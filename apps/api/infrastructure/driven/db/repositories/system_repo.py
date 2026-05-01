from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
import datetime


class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_alerts(self, tenant_id: int) -> List[models.BudgetAlert]:
        return self.db.query(models.BudgetAlert).filter(
            models.BudgetAlert.tenant_id == tenant_id,
            models.BudgetAlert.acknowledged == False
        ).order_by(models.BudgetAlert.triggered_at.desc()).all()

    def get_all_alerts(self, tenant_id: int, limit: int = 100) -> List[models.BudgetAlert]:
        return self.db.query(models.BudgetAlert).filter(
            models.BudgetAlert.tenant_id == tenant_id
        ).order_by(models.BudgetAlert.triggered_at.desc()).limit(limit).all()

    def create_alert(self, tenant_id: int, category_id: int, month: str, 
                     budget_amount: float, actual_amount: float, threshold_pct: int = 80) -> models.BudgetAlert:
        alert = models.BudgetAlert(
            tenant_id=tenant_id,
            category_id=category_id,
            month=month,
            budget_amount=budget_amount,
            actual_amount=actual_amount,
            threshold_pct=threshold_pct
        )
        self.db.add(alert)
        self.db.flush()
        return alert

    def acknowledge_alert(self, alert_id: int, tenant_id: int, username: str = None) -> Optional[models.BudgetAlert]:
        alert = self.db.query(models.BudgetAlert).filter(
            models.BudgetAlert.id == alert_id,
            models.BudgetAlert.tenant_id == tenant_id
        ).first()
        if alert:
            alert.acknowledged = True
            alert.acknowledged_at = datetime.datetime.utcnow()
            alert.acknowledged_by = username
            self.db.flush()
        return alert

    def delete_old_alerts(self, days: int = 90) -> int:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        old = self.db.query(models.BudgetAlert).filter(
            models.BudgetAlert.triggered_at < cutoff,
            models.BudgetAlert.acknowledged == True
        ).all()
        count = len(old)
        for a in old:
            self.db.delete(a)
        if count > 0:
            self.db.flush()
        return count


class EditLockRepository:
    def __init__(self, db: Session):
        self.db = db

    def acquire_lock(self, tenant_id: int, user_id: int, resource_type: str, 
                     resource_id: int, ttl_minutes: int = 5) -> Optional[models.EditLock]:
        existing = self.db.query(models.EditLock).filter(
            models.EditLock.resource_type == resource_type,
            models.EditLock.resource_id == resource_id
        ).first()

        if existing and existing.expires_at > datetime.datetime.utcnow():
            if existing.user_id != user_id:
                return None
            existing.expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=ttl_minutes)
            self.db.flush()
            return existing

        lock = models.EditLock(
            tenant_id=tenant_id,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=ttl_minutes)
        )
        self.db.add(lock)
        self.db.flush()
        return lock

    def release_lock(self, resource_type: str, resource_id: int, user_id: int = None) -> bool:
        query = self.db.query(models.EditLock).filter(
            models.EditLock.resource_type == resource_type,
            models.EditLock.resource_id == resource_id
        )
        if user_id:
            query = query.filter(models.EditLock.user_id == user_id)
        
        lock = query.first()
        if lock:
            self.db.delete(lock)
            self.db.flush()
            return True
        return False

    def get_active_locks(self, tenant_id: int) -> List[models.EditLock]:
        return self.db.query(models.EditLock).filter(
            models.EditLock.tenant_id == tenant_id,
            models.EditLock.expires_at > datetime.datetime.utcnow()
        ).all()

    def cleanup_expired(self) -> int:
        expired = self.db.query(models.EditLock).filter(
            models.EditLock.expires_at < datetime.datetime.utcnow()
        ).all()
        count = len(expired)
        for e in expired:
            self.db.delete(e)
        if count > 0:
            self.db.flush()
        return count


class DriftRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_drift_history(self, tenant_id: int, year: int, limit: int = 100) -> List[models.DriftEvent]:
        return self.db.query(models.DriftEvent).filter(
            models.DriftEvent.tenant_id == tenant_id,
            models.DriftEvent.year == year
        ).order_by(models.DriftEvent.detected_at.desc()).limit(limit).all()

    def create_drift(self, tenant_id: int, year: int, concept_key: str, 
                     concept_label: str, month: str, delta_before: float, 
                     delta_after: float = None) -> models.DriftEvent:
        drift = models.DriftEvent(
            tenant_id=tenant_id,
            year=year,
            concept_key=concept_key,
            concept_label=concept_label,
            month=month,
            delta_before=delta_before,
            delta_after=delta_after
        )
        self.db.add(drift)
        self.db.flush()
        return drift

    def resolve_drift(self, drift_id: int, tenant_id: int, delta_after: float) -> Optional[models.DriftEvent]:
        drift = self.db.query(models.DriftEvent).filter(
            models.DriftEvent.id == drift_id,
            models.DriftEvent.tenant_id == tenant_id
        ).first()
        if drift:
            drift.is_resolved = True
            drift.resolved_at = datetime.datetime.utcnow()
            drift.delta_after = delta_after
            self.db.flush()
        return drift

    def get_unresolved_drifts(self, tenant_id: int) -> List[models.DriftEvent]:
        return self.db.query(models.DriftEvent).filter(
            models.DriftEvent.tenant_id == tenant_id,
            models.DriftEvent.is_resolved == False
        ).all()


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_entry(self, tenant_id: int, user_id: int, action: str, 
                     resource_type: str, resource_id: int, 
                     old_values: dict = None, new_values: dict = None,
                     ip_address: str = None) -> models.AuditEntry:
        import json
        entry = models.AuditEntry(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            ip_address=ip_address
        )
        self.db.add(entry)
        self.db.flush()
        return entry

    def get_entries(self, tenant_id: int, resource_type: str = None, 
                    resource_id: int = None, limit: int = 100) -> List[models.AuditEntry]:
        query = self.db.query(models.AuditEntry).filter(
            models.AuditEntry.tenant_id == tenant_id
        )
        if resource_type:
            query = query.filter(models.AuditEntry.resource_type == resource_type)
        if resource_id:
            query = query.filter(models.AuditEntry.resource_id == resource_id)
        return query.order_by(models.AuditEntry.timestamp.desc()).limit(limit).all()

    def get_resource_audit_trail(self, tenant_id: int, resource_type: str, 
                                  resource_id: int) -> List[models.AuditEntry]:
        return self.db.query(models.AuditEntry).filter(
            models.AuditEntry.tenant_id == tenant_id,
            models.AuditEntry.resource_type == resource_type,
            models.AuditEntry.resource_id == resource_id
        ).order_by(models.AuditEntry.timestamp.asc()).all()