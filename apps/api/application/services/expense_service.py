from typing import List, Optional
from core.entities.expenses import ItemEntity, ItemCreateDto, ItemUpdateDto
from core.ports.secondary.expense_repository import ExpenseRepositoryPort, ExpenseSyncPort
from core.exceptions import DomainException

class AutoSourceActionError(DomainException):
    def __init__(self, message: str = "Items from Block A/B must be managed from their respective lists"):
        self.message = message
        super().__init__(self.message)

class ItemNotFoundError(DomainException):
    def __init__(self, message: str = "Item not found"):
        self.message = message
        super().__init__(self.message)

AUTO_SOURCES = ("BA:", "BB:")

class ExpenseService:
    def __init__(self, expense_repo: ExpenseRepositoryPort, sync_port: ExpenseSyncPort):
        self.expense_repo = expense_repo
        self.sync_port = sync_port

    def _is_auto(self, source: Optional[str]) -> bool:
        return bool(source and any(source.startswith(p) for p in AUTO_SOURCES))

    def _calc_subtotal(self, quantity: float, unit_price: float) -> float:
        return round((quantity or 0) * (unit_price or 0), 2)

    def get_expenses(self, tenant_id: int, month: Optional[str] = None) -> List[ItemEntity]:
        return self.expense_repo.get_all(tenant_id, month)

    def create_expense(self, tenant_id: int, dto: ItemCreateDto) -> ItemEntity:
        if self._is_auto(dto.source):
            raise AutoSourceActionError()
        
        subtotal = self._calc_subtotal(dto.quantity, dto.unit_price)
        item = self.expense_repo.create(tenant_id, dto, subtotal)
        
        # Dispatch sync
        self.sync_port.post_sync(item.month, None, item.status, tenant_id)
        return item

    def update_expense(self, tenant_id: int, item_id: int, dto: ItemUpdateDto) -> ItemEntity:
        existing = self.expense_repo.get_by_id(tenant_id, item_id)
        if not existing:
            raise ItemNotFoundError()
            
        if self._is_auto(existing.source):
            raise AutoSourceActionError("This item is managed automatically from Shopping Lists")

        prev_status = existing.status
        subtotal = self._calc_subtotal(dto.quantity, dto.unit_price)
        
        # Forced domain logic: manual items lose auto source if accidentally present
        dto.source = None 

        updated = self.expense_repo.update(tenant_id, item_id, dto, subtotal)
        self.sync_port.post_sync(updated.month, prev_status, updated.status, tenant_id)
        return updated

    def delete_expense(self, tenant_id: int, item_id: int) -> None:
        existing = self.expense_repo.get_by_id(tenant_id, item_id)
        if not existing:
            raise ItemNotFoundError()

        if self._is_auto(existing.source):
            raise AutoSourceActionError("This item is managed from Shopping Lists. Delete it from Block A or B")

        prev_status = existing.status
        month = existing.month
        
        self.expense_repo.delete(tenant_id, item_id)
        
        # Always sync to update both Budget (Planned) and Actuals (Bought)
        self.sync_port.post_sync(month, prev_status, None, tenant_id)
