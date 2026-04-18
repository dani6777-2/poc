
from core.entities.analysis import (
    AnalysisResponse, AnalysisKpis, CanalStat, InflationStat, 
    CategoryChartItem, PlanVsRealItem
)
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.revenue_repository import RevenueRepositoryPort
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.budget_repository import BudgetRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort
from core.constants import MONTHS_KEYS, AUTO_PREFIXES, CARD_DESCRIPTION_PREFIX

class AnalysisService:
    def __init__(
        self,
        expense_repo: ExpenseRepositoryPort,
        revenue_repo: RevenueRepositoryPort,
        annual_repo: AnnualExpenseRepositoryPort,
        budget_repo: BudgetRepositoryPort,
        card_repo: CardRepositoryPort
    ):
        self.expense_repo = expense_repo
        self.revenue_repo = revenue_repo
        self.annual_repo = annual_repo
        self.budget_repo = budget_repo
        self.card_repo = card_repo

    def _month_key(self, month: str) -> str:
        return MONTHS_KEYS[int(month[5:7]) - 1]

    def get_analysis(self, tenant_id: int, month: str) -> AnalysisResponse:
        year = int(month[:4])
        mk = self._month_key(month)
        
        config = self.card_repo.get_config(tenant_id)
        card_channel_id = config.channel_id if config and (config.total_limit or 0) > 0 else None

        # Items (Registry)
        items = self.expense_repo.get_all(tenant_id, month)
        bought_items = [i for i in items if i.status == "Bought"]
        
        card_items = [i for i in bought_items if i.payment_method == "credit" or (card_channel_id and i.channel_id == card_channel_id)]
        cash_items = [i for i in bought_items if not (i.payment_method == "credit" or (card_channel_id and i.channel_id == card_channel_id))]

        total_expense_reg = sum(i.subtotal or 0 for i in bought_items)
        cash_expense_reg = sum(i.subtotal or 0 for i in cash_items)
        card_expense_month = sum(i.subtotal or 0 for i in card_items)

        # Revenue
        revenue_entities = self.revenue_repo.get_all_by_year(tenant_id, year)
        total_revenue = sum(getattr(r, mk) or 0 for r in revenue_entities)

        # Annual Expenses
        annual_entities = self.annual_repo.get_all_by_year(tenant_id, year)
        actual_mk = f"actual_{mk}"
        actual_card_mk = f"actual_card_{mk}"

        section_planned: dict = {}
        section_actual_gs: dict = {}

        total_expense_matrix = 0
        total_card_expense = 0

        for r in annual_entities:
            plan_v = getattr(r, mk) or 0
            actual_v = getattr(r, actual_mk) or 0
            actual_card = getattr(r, actual_card_mk) or 0

            sec_name = r.section_name or "Various"
            is_card_debt_row = r.description and r.description.startswith(CARD_DESCRIPTION_PREFIX)

            # Fix #1 & #9: exclude 💳 Card: debt rows from expense matrix (already counted via manual_payment)
            # and track cash vs card separately in section_actual
            if not is_card_debt_row:
                section_planned[sec_name] = section_planned.get(sec_name, 0) + plan_v
                # Fix #1: section_actual shows cash-only spending (actual minus card portion)
                cash_portion = actual_v - actual_card
                section_actual_gs[sec_name] = section_actual_gs.get(sec_name, 0) + cash_portion

                total_expense_matrix += actual_v
                total_card_expense += actual_card

        # Budget
        budgets = self.budget_repo.get_all(tenant_id, month)
        total_budget = sum(b.budget or 0 for b in budgets)

        # Monthly state (Manual CC Payment)
        m_state = self.card_repo.get_monthly_state(tenant_id, month)
        manual_cc_payment = m_state.get("manual_payment", 0.0) if m_state else 0.0

        # Calculations
        total_cash_expense = total_expense_matrix - total_card_expense
        
        # Liquidity (Cash Balance) = Revenue - Cash Expenses - Manual CC Previous Month Payment
        cash_balance = total_revenue - total_cash_expense - manual_cc_payment
        
        projected_balance = total_revenue - total_cash_expense - total_card_expense
        
        primary_balance = cash_balance 
        base_pct = total_revenue if total_revenue > 0 else total_budget
        executed_pct = round(total_cash_expense / base_pct * 100, 1) if base_pct > 0 else 0

        # Stats
        n_purchases = len(bought_items)
        avg_ticket = round(total_expense_reg / n_purchases, 0) if n_purchases > 0 else 0

        # Category consolidation
        cat_consolidated: dict = {}
        for i in bought_items:
            cat = i.category_name or "Uncategorized"
            cat_consolidated[cat] = cat_consolidated.get(cat, 0) + (i.subtotal or 0)
        for r in annual_entities:
            if r.description and not any(r.description.startswith(p) for p in AUTO_PREFIXES):
                val_total = getattr(r, actual_mk) or 0
                val_card = getattr(r, actual_card_mk) or 0
                val_cash = val_total - val_card
                if val_cash > 0:
                    cat_consolidated[r.description] = cat_consolidated.get(r.description, 0) + val_cash
        
        highest_cat = max(cat_consolidated, key=cat_consolidated.get) if cat_consolidated else "—"

        # Plan Vs Real
        all_sections = set(list(section_planned.keys()) + list(section_actual_gs.keys()))
        plan_vs_real = []
        for sec in sorted(all_sections):
            p_v = section_planned.get(sec, 0)
            r_v = section_actual_gs.get(sec, 0)
            plan_vs_real.append(PlanVsRealItem(
                section=sec,
                planned=round(p_v, 0),
                actual=round(r_v, 0),
                variance=round(p_v - r_v, 0),
                pct_income=round(r_v / total_revenue * 100, 1) if total_revenue > 0 else None
            ))

        # Channels
        channel_stats: dict = {}
        for i in bought_items:
            c = i.channel_name or "No channel"
            if c not in channel_stats: channel_stats[c] = {"total": 0, "n": 0}
            channel_stats[c]["total"] += i.subtotal or 0
            channel_stats[c]["n"] += 1
        
        channels = []
        for c, s in channel_stats.items():
            is_card = (config.channel_name and c == config.channel_name)
            channels.append(CanalStat(
                channel=c,
                total=round(s["total"], 0),
                pct=round(s["total"] / total_expense_reg * 100, 1) if total_expense_reg > 0 else 0,
                pct_revenue=round(s["total"] / total_revenue * 100, 1) if total_revenue > 0 else None,
                n_purchases=s["n"],
                avg_price=round(s["total"] / s["n"], 0),
                is_card=bool(is_card),
                note="Deducted only via manual payment entry" if is_card else None
            ))

        # Inflation
        inflation = []
        for i in items:
            if i.prev_month_price and i.unit_price and i.prev_month_price > 0:
                diff = i.unit_price - i.prev_month_price
                inflation.append(InflationStat(
                    name=i.name,
                    actual_price=i.unit_price,
                    prev_month_price=i.prev_month_price,
                    difference=round(diff, 0),
                    variation_pct=round(diff / i.prev_month_price * 100, 1)
                ))

        # Category Chart
        category_chart = []
        for b in budgets:
            actual = cat_consolidated.get(b.category_name, 0)
            category_chart.append(CategoryChartItem(
                category=b.category_name or "Uncategorized",
                budget=b.budget or 0,
                actual=round(actual, 0),
                pct_revenue=round(actual / total_revenue * 100, 1) if total_revenue > 0 else None
            ))

        return AnalysisResponse(
            kpis=AnalysisKpis(
                total_revenue=round(total_revenue, 0),
                planned_expense=round(sum(section_planned.values()), 0),
                total_budget=round(total_budget, 0),
                total_expense=round(total_expense_matrix, 0),
                actual_expense=round(total_cash_expense, 0),
                cash_expense=round(total_cash_expense, 0),
                card_expense_month=round(card_expense_month, 0),
                card_expense_annuals=round(total_card_expense, 0),
                total_card_expense=round(total_card_expense, 0),
                has_card=total_card_expense > 0,
                card_channel=config.channel_name if config else None,
                n_purchases=n_purchases,
                avg_ticket=avg_ticket,
                highest_expense_cat=highest_cat,
                balance=round(primary_balance, 0),
                balance_vs_revenue=round(cash_balance, 0),
                cash_balance=round(cash_balance, 0),
                projected_balance=round(projected_balance, 0),
                balance_vs_budget=round(total_budget - total_cash_expense, 0),
                balance_vs_planned=round(sum(section_planned.values()) - total_cash_expense, 0) if sum(section_planned.values()) > 0 else None,
                executed_pct=executed_pct,
                has_revenue=total_revenue > 0,
                expected_revenues=round(total_revenue, 0),
                liquidity_gap=round(projected_balance, 0) if projected_balance < 0 else 0
            ),
            channels=sorted(channels, key=lambda x: x.total, reverse=True),
            inflation=sorted(inflation, key=lambda x: abs(x.variation_pct), reverse=True),
            category_chart=category_chart,
            plan_vs_actual=plan_vs_real,
            section_planned={s: round(v, 0) for s, v in section_planned.items()},
            section_actual={s: round(v, 0) for s, v in section_actual_gs.items()},
            ref_section_month={s: round(v, 0) for s, v in section_planned.items()},
            meta={
                "month": month, "year": year, "month_key": mk,
                "total_revenue": round(total_revenue, 0),
                "planned_expense_plan": round(sum(section_planned.values()), 0)
            }
        )
