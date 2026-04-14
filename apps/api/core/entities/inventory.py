from typing import Optional
from pydantic import BaseModel, ConfigDict

class InventoryItemA(BaseModel):
    id: int
    tenant_id: int
    month: str
    category_id: int
    category_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    name: str
    unit_id: Optional[int] = None
    unit_name: Optional[str] = None
    quantity: float = 0.0
    channel_id: Optional[int] = None
    channel_name: Optional[str] = None
    unit_price: float = 0.0
    subtotal: float = 0.0
    prev_month_price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class InventoryItemB(BaseModel):
    id: int
    tenant_id: int
    month: str
    category_id: int
    category_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    name: str
    channel_id: Optional[int] = None
    channel_name: Optional[str] = None
    unit_id: Optional[int] = None
    unit_name: Optional[str] = None
    price_per_kg: float = 0.0
    subtotal: float = 0.0
    prev_month_price: Optional[float] = None
    price_delta: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class InventoryItemACreate(BaseModel):
    month: str
    category_id: int
    name: str
    unit_id: Optional[int] = None
    quantity: float = 0.0
    channel_id: Optional[int] = None
    unit_price: float = 0.0
    prev_month_price: Optional[float] = None

class InventoryItemBCreate(BaseModel):
    month: str
    category_id: int
    name: str
    channel_id: Optional[int] = None
    unit_id: Optional[int] = None
    price_per_kg: float = 0.0
    prev_month_price: Optional[float] = None
