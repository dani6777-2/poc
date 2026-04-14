from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.inventory import InventoryItemA, InventoryItemB, InventoryItemACreate, InventoryItemBCreate
from core.ports.secondary.inventory_repository import InventoryRepositoryPort

class SQLInventoryRepository(InventoryRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_all_a(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemA]:
        q = self.db.query(models.InventoryBlockA).filter(models.InventoryBlockA.tenant_id == tenant_id)
        if month:
            q = q.filter(models.InventoryBlockA.month == month)
            
        q = q.outerjoin(models.TaxonomyCategory, models.InventoryBlockA.category_id == models.TaxonomyCategory.id)\
             .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
             .outerjoin(models.TaxonomyUnit, models.InventoryBlockA.unit_id == models.TaxonomyUnit.id)\
             .outerjoin(models.TaxonomyChannel, models.InventoryBlockA.channel_id == models.TaxonomyChannel.id)
             
        rows = q.order_by(models.TaxonomySection.sort_order, models.InventoryBlockA.id).all()
        return [self._to_entity_a(r) for r in rows]

    def get_by_id_a(self, tenant_id: int, item_id: int) -> Optional[InventoryItemA]:
        row = self.db.query(models.InventoryBlockA).filter(
            models.InventoryBlockA.id == item_id,
            models.InventoryBlockA.tenant_id == tenant_id
        ).outerjoin(models.TaxonomyCategory, models.InventoryBlockA.category_id == models.TaxonomyCategory.id)\
         .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
         .outerjoin(models.TaxonomyUnit, models.InventoryBlockA.unit_id == models.TaxonomyUnit.id)\
         .outerjoin(models.TaxonomyChannel, models.InventoryBlockA.channel_id == models.TaxonomyChannel.id)\
         .first()
        return self._to_entity_a(row) if row else None

    def create_a(self, tenant_id: int, item_dto: InventoryItemACreate, subtotal: float) -> InventoryItemA:
        row = models.InventoryBlockA(
            tenant_id=tenant_id,
            month=item_dto.month,
            category_id=item_dto.category_id,
            name=item_dto.name,
            unit_id=item_dto.unit_id,
            quantity=item_dto.quantity,
            channel_id=item_dto.channel_id,
            unit_price=item_dto.unit_price,
            subtotal=subtotal,
            prev_month_price=item_dto.prev_month_price
        )
        self.db.add(row)
        self.db.commit()
        return self.get_by_id_a(tenant_id, row.id)

    def update_a(self, tenant_id: int, item_id: int, item_dto: InventoryItemACreate, subtotal: float) -> InventoryItemA:
        row = self.db.query(models.InventoryBlockA).filter(models.InventoryBlockA.id == item_id).first()
        row.month = item_dto.month
        row.category_id = item_dto.category_id
        row.name = item_dto.name
        row.unit_id = item_dto.unit_id
        row.quantity = item_dto.quantity
        row.channel_id = item_dto.channel_id
        row.unit_price = item_dto.unit_price
        row.subtotal = subtotal
        row.prev_month_price = item_dto.prev_month_price
        self.db.commit()
        return self.get_by_id_a(tenant_id, item_id)

    def delete_a(self, tenant_id: int, item_id: int) -> None:
        row = self.db.query(models.InventoryBlockA).filter(models.InventoryBlockA.id == item_id).first()
        if row:
            self.db.delete(row)
            self.db.commit()

    def get_all_b(self, tenant_id: int, month: Optional[str]) -> List[InventoryItemB]:
        q = self.db.query(models.InventoryBlockB).filter(models.InventoryBlockB.tenant_id == tenant_id)
        if month:
            q = q.filter(models.InventoryBlockB.month == month)
            
        q = q.outerjoin(models.TaxonomyCategory, models.InventoryBlockB.category_id == models.TaxonomyCategory.id)\
             .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
             .outerjoin(models.TaxonomyChannel, models.InventoryBlockB.channel_id == models.TaxonomyChannel.id)\
             .outerjoin(models.TaxonomyUnit, models.InventoryBlockB.unit_id == models.TaxonomyUnit.id)
             
        rows = q.order_by(models.TaxonomySection.sort_order, models.InventoryBlockB.id).all()
        return [self._to_entity_b(r) for r in rows]

    def get_by_id_b(self, tenant_id: int, item_id: int) -> Optional[InventoryItemB]:
        row = self.db.query(models.InventoryBlockB).filter(
            models.InventoryBlockB.id == item_id,
            models.InventoryBlockB.tenant_id == tenant_id
        ).outerjoin(models.TaxonomyCategory, models.InventoryBlockB.category_id == models.TaxonomyCategory.id)\
         .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
         .outerjoin(models.TaxonomyChannel, models.InventoryBlockB.channel_id == models.TaxonomyChannel.id)\
         .outerjoin(models.TaxonomyUnit, models.InventoryBlockB.unit_id == models.TaxonomyUnit.id)\
         .first()
        return self._to_entity_b(row) if row else None

    def create_b(self, tenant_id: int, item_dto: InventoryItemBCreate, subtotal: float) -> InventoryItemB:
        row = models.InventoryBlockB(
            tenant_id=tenant_id,
            month=item_dto.month,
            category_id=item_dto.category_id,
            name=item_dto.name,
            channel_id=item_dto.channel_id,
            unit_id=item_dto.unit_id,
            price_per_kg=item_dto.price_per_kg,
            subtotal=subtotal,
            prev_month_price=item_dto.prev_month_price,
            price_delta=0.0
        )
        self.db.add(row)
        self.db.commit()
        return self.get_by_id_b(tenant_id, row.id)

    def update_b(self, tenant_id: int, item_id: int, item_dto: InventoryItemBCreate, subtotal: float) -> InventoryItemB:
        row = self.db.query(models.InventoryBlockB).filter(models.InventoryBlockB.id == item_id).first()
        row.month = item_dto.month
        row.category_id = item_dto.category_id
        row.name = item_dto.name
        row.channel_id = item_dto.channel_id
        row.unit_id = item_dto.unit_id
        row.price_per_kg = item_dto.price_per_kg
        row.subtotal = subtotal
        row.prev_month_price = item_dto.prev_month_price
        if row.prev_month_price and row.price_per_kg:
            row.price_delta = row.price_per_kg - row.prev_month_price
        self.db.commit()
        return self.get_by_id_b(tenant_id, item_id)

    def delete_b(self, tenant_id: int, item_id: int) -> None:
        row = self.db.query(models.InventoryBlockB).filter(models.InventoryBlockB.id == item_id).first()
        if row:
            self.db.delete(row)
            self.db.commit()

    def _to_entity_a(self, row: models.InventoryBlockA) -> InventoryItemA:
        return InventoryItemA(
            id=row.id,
            tenant_id=row.tenant_id,
            month=row.month,
            category_id=row.category_id,
            category_name=row.category.name if row.category else None,
            section_id=row.category.section_id if row.category else None,
            section_name=row.category.section.name if (row.category and row.category.section) else None,
            name=row.name,
            unit_id=row.unit_id,
            unit_name=row.unit.name if row.unit else None,
            quantity=row.quantity,
            channel_id=row.channel_id,
            channel_name=row.channel.name if row.channel else None,
            unit_price=row.unit_price,
            subtotal=row.subtotal,
            prev_month_price=row.prev_month_price
        )

    def _to_entity_b(self, row: models.InventoryBlockB) -> InventoryItemB:
        return InventoryItemB(
            id=row.id,
            tenant_id=row.tenant_id,
            month=row.month,
            category_id=row.category_id,
            category_name=row.category.name if row.category else None,
            section_id=row.category.section_id if row.category else None,
            section_name=row.category.section.name if (row.category and row.category.section) else None,
            name=row.name,
            channel_id=row.channel_id,
            channel_name=row.channel.name if row.channel else None,
            unit_id=row.unit_id,
            unit_name=row.unit.name if row.unit else None,
            price_per_kg=row.price_per_kg,
            subtotal=row.subtotal,
            prev_month_price=row.prev_month_price,
            price_delta=row.price_delta
        )
