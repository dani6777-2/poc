from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from application.services.annual_expense_service import AnnualExpenseService
from application.services.revenue_service import RevenueService
from infrastructure.config.dependencies import get_annual_expense_service, get_revenue_service, get_db, get_expense_service
from application.services.expense_service import ExpenseService
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

@router.get("/system/health")
def system_health(year: int, svc: AnnualExpenseService = Depends(get_annual_expense_service), tr_svc: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from core.constants import MONTHS
    # Imbalance calculation
    items = tr_svc.expense_repo.get_all(current_user.tenant_id, None)
    total_bought_items = sum(i.subtotal for i in items if i.status == "Bought" and str(i.month).startswith(str(year)))
    
    matrix = svc.annual_repo.get_all_by_year(current_user.tenant_id, year)
    total_matrix_actuals = sum(sum(getattr(r, f"actual_{m}") or 0.0 for m in MONTHS) for r in matrix)
    
    delta = round(abs(total_bought_items - total_matrix_actuals), 2)
    duplicates = tr_svc.expense_repo.get_duplicate_clusters_count(current_user.tenant_id)
    status = "warning" if delta > 0.05 or duplicates > 0 else "healthy"
    
    log = models.SystemHealthLog(tenant_id=current_user.tenant_id, status=status, delta=delta, duplicate_clusters=duplicates)
    db.add(log)
    db.commit()

    return {
        "status": status,
        "duplicate_clusters": duplicates,
        "imbalance_delta": delta,
        "metrics": {"total_transactions_sum": total_bought_items, "matrix_actuals_sum": total_matrix_actuals}
    }

class ReconcileRequest(BaseModel):
    year: int
    dry_run: bool = False

@router.post("/system/reconcile")
def reconcile_system(req: ReconcileRequest, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    trace = service.sync_registry_to_expenses(current_user.tenant_id, req.year, dry_run=req.dry_run)
    return {"status": "success", "message": "Reconciliation Trace Analyzed", "audited_year": req.year, "trace": trace, "dry_run": req.dry_run}
