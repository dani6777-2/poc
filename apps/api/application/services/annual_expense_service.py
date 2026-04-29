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
    def _normalize_concept_name(name: str) -> str:
        if not name: return ""
        import re
        import unicodedata
        # Level Up: Normalize format (spacing, casing) and remove accents for the STRUCTURAL KEY
        name = name.strip().lower()
        name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
        name = re.sub(r'\s+', ' ', name) 
        return name

    def _get_concept_key(self, category_id: int, name: str) -> str:
        norm = self._normalize_concept_name(name)
        if not norm:
            return f"{category_id}:general"
        import hashlib
        # Stable Hashing for Identity
        h = hashlib.sha1(norm.encode()).hexdigest()[:12]
        return f"{category_id}:{h}"

    @staticmethod
    def _is_semantic_diff(old_val, new_val) -> bool:
        if old_val is None and new_val is None:
            return False
        try:
            o_val = float(old_val) if old_val is not None else None
            n_val = float(new_val) if new_val is not None else None
        except (TypeError, ValueError):
            return old_val != new_val
        if o_val is None and n_val == 0.0: return False
        if o_val == 0.0 and n_val is None: return False
        if o_val is None and n_val not in (0.0, None): return True
        if o_val not in (0.0, None) and n_val is None: return True
        # Math comparison
        from decimal import Decimal, ROUND_HALF_UP
        v1 = Decimal(str(old_val)) if old_val is not None else Decimal('0.0')
        v2 = Decimal(str(new_val)) if new_val is not None else Decimal('0.0')
        return v1.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) != v2.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def get_annual_expenses(self, tenant_id: int, year: int, section_id: Optional[int] = None) -> List[AnnualExpenseEntity]:
        self.sync_registry_to_expenses(tenant_id, year)
        rows = self.annual_repo.get_all_by_year(tenant_id, year, section_id)
        # Filter is_active=True to only show current concepts in the UI
        return [self._enrich(r) for r in rows if r.is_active]

    def create_annual_expense(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        # Prevent manual creation of "automatic" flagged rows
        if data.is_automatic:
            raise ValueError(f"Manual rows cannot be pre-flagged as automatic.")
        
        # Ensure concept_origin is 'manual' if not provided
        if not data.concept_origin:
            data.concept_origin = "manual"
            
        entity = self.annual_repo.create(tenant_id, data)
        return self._enrich(entity)

    def update_annual_expense(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing:
            raise ValueError("Row not found")
            
        # Security Guard: System managed rows cannot be manually updated
        if existing.is_automatic or existing.concept_origin == "registry":
            raise ValueError("Guard triggered: Cannot edit a system-managed entity.")
            
        entity = self.annual_repo.update(tenant_id, expense_id, data)
        return self._enrich(entity)

    def delete_annual_expense(self, tenant_id: int, expense_id: int) -> None:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing: return
        
        # Security Guard: System managed rows cannot be manually deleted
        if existing.is_automatic or existing.concept_origin == "registry":
             raise ValueError("Guard triggered: Cannot delete a system-managed entity.")
             
        self.annual_repo.delete(tenant_id, expense_id)

    def sync_registry_to_expenses(self, tenant_id: int, year: int, dry_run: bool = False, target_month: str = None) -> Dict[str, any]:
        if hasattr(self.annual_repo, 'db') and self.annual_repo.db.bind.dialect.name == 'postgresql':
            lock_id = tenant_id + (year * 100000)
            from sqlalchemy import text
            try:
                self.annual_repo.db.execute(text(f"SELECT pg_advisory_xact_lock({lock_id})"))
            except Exception as e:
                logger.warning(f"Failed to acquire advisory lock: {e}")

        existing_rows = self.annual_repo.get_all_by_year(tenant_id, year, for_update=not dry_run)
        
        # 1. Identity Resolution Maps
        auto_rows_by_key = {r.concept_key: r for r in existing_rows if r.is_automatic and r.concept_key}
        
        # Legacy Semantic Map: to merge existing rows without keys
        legacy_rows = [r for r in existing_rows if r.is_automatic and not r.concept_key]
        rows_by_norm_desc = {self._normalize_concept_name(r.description.replace(REGISTRY_DESCRIPTION_PREFIX, "")): r for r in legacy_rows}
        
        snapshot_before = {}
        for r in existing_rows:
            snapshot_before[r.id] = {m: getattr(r, m) for m in MONTHS}
            snapshot_before[r.id].update({f"actual_{m}": getattr(r, f"actual_{m}") for m in MONTHS})
        
        card_config = self.card_repo.get_config(tenant_id)
        card_channel_id = card_config.channel_id if card_config and (card_config.total_limit or 0) > 0 else None

        cat_map = {}
        cat_to_sec = {}
        if self.taxonomy_service:
            cats = self.taxonomy_service.get_categories(tenant_id)
            cat_to_sec = {c.id: c.section_id for c in cats}
            cat_map = {c.id: c.name for c in cats}

        per_concept_tracker: Dict[str, Dict[str, any]] = {}

        try:
            target_month_idx = int(target_month.split('-')[1]) - 1 if target_month else None
        except:
            target_month_idx = None

        for month_idx, mk in enumerate(MONTHS):
            if target_month_idx is not None and month_idx != target_month_idx:
                continue
                
            month_str = f"{year}-{str(month_idx + 1).zfill(2)}"
            
            # 3. Budget (Category Context)
            if self.budget_repo:
                budgets = self.budget_repo.get_by_month(tenant_id, month_str)
                for b in budgets:
                    key = self._get_concept_key(b.category_id, "")
                    target = per_concept_tracker.setdefault(key, {
                        'c_id': b.category_id, 'label': "GENERAL", 'raw_name': "",
                        'data': {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS}
                    })
                    target['data'][mk]['budget'] = Decimal(str(b.budget or 0.0))

            # 4. Registry Items (Concept Context)
            items = self.expense_repo.get_all(tenant_id, month_str)
            print(f"DEBUG: Found {len(items)} items in registry for {month_str}")
            for item in items:
                if not item.category_id: continue
                s_id = cat_to_sec.get(item.category_id)
                if not s_id: continue
                
                item_name = (item.name or "").strip()
                key = self._get_concept_key(item.category_id, item_name)
                
                target = per_concept_tracker.setdefault(key, {
                    'c_id': item.category_id, 'label': item_name.upper() or "GENERAL", 'raw_name': item_name,
                    'data': {m: {'total': Decimal('0.0'), 'card': Decimal('0.0'), 'budget': Decimal('0.0'), 'plan': Decimal('0.0')} for m in MONTHS}
                })
                
                sub = Decimal(str(item.subtotal or 0.0))
                is_card = item.payment_method == "credit" or (card_channel_id and item.channel_id == card_channel_id)
                
                if item.status == "Bought":
                    target['data'][mk]['total'] += sub
                    if is_card: target['data'][mk]['card'] += sub
                elif item.status == "Planned":
                    target['data'][mk]['plan'] += sub
            
            print(f"DEBUG: per_concept_tracker keys after {month_str}: {list(per_concept_tracker.keys())}")
            if per_concept_tracker:
                 first_key = list(per_concept_tracker.keys())[0]
                 print(f"DEBUG: first key Jan totals: {per_concept_tracker[first_key]['data']['jan']}")

        affected_count = 0
        trace_differences = []
        synced_keys = set()

        # 5. Matrix Persistence with Semantic Merging
        for key, concept_info in per_concept_tracker.items():
            synced_keys.add(key)
            month_totals = concept_info['data']
            c_id = concept_info['c_id']
            label = concept_info['label']
            raw_name = concept_info['raw_name']
            sec_id = cat_to_sec.get(c_id)
            
            # IDENTITY RESOLUTION
            row = auto_rows_by_key.get(key)
            
            # Creation Logic with Collision Check
            display_desc = f"{REGISTRY_DESCRIPTION_PREFIX}{cat_map.get(c_id, 'UNKNOWN').upper()}"
            if raw_name: display_desc += f" - {raw_name.upper()}"
            
            if not row:
                # Semantic Merge: Look for a row that already has this exact description
                row = next((r for r in existing_rows if r.description == display_desc and r.is_automatic), None)

            if not row:
                # Creation as last resort
                dto = AnnualExpenseCreateDto(
                    year=year, section_id=sec_id, category_id=c_id, 
                    description=display_desc, sort_order=900, is_automatic=True,
                    concept_key=key, concept_label=label, concept_origin='registry', is_active=True
                )
                if not dry_run:
                    row = self.annual_repo.create(tenant_id, dto)
                    # Support concurrency & batch consistency: add newly created row to local cache
                    existing_rows.append(row)
                    if key: auto_rows_by_key[key] = row
                else:
                    row = AnnualExpenseEntity(id=999000, tenant_id=tenant_id, year=year, description=display_desc, section_id=sec_id, category_id=c_id, is_automatic=True, concept_key=key)

            if row:
                updates = {}
                # Ensure stable keys and status are set even on legacy matched rows
                if not row.concept_key or not row.concept_label or not row.is_active:
                    updates["concept_key"] = key
                    updates["concept_label"] = label
                    updates["is_active"] = True
                    updates["concept_origin"] = "registry"

                for mk, data in month_totals.items():
                    if target_month_idx is not None and mk != MONTHS[target_month_idx]: continue
                    val_plan = data['budget'] if data['budget'] > 0 else data['plan']
                    updates[mk] = float(val_plan.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                    updates[f"actual_{mk}"] = float(data['total'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                    updates[f"actual_card_{mk}"] = float(data['card'].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                
                clean_updates = {k:v for k,v in updates.items() if AnnualExpenseService._is_semantic_diff(snapshot_before.get(row.id, {}).get(k), v)}
                
                if clean_updates:
                    affected_count += 1
                    print(f"DEBUG: Updating row {row.id} ({row.description}) with {len(clean_updates)} changes")
                    if not dry_run and row.id < 999000:
                        self.annual_repo.set_values(row.id, clean_updates)
                        for k,v in clean_updates.items():
                            trace_differences.append(f"CONCEPT_SYNC [{label}] {k}: {snapshot_before.get(row.id, {}).get(k)} -> {v}")
                else:
                    print(f"DEBUG: No changes detected for row {row.id} ({row.description})")

        # 6. Lifecycle: Zero out missing concepts but keep them active if they had history
        if not dry_run:
            active_but_missing = [r for r in existing_rows if r.is_automatic and r.concept_key and r.concept_key not in synced_keys and r.is_active]
            for r in active_but_missing:
                zeros = {m: 0.0 for m in MONTHS}
                zeros.update({f"actual_{m}": 0.0 for m in MONTHS})
                zeros.update({f"actual_card_{m}": 0.0 for m in MONTHS})
                self.annual_repo.set_values(r.id, zeros)
                affected_count += 1
                trace_differences.append(f"Lifecycle: Concept '{r.concept_label}' Zeroed.")

        # Legacy Clean: Zero out remaining legacy unmapped rows
        legacy_unmapped = [r for r in existing_rows if r.is_automatic and r.description.startswith(REGISTRY_DESCRIPTION_PREFIX) and not r.concept_key and self._normalize_concept_name(r.description.replace(REGISTRY_DESCRIPTION_PREFIX, "")) not in [self._normalize_concept_name(per_concept_tracker[k]['raw_name']) for k in synced_keys]]
        if not dry_run and legacy_unmapped:
            for r in legacy_unmapped:
                zeros = {m: 0.0 for m in MONTHS}
                zeros.update({f"actual_{m}": 0.0 for m in MONTHS})
                zeros.update({f"actual_card_{m}": 0.0 for m in MONTHS})
                self.annual_repo.set_values(r.id, zeros)
                affected_count += 1
                trace_differences.append(f"Legacy Cleanup: Row {r.description} Zeroed.")
            
        # 7. Zero out legacy generic rows that no longer aggregate data
        # This ensures that old 'Registry: Various' rows don't keep stale values.
        if not dry_run:
            legacy_found = [r for r in existing_rows if r.is_automatic and not r.category_id and r.description.startswith(REGISTRY_DESCRIPTION_PREFIX)]
            for leg in legacy_found:
                zeros = {m: 0.0 for m in MONTHS}
                zeros.update({f"actual_{m}": 0.0 for m in MONTHS})
                zeros.update({f"actual_card_{m}": 0.0 for m in MONTHS})
                # Check if it actually needs zeroing
                current_values = {k: snapshot_before.get(leg.id, {}).get(k) for k in zeros.keys()}
                if any(v != 0.0 for v in current_values.values()):
                    self.annual_repo.set_values(leg.id, zeros)
                    affected_count += 1
                    trace_differences.append(f"Row {leg.id} ({leg.description}) | Zeroed out legacy generic row to ensure granularity.")
            
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
