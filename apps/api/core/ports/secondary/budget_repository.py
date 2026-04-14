from typing import List, Optional, Dict
from abc import ABC, abstractmethod
from core.entities.budget import BudgetEntity, BudgetCreateDto

class BudgetRepositoryPort(ABC):
    @abstractmethod
    def get_all(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        pass

    @abstractmethod
    def get_by_month(self, tenant_id: int, month: str) -> List[BudgetEntity]:
        pass

    @abstractmethod
    def create_or_update(self, tenant_id: int, dto: BudgetCreateDto) -> BudgetEntity:
        pass

    @abstractmethod
    def bulk_add(self, entities: List[BudgetEntity]):
        pass

    @abstractmethod
    def get_historial(self, tenant_id: int, category_id: int) -> List[BudgetEntity]:
        pass

    @abstractmethod
    def get_real_expenditure_by_category(self, tenant_id: int, month: str) -> Dict[int, float]:
        """Returns a dict of {category_name: total_real_expenditure} for the given month."""
        pass
