from typing import List, Dict, Optional
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort
from core.ports.secondary.budget_repository import BudgetRepositoryPort
from application.services.taxonomy_service import TaxonomyService
from core.constants import MONTHS, ACTUAL_MONTHS, CARD_MONTHS, REGISTRY_DESCRIPTION_PREFIX, AUTO_PREFIXES

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
        entity.is_automatic = any(entity.description.startswith(p) for p in AUTO_PREFIXES)
        entity.annual_total = sum(getattr(entity, m) or 0.0 for m in MONTHS)
        entity.actual_annual_total = sum(getattr(entity, r) or 0.0 for r in ACTUAL_MONTHS)
        entity.actual_card_annual_total = sum(getattr(entity, t) or 0.0 for t in CARD_MONTHS)
        return entity

    def get_annual_expenses(self, tenant_id: int, year: int, section_id: Optional[int] = None) -> List[AnnualExpenseEntity]:
        self.sync_registry_to_expenses(tenant_id, year)
        rows = self.annual_repo.get_all_by_year(tenant_id, year, section_id)
        return [self._enrich(r) for r in rows]

    def create_annual_expense(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        entity = self.annual_repo.create(tenant_id, data)
        return self._enrich(entity)

    def update_annual_expense(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        entity = self.annual_repo.update(tenant_id, expense_id, data)
        return self._enrich(entity)

    def delete_annual_expense(self, tenant_id: int, expense_id: int) -> None:
        existing = self.annual_repo.get_by_id(tenant_id, expense_id)
        if not existing or any(existing.description.startswith(p) for p in AUTO_PREFIXES):
            return 
        self.annual_repo.delete(tenant_id, expense_id)

    def sync_registry_to_expenses(self, tenant_id: int, year: int) -> None:
        existing_rows = self.annual_repo.get_all_by_year(tenant_id, year)
        
        card_config = self.card_repo.get_config(tenant_id)
        card_channel_id = card_config.channel_id if card_config and (card_config.total_limit or 0) > 0 else None

        cat_to_sec = {}
        if self.taxonomy_service:
            cats = self.taxonomy_service.get_categories(tenant_id)
            cat_to_sec = {c.id: c.section_id for c in cats}

        # per_section_gen tracks generic "📝 Registry: ..." rows
        # Structure: {section_id: {month_key: {total: 0, card: 0, budget: 0, plan: 0}}}
        per_section_gen: Dict[int, Dict[str, Dict[str, float]]] = {}

        for month_idx, mk in enumerate(MONTHS):
            month_str = f"{year}-{str(month_idx + 1).zfill(2)}"
            
            # 1. Budget sync for this month (sum of category budgets per section)
            sec_budget_map = {}
            if self.budget_repo:
                budgets = self.budget_repo.get_by_month(tenant_id, month_str)
                for b in budgets:
                    s_id = cat_to_sec.get(b.category_id)
                    if s_id:
                        sec_budget_map[s_id] = sec_budget_map.get(s_id, 0.0) + (b.budget or 0.0)

            # 2. Real spending sync
            items = self.expense_repo.get_all(tenant_id, month_str)
            for item in items:
                if not item.section_id: continue
                sec_id = item.section_id
                sub = item.subtotal or 0.0
                
                target = per_section_gen.setdefault(sec_id, {m: {'total': 0.0, 'card': 0.0, 'budget': 0.0, 'plan': 0.0} for m in MONTHS})
                
                if item.status == "Bought":
                    is_card = item.payment_method == "credit" or (card_channel_id and item.channel_id == card_channel_id)
                    target[mk]['total'] += sub
                    if is_card:
                        target[mk]['card'] += sub
                elif item.status == "Planned":
                    target[mk]['plan'] += sub

            # 3. Apply Budget map to target
            for s_id, b_val in sec_budget_map.items():
                target = per_section_gen.setdefault(s_id, {m: {'total': 0.0, 'card': 0.0, 'budget': 0.0, 'plan': 0.0} for m in MONTHS})
                target[mk]['budget'] = b_val

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
            
            updates = {}
            for mk, data in month_totals.items():
                updates[mk] = round(data['budget'] if data['budget'] > 0 else data['plan'], 0)
                updates[f"actual_{mk}"] = round(data['total'], 0)
                updates[f"actual_card_{mk}"] = round(data['card'], 0)
            
            self.annual_repo.set_values(row.id, updates)

    def sync_card_to_debts_for_month(self, tenant_id: int, month_str: str) -> None:
        # DEACTIVATED: User wants manual entry for previous month debt
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
            final_expense = (cash_expense + manual_payment) if actual_total > 0 else plan
            net = inc - final_expense
            accumulated += net
            result.append({
                "month": m, "revenues": inc, "expenses": final_expense, "planned_expenses": plan,
                "actual_total_expenses": actual_total, "actual_card_expenses": actual_card_total,
                "manual_cc_payment": manual_payment,
                "net": net, "accumulated": accumulated,
            })
        return result
