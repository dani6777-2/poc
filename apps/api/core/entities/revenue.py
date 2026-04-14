from typing import Optional
from pydantic import BaseModel

class RevenueEntity(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    year: int
    source: str
    sort_order: Optional[int] = 0
    jan: float = 0.0
    feb: float = 0.0
    mar: float = 0.0
    apr: float = 0.0
    may: float = 0.0
    jun: float = 0.0
    jul: float = 0.0
    aug: float = 0.0
    sep: float = 0.0
    oct: float = 0.0
    nov: float = 0.0
    dec: float = 0.0
    annual_total: float = 0.0

class RevenueCreateDto(BaseModel):
    year: int
    source: str
    sort_order: Optional[int] = 0
    jan: float = 0.0
    feb: float = 0.0
    mar: float = 0.0
    apr: float = 0.0
    may: float = 0.0
    jun: float = 0.0
    jul: float = 0.0
    aug: float = 0.0
    sep: float = 0.0
    oct: float = 0.0
    nov: float = 0.0
    dec: float = 0.0

class RevenueUpdateDto(BaseModel):
    year: Optional[int] = None
    source: Optional[str] = None
    sort_order: Optional[int] = None
    jan: Optional[float] = None
    feb: Optional[float] = None
    mar: Optional[float] = None
    apr: Optional[float] = None
    may: Optional[float] = None
    jun: Optional[float] = None
    jul: Optional[float] = None
    aug: Optional[float] = None
    sep: Optional[float] = None
    oct: Optional[float] = None
    nov: Optional[float] = None
    dec: Optional[float] = None
