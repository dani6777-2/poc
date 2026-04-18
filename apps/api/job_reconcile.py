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

def run_job(tenant_id: int, year: int, dry_run: bool = False):
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
        
        mode_str = "[DRY-RUN ANALYSIS]" if dry_run else "[EXECUTION]"
        logger.info(f"Starting {mode_str} background reconciliation job for Tenant {tenant_id}, Year {year}")
        trace = service.sync_registry_to_expenses(tenant_id, year, dry_run=dry_run)
        
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
    import argparse
    parser = argparse.ArgumentParser(description="FinOps Reconciliation Job")
    parser.add_argument("tenant_id", type=int, help="Tenant ID")
    parser.add_argument("year", type=int, help="Fiscal Year")
    parser.add_argument("--dry-run", action="store_true", help="Run without persisting changes")
    
    args = parser.parse_args()
    run_job(args.tenant_id, args.year, dry_run=args.dry_run)
