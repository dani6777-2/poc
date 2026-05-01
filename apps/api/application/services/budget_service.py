from typing import List, Dict, Optional
from core.entities.budget import BudgetEntity, BudgetCreateDto
from core.ports.secondary.budget_repository import BudgetRepositoryPort
from application.services.taxonomy_service import TaxonomyService

class BudgetService:
    def __init__(self, budget_repo: BudgetRepositoryPort, taxonomy_service: Optional[TaxonomyService] = None):
        self.budget_repo = budget_repo
        self.taxonomy_service = taxonomy_service

    def get_budget(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        """Get the full list of category budgets for the month, syncing actuals."""
        self.sync_real_spending(tenant_id, month)
        return self.budget_repo.get_all(tenant_id, month)

    def update_budget(self, tenant_id: int, budget_id: int, data: BudgetCreateDto) -> BudgetEntity:
        # Note: in this POC we often create_or_update by category/month
        return self.budget_repo.create_or_update(tenant_id, data)

    def get_historial(self, tenant_id: int, category_id: int) -> List[BudgetEntity]:
        return self.budget_repo.get_historial(tenant_id, category_id)

    def sync_real_spending(self, tenant_id: int, month: str):
        """Ensures all categories exist for the month and updates their actual_spending."""
        real_spending = self.budget_repo.get_real_expenditure_by_category(tenant_id, month)
        
        # 1. Category Discovery: Get all categories that SHOULD have a budget
        if self.taxonomy_service:
            all_categories = self.taxonomy_service.get_categories(tenant_id)
            for cat in all_categories:
                # This call handles both creation of missing rows and updating existing ones
                # We fetch current one to avoid overwriting budget to 0 if it already exists
                existing_rows = self.budget_repo.get_by_month(tenant_id, month)
                row = next((r for r in existing_rows if r.category_id == cat.id), None)
                
                budget_val = row.budget if row else 0.0
                actual_val = real_spending.get(cat.id, 0.0)
                
                # Update or Create
                if not row or row.actual_spending != actual_val:
                    self.budget_repo.create_or_update(tenant_id, BudgetCreateDto(
                        month=month,
                        category_id=cat.id,
                        budget=budget_val,
                        actual_spending=actual_val
                    ))
        else:
            # Fallback for existing budget records only
            existing = self.budget_repo.get_by_month(tenant_id, month)
            for e in existing:
                mapped_actual = real_spending.get(e.category_id, 0.0)
                if e.actual_spending != mapped_actual:
                    self.budget_repo.create_or_update(tenant_id, BudgetCreateDto(
                        month=e.month,
                        category_id=e.category_id,
                        budget=e.budget,
                        actual_spending=mapped_actual
                    ))

    def get_totals(self, tenant_id: int, month: str) -> Dict:
        """Compute aggregated totals for the given month."""
        self.sync_real_spending(tenant_id, month)
        rows = self.budget_repo.get_all(tenant_id, month)
        
        total_budget = sum(r.budget or 0.0 for r in rows)
        total_actual = sum(r.actual_spending or 0.0 for r in rows)
        
        return {
            "total_budget": total_budget,
            "total_actual": total_actual,
            "count": len(rows)
        }
