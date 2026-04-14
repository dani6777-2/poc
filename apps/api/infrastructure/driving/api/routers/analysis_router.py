from fastapi import APIRouter, Depends
from core.entities.analysis import AnalysisResponse
from application.services.analysis_service import AnalysisService
from infrastructure.config.dependencies import get_analysis_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/{month}", response_model=AnalysisResponse)
def get_analysis(month: str, service: AnalysisService = Depends(get_analysis_service), current_user: models.User = Depends(get_current_user)):
    return service.get_analysis(current_user.tenant_id, month)
