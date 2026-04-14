from typing import List, Optional
from abc import ABC, abstractmethod
from core.entities.inventory import InventoryItemA, InventoryItemB, InventoryItemACreate, InventoryItemBCreate

class InventoryRepositoryPort(ABC):
    @abstractmethod
    def get_all_a(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemA]:
        pass

    @abstractmethod
    def get_by_id_a(self, tenant_id: int, item_id: int) -> Optional[InventoryItemA]:
        pass

    @abstractmethod
    def create_a(self, tenant_id: int, item: InventoryItemACreate, subtotal: float) -> InventoryItemA:
        pass

    @abstractmethod
    def update_a(self, tenant_id: int, item_id: int, item: InventoryItemACreate, subtotal: float) -> InventoryItemA:
        pass

    @abstractmethod
    def delete_a(self, tenant_id: int, item_id: int) -> None:
        pass

    @abstractmethod
    def get_all_b(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemB]:
        pass

    @abstractmethod
    def get_by_id_b(self, tenant_id: int, item_id: int) -> Optional[InventoryItemB]:
        pass

    @abstractmethod
    def create_b(self, tenant_id: int, item: InventoryItemBCreate, subtotal: float) -> InventoryItemB:
        pass

    @abstractmethod
    def update_b(self, tenant_id: int, item_id: int, item: InventoryItemBCreate, subtotal: float) -> InventoryItemB:
        pass

    @abstractmethod
    def delete_b(self, tenant_id: int, item_id: int) -> None:
        pass
