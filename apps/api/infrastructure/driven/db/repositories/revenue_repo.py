from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.revenue import RevenueEntity, RevenueCreateDto, RevenueUpdateDto
from core.ports.secondary.revenue_repository import RevenueRepositoryPort

class SQLRevenueRepository(RevenueRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_all_by_year(self, tenant_id: int, year: int) -> List[RevenueEntity]:
        rows = self.db.query(models.Revenue).filter(
            models.Revenue.tenant_id == tenant_id,
            models.Revenue.year == year
        ).order_by(models.Revenue.sort_order).all()
        return [self._to_entity(r) for r in rows]

    def get_by_id(self, tenant_id: int, revenue_id: int) -> Optional[RevenueEntity]:
        row = self.db.query(models.Revenue).filter(
            models.Revenue.id == revenue_id,
            models.Revenue.tenant_id == tenant_id
        ).first()
        return self._to_entity(row) if row else None

    def create(self, tenant_id: int, data: RevenueCreateDto) -> RevenueEntity:
        row = models.Revenue(**data.model_dump())
        row.tenant_id = tenant_id
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_entity(row)

    def update(self, tenant_id: int, revenue_id: int, data: RevenueUpdateDto) -> RevenueEntity:
        row = self.db.query(models.Revenue).filter(
            models.Revenue.id == revenue_id,
            models.Revenue.tenant_id == tenant_id
        ).first()
        if not row:
            raise ValueError("Revenue not found")
            
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(row, k, v)
        self.db.commit()
        self.db.refresh(row)
        return self._to_entity(row)

    def delete(self, tenant_id: int, revenue_id: int) -> None:
        row = self.db.query(models.Revenue).filter(
            models.Revenue.id == revenue_id,
            models.Revenue.tenant_id == tenant_id
        ).first()
        if row:
            self.db.delete(row)
            self.db.commit()

    def _to_entity(self, row: models.Revenue) -> RevenueEntity:
        return RevenueEntity(
            id=row.id,
            tenant_id=row.tenant_id,
            year=row.year,
            source=row.source,
            sort_order=row.sort_order,
            jan=row.jan,
            feb=row.feb,
            mar=row.mar,
            apr=row.apr,
            may=row.may,
            jun=row.jun,
            jul=row.jul,
            aug=row.aug,
            sep=row.sep,
            oct=row.oct,
            nov=row.nov,
            dec=row.dec
        )
