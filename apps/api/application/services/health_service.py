from typing import List, Dict, Optional
from core.entities.health import (
    HealthResponse, SectionAlert, Group503020, CardAlert
)
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.revenue_repository import RevenueRepositoryPort
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort

MONTHS_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
AUTO_PREFIXES = ('📝 Registry:', '💳 Card:', '🛒 Supermarket')

RULES = {
    "Fixed Expenses": {
        "max_ok": 30, "max_warning": 40, "icon": "📌", "group": "needs",
        "advice_ok": "Fixed expenses controlled ✓",
        "advice_warning": "High fixed expenses — review rent and utility bills",
        "advice_danger": "Critical: more than 40% in fixed commitments makes saving impossible",
        "reference": "Recommended: max 30% of income",
    },
    "Food": {
        "max_ok": 15, "max_warning": 22, "icon": "🍽️", "group": "needs",
        "advice_ok": "Food spending in healthy range ✓",
        "advice_warning": "High food spending — plan purchases with weekly lists",
        "advice_danger": "Critical food spending: exceeds 22% of income",
        "reference": "Recommended: 10–15% of income",
    },
    "Transport": {
        "max_ok": 12, "max_warning": 18, "icon": "🚗", "group": "needs",
        "advice_ok": "Transport in optimal range ✓",
        "advice_warning": "High transport costs — evaluate carpooling or public transit",
        "advice_danger": "Critical transport: more than 18% of income",
        "reference": "Recommended: max 12% of income",
    },
    "Health": {
        "max_ok": 8, "max_warning": 12, "icon": "🏥", "group": "needs",
        "advice_ok": "Reasonable health spending ✓",
        "advice_warning": "High health spending — review your health plan or insurance",
        "advice_danger": "Critical health spending: more than 12% of income",
        "reference": "Recommended: max 8% of income",
    },
    "Home": {
        "max_ok": 8, "max_warning": 12, "icon": "🏠", "group": "lifestyle",
        "advice_ok": "Home well managed ✓",
        "advice_warning": "High home expenses",
        "advice_danger": "Critical home: exceeds 12% of income",
        "reference": "Recommended: max 8% of income",
    },
    "Daily Life": {
        "max_ok": 8, "max_warning": 12, "icon": "🎭", "group": "lifestyle",
        "advice_ok": "Balanced leisure and daily life ✓",
        "advice_warning": "High leisure — review subscriptions and outings",
        "advice_danger": "Critical leisure: more than 12% in lifestyle",
        "reference": "Recommended: max 8% of income",
    },
    "Pets": {
        "max_ok": 5, "max_warning": 8, "icon": "🐾", "group": "lifestyle",
        "advice_ok": "Pets controlled ✓",
        "advice_warning": "High pet costs — review diet and vet visits",
        "advice_danger": "Critical pet costs: more than 8% of income",
        "reference": "Recommended: max 5% of income",
    },
    "Various": {
        "max_ok": 5, "max_warning": 8, "icon": "🗂️", "group": "lifestyle",
        "advice_ok": "Various expenses under control ✓",
        "advice_warning": "High various expenses — identify and eliminate small leaks",
        "advice_danger": "Critical various — forgotten subscriptions or hidden costs?",
        "reference": "Recommended: max 5% of income",
    },
    "Debts": {
        "max_ok": 15, "max_warning": 25, "icon": "💳", "group": "debts",
        "advice_ok": "Manageable debt level ✓",
        "advice_warning": "High debt — prioritize paying high-interest debts",
        "advice_danger": "Critical debt: more than 25% in financial obligations",
        "reference": "Recommended: max 15% (w/o mortgage) or 35% (with mortgage)",
    },
    "Savings": {
        "min_ok": 20, "min_warning": 10, "icon": "🏦", "group": "savings", "invert": True,
        "advice_ok": "Excellent! Savings above 20% ✓",
        "advice_warning": "Low savings — minimum goal: 20% of income",
        "advice_danger": "Insufficient savings — urgent priority",
        "reference": "Goal: minimum 20% of income",
    },
}

