import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db import models
from infrastructure.driven.db.repositories.system_repo import AlertRepository
from core.constants import MONTHS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_consistency_check():
    db = SessionLocal()
    try:
        tenants = db.query(models.Tenant).all()
        logger.info(f"Running consistency check for {len(tenants)} tenants")
        
        for tenant in tenants:
            budgets = db.query(models.Budget).filter(models.Budget.tenant_id == tenant.id).all()
            alert_repo = AlertRepository(db)
            
            for budget in budgets:
                month = budget.month
                year = month[:4]
                
                items = db.query(models.Item).filter(
                    models.Item.tenant_id == tenant.id,
                    models.Item.month == month,
                    models.Item.category_id == budget.category_id,
                    models.Item.status == "Bought"
                ).all()
                
                actual_spent = sum(item.subtotal or 0 for item in items)
                budget_amount = budget.budget or 0
                
                if budget_amount > 0:
                    pct = (actual_spent / budget_amount) * 100
                    threshold = 80
                    
                    existing_alerts = db.query(models.BudgetAlert).filter(
                        models.BudgetAlert.tenant_id == tenant.id,
                        models.BudgetAlert.category_id == budget.category_id,
                        models.BudgetAlert.month == month,
                        models.BudgetAlert.acknowledged == False
                    ).first()
                    
                    if pct >= threshold and not existing_alerts:
                        alert_repo.create_alert(
                            tenant_id=tenant.id,
                            category_id=budget.category_id,
                            month=month,
                            budget_amount=budget_amount,
                            actual_amount=actual_spent,
                            threshold_pct=threshold
                        )
                        logger.info(f"Alert created for tenant {tenant.id}, category {budget.category_id}, month {month}: {pct:.1f}%")
            
            db.commit()
        
        alert_repo = AlertRepository(db)
        cleaned = alert_repo.delete_old_alerts(days=90)
        logger.info(f"Cleaned up {cleaned} old alerts")
        
    except Exception as e:
        logger.exception(f"Error in consistency check: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting consistency check job...")
    run_consistency_check()
    logger.info("Consistency check job completed")