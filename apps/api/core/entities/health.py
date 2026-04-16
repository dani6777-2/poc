from typing import List, Dict, Optional
from pydantic import BaseModel

class SectionAlert(BaseModel):
    section: str
    icon: str
    expense: float
    pct_income: Optional[float]
    level: str
    advice: str
    reference: str
    max_ok: Optional[float] = None
    max_warning: Optional[float] = None
    min_ok: Optional[float] = None
    min_warning: Optional[float] = None
    invert: bool = False
    group: Optional[str] = None

class Group503020(BaseModel):
    label: str
    icon: str
    meta: float
    total: float
    pct: Optional[float]
    level: str
    sections: List[str]

class CardAlert(BaseModel):
    name: str
    channel_name: Optional[str] = None
    total_limit: float
    used: float
    available: float
    pct_used: float
    level: str
    advice: str
    reference: str
    n_transactions: int
    note: str

class HealthResponse(BaseModel):
    month: str
    total_revenue: float
    no_revenue: bool
    global_score: int
    global_level: str
    sections: List[SectionAlert]
    rule_50_30_20: Dict[str, Group503020]
    card: Optional[CardAlert]
    active_alerts: int
    alerts_summary: List[SectionAlert]
    cash_expense: float
    card_expense_month: float
    card_expense_annuals: float
    total_card_expense: float
    cash_balance: Optional[float]
    projected_balance: Optional[float]
