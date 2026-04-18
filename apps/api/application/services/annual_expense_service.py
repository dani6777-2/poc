from typing import List, Dict, Optional
import logging
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort
from core.ports.secondary.budget_repository import BudgetRepositoryPort
from application.services.taxonomy_service import TaxonomyService
from core.constants import MONTHS, ACTUAL_MONTHS, CARD_MONTHS, REGISTRY_DESCRIPTION_PREFIX, AUTO_PREFIXES
from decimal import Decimal, ROUND_HALF_UP

logger = logging.getLogger(__name__)

class AnnualExpenseService:
    def __init__(
        self, 
        annual_repo: AnnualExpenseRepositoryPort,
        expense_repo: ExpenseRepositoryPort,
        card_repo: CardRepositoryPort,
        budget_repo: Optional[BudgetRepositoryPort] = None,
        taxonomy_service: Optional[TaxonomyService] = None
    ):
        self.annual_repo = annual_repo
        self.expense_repo = expense_repo
        self.card_repo = card_repo
        self.budget_repo = budget_repo
        self.taxonomy_service = taxonomy_service

    def _enrich(self, entity: AnnualExpenseEntity) -> AnnualExpenseEntity:
        entity.is_automatic = entity.is_automatic or any(entity.description.startswith(p) for p in AUTO_PREFIXES)
        entity.annual_total = sum(getattr(entity, m) or 0.0 for m in MONTHS)
        entity.actual_annual_total = sum(getattr(entity, r) or 0.0 for r in ACTUAL_MONTHS)
        entity.actual_card_annual_total = sum(getattr(entity, t) or 0.0 for t in CARD_MONTHS)
        return entity

    @staticmethod
    def _is_semantic_diff(old_val, new_val) -> bool:
        if old_val is None and new_val is None:
            return False

        # Safe float conversion to handle strings or Decimals correctly
        try:
            o_val = float(old_val) if old_val is not None else None
            n_val = float(new_val) if new_val is not None else None
        except (TypeError, ValueError):
            return old_val != new_val

        # Null equivalence matrix
        if o_val is None and n_val == 0.0:
            return False
            
        if o_val == 0.0 and n_val is None:
            return False

        if o_val is None and n_val not in (0.0, None):
            return True

        if o_val not in (0.0, None) and n_val is None:
            return True

        # Math comparison with strict decimal rounding
        v1 = Decimal(str(old_val)) if old_val is not None else Decimal('0.0')
        v2 = Decimal(str(new_val)) if new_val is not None else Decimal('0.0')
        return v1.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) != v2.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def get_annual_expenses(self, tenant_id: int, year: int, section_id: Optional[int] = None) -> List[AnnualExpenseEntity]:
        self.sync_registry_to_expenses(tenant_id, year)
        rows = self.annual_repo.get_all_by_year(tenant_id, year, section_id)
        return [self._enrich(r) for r in rows]

    def create_annual_expense(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        if data.is_automatic or (data.description and any(data.description.startswith(p) for p in AUTO_PREFIXES)):
            raise ValueError(f"No se pueden crear filas manuales pre-marcadas como automáticas.")
        entity = self.annual_repo.create(tenant_id, data)
        return self._enrich(entity)

    def update_annual_expense(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing:
            raise ValueError("Row not found")
        if existing.is_automatic or any(existing.description.startswith(p) for p in AUTO_PREFIXES):
            raise ValueError("Guard triggered: Cannot edit a system-generated row.")
            
        if data.is_automatic or (data.description and any(data.description.startswith(p) for p in AUTO_PREFIXES)):
            raise ValueError(f"No se pueden utilizar prefijos de sistema en descripciones manuales.")
        entity = self.annual_repo.update(tenant_id, expense_id, data)
        return self._enrich(entity)

    def delete_annual_expense(self, tenant_id: int, expense_id: int) -> None:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing or existing.is_automatic or any(existing.description.startswith(p) for p in AUTO_PREFIXES):
            return 
        self.annual_repo.delete(tenant_id, expense_id)

    def sync_registry_to_expenses(self, tenant_id: int, year: int, dry_run: bool = False, target_month: str = None) -> Dict[str, any]:
        # Advisory locking for concurrency serialization
        if hasattr(self.annual_repo, 'db') and self.annual_repo.db.bind.dialect.name == 'postgresql':
            lock_id = tenant_id + (year * 100000)
            from sqlalchemy import text
            try:
                self.annual_repo.db.execute(text(f"SELECT pg_advisory_xact_lock({lock_id})"))
            except Exception as e:
                logger.warning(f"Failed to acquire advisory lock: {e}")

        existing_rows = self.annual_repo.get_all_by_year(tenant_id, year, for_update=not dry_run)
        
        # Build "before" snapshot for auditing trace
        snapshot_before = {}
        for r in existing_rows:
            snapshot_before[r.id] = {m: getattr(r, m) for m in MONTHS}
            snapshot_before[r.id].update({f"actual_{m}": getattr(r, f"actual_{m}") for m in MONTHS})
        
        card_config = self.card_repo.get_config(tenant_id)
        card_channel_id = card_config.channel_id if card_config and (card_config.total_limit or 0) > 0 else None

        # 1. Map categories to sections for section-wide aggregations
        cat_to_sec = {}
        cat_map = {}
        if self.taxonomy_service:
            cats = self.taxonomy_service.get_categories(tenant_id)
            cat_to_sec = {c.id: c.section_id for c in cats}
            cat_map = {c.id: c.name for c in cats}

        # per_section_gen tracks generic "📝 Registry: ..." rows (for unlinked categories)
        per_section_gen: Dict[int, Dict[str, Dict[str, float]]] = {}
        # per_category_gen tracks rows explicitly linked via category_id
        per_category_gen: Dict[int, Dict[str, Dict[str, float]]] = {}

        # 2. Get list of category_ids that are explicitly linked in annual matrix
        linked_category_ids = {r.category_id for r in existing_rows if r.category_id}

        try:
            target_month_idx = int(target_month.split('-')[1]) - 1 if target_month else None
        except:
            target_month_idx = None

        for month_idx, mk in enumerate(MONTHS):
            if target_month_idx is not None and month_idx != target_month_idx:
                continue
                
            month_str = f"{year}-{str(month_idx + 1).zfill(2)}"
            
            # 3. Budget sync (sum category budgets)
            sec_budget_map = {}
            cat_budget_map = {}
            if self.budget_repo:
                budgets = self.budget_repo.get_by_month(tenant_id, month_str)
                for b in budgets:
                    # If this category is explicitly linked, track it separately
                    if b.category_id in linked_category_ids:
                        cat_budget_map[b.category_id] = b.budget or 0.0
                    else:
                        # Otherwise, add to section-wide total
                        s_id = cat_to_sec.get(b.category_id)
                        if s_id:
                            sec_budget_map[s_id] = sec_budget_map.get(s_id, 0.0) + (b.budget or 0.0)

            # 4. Real spending sync
            items = self.expense_repo.get_all(tenant_id, month_str)
            for item in items:
                sub = Decimal(str(item.subtotal or 0.0))
                is_card = item.payment_method == "credit" or (card_channel_id and item.channel_id == card_channel_id)
                
                # Determine where to aggregate: specific category row or section row
                if item.category_id and item.category_id in linked_category_ids:
                    # Aggregate to Category logic
                    target = per_category_gen.setdefault(item.category_id, {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS})
                    if item.status == "Bought":
                        target[mk]['total'] += sub
                        if is_card: target[mk]['card'] += sub
                    elif item.status == "Planned":
                        target[mk]['plan'] += sub
                elif item.section_id:
                    # Aggregate to Section logic (legacy/generic)
                    sec_id = item.section_id
                    target = per_section_gen.setdefault(sec_id, {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS})
                    if item.status == "Bought":
                        target[mk]['total'] += sub
                        if is_card: target[mk]['card'] += sub
                    elif item.status == "Planned":
                        target[mk]['plan'] += sub

            # 5. Apply Budget values to targets
            for c_id, b_val in cat_budget_map.items():
                target = per_category_gen.setdefault(c_id, {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS})
                target[mk]['budget'] = Decimal(str(b_val))
            for s_id, b_val in sec_budget_map.items():
                target = per_section_gen.setdefault(s_id, {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS})
                target[mk]['budget'] = Decimal(str(b_val))

        affected_count = 0
        trace_differences = []

        # 6. Update category-linked rows
        for c_id, month_totals in per_category_gen.items():
            row = next((r for r in existing_rows if r.category_id == c_id), None)
            if row:
                updates = {}
                for mk, data in month_totals.items():
                    if target_month_idx is not None and mk != MONTHS[target_month_idx]:
                        continue
                    val_budget_or_plan = data['budget'] if data['budget'] > Decimal('0.0') else data['plan']
                    updates[mk] = float(val_budget_or_plan.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                    updates[f"actual_{mk}"] = float(data['total'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                    updates[f"actual_card_{mk}"] = float(data['card'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                
                clean_updates = {}
                for k,v in updates.items():
                    old_v = snapshot_before[row.id].get(k)
                    if AnnualExpenseService._is_semantic_diff(old_v, v):
                        clean_updates[k] = v
                        trace_differences.append(f"Row {row.id} ({row.description}) | Field '{k}' changed logically from {old_v} to {v}")
                
                if clean_updates:
                    affected_count += 1
                    if not dry_run:
                        self.annual_repo.set_values(row.id, clean_updates)

        # 7. Update generic "Registry" rows per section
        for sec_id, month_totals in per_section_gen.items():
            sec_name = "Various"
            any_row = next((r for r in existing_rows if r.section_id == sec_id), None)
            if any_row: sec_name = any_row.section_name
            
            description = f"{REGISTRY_DESCRIPTION_PREFIX}{sec_name}"
            generic_rows = [r for r in existing_rows if r.section_id == sec_id and r.description.startswith(REGISTRY_DESCRIPTION_PREFIX)]
            row = generic_rows[0] if generic_rows else None

            if not row:
                dto = AnnualExpenseCreateDto(year=year, section_id=sec_id, description=description, sort_order=999, is_automatic=True)
                if not dry_run:
                    row = self.annual_repo.create(tenant_id, dto)
                else:
                    row = AnnualExpenseEntity(id=999999 + sec_id, description=description, section_id=sec_id)
            
            updates = {}
            for mk, data in month_totals.items():
                if target_month_idx is not None and mk != MONTHS[target_month_idx]:
                    continue
                val_budget_or_plan = data['budget'] if data['budget'] > Decimal('0.0') else data['plan']
                updates[mk] = float(val_budget_or_plan.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                updates[f"actual_{mk}"] = float(data['total'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                updates[f"actual_card_{mk}"] = float(data['card'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
            
            
            clean_updates = {}
            for k,v in updates.items():
                old_v = snapshot_before.get(row.id, {}).get(k)
                # In Generic row we might not even have snapshot_before recorded if it was newly created
                if old_v is None and row.id > 999999: old_v = "New"
                if old_v == "New" or AnnualExpenseService._is_semantic_diff(old_v, v):
                    clean_updates[k] = v
                    trace_differences.append(f"Row {row.id} ({row.description}) | Field '{k}' changed logically from {old_v} to {v}")

            if clean_updates:
                affected_count += 1
                if not dry_run and row.id < 999999:
                    self.annual_repo.set_values(row.id, clean_updates)
            
        logger.info(f"[RECONCILE] Matrix synchronized for tenant {tenant_id}, year {year}. Dry run: {dry_run}")
        
        if not dry_run:
            if hasattr(self.annual_repo, 'commit_transaction'):
                self.annual_repo.commit_transaction()
        
        if not dry_run and affected_count > 0 and not target_month:
            if hasattr(self.annual_repo, 'create_snapshot'):
                import json
                import base64
                import zlib
                
                after_rows = self.annual_repo.get_all_by_year(tenant_id, year)
                
                # Diffing logic
                diff = {}
                for r in after_rows:
                    after_state = {m: getattr(r, m) for m in MONTHS}
                    after_state.update({f"actual_{m}": getattr(r, f"actual_{m}") for m in MONTHS})
                    
                    before_state = snapshot_before.get(r.id, {})
                    row_diff = {}
                    for k, v_after in after_state.items():
                        v_before = before_state.get(k)
                        if AnnualExpenseService._is_semantic_diff(v_before, v_after):
                            row_diff[k] = [v_before, v_after]
                    if row_diff:
                        diff[str(r.id)] = row_diff
                
                affected_keys = list(diff.keys())
                affected_ids_csv = ",".join(affected_keys) if affected_keys else None
                
                diff_json = json.dumps(diff)
                compressed = base64.b64encode(zlib.compress(diff_json.encode('utf-8'))).decode('utf-8')
                
                self.annual_repo.create_snapshot(
                    tenant_id, year, affected_count,
                    "DIFF_ZLIB_B64",
                    compressed,
                    affected_ids_csv
                )
                logger.critical(f"[DRIFT_CRITICAL] Auto-correction performed for {tenant_id}. Compressed Diff Snapshot recorded.")

        status = "CHANGES_DETECTED" if affected_count > 0 else "NO_CHANGES_DETECTED"
        return {
            "status": status,
            "affected_records": affected_count,
            "differences": trace_differences
        }

    def sync_card_to_debts_for_month(self, tenant_id: int, month_str: str) -> None:
        pass

    def get_summary(self, tenant_id: int, year: int) -> Dict:
        self.sync_registry_to_expenses(tenant_id, year)
        rows = self.annual_repo.get_all_by_year(tenant_id, year)
        per_month = {m: sum(getattr(r, m) or 0 for r in rows) for m in MONTHS}
        per_month_actual = {m: sum(getattr(r, f"actual_{m}") or 0 for r in rows) for m in MONTHS}
        per_section: Dict = {}
        for r in rows:
            sec_name = r.section_name or "Various"
            if sec_name not in per_section:
                per_section[sec_name] = {m: 0.0 for m in MONTHS}
                per_section[sec_name].update({f"actual_{m}": 0.0 for m in MONTHS})
                per_section[sec_name]['annual_total'] = 0.0
                per_section[sec_name]['actual_annual_total'] = 0.0
            for m in MONTHS:
                per_section[sec_name][m] = round(per_section[sec_name][m] + (getattr(r, m) or 0), 2)
                per_section[sec_name][f"actual_{m}"] = round(per_section[sec_name][f"actual_{m}"] + (getattr(r, f"actual_{m}") or 0), 2)
            per_section[sec_name]['annual_total'] += sum(getattr(r, m) or 0 for m in MONTHS)
            per_section[sec_name]['actual_annual_total'] += sum(getattr(r, f"actual_{m}") or 0 for m in MONTHS)
        return {
            "per_month": per_month, "per_month_actual": per_month_actual, "per_section": per_section,
            "annual_total": sum(per_month.values()), "actual_annual_total": sum(per_month_actual.values()),
        }

    def get_net_summary(self, tenant_id: int, year: int, income_summary_func) -> List[Dict]:
        self.sync_registry_to_expenses(tenant_id, year)
        income_data = income_summary_func(tenant_id, year)
        income_by_month = income_data["per_month"]
        expenses = self.annual_repo.get_all_by_year(tenant_id, year)
        result = []
        accumulated = 0.0
        for month_idx, m in enumerate(MONTHS):
            month_str = f"{year}-{str(month_idx + 1).zfill(2)}"
            inc = income_by_month.get(m, 0.0)
            plan = sum(getattr(r, m) or 0.0 for r in expenses)
            actual_total = sum(getattr(r, f"actual_{m}") or 0.0 for r in expenses)
            actual_card_total = sum(getattr(r, f"actual_card_{m}") or 0.0 for r in expenses)
            cash_expense = actual_total - actual_card_total
            # Fix #7: deduct manual CC payment (prev month debt paid in cash this month)
            m_state = self.card_repo.get_monthly_state(tenant_id, month_str)
            manual_payment = m_state.get("manual_payment", 0.0) if m_state else 0.0
            final_expense = round((cash_expense + manual_payment) if actual_total > 0 else plan, 2)
            net = round(inc - final_expense, 2)
            accumulated = round(accumulated + net, 2)
            result.append({
                "month": m, "revenues": inc, "expenses": final_expense, "planned_expenses": plan,
                "actual_total_expenses": actual_total, "actual_card_expenses": actual_card_total,
                "manual_cc_payment": manual_payment,
                "net": net, "accumulated": accumulated,
            })
        return result
