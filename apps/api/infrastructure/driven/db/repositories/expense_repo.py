from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from core.ports.secondary.expense_repository import ExpenseRepositoryPort, ExpenseSyncPort
from core.entities.expenses import ItemEntity, ItemCreateDto, ItemUpdateDto
from core.exceptions import DomainException
from infrastructure.driven.db import models

from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort

class SQLExpenseRepository(ExpenseRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, tenant_id: int, month: Optional[str], limit: int = 100, offset: int = 0) -> List[ItemEntity]:
        q = self.db.query(models.Item).filter(models.Item.tenant_id == tenant_id)
        if month:
            q = q.filter(models.Item.month == month)
        
        # Joins: Item -> Category -> Section
        q = q.outerjoin(models.TaxonomyCategory, models.Item.category_id == models.TaxonomyCategory.id)\
             .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
             .outerjoin(models.TaxonomyChannel, models.Item.channel_id == models.TaxonomyChannel.id)\
             .outerjoin(models.TaxonomyUnit, models.Item.unit_id == models.TaxonomyUnit.id)
             
        rows = q.order_by(models.Item.id).offset(offset).limit(limit).all()
        return [self._to_entity(r) for r in rows]

    def get_by_id(self, tenant_id: int, item_id: int) -> Optional[ItemEntity]:
        row = self.db.query(models.Item).filter(
            models.Item.id == item_id,
            models.Item.tenant_id == tenant_id
        ).outerjoin(models.TaxonomyCategory, models.Item.category_id == models.TaxonomyCategory.id)\
         .outerjoin(models.TaxonomySection, models.TaxonomyCategory.section_id == models.TaxonomySection.id)\
         .outerjoin(models.TaxonomyChannel, models.Item.channel_id == models.TaxonomyChannel.id)\
         .outerjoin(models.TaxonomyUnit, models.Item.unit_id == models.TaxonomyUnit.id)\
         .first()
        return self._to_entity(row) if row else None

    def check_exact_duplicate(self, tenant_id: int, date: str, category_id: int, subtotal: float) -> Optional[ItemEntity]:
        row = self.db.query(models.Item).filter(
            models.Item.tenant_id == tenant_id,
            models.Item.date == date,
            models.Item.category_id == category_id,
            models.Item.subtotal == subtotal
        ).first()
        return self._to_entity(row) if row else None

    def create(self, tenant_id: int, dto: ItemCreateDto, subtotal: float) -> ItemEntity:
        subtotal = round(subtotal, 2)
        row = models.Item(
            tenant_id=tenant_id,
            month=dto.month,
            date=dto.date,
            name=dto.name,
            category_id=dto.category_id,
            channel_id=dto.channel_id,
            unit_id=dto.unit_id,
            quantity=dto.quantity,
            unit_price=dto.unit_price,
            subtotal=subtotal,
            prev_month_price=dto.prev_month_price,
            status=dto.status,
            source=dto.source,
            payment_method=dto.payment_method or "cash",
        )
        self.db.add(row)
        self.db.commit()
        return self.get_by_id(tenant_id, row.id)

    def update(self, tenant_id: int, item_id: int, dto: ItemUpdateDto, subtotal: float) -> ItemEntity:
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            row = self.db.query(models.Item).filter(models.Item.id == item_id).first()
            if not row: return None
            row.month = dto.month
            row.date = dto.date
            row.name = dto.name
            row.category_id = dto.category_id
            row.channel_id = dto.channel_id
            row.unit_id = dto.unit_id
            row.quantity = dto.quantity
            row.unit_price = dto.unit_price
            row.subtotal = round(subtotal, 2)
            row.prev_month_price = dto.prev_month_price
            row.status = dto.status
            row.source = dto.source
            row.payment_method = dto.payment_method or "cash"
            try:
                self.db.commit()
                return self.get_by_id(tenant_id, item_id)
            except StaleDataError:
                self.db.rollback()
                if attempt == MAX_RETRIES - 1:
                    raise DomainException("CONFLICT_409: El registro de gasto cambió por otra operación (Optimistic Lock) tras múltiples intentos locales.")

    def delete(self, tenant_id: int, item_id: int) -> None:
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            row = self.db.query(models.Item).filter(models.Item.id == item_id).first()
            if not row: return
            self.db.delete(row)
            try:
                self.db.commit()
                return
            except StaleDataError:
                self.db.rollback()
                if attempt == MAX_RETRIES - 1:
                    raise DomainException("CONFLICT_409: El registro de gasto ya fue modificado o eliminado (Optimistic Lock) tras m\u00faltiples intentos locales.")

    def get_by_source(self, tenant_id: int, source: str) -> Optional[ItemEntity]:
        row = self.db.query(models.Item).filter(
            models.Item.tenant_id == tenant_id,
            models.Item.source == source
        ).first()
        return self.get_by_id(tenant_id, row.id) if row else None

    def delete_by_source(self, tenant_id: int, source: str) -> None:
        row = self.db.query(models.Item).filter(
            models.Item.tenant_id == tenant_id,
            models.Item.source == source
        ).first()
        if row:
            self.db.delete(row)
            self.db.commit()

    def get_duplicate_clusters_count(self, tenant_id: int) -> int:
        from sqlalchemy import func
        subq = self.db.query(
            models.Item.date,
            models.Item.category_id,
            models.Item.subtotal
        ).filter(
            models.Item.tenant_id == tenant_id
        ).group_by(
            models.Item.date,
            models.Item.category_id,
            models.Item.subtotal
        ).having(func.count(models.Item.id) > 1).subquery()
        count = self.db.query(func.count()).select_from(subq).scalar()
        return count or 0

    def _to_entity(self, row: models.Item) -> ItemEntity:
        return ItemEntity(
            id=row.id,
            tenant_id=row.tenant_id,
            month=row.month,
            date=row.date,
            name=row.name,
            category_id=row.category_id,
            category_name=row.category.name if row.category else None,
            section_id=row.category.section_id if row.category else None,
            section_name=row.category.section.name if (row.category and row.category.section) else None,
            channel_id=row.channel_id,
            channel_name=row.channel.name if row.channel else None,
            unit_id=row.unit_id,
            unit_name=row.unit.name if row.unit else None,
            quantity=row.quantity,
            unit_price=row.unit_price,
            subtotal=row.subtotal,
            prev_month_price=row.prev_month_price,
            status=row.status,
            source=row.source,
            payment_method=row.payment_method or "cash",
            version_id=row.version_id
        )

class LegacyExpenseSyncAdapter(ExpenseSyncPort):
    def __init__(self, db: Session, annual_repo: AnnualExpenseRepositoryPort, card_repo: CardRepositoryPort):
        from application.services.annual_expense_service import AnnualExpenseService
        self.db = db
        self.annual_service = AnnualExpenseService(annual_repo, SQLExpenseRepository(db), card_repo)

    def post_sync(self, month: str, prev_status: Optional[str], new_status: Optional[str], tenant_id: int, prev_month: Optional[str] = None) -> None:
        year = int(month[:4])
        
        if prev_month and prev_month != month:
            prev_year = int(prev_month[:4])
            if prev_status == "Bought":
                self.annual_service.sync_registry_to_expenses(tenant_id, prev_year, dry_run=False, target_month=prev_month)
                self.annual_service.sync_card_to_debts_for_month(tenant_id, prev_month)
                
        if new_status == "Bought" or prev_status == "Bought":
            self.annual_service.sync_registry_to_expenses(tenant_id, year, dry_run=False, target_month=month)
            self.annual_service.sync_card_to_debts_for_month(tenant_id, month)
