from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime

def _validate_month(v: str) -> str:
    try:
        datetime.strptime(v, "%Y-%m")
        return v
    except ValueError as exc:
        raise ValueError("month must be in YYYY-MM format") from exc

class BudgetEntity(BaseModel):
    id: int
    tenant_id: int
    month: str
    category_id: int
    category_name: Optional[str] = None
    budget: float
    actual_spending: float
    
    model_config = ConfigDict(from_attributes=True)

class BudgetCreateDto(BaseModel):
    month: str
    category_id: int
    budget: float = 0.0
    actual_spending: float = 0.0

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        return _validate_month(v)
