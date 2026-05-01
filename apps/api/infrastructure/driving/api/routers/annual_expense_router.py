from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from application.services.annual_expense_service import AnnualExpenseService
from application.services.revenue_service import RevenueService
from infrastructure.config.dependencies import get_annual_expense_service, get_revenue_service, get_db, get_expense_service
from application.services.expense_service import ExpenseService
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.exceptions import DomainException
from infrastructure.driving.api.auth import get_current_user
from infrastructure.driven.db.repositories.system_repo import DriftRepository, AlertRepository, EditLockRepository, AuditRepository
import logging
import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expense-details", tags=["expense-details"])

# ==== STATIC ROUTES (no path params) - MUST COME FIRST ====

@router.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    secs = db.query(models.TaxonomySection).order_by(models.TaxonomySection.sort_order).all()
    return {"sections": [s.name for s in secs], "sections_full": [{"id": s.id, "name": s.name, "icon": s.icon} for s in secs]}

@router.get("/ledger/integrity-status")
def calculate_data_integrity_status(year: int, svc: AnnualExpenseService = Depends(get_annual_expense_service), tr_svc: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from core.constants import MONTHS
    items = tr_svc.expense_repo.get_all(current_user.tenant_id, None)
    total_bought_items = sum(i.subtotal for i in items if i.status == "Bought" and str(i.month).startswith(str(year)))

    matrix = svc.annual_repo.get_all_by_year(current_user.tenant_id, year)
    total_matrix_actuals = sum(sum(getattr(r, f"actual_{m}") or 0.0 for m in MONTHS) for r in matrix)

    delta = round(abs(total_bought_items - total_matrix_actuals), 2)
    duplicates = tr_svc.expense_repo.get_duplicate_clusters_count(current_user.tenant_id)
    integrity_status = "INTEGRITY_WARNING" if delta > 0.05 or duplicates > 0 else "INTEGRITY_OK"

    log = models.SystemHealthLog(tenant_id=current_user.tenant_id, status=integrity_status, delta=delta, duplicate_clusters=duplicates)
    db.add(log)
    db.commit()

    return {
        "status": integrity_status,
        "duplicate_clusters": duplicates,
        "imbalance_delta": delta,
        "metrics": {"total_transactions_sum": total_bought_items, "matrix_actuals_sum": total_matrix_actuals}
    }

class SynchronizeRequest(BaseModel):
    year: int
    dry_run: bool = True

@router.post("/ledger/synchronize")
def synchronize_ledger(req: SynchronizeRequest, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    trace = service.synchronize_ledger_to_summary(current_user.tenant_id, req.year, dry_run=req.dry_run)
    return {"status": trace.get("status", "success"), "message": "Ledger Synchronization Protocol executed", "audited_year": req.year, "trace": trace, "dry_run": req.dry_run}

LegacyReconcileRequest = SynchronizeRequest

@router.get("/system/health")
def system_health_legacy(year: int, svc: AnnualExpenseService = Depends(get_annual_expense_service), tr_svc: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return calculate_data_integrity_status(year, svc, tr_svc, current_user, db)

@router.post("/system/reconcile")
def reconcile_system_legacy(req: LegacyReconcileRequest, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    trace = service.synchronize_ledger_to_summary(current_user.tenant_id, req.year, dry_run=req.dry_run)
    return {"status": trace.get("status", "success"), "message": "Legacy endpoint - use /ledger/synchronize", "audited_year": req.year, "trace": trace, "dry_run": req.dry_run}

# ==== NEW STATIC ROUTES ====

@router.get("/alerts")
def get_alerts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = AlertRepository(db)
    active = repo.get_active_alerts(current_user.tenant_id)
    all_alerts = repo.get_all_alerts(current_user.tenant_id, limit=50)
    return {
        "active": [{"id": a.id, "category_id": a.category_id, "month": a.month, "budget": a.budget_amount, "actual": a.actual_amount, "threshold": a.threshold_pct, "triggered_at": a.triggered_at.isoformat()} for a in active],
        "history": [{"id": a.id, "category_id": a.category_id, "month": a.month, "budget": a.budget_amount, "actual": a.actual_amount, "threshold": a.threshold_pct, "triggered_at": a.triggered_at.isoformat(), "acknowledged": a.acknowledged} for a in all_alerts]
    }

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = AlertRepository(db)
    alert = repo.acknowledge_alert(alert_id, current_user.tenant_id, current_user.email)
    if alert:
        db.commit()
        return {"ok": True, "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")

class LockRequest(BaseModel):
    resource_type: str
    resource_id: int

@router.post("/locks/acquire")
def acquire_edit_lock(req: LockRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = EditLockRepository(db)
    lock = repo.acquire_lock(current_user.tenant_id, current_user.id, req.resource_type, req.resource_id)
    if not lock:
        active = repo.get_active_locks(current_user.tenant_id)
        conflicting = [l for l in active if l.resource_type == req.resource_type and l.resource_id == req.resource_id]
        if conflicting:
            raise HTTPException(status_code=409, detail="Resource is being edited by another user")
        return {"ok": False, "reason": "Could not acquire lock"}
    db.commit()
    return {"ok": True, "expires_at": lock.expires_at.isoformat()}

@router.post("/locks/release")
def release_edit_lock(req: LockRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = EditLockRepository(db)
    released = repo.release_lock(req.resource_type, req.resource_id, current_user.id)
    if released:
        db.commit()
    return {"ok": released}

@router.get("/locks/active")
def get_active_locks(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = EditLockRepository(db)
    locks = repo.get_active_locks(current_user.tenant_id)
    return {"locks": [{"resource_type": l.resource_type, "resource_id": l.resource_id, "user_id": l.user_id, "expires_at": l.expires_at.isoformat()} for l in locks]}

class SimulationRequest(BaseModel):
    year: int
    changes: dict

@router.post("/simulate")
def simulate_scenario(req: SimulationRequest, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    current = service.get_summary(current_user.tenant_id, req.year)
    
    simulated = {"per_month": {}, "annual_total": 0, "actual_annual_total": 0}
    for key, val in current.get("per_month", {}).items():
        simulated["per_month"][key] = val
    
    for concept_key, changes in req.changes.items():
        for field, new_val in changes.items():
            if field in simulated["per_month"]:
                simulated["per_month"][field] = simulated["per_month"].get(field, 0) + new_val
    
    simulated["annual_total"] = sum(simulated["per_month"].get(m, 0) for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])
    simulated["actual_annual_total"] = current.get("actual_annual_total", 0)
    
    return {
        "current": current,
        "simulated": simulated,
        "delta": simulated["annual_total"] - current.get("annual_total", 0)
    }

class ImportRequest(BaseModel):
    year: int
    items: List[dict]
    expense_details: List[dict]

@router.post("/import")
def import_data(req: ImportRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    imported_items = 0
    imported_details = 0
    
    for item_data in req.items:
        item = models.Item(
            tenant_id=current_user.tenant_id,
            month=item_data.get("month"),
            date=item_data.get("date"),
            name=item_data.get("name"),
            category_id=item_data.get("category_id"),
            quantity=item_data.get("quantity", 0),
            unit_price=item_data.get("unit_price", 0),
            subtotal=item_data.get("subtotal", 0),
            status=item_data.get("status", "Planned"),
            payment_method=item_data.get("payment_method", "cash")
        )
        db.add(item)
        imported_items += 1
    
    for detail_data in req.expense_details:
        detail = models.ExpenseDetail(
            tenant_id=current_user.tenant_id,
            year=req.year,
            section_id=detail_data.get("section_id"),
            category_id=detail_data.get("category_id"),
            description=detail_data.get("description"),
            concept_key=detail_data.get("concept_key"),
            jan=detail_data.get("jan", 0),
            actual_jan=detail_data.get("actual_jan", 0),
            actual_card_jan=detail_data.get("actual_card_jan", 0),
            is_automatic=detail_data.get("is_automatic", False)
        )
        db.add(detail)
        imported_details += 1
    
    db.commit()
    return {"ok": True, "imported_items": imported_items, "imported_details": imported_details}

# ==== ROUTES WITH PATH PARAMETERS (must come after static routes) ====

@router.post("/", response_model=AnnualExpenseEntity)
def create_expense(data: AnnualExpenseCreateDto, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.create_annual_expense(current_user.tenant_id, data)

@router.put("/{expense_id}", response_model=AnnualExpenseEntity)
def update_expense(expense_id: int, data: AnnualExpenseCreateDto, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    try:
        return service.update_annual_expense(current_user.tenant_id, expense_id, data)
    except DomainException as e:
        status = 404 if "not found" in str(e.message).lower() else 400
        if "CONFLICT_409" in str(e.message):
            status = 409
        raise HTTPException(status_code=status, detail=str(e.message))

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    service.delete_annual_expense(current_user.tenant_id, expense_id)
    return {"ok": True}

@router.get("/{year}", response_model=List[AnnualExpenseEntity])
def get_expenses(year: int, section_id: Optional[int] = None, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.get_annual_expenses(current_user.tenant_id, year, section_id)

@router.get("/{year}/summary")
def get_expense_summary(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    return service.get_summary(current_user.tenant_id, year)

@router.get("/{year}/net")
def get_monthly_net(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), revenue_service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.get_net_summary(current_user.tenant_id, year, revenue_service.get_summary)

@router.get("/{year}/stats")
def get_expense_stats(year: int, month_idx: int, service: AnnualExpenseService = Depends(get_annual_expense_service), revenue_service: RevenueService = Depends(get_revenue_service), current_user: models.User = Depends(get_current_user)):
    return service.get_stats(current_user.tenant_id, year, month_idx, revenue_service.get_summary)

@router.post("/{year}/sync")
def sync_manual(year: int, service: AnnualExpenseService = Depends(get_annual_expense_service), current_user: models.User = Depends(get_current_user)):
    trace = service.synchronize_ledger_to_summary(current_user.tenant_id, year, dry_run=False)
    return {"ok": True, "year": year, "message": "Ledger to Fiscal Summary synchronization completed", "trace": trace}

@router.get("/{year}/drift-history")
def get_drift_history(year: int, limit: int = 100, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = DriftRepository(db)
    drifts = repo.get_drift_history(current_user.tenant_id, year, limit)
    return {
        "year": year,
        "drifts": [{
            "id": d.id,
            "concept_key": d.concept_key,
            "concept_label": d.concept_label,
            "month": d.month,
            "detected_at": d.detected_at.isoformat() if d.detected_at else None,
            "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
            "is_resolved": d.is_resolved,
            "delta_before": d.delta_before,
            "delta_after": d.delta_after
        } for d in drifts]
    }

@router.get("/{year}/export")
def export_data(year: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(models.Item).filter(models.Item.tenant_id == current_user.tenant_id, models.Item.month.startswith(str(year))).all()
    matrix = db.query(models.ExpenseDetail).filter(models.ExpenseDetail.tenant_id == current_user.tenant_id, models.ExpenseDetail.year == year).all()
    
    return {
        "year": year,
        "tenant_id": current_user.tenant_id,
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "items": [{
            "id": i.id, "month": i.month, "date": i.date, "name": i.name, 
            "category_id": i.category_id, "quantity": i.quantity, "unit_price": i.unit_price,
            "subtotal": i.subtotal, "status": i.status, "payment_method": i.payment_method
        } for i in items],
        "expense_details": [{
            "id": m.id, "section_id": m.section_id, "category_id": m.category_id,
            "description": m.description, "concept_key": m.concept_key,
            "jan": m.jan, "actual_jan": m.actual_jan, "actual_card_jan": m.actual_card_jan,
            "is_automatic": m.is_automatic
        } for m in matrix]
    }

@router.get("/audit/{resource_type}/{resource_id}")
def get_audit_trail(resource_type: str, resource_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = AuditRepository(db)
    entries = repo.get_resource_audit_trail(current_user.tenant_id, resource_type, resource_id)
    return {"entries": [{"id": e.id, "action": e.action, "old_values": e.old_values, "new_values": e.new_values, "timestamp": e.timestamp.isoformat(), "user_id": e.user_id} for e in entries]}