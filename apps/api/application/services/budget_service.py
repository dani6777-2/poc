from typing import List, Dict
from core.entities.budget import BudgetEntity, BudgetCreateDto
from core.ports.secondary.budget_repository import BudgetRepositoryPort

class BudgetService:
    def __init__(self, budget_repo: BudgetRepositoryPort):
        self.budget_repo = budget_repo

    def get_budget(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        """Get the full list of category budgets for the month, syncing actuals."""
        self.sync_real_spending(tenant_id, month)
        return self.budget_repo.get_all(tenant_id, month)

    def update_budget(self, tenant_id: int, budget_id: int, data: BudgetCreateDto) -> BudgetEntity:
        # Note: in this POC we often create_or_update by category/month
        return self.budget_repo.create_or_update(tenant_id, data)

    def get_historial(self, tenant_id: int, category: str) -> List[BudgetEntity]:
        return self.budget_repo.get_historial(tenant_id, category)

    def sync_real_spending(self, tenant_id: int, month: str):
        actuals = self.budget_repo.get_real_expenditure_by_category(tenant_id, month)
        existing = self.budget_repo.get_by_month(tenant_id, month)
        
        for e in existing:
            mapped_actual = actuals.get(e.category_name, 0.0)
            if e.actual_spending != mapped_actual:
                e.actual_spending = mapped_actual
                # Optimization: we could do a bulk update here
                self.budget_repo.create_or_update(tenant_id, BudgetCreateDto(
                    month=e.month,
                    category_id=e.category_id,
                    budget=e.budget,
                    actual_spending=e.actual_spending
                ))
