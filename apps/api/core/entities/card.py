from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class CardConfigEntity(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    name: str = "Credit Card"
    total_limit: float = 0.0
    channel_id: Optional[int] = None
    channel_name: Optional[str] = None
    alert_pct: int = 80
    cutoff_day: int = 1
    payment_day: int = 5
    
    model_config = ConfigDict(from_attributes=True)

class CardMonthlyStateEntity(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    month: str
    manual_payment: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class CardTransactionEntity(BaseModel):
    name: str
    subtotal: float
    date: Optional[str] = None

class CardBalanceEntity(BaseModel):
    name: str
    channel_id: Optional[int] = None
    channel_name: Optional[str] = None
    total_limit: float
    used: float
    manual_payment: float = 0.0
    net_debt: float = 0.0      # used - manual_payment (real pending debt after partial payment)
    available: float
    pct_used: float
    alert: bool
    critical: bool
    alert_pct: int
    n_transactions: int
    transactions: List[CardTransactionEntity]
    is_configured: bool
    cutoff_day: int
    payment_day: int
    next_closing: str
    next_payment: str
