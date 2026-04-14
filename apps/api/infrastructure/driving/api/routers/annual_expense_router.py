from typing import List, Optional
from fastapi import APIRouter, Depends
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from application.services.annual_expense_service import AnnualExpenseService
from application.services.revenue_service import RevenueService
from infrastructure.config.dependencies import get_annual_expense_service, get_revenue_service, get_db
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/expense-details", tags=["expense-details"])

@router.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    secs = db.query(models.TaxonomySection).order_by(models.TaxonomySection.sort_order).all()
    return {"sections": [s.name for s in secs], "sections_full": [{"id": s.id, "name": s.name, "icon": s.icon} for s in secs]}

@router.get("/{year}", response_model=List[AnnualExpenseEntity])
def get_expenses(year: int, section_id: Optional[int] = None, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.get_annual_expenses(current_user.tenant_id, year, section_id)

@router.post("/", response_model=AnnualExpenseEntity)
def create_expense(data: AnnualExpenseCreateDto, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.create_annual_expense(current_user.tenant_id, data)

@router.put("/{expense_id}", response_model=AnnualExpenseEntity)
def update_expense(expense_id: int, data: AnnualExpenseCreateDto, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.update_annual_expense(current_user.tenant_id, expense_id, data)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    service.delete_annual_expense(current_user.tenant_id, expense_id)
    return {"ok": True}

@router.get("/{year}/summary")
def get_expense_summary(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.get_summary(current_user.tenant_id, year)

@router.get("/{year}/net")
def get_monthly_net(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), revenue_service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.get_net_summary(current_user.tenant_id, year, revenue_service.get_summary)

@router.post("/{year}/sync")
def sync_manual(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    service.sync_registry_to_expenses(current_user.tenant_id, year)
    return {"ok": True, "year": year, "message": "Registry to Annual Expenses synchronization completed"}
