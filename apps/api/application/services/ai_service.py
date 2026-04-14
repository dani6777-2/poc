from datetime import date
import calendar
from typing import List, Dict, Optional
from core.entities.ai_forecast import AIForecastEntity, AIInsight
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.revenue_repository import RevenueRepositoryPort

MONTHS_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

class AIService:
    def __init__(
        self,
        expense_repo: ExpenseRepositoryPort,
        revenue_repo: RevenueRepositoryPort
    ):
        self.expense_repo = expense_repo
        self.revenue_repo = revenue_repo

    def get_forecast(self, tenant_id: int, month: str) -> AIForecastEntity:
        year = int(month[:4])
        month_num = int(month[5:7])
        mk = MONTHS_KEYS[month_num - 1]

        # 1. Expenses
        items = self.expense_repo.get_all(tenant_id, month)
        bought_items = [i for i in items if i.status == "Bought"]
        actual_expense = sum(i.subtotal or 0 for i in bought_items)

        # 2. Revenue
        revenues = self.revenue_repo.get_all_by_year(tenant_id, year)
        total_revenue = sum(getattr(r, mk) or 0 for r in revenues)

        # 3. Forecast logic
        today = date.today()
        is_current_month = (today.year == year and today.month == month_num)
        
        if is_current_month:
            day_of_month = today.day
        else:
            _, day_of_month = calendar.monthrange(year, month_num)
            
        _, total_days = calendar.monthrange(year, month_num)
        
        daily_run_rate = actual_expense / day_of_month if day_of_month > 0 else 0
        projected_expense = daily_run_rate * total_days
        
        estimated_savings = total_revenue - projected_expense if total_revenue > 0 else 0
        savings_rate = (estimated_savings / total_revenue * 100) if total_revenue > 0 else 0
        
        # 4. Health Score
        ratio = (projected_expense / total_revenue) if total_revenue > 0 else 0
        
        # 5. Anomalies
        anomalies = []
        cat_totals = {}
        for i in bought_items:
            cat = i.category_name or "Various"
            cat_totals[cat] = cat_totals.get(cat, 0) + (i.subtotal or 0)
        
        for cat, total in cat_totals.items():
            if total > 500000:
                anomalies.append(f"Unusual spending in {cat}")

        score_save = min(100, max(0, savings_rate * 2))
        score_run  = 100 if ratio < 0.8 else max(0, 100 - (ratio - 0.8) * 200)
        score_anom = max(0, 100 - len(anomalies) * 20)
        score = int((score_save * 0.4) + (score_run * 0.3) + (score_anom * 0.3))

        # 6. Detail KPIs - Using normalized names now
        essential_cats = ['dairy', 'groceries', 'proteins', 'fruits/vegetables', 'cleaning', 'pets', 'health']
        essential_expense = sum(total for cat, total in cat_totals.items() if cat.lower() in essential_cats)
        essential_ratio = (essential_expense / actual_expense) if actual_expense > 0 else 0

        insights = []
        if score > 80:
            insights.append(AIInsight(id="health-high", type="success", message="Robust financial health", value="Premium"))
        elif score < 40:
            insights.append(AIInsight(id="health-low", type="warning", message="Financial health under pressure", value="Attention"))

        if essential_ratio > 0.7:
            insights.append(AIInsight(id="essential-high", type="info", message="Spending concentrated on basic needs", value="Rigid"))
        
        if ratio > 0.95:
            insights.append(AIInsight(id="over", type="warning", message="Overdraft risk detected", value="Critical"))
        elif ratio < 0.5:
            insights.append(AIInsight(id="save", type="success", message="High savings capacity this month", value="Excellent"))
        
        if is_current_month and actual_expense > total_revenue * 0.5 and today.day < 15:
            insights.append(AIInsight(id="speed", type="warning", message="Spending velocity too high for mid-month", value="Adjust"))

        for anom in anomalies:
            insights.append(AIInsight(id=f"ano-{anom[:3]}", type="info", message=anom, value="Anomaly"))

        return AIForecastEntity(
            month=month,
            actual_expense=round(actual_expense, 0),
            projected_expense=round(projected_expense, 0),
            daily_run_rate=round(daily_run_rate, 0),
            estimated_savings=round(estimated_savings, 0),
            savings_rate=round(savings_rate, 1),
            health_score=score,
            detail_kpis={
                "essential_ratio": round(essential_ratio * 100, 1),
                "vulnerability": round((1 - essential_ratio) * 100, 1) if essential_ratio > 0 else 0
            },
            insights=insights
        )
