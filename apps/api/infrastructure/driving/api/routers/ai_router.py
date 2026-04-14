from fastapi import APIRouter, Depends
from core.entities.ai_forecast import AIForecastEntity
from application.services.ai_service import AIService
from infrastructure.config.dependencies import get_ai_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

@router.get("/forecast/{month}", response_model=AIForecastEntity)
def get_ai_forecast(month: str, service: AIService = Depends(get_ai_service), current_user: models.User = Depends(get_current_user)):
    return service.get_forecast(current_user.tenant_id, month)
