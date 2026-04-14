from typing import List, Dict, Optional
from pydantic import BaseModel

class AIInsight(BaseModel):
    id: str
    type: str # success, warning, info
    message: str
    value: str

class AIForecastEntity(BaseModel):
    month: str
    actual_expense: float
    projected_expense: float
    daily_run_rate: float
    estimated_savings: float
    savings_rate: float
    health_score: int
    detail_kpis: Dict[str, float]
    insights: List[AIInsight]
