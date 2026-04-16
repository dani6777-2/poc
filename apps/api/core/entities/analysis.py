from typing import List, Dict, Optional
from pydantic import BaseModel

class AnalysisKpis(BaseModel):
    total_revenue: float
    planned_expense: float
    total_budget: float
    total_expense: float
    actual_expense: float # Real total cash spent
    cash_expense: float
    card_expense_month: float
    card_expense_annuals: float
    total_card_expense: float
    has_card: bool
    card_channel: Optional[str]
    n_purchases: int
    avg_ticket: float
    highest_expense_cat: str
    balance: float
    balance_vs_revenue: Optional[float]
    cash_balance: Optional[float]
    projected_balance: Optional[float]
    balance_vs_budget: float
    balance_vs_planned: Optional[float]
    executed_pct: float
    has_revenue: bool

class CanalStat(BaseModel):
    channel: str
    total: float
    pct: float
    pct_revenue: Optional[float]
    n_purchases: int
    avg_price: float
    is_card: bool
    note: Optional[str]

class InflationStat(BaseModel):
    name: str
    actual_price: Optional[float]
    prev_month_price: Optional[float]
    difference: float
    variation_pct: float

class CategoryChartItem(BaseModel):
    category: str
    budget: float
    actual: float
    pct_revenue: Optional[float]

class PlanVsRealItem(BaseModel):
    section: str
    planned: float
    actual: float
    variance: float
    pct_income: Optional[float]

class AnalysisResponse(BaseModel):
    kpis: AnalysisKpis
    channels: List[CanalStat]
    inflation: List[InflationStat]
    category_chart: List[CategoryChartItem]
    plan_vs_actual: List[PlanVsRealItem]
    section_planned: Dict[str, float]
    section_actual: Dict[str, float]
    ref_section_month: Dict[str, float]
    meta: Dict