GROUPS = {
    "needs": {"sections": ["Fixed Expenses", "Food", "Health", "Transport"], "meta": 50, "label": "Needs", "icon": "🏠"},
    "lifestyle": {"sections": ["Daily Life", "Pets", "Various", "Home"], "meta": 30, "label": "Lifestyle", "icon": "🎭"},
    "debts": {"sections": ["Debts"], "meta": 15, "label": "Debts", "icon": "💳"},
    "savings": {"sections": ["Savings"], "meta": 20, "label": "Savings", "icon": "🏦"},
}

CARD_RULES = {
    "max_ok": 50, "max_warning": 80,
    "advice": {
        "ok": "Healthy card usage ✓",
        "warning": "Card at limit — reduce card purchases this month",
        "danger": "Critical card usage — limit nearly reached or exceeded",
    }
}

class HealthService:
    def __init__(
        self,
        expense_repo: ExpenseRepositoryPort,
        revenue_repo: RevenueRepositoryPort,
        annual_repo: AnnualExpenseRepositoryPort,
        card_repo: CardRepositoryPort
    ):
        self.expense_repo = expense_repo
        self.revenue_repo = revenue_repo
        self.annual_repo = annual_repo
        self.card_repo = card_repo

    def _month_key(self, month: str) -> str:
        return MONTHS_KEYS[int(month[5:7]) - 1]

    def _get_level(self, pct: float, rule: dict) -> str:
        if rule.get("invert"):
            if pct >= rule["min_ok"]: return "ok"
            if pct >= rule["min_warning"]: return "warning"
            return "danger"
        else:
            if pct <= rule["max_ok"]: return "ok"
            if pct <= rule["max_warning"]: return "warning"
            return "danger"

    def _level_score(self, level: str) -> int:
        return {"ok": 100, "warning": 50, "danger": 0, "no_data": 70}.get(level, 70)

    def get_health(self, tenant_id: int, month: str) -> HealthResponse:
        year = int(month[:4])
        mk = self._month_key(month)
        
        revenues = self.revenue_repo.get_all_by_year(tenant_id, year)
        total_revenue = sum(getattr(r, mk) or 0 for r in revenues)
        no_revenue = total_revenue == 0
        base_inc = total_revenue if not no_revenue else None

        card_config = self.card_repo.get_config(tenant_id)
        card_channel_id = card_config.channel_id if card_config and (card_config.total_limit or 0) > 0 else None

        items = self.expense_repo.get_all(tenant_id, month)
        bought_items = [i for i in items if i.status == "Bought"]
        
        card_items = [i for i in bought_items if card_channel_id and i.channel_id == card_channel_id]
        cash_items = [i for i in bought_items if not (card_channel_id and i.channel_id == card_channel_id)]
        
        card_expense_reg = sum(i.subtotal or 0 for i in card_items)
        cash_expense_reg = sum(i.subtotal or 0 for i in cash_items)

        annuals = self.annual_repo.get_all_by_year(tenant_id, year)
        actual_mk = f"actual_{mk}"
        actual_card_mk = f"actual_card_{mk}"
        
        section_planned: dict = {}
        section_actual: dict = {}
        card_expense_gs = 0
        cash_expense_gs = 0
        auto_card_pay = 0
        
        for r in annuals:
            plan_v = getattr(r, mk) or 0
            actual_v = getattr(r, actual_mk) or 0
            actual_card = getattr(r, actual_card_mk) or 0
            
            sec_name = r.section_name or "Various"
            is_card_pay = r.description and r.description.startswith('💳 Card:')
            
            section_planned[sec_name] = section_planned.get(sec_name, 0) + plan_v
            if not is_card_pay:
                section_actual[sec_name] = section_actual.get(sec_name, 0) + actual_v
            else:
                auto_card_pay += actual_v
            
            if r.description and not any(r.description.startswith(p) for p in AUTO_PREFIXES):
                card_expense_gs += actual_card
                cash_expense_gs += (actual_v - actual_card)

        total_cash_expense = cash_expense_reg + cash_expense_gs + auto_card_pay
        total_card_expense = card_expense_reg + card_expense_gs

        section_alerts = []
        scores = []
        for sec, rule in RULES.items():
            expense = section_actual.get(sec, 0) if section_actual.get(sec, 0) > 0 else section_planned.get(sec, 0)
            pct = round(expense / base_inc * 100, 1) if base_inc and base_inc > 0 and expense > 0 else None
            level = self._get_level(pct, rule) if pct is not None else "no_data"
            scores.append(self._level_score(level))
            
            section_alerts.append(SectionAlert(
                section=sec, icon=rule["icon"], expense=round(expense, 0),
                pct_income=pct, level=level, advice=rule.get(f"advice_{level}", ""),
                reference=rule["reference"], max_ok=rule.get("max_ok"),
                max_warning=rule.get("max_warning"), min_ok=rule.get("min_ok"),
                min_warning=rule.get("min_warning"), invert=rule.get("invert", False),
                group=rule.get("group")
            ))

        rule_50_30_20 = {}
        for k, cfg in GROUPS.items():
            total_g = sum((section_actual.get(s, 0) or section_planned.get(s, 0)) for s in cfg["sections"])
            pct_g = round(total_g / base_inc * 100, 1) if base_inc and base_inc > 0 else None
            goal = cfg["meta"]
            if pct_g is None: level_g = "no_data"
            elif k == "savings": level_g = "ok" if pct_g >= goal else ("warning" if pct_g >= goal*0.5 else "danger")
            else: level_g = "ok" if pct_g <= goal else ("warning" if pct_g <= goal*1.25 else "danger")
            
            rule_50_30_20[k] = Group503020(
                label=cfg["label"], icon=cfg["icon"], meta=goal, total=round(total_g, 0),
                pct=pct_g, level=level_g, sections=cfg["sections"]
            )

        card_alert = None
        if card_config and (card_config.total_limit or 0) > 0:
            card_pct = round(total_card_expense / card_config.total_limit * 100, 1) if card_config.total_limit > 0 else 0
            tc_level = "ok" if card_pct <= CARD_RULES["max_ok"] else ("warning" if card_pct <= CARD_RULES["max_warning"] else "danger")
            card_alert = CardAlert(
                name=card_config.name, channel_name=card_config.channel_name,
                total_limit=card_config.total_limit, used=round(total_card_expense, 0),
                available=round(card_config.total_limit - total_card_expense, 0),
                pct_used=card_pct, level=tc_level, advice=CARD_RULES["advice"][tc_level],
                reference=f"Alert set at {card_config.alert_pct}%", n_transactions=len(card_items),
                note="Does not deduct from your current balance — paid next month"
            )
            scores.append(self._level_score(tc_level))

        global_score = round(sum(scores) / len(scores)) if scores else 0
        global_level = "ok" if global_score >= 80 else ("warning" if global_score >= 55 else "danger")
        active_alerts_list = [a for a in section_alerts if a.level in ("warning", "danger")]

        return HealthResponse(
            month=month, total_revenue=round(total_revenue, 0), no_revenue=no_revenue,
            global_score=global_score, global_level=global_level,
            sections=section_alerts, rule_50_30_20=rule_50_30_20,
            card=card_alert, active_alerts=len(active_alerts_list),
            alerts_summary=active_alerts_list[:3],
            cash_expense=round(total_cash_expense, 0),
            card_expense_month=round(card_expense_reg, 0),
            card_expense_annuals=round(card_expense_gs, 0),
            total_card_expense=round(total_card_expense, 0),
            cash_balance=round(total_revenue - total_cash_expense, 0) if not no_revenue else None,
            projected_balance=round(total_revenue - total_cash_expense - total_card_expense, 0) if not no_revenue else None
        )
