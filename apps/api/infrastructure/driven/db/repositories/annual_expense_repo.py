from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort

class SQLAnnualExpenseRepository(AnnualExpenseRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_all_by_year(self, tenant_id: int, year: int, section_id: Optional[int] = None, for_update: bool = False, limit: int = 100, offset: int = 0) -> List[AnnualExpenseEntity]:
        q = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year == year
        )
        if for_update:
            try:
                # Use 'of' to target only the primary table, avoiding locking nullable sides of outer joins
                q = q.with_for_update(of=models.ExpenseDetail)
            except:
                pass # Fallback for non-supporting dialects
                
        q = q.outerjoin(models.TaxonomySection, models.ExpenseDetail.section_id == models.TaxonomySection.id)\
         .outerjoin(models.TaxonomyCategory, models.ExpenseDetail.category_id == models.TaxonomyCategory.id)
        
        if section_id:
            q = q.filter(models.ExpenseDetail.section_id == section_id)
        
        rows = q.order_by(models.TaxonomySection.sort_order, models.ExpenseDetail.sort_order).offset(offset).limit(limit).all()
        return [self._to_entity(r) for r in rows]

    def get_by_id(self, tenant_id: int, expense_id: int) -> Optional[AnnualExpenseEntity]:
        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.id == expense_id,
            models.ExpenseDetail.tenant_id == tenant_id
        ).outerjoin(models.TaxonomySection, models.ExpenseDetail.section_id == models.TaxonomySection.id)\
         .outerjoin(models.TaxonomyCategory, models.ExpenseDetail.category_id == models.TaxonomyCategory.id).first()
        return self._to_entity(row) if row else None

    def create(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        row = models.ExpenseDetail(**data.model_dump())
        row.tenant_id = tenant_id
        self.db.add(row)
        self.db.flush()
        return self.get_by_id(tenant_id, row.id)

    def update(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.id == expense_id,
            models.ExpenseDetail.tenant_id == tenant_id
        ).first()
        if row:
            for k, v in data.model_dump().items():
                setattr(row, k, v)
            self.db.flush()
        return self.get_by_id(tenant_id, expense_id)

    def delete(self, tenant_id: int, expense_id: int) -> None:
        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.id == expense_id,
            models.ExpenseDetail.tenant_id == tenant_id
        ).first()
        if row:
            self.db.delete(row)
            self.db.flush()

    def get_by_concept(self, tenant_id: int, year: int, section_id: int, description: str) -> Optional[AnnualExpenseEntity]:
        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year == year,
            models.ExpenseDetail.section_id == section_id,
            models.ExpenseDetail.description == description
        ).first()
        return self.get_by_id(tenant_id, row.id) if row else None

    def delete_by_prefix(self, tenant_id: int, year: int, prefix: str) -> None:
        legacy = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year == year,
            models.ExpenseDetail.description.like(f"{prefix}%")
        ).all()
        for row in legacy:
            self.db.delete(row)
        if legacy:
            self.db.flush()

    def set_values(self, entity_id: int, column_values: dict) -> None:
        row = self.db.query(models.ExpenseDetail).filter(models.ExpenseDetail.id == entity_id).first()
        if row:
            for k, v in column_values.items():
                setattr(row, k, v)
            self.db.flush()

    def commit_transaction(self) -> None:
        from sqlalchemy.orm.exc import StaleDataError
        from core.exceptions import DomainException
        try:
            self.db.commit()
        except StaleDataError:
            self.db.rollback()
            raise DomainException("CONFLICT_409: Colisi\u00f3n concurrente en la Matriz Anual. Operaci\u00f3n cancelada por seguridad.")

    def create_snapshot(self, tenant_id: int, year: int, affected_records: int, before_state_json: str, after_state_json: str, affected_records_ids: Optional[str] = None) -> None:
        snap = models.ReconciliationSnapshot(
            tenant_id=tenant_id,
            year=year,
            affected_records=affected_records,
            affected_records_ids=affected_records_ids,
            before_state_json=before_state_json,
            after_state_json=after_state_json
        )
        self.db.add(snap)
        self.db.flush()

    def _to_entity(self, row: models.ExpenseDetail) -> AnnualExpenseEntity:
        return AnnualExpenseEntity(
            id=row.id,
            tenant_id=row.tenant_id,
            year=row.year,
            section_id=row.section_id,
            section_name=row.section.name if row.section else None,
            description=row.description,
            sort_order=row.sort_order,
            is_automatic=bool(row.is_automatic),
            category_id=row.category_id,
            category_name=row.category.name if row.category else None,
            concept_key=row.concept_key,
            concept_label=row.concept_label,
            concept_origin=row.concept_origin or "manual",
            is_active=row.is_active if row.is_active is not None else True,
            jan=row.jan, feb=row.feb, mar=row.mar, apr=row.apr, may=row.may, jun=row.jun,
            jul=row.jul, aug=row.aug, sep=row.sep, oct=row.oct, nov=row.nov, dec=row.dec,
            actual_jan=row.actual_jan, actual_feb=row.actual_feb, actual_mar=row.actual_mar, actual_apr=row.actual_apr, 
            actual_may=row.actual_may, actual_jun=row.actual_jun, actual_jul=row.actual_jul, actual_aug=row.actual_aug, 
            actual_sep=row.actual_sep, actual_oct=row.actual_oct, actual_nov=row.actual_nov, actual_dec=row.actual_dec,
            actual_card_jan=row.actual_card_jan, actual_card_feb=row.actual_card_feb, actual_card_mar=row.actual_card_mar, actual_card_apr=row.actual_card_apr, 
            actual_card_may=row.actual_card_may, actual_card_jun=row.actual_card_jun, actual_card_jul=row.actual_card_jul, actual_card_aug=row.actual_card_aug, 
            actual_card_sep=row.actual_card_sep, actual_card_oct=row.actual_card_oct, actual_card_nov=row.actual_card_nov, actual_card_dec=row.actual_card_dec,
            version_id=row.version_id
        )
