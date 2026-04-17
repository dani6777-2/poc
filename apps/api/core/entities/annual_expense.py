from typing import Optional
from pydantic import BaseModel, ConfigDict

class AnnualExpenseEntity(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    year: int
    section_id: int
    section_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    description: str
    sort_order: Optional[int] = 0
    is_automatic: bool = False
    
    # Budget
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
    
    # Actual
    actual_jan: float = 0.0
    actual_feb: float = 0.0
    actual_mar: float = 0.0
    actual_apr: float = 0.0
    actual_may: float = 0.0
    actual_jun: float = 0.0
    actual_jul: float = 0.0
    actual_aug: float = 0.0
    actual_sep: float = 0.0
    actual_oct: float = 0.0
    actual_nov: float = 0.0
    actual_dec: float = 0.0
    
    # Card
    actual_card_jan: float = 0.0
    actual_card_feb: float = 0.0
    actual_card_mar: float = 0.0
    actual_card_apr: float = 0.0
    actual_card_may: float = 0.0
    actual_card_jun: float = 0.0
    actual_card_jul: float = 0.0
    actual_card_aug: float = 0.0
    actual_card_sep: float = 0.0
    actual_card_oct: float = 0.0
    actual_card_nov: float = 0.0
    actual_card_dec: float = 0.0
    
    # Computed
    annual_total: float = 0.0
    actual_annual_total: float = 0.0
    actual_card_annual_total: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class AnnualExpenseCreateDto(BaseModel):
    year: int
    section_id: int
    category_id: Optional[int] = None
    description: str
    sort_order: Optional[int] = 0
    is_automatic: bool = False
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
    actual_jan: float = 0.0
    actual_feb: float = 0.0
    actual_mar: float = 0.0
    actual_apr: float = 0.0
    actual_may: float = 0.0
    actual_jun: float = 0.0
    actual_jul: float = 0.0
    actual_aug: float = 0.0
    actual_sep: float = 0.0
    actual_oct: float = 0.0
    actual_nov: float = 0.0
    actual_dec: float = 0.0
    actual_card_jan: float = 0.0
    actual_card_feb: float = 0.0
    actual_card_mar: float = 0.0
    actual_card_apr: float = 0.0
    actual_card_may: float = 0.0
    actual_card_jun: float = 0.0
    actual_card_jul: float = 0.0
    actual_card_aug: float = 0.0
    actual_card_sep: float = 0.0
    actual_card_oct: float = 0.0
    actual_card_nov: float = 0.0
    actual_card_dec: float = 0.0
