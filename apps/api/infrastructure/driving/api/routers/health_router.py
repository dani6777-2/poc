from fastapi import APIRouter, Depends
from core.entities.health import HealthResponse
from application.services.health_service import HealthService
from infrastructure.config.dependencies import get_health_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/alerts/{month}", response_model=HealthResponse)
def get_health_status(month: str, service: HealthService = Depends(get_health_service), current_user: models.User = Depends(get_current_user)):
    return service.get_health(current_user.tenant_id, month)
