from typing import List, Dict
from core.entities.revenue import RevenueEntity, RevenueCreateDto, RevenueUpdateDto
from core.ports.secondary.revenue_repository import RevenueRepositoryPort

MONTHS_COLS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

class RevenueService:
    def __init__(self, revenue_repo: RevenueRepositoryPort):
        self.revenue_repo = revenue_repo

    def _enrich(self, entity: RevenueEntity) -> RevenueEntity:
        entity.annual_total = sum(getattr(entity, m) or 0.0 for m in MONTHS_COLS)
        return entity

    def get_revenue_by_year(self, tenant_id: int, year: int) -> List[RevenueEntity]:
        rows = self.revenue_repo.get_all_by_year(tenant_id, year)
        return [self._enrich(r) for r in rows]

    def _validate_positive(self, data) -> None:
        for m in MONTHS_COLS:
            val = getattr(data, m, None)
            if val is not None and val < 0:
                raise ValueError(f"El ingreso de {m} no puede ser negativo.")

    def create_revenue(self, tenant_id: int, data: RevenueCreateDto) -> RevenueEntity:
        self._validate_positive(data)
        entity = self.revenue_repo.create(tenant_id, data)
        return self._enrich(entity)

    def update_revenue(self, tenant_id: int, revenue_id: int, data: RevenueUpdateDto) -> RevenueEntity:
        self._validate_positive(data)
        entity = self.revenue_repo.update(tenant_id, revenue_id, data)
        return self._enrich(entity)

    def delete_revenue(self, tenant_id: int, revenue_id: int) -> None:
        self.revenue_repo.delete(tenant_id, revenue_id)

    def get_summary(self, tenant_id: int, year: int) -> Dict:
        """Total per month and annual total of all revenues for the tenant."""
        entities = self.revenue_repo.get_all_by_year(tenant_id, year)
        totals = {}
        global_total = 0.0
        for m in MONTHS_COLS:
            t = sum(getattr(r, m) or 0.0 for r in entities)
            totals[m] = t
            global_total += t
        return {"per_month": totals, "annual_total": global_total}
