from typing import List
from fastapi import APIRouter, Depends, HTTPException
from core.entities.revenue import RevenueEntity, RevenueCreateDto, RevenueUpdateDto
from application.services.revenue_service import RevenueService
from infrastructure.config.dependencies import get_revenue_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/revenues", tags=["revenues"])

@router.get("/{year}", response_model=List[RevenueEntity])
def get_revenues(year: int, service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.get_revenue_by_year(current_user.tenant_id, year)

@router.post("/", response_model=RevenueEntity)
def create_revenue(data: RevenueCreateDto, service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.create_revenue(current_user.tenant_id, data)

@router.put("/{revenue_id}", response_model=RevenueEntity)
def update_revenue(revenue_id: int, data: RevenueUpdateDto, service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    try:
        return service.update_revenue(current_user.tenant_id, revenue_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{revenue_id}")
def delete_revenue(revenue_id: int, service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    service.delete_revenue(current_user.tenant_id, revenue_id)
    return {"ok": True}

@router.get("/{year}/summary")
def get_revenue_summary(year: int, service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.get_summary(current_user.tenant_id, year)
