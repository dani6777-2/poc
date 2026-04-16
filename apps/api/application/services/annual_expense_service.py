from typing import List, Dict, Optional, Tuple
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
ACTUAL_MONTHS = [f"actual_{m}" for m in MONTHS]
CARD_MONTHS = [f"actual_card_{m}" for m in MONTHS]

REGISTRY_DESCRIPTION_PREFIX = "📝 Registry: "
AUTO_PREFIXES = (REGISTRY_DESCRIPTION_PREFIX, "💳 Card:", "🛒 Supermarket")

class AnnualExpenseService:
    def __init__(
        self, 
        annual_repo: AnnualExpenseRepositoryPort,
        expense_repo: ExpenseRepositoryPort,
        card_repo: CardRepositoryPort
    ):
        self.annual_repo = annual_repo
        self.expense_repo = expense_repo
        self.card_repo = card_repo

    def _enrich(self, entity: AnnualExpenseEntity) -> AnnualExpenseEntity:
        entity.is_automatic = any(entity.description.startswith(p) for p in AUTO_PREFIXES)
        entity.annual_total = sum(getattr(entity, m) or 0.0 for m in MONTHS)
        entity.actual_annual_total = sum(getattr(entity, r) or 0.0 for r in ACTUAL_MONTHS)
        entity.actual_card_annual_total = sum(getattr(entity, t) or 0.0 for t in CARD_MONTHS)
        return entity

    def get_annual_expenses(self, tenant_id: int, year: int, section_id: Optional[int] = None) -> List[AnnualExpenseEntity]:
        self.sync_registry_to_expenses(tenant_id, year)
        prev_year_dec = f"{year - 1}-12"
        self.sync_card_to_debts_for_month(tenant_id, prev_year_dec)
        for month_idx in range(1, 12):
            month_str = f"{year}-{str(month_idx).zfill(2)}"
            self.sync_card_to_debts_for_month(tenant_id, month_str)
        rows = self.annual_repo.get_all_by_year(tenant_id, year, section_id)
        return [self._enrich(r) for r in rows]

    def create_annual_expense(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        entity = self.annual_repo.create(tenant_id, data)
        return self._enrich(entity)

    def update_annual_expense(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        for m in MONTHS:
            actual_val = getattr(data, f"actual_{m}") or 0.0
            actual_card_val = getattr(data, f"actual_card_{m}") or 0.0
            if actual_card_val > actual_val:
                setattr(data, f"actual_{m}", actual_card_val)

        entity = self.annual_repo.update(tenant_id, expense_id, data)
        for month_idx in range(1, 13):
            month_str = f"{entity.year}-{str(month_idx).zfill(2)}"
            self.sync_card_to_debts_for_month(tenant_id, month_str)
        return self._enrich(entity)

    def delete_annual_expense(self, tenant_id: int, expense_id: int) -> None:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing or any(existing.description.startswith(p) for p in AUTO_PREFIXES):
            return 
        self.annual_repo.delete(tenant_id, expense_id)

    def sync_registry_to_expenses(self, tenant_id: int, year: int) -> None:
        self.annual_repo.delete_by_prefix(tenant_id, year, "🛒 Supermarket")
        
        existing_rows = self.annual_repo.get_all_by_year(tenant_id, year)
        descriptions_by_sec = {}
        for r in existing_rows:
            if r.section_id not in descriptions_by_sec:
                descriptions_by_sec[r.section_id] = {}
            descriptions_by_sec[r.section_id][r.description.strip().lower()] = r.id

        # Aggregation: {(section_id, description_id_opt): {mk: {total, plan}}}
        per_description: Dict[Tuple[int, Optional[int]], Dict[str, Dict[str, float]]] = {}
        # By generic section (for categories without specific manual description)
        per_section_gen: Dict[int, Dict[str, Dict[str, float]]] = {}

        # Initialize per_description with all existing relevant rows to handle deletions (reset to zero)
        for r in existing_rows:
            # Check if it's a manual category-matched row (already in descriptions_by_sec)
            # OR if it's a generic Registry row
            if r.description.startswith(REGISTRY_DESCRIPTION_PREFIX):
                per_section_gen[r.section_id] = {m: {'total': 0.0, 'plan': 0.0} for m in MONTHS}
            else:
                # Any row that is NOT generic might be a category-matched one. 
                # We pre-init it to 0 so if it has no matches, it resets.
                per_description[(r.section_id, r.id)] = {m: {'total': 0.0, 'plan': 0.0} for m in MONTHS}
        
        for month_idx, mk in enumerate(MONTHS):
            month_str = f"{year}-{str(month_idx + 1).zfill(2)}"
            items = self.expense_repo.get_all(tenant_id, month_str)
            for item in items:
                if not item.section_id: continue
                
                sec_id = item.section_id
                sub = item.subtotal or 0.0
                is_bought = item.status == "Bought"
                
                # Check if item category matches a manual description
                description_id = descriptions_by_sec.get(sec_id, {}).get(item.category_name.strip().lower() if item.category_name else "")
                
                if description_id:
                    target = per_description.setdefault((sec_id, description_id), {m: {'total': 0.0, 'plan': 0.0} for m in MONTHS})
                else:
                    target = per_section_gen.setdefault(sec_id, {m: {'total': 0.0, 'plan': 0.0} for m in MONTHS})

                if is_bought:
                    target[mk]['total'] += sub
                elif item.status == "Planned":
                    target[mk]['plan'] += sub

        # Update specific descriptions
        for (sec_id, description_id), month_totals in per_description.items():
            updates = {}
            for mk, data in month_totals.items():
                updates[f"actual_{mk}"] = round(data['total'], 0)
                if data['plan'] > 0: updates[mk] = round(data['plan'], 0)
            self.annual_repo.set_values(description_id, updates)

        # Update generic "Registry" rows per section
        for sec_id, month_totals in per_section_gen.items():
            sec_name = "Various"
            any_row = next((r for r in existing_rows if r.section_id == sec_id), None)
            if any_row: sec_name = any_row.section_name
            
            description = f"{REGISTRY_DESCRIPTION_PREFIX}{sec_name}"
            
            generic_rows = [r for r in existing_rows if r.section_id == sec_id and r.description.startswith(REGISTRY_DESCRIPTION_PREFIX)]
            row = generic_rows[0] if generic_rows else None

            if not row:
                dto = AnnualExpenseCreateDto(year=year, section_id=sec_id, description=description, sort_order=999)
                row = self.annual_repo.create(tenant_id, dto)
            else:
                if row.description != description:
                    dto = AnnualExpenseCreateDto(year=row.year, section_id=row.section_id, description=description, sort_order=row.sort_order)
                    self.annual_repo.update(tenant_id, row.id, dto)
                # Cleanup any duplicates generated by previous bug
                if len(generic_rows) > 1:
                    for dup in generic_rows[1:]:
                        self.annual_repo.delete(tenant_id, dup.id)

            updates = {}
            for mk, data in month_totals.items():
                updates[mk] = round(data['plan'], 0)
                updates[f"actual_{mk}"] = round(data['total'], 0)
            self.annual_repo.set_values(row.id, updates)

        # Sync debts
        for month_idx in range(12):
            self.sync_card_to_debts_for_month(tenant_id, f"{year}-{str(month_idx + 1).zfill(2)}")

    def sync_card_to_debts_for_month(self, tenant_id: int, month_str: str) -> None:
        config = self.card_repo.get_config(tenant_id)
        if not config.total_limit or config.total_limit == 0: return
        transactions = self.card_repo.get_manual_tc_expenses_from_annual(tenant_id, month_str)
        used = sum(t.subtotal for t in transactions)
        self.card_repo.sync_to_deudas_next_month(tenant_id, month_str, config.name, used)

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
                per_section[sec_name][m] += getattr(r, m) or 0
                per_section[sec_name][f"actual_{m}"] += getattr(r, f"actual_{m}") or 0
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
        for m in MONTHS:
            inc = income_by_month.get(m, 0.0)
            plan = sum(getattr(r, m) or 0.0 for r in expenses)
            actual_total = sum(getattr(r, f"actual_{m}") or 0.0 for r in expenses)
            actual_card_total = sum(getattr(r, f"actual_card_{m}") or 0.0 for r in expenses)
            cash_expense = actual_total - actual_card_total
            final_expense = cash_expense if actual_total > 0 else plan
            net = inc - final_expense
            accumulated += net
            result.append({
                "month": m, "revenues": inc, "expenses": final_expense, "planned_expenses": plan,
                "actual_total_expenses": actual_total, "actual_card_expenses": actual_card_total,
                "net": net, "accumulated": accumulated,
            })
        return result
