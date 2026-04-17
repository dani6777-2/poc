from typing import List, Optional
from core.entities.inventory import InventoryItemA, InventoryItemB, InventoryItemACreate, InventoryItemBCreate
from core.entities.expenses import ItemCreateDto, ItemUpdateDto
from core.ports.secondary.inventory_repository import InventoryRepositoryPort
from core.ports.secondary.expense_repository import ExpenseRepositoryPort, ExpenseSyncPort

class InventoryService:
    def __init__(
        self, 
        inventory_repo: InventoryRepositoryPort, 
        expense_repo: ExpenseRepositoryPort,
        sync_port: ExpenseSyncPort
    ):
        self.inventory_repo = inventory_repo
        self.expense_repo = expense_repo
        self.sync_port = sync_port

    def _calc_subtotal(self, quantity: float, unit_price: float) -> float:
        return round((quantity or 0.0) * (unit_price or 0.0), 2)

    def get_items_a(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemA]:
        return self.inventory_repo.get_all_a(tenant_id, month)

    def create_item_a(self, tenant_id: int, dto: InventoryItemACreate) -> InventoryItemA:
        subtotal = self._calc_subtotal(dto.quantity, dto.unit_price)
        item = self.inventory_repo.create_a(tenant_id, dto, subtotal)
        self._sync_a_to_expenses(tenant_id, item)
        return item

    def update_item_a(self, tenant_id: int, item_id: int, dto: InventoryItemACreate) -> InventoryItemA:
        subtotal = self._calc_subtotal(dto.quantity, dto.unit_price)
        item = self.inventory_repo.update_a(tenant_id, item_id, dto, subtotal)
        self._sync_a_to_expenses(tenant_id, item)
        return item

    def delete_item_a(self, tenant_id: int, item_id: int) -> None:
        item = self.inventory_repo.get_by_id_a(tenant_id, item_id)
        if not item: return
        month = item.month
        source = f"BA:{item_id}"
        self.inventory_repo.delete_a(tenant_id, item_id)
        self.expense_repo.delete_by_source(tenant_id, source)
        self.sync_port.post_sync(month, "Bought", None, tenant_id)

    def _sync_a_to_expenses(self, tenant_id: int, item: InventoryItemA) -> None:
        source = f"BA:{item.id}"
        status = item.status
        existing_expense = self.expense_repo.get_by_source(tenant_id, source)
        
        if not existing_expense:
            expense_dto = ItemCreateDto(
                month=item.month,
                name=item.name,
                category_id=item.category_id,
                channel_id=item.channel_id,
                unit_id=item.unit_id,
                quantity=item.quantity or 1,
                unit_price=item.unit_price or 0,
                prev_month_price=item.prev_month_price,
                status=status,
                source=source
            )
            self.expense_repo.create(tenant_id, expense_dto, item.subtotal)
        else:
            expense_dto = ItemUpdateDto(
                month=item.month,
                name=item.name,
                category_id=item.category_id,
                channel_id=item.channel_id,
                unit_id=item.unit_id,
                quantity=item.quantity or 1,
                unit_price=item.unit_price or 0,
                prev_month_price=item.prev_month_price,
                status=status,
                source=source
            )
            self.expense_repo.update(tenant_id, existing_expense.id, expense_dto, item.subtotal)
        self.sync_port.post_sync(item.month, None, status, tenant_id)

    def get_items_b(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemB]:
        return self.inventory_repo.get_all_b(tenant_id, month)

    def create_item_b(self, tenant_id: int, dto: InventoryItemBCreate) -> InventoryItemB:
        item = self.inventory_repo.create_b(tenant_id, dto, dto.price_per_kg)
        self._sync_b_to_expenses(tenant_id, item)
        return item

    def update_item_b(self, tenant_id: int, item_id: int, dto: InventoryItemBCreate) -> InventoryItemB:
        item = self.inventory_repo.update_b(tenant_id, item_id, dto, dto.price_per_kg)
        self._sync_b_to_expenses(tenant_id, item)
        return item

    def delete_item_b(self, tenant_id: int, item_id: int) -> None:
        item = self.inventory_repo.get_by_id_b(tenant_id, item_id)
        if not item: return
        month = item.month
        source = f"BB:{item_id}"
        self.inventory_repo.delete_b(tenant_id, item_id)
        self.expense_repo.delete_by_source(tenant_id, source)
        self.sync_port.post_sync(month, "Bought", None, tenant_id)

    def _sync_b_to_expenses(self, tenant_id: int, item: InventoryItemB) -> None:
        source = f"BB:{item.id}"
        status = item.status
        existing_expense = self.expense_repo.get_by_source(tenant_id, source)
        
        if not existing_expense:
            expense_dto = ItemCreateDto(
                month=item.month,
                name=item.name,
                category_id=item.category_id,
                channel_id=item.channel_id,
                unit_id=item.unit_id,
                quantity=1,
                unit_price=item.price_per_kg or 0,
                prev_month_price=item.prev_month_price,
                status=status,
                source=source
            )
            self.expense_repo.create(tenant_id, expense_dto, item.subtotal)
        else:
            expense_dto = ItemUpdateDto(
                month=item.month,
                name=item.name,
                category_id=item.category_id,
                channel_id=item.channel_id,
                unit_id=item.unit_id,
                quantity=1,
                unit_price=item.price_per_kg or 0,
                prev_month_price=item.prev_month_price,
                status=status,
                source=source
            )
            self.expense_repo.update(tenant_id, existing_expense.id, expense_dto, item.subtotal)
        self.sync_port.post_sync(item.month, None, status, tenant_id)
