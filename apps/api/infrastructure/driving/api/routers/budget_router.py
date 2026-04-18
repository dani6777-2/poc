from typing import List
from fastapi import APIRouter, Depends
from core.entities.budget import BudgetEntity, BudgetCreateDto
from application.services.budget_service import BudgetService
from infrastructure.config.dependencies import get_budget_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.get("/{month}", response_model=List[BudgetEntity])
def get_budget(month: str, budget_service: BudgetService = Depends(get_budget_service), current_user: models.User = Depends(get_current_user)):
    return budget_service.get_budget(current_user.tenant_id, month)

@router.post("/", response_model=BudgetEntity)
def create_budget(data: BudgetCreateDto, budget_service: BudgetService = Depends(get_budget_service), current_user: models.User = Depends(get_current_user)):
    return budget_service.update_budget(current_user.tenant_id, 0, data)

@router.put("/{budget_id}", response_model=BudgetEntity)
def update_budget(budget_id: int, data: BudgetCreateDto, budget_service: BudgetService = Depends(get_budget_service), current_user: models.User = Depends(get_current_user)):
    return budget_service.update_budget(current_user.tenant_id, budget_id, data)


