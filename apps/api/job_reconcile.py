import os
import sys
import logging

from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.repositories.annual_expense_repo import SQLAnnualExpenseRepository
from infrastructure.driven.db.repositories.expense_repo import SQLExpenseRepository
from infrastructure.driven.db.repositories.card_repo import SQLCardRepository
from infrastructure.driven.db.repositories.budget_repo import SQLBudgetRepository
from application.services.annual_expense_service import AnnualExpenseService
from application.services.taxonomy_service import TaxonomyService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reconcile_job")

def run_job(tenant_id: int, year: int):
    # Setup dependencies
    db = SessionLocal()
    try:
        annual_repo = SQLAnnualExpenseRepository(db)
        expense_repo = SQLExpenseRepository(db)
        card_repo = SQLCardRepository(db)
        budget_repo = SQLBudgetRepository(db)
        tax_service = TaxonomyService(db)
        
        service = AnnualExpenseService(
            annual_repo=annual_repo,
            expense_repo=expense_repo,
            card_repo=card_repo,
            budget_repo=budget_repo,
            taxonomy_service=tax_service
        )
        
        logger.info(f"Starting background reconciliation job for Tenant {tenant_id}, Year {year}")
        trace = service.sync_registry_to_expenses(tenant_id, year)
        
        logger.info(f"Reconciliation completed. Affected matrix clusters: {trace.get('affected_records')}")
        if trace.get('differences'):
            for diff in trace.get('differences'):
                logger.info(f" -> {diff}")
        else:
            logger.info(" -> Zero drift. (Data is fully synchronized)")
            
    except Exception as e:
        logger.error(f"Reconciliation Job failed: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python job_reconcile.py <tenant_id> <year>")
        sys.exit(1)
        
    tid = int(sys.argv[1])
    yr = int(sys.argv[2])
    run_job(tid, yr)
