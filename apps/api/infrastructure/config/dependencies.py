from fastapi import Depends
from sqlalchemy.orm import Session
from infrastructure.driven.db.config import get_db
from infrastructure.driven.db.repositories.user_repo import SQLUserRepository, SQLTenantRepository
from infrastructure.driven.db.repositories.budget_repo import SQLBudgetRepository
from infrastructure.driven.db.repositories.expense_repo import SQLExpenseRepository, LegacyExpenseSyncAdapter
from infrastructure.driven.db.repositories.card_repo import SQLCardRepository
from infrastructure.driven.db.repositories.inventory_repo import SQLInventoryRepository
from infrastructure.driven.db.repositories.revenue_repo import SQLRevenueRepository
from infrastructure.driven.db.repositories.annual_expense_repo import SQLAnnualExpenseRepository
from infrastructure.driven.ai.ocr_adapter import LegacyOCRAdapter
from application.services.auth_service import AuthService
from application.services.budget_service import BudgetService
from application.services.expense_service import ExpenseService
from application.services.card_service import CardService
from application.services.inventory_service import InventoryService
from application.services.revenue_service import RevenueService
from application.services.annual_expense_service import AnnualExpenseService
from application.services.analysis_service import AnalysisService
from application.services.health_service import HealthService
from application.services.ai_service import AIService
from application.services.ocr_app_service import OCRAppService
from infrastructure.driving.api.auth import SECRET_KEY, ALGORITHM

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    user_repo = SQLUserRepository(db)
    tenant_repo = SQLTenantRepository(db)
    return AuthService(
        user_repo=user_repo,
        tenant_repo=tenant_repo,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM
    )

def get_budget_service(db: Session = Depends(get_db)) -> BudgetService:
    repo = SQLBudgetRepository(db)
    taxonomy = get_taxonomy_service(db)
    return BudgetService(budget_repo=repo, taxonomy_service=taxonomy)

def get_expense_service(db: Session = Depends(get_db)) -> ExpenseService:
    repo = SQLExpenseRepository(db)
    annual_repo = SQLAnnualExpenseRepository(db)
    card_repo = SQLCardRepository(db)
    sync = LegacyExpenseSyncAdapter(db, annual_repo, card_repo)
    return ExpenseService(expense_repo=repo, sync_port=sync, card_repo=card_repo)

def get_card_service(db: Session = Depends(get_db)) -> CardService:
    repo = SQLCardRepository(db)
    return CardService(card_repo=repo)

def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    inv_repo = SQLInventoryRepository(db)
    exp_repo = SQLExpenseRepository(db)
    annual_repo = SQLAnnualExpenseRepository(db)
    card_repo = SQLCardRepository(db)
    sync = LegacyExpenseSyncAdapter(db, annual_repo, card_repo)
    return InventoryService(inventory_repo=inv_repo, expense_repo=exp_repo, sync_port=sync)

def get_revenue_service(db: Session = Depends(get_db)) -> RevenueService:
    repo = SQLRevenueRepository(db)
    return RevenueService(revenue_repo=repo)

def get_annual_expense_service(db: Session = Depends(get_db)) -> AnnualExpenseService:
    annual_repo = SQLAnnualExpenseRepository(db)
    expense_repo = SQLExpenseRepository(db)
    card_repo = SQLCardRepository(db)
    budget_repo = SQLBudgetRepository(db)
    taxonomy_service = get_taxonomy_service(db)
    return AnnualExpenseService(
        annual_repo=annual_repo,
        expense_repo=expense_repo,
        card_repo=card_repo,
        budget_repo=budget_repo,
        taxonomy_service=taxonomy_service
    )

def get_analysis_service(db: Session = Depends(get_db)) -> AnalysisService:
    return AnalysisService(
        expense_repo=SQLExpenseRepository(db),
        revenue_repo=SQLRevenueRepository(db),
        annual_repo=SQLAnnualExpenseRepository(db),
        budget_repo=SQLBudgetRepository(db),
        card_repo=SQLCardRepository(db)
    )

def get_health_service(db: Session = Depends(get_db)) -> HealthService:
    return HealthService(
        expense_repo=SQLExpenseRepository(db),
        revenue_repo=SQLRevenueRepository(db),
        annual_repo=SQLAnnualExpenseRepository(db),
        card_repo=SQLCardRepository(db)
    )

def get_ai_service(db: Session = Depends(get_db)) -> AIService:
    return AIService(
        expense_repo=SQLExpenseRepository(db),
        revenue_repo=SQLRevenueRepository(db)
    )

def get_ocr_service(db: Session = Depends(get_db)) -> OCRAppService:
    ocr_port = LegacyOCRAdapter()
    expense_repo = SQLExpenseRepository(db)
    annual_service = get_annual_expense_service(db)
    return OCRAppService(
        ocr_port=ocr_port,
        expense_repo=expense_repo,
        annual_service=annual_service
    )

from application.services.taxonomy_service import TaxonomyService

def get_taxonomy_service(db: Session = Depends(get_db)) -> TaxonomyService:
    return TaxonomyService(db=db)
