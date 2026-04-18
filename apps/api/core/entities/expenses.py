from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from decimal import Decimal

class ItemEntity(BaseModel):
    id: int
    tenant_id: int
    month: str
    date: Optional[str]
    name: str
    
    category_id: Optional[int] = None
    category_name: Optional[str] = None 
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    
    channel_id: Optional[int] = None
    channel_name: Optional[str] = None
    
    unit_id: Optional[int] = None
    unit_name: Optional[str] = None
    
    quantity: float
    unit_price: float
    subtotal: float
    prev_month_price: Optional[float]
    status: str
    source: Optional[str]
    payment_method: str = "debit"
    version_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class ItemCreateDto(BaseModel):
    month: str
    date: Optional[str] = None
    name: str
    category_id: Optional[int] = None
    channel_id: Optional[int] = None
    unit_id: Optional[int] = None
    quantity: float = 0.0
    unit_price: float = 0.0
    prev_month_price: Optional[float] = None
    status: str = "Planned"
    source: Optional[str] = None
    payment_method: str = "debit"
    override_duplicate: Optional[bool] = False

    @field_validator("quantity", "unit_price", "prev_month_price", mode="before", check_fields=False)
    @classmethod
    def _sanitize_float(cls, v):
        if v is not None and str(v).strip() != "":
            return float(Decimal(str(v)).quantize(Decimal("0.01")))
        return None

class ItemUpdateDto(BaseModel):
    month: str
    date: Optional[str] = None
    name: str
    category_id: Optional[int] = None
    channel_id: Optional[int] = None
    unit_id: Optional[int] = None
    quantity: float = 0.0
    unit_price: float = 0.0
    prev_month_price: Optional[float] = None
    status: str
    source: Optional[str] = None
    payment_method: str = "debit"
    version_id: Optional[int] = None

    @field_validator("quantity", "unit_price", "prev_month_price", mode="before", check_fields=False)
    @classmethod
    def _sanitize_float(cls, v):
        if v is not None and str(v).strip() != "":
            return float(Decimal(str(v)).quantize(Decimal("0.01")))
        return None
