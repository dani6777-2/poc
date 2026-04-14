from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from core.ports.secondary.budget_repository import BudgetRepositoryPort
from core.entities.budget import BudgetEntity, BudgetCreateDto
from infrastructure.driven.db import models

class SQLBudgetRepository(BudgetRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        return self.get_by_month(tenant_id, month)

    def get_by_month(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        rows = self.db.query(models.Budget).filter(
            models.Budget.tenant_id == tenant_id,
            models.Budget.month == month
        ).outerjoin(models.TaxonomyCategory, models.Budget.category_id == models.TaxonomyCategory.id).all()
        return [self._to_entity(r) for r in rows]

    def create_or_update(self, tenant_id: int, dto: BudgetCreateDto) -> BudgetEntity:
        row = self.db.query(models.Budget).filter(
            models.Budget.tenant_id == tenant_id,
            models.Budget.month == dto.month,
            models.Budget.category_id == dto.category_id
        ).first()

        if not row:
            row = models.Budget(
                tenant_id=tenant_id,
                month=dto.month,
                category_id=dto.category_id,
                budget=dto.budget,
                actual_spending=dto.actual_spending
            )
            self.db.add(row)
        else:
            row.budget = dto.budget
            row.actual_spending = dto.actual_spending

        self.db.commit()
        self.db.refresh(row)
        return self._to_entity(row)

    def bulk_add(self, entities: List[BudgetEntity]):
        pass 

    def get_historial(self, tenant_id: int, category_id: int) -> List[BudgetEntity]:
        rows = self.db.query(models.Budget).filter(
            models.Budget.tenant_id == tenant_id,
            models.Budget.category_id == category_id
        ).outerjoin(models.TaxonomyCategory, models.Budget.category_id == models.TaxonomyCategory.id).order_by(models.Budget.month).all()
        return [self._to_entity(r) for r in rows]

    def get_real_expenditure_by_category(self, tenant_id: int, month: str) -> Dict[int, float]:
        """Calculates actual_spending per category_id directly from Registry."""
        bought_items = self.db.query(models.Item).filter(
            models.Item.tenant_id == tenant_id,
            models.Item.month == month,
            models.Item.status == "Bought"
        ).all()
        
        cat_real: Dict[int, float] = {}
        for i in bought_items:
            if i.category_id:
                cat_real[i.category_id] = cat_real.get(i.category_id, 0.0) + (i.subtotal or 0.0)
        return cat_real

    def _to_entity(self, row: models.Budget) -> BudgetEntity:
        return BudgetEntity(
            id=row.id,
            tenant_id=row.tenant_id,
            month=row.month,
            category_id=row.category_id,
            category_name=row.category.name if row.category else None,
            budget=row.budget,
            actual_spending=row.actual_spending
        )
