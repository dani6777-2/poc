from typing import List, Optional
from abc import ABC, abstractmethod
from core.entities.expenses import ItemEntity, ItemCreateDto, ItemUpdateDto

class ExpenseRepositoryPort(ABC):
    @abstractmethod
    def get_all(self, tenant_id: int, month: Optional[str]) -> List[ItemEntity]:
        pass

    @abstractmethod
    def get_by_id(self, tenant_id: int, item_id: int) -> Optional[ItemEntity]:
        pass

    @abstractmethod
    def check_exact_duplicate(self, tenant_id: int, date: str, category_id: int, subtotal: float) -> Optional[ItemEntity]:
        pass

    @abstractmethod
    def create(self, tenant_id: int, dto: ItemCreateDto, subtotal: float) -> ItemEntity:
        pass

    @abstractmethod
    def update(self, tenant_id: int, item_id: int, dto: ItemUpdateDto, subtotal: float) -> ItemEntity:
        pass

    @abstractmethod
    def delete(self, tenant_id: int, item_id: int) -> None:
        pass

    @abstractmethod
    def get_by_source(self, tenant_id: int, source: str) -> Optional[ItemEntity]:
        pass

    @abstractmethod
    def delete_by_source(self, tenant_id: int, source: str) -> None:
        pass

    @abstractmethod
    def get_duplicate_clusters_count(self, tenant_id: int) -> int:
        pass

class ExpenseSyncPort(ABC):
    """Port to handle downstream synchronizations (hexagonal outbound event)"""
    @abstractmethod
    def post_sync(self, month: str, prev_status: Optional[str], new_status: Optional[str], tenant_id: int, prev_month: Optional[str] = None) -> None:
        pass
