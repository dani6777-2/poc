from typing import List, Optional
from abc import ABC, abstractmethod
from core.entities.revenue import RevenueEntity, RevenueCreateDto, RevenueUpdateDto

class RevenueRepositoryPort(ABC):
    @abstractmethod
    def get_all_by_year(self, tenant_id: int, year: int) -> List[RevenueEntity]:
        pass

    @abstractmethod
    def get_by_id(self, tenant_id: int, revenue_id: int) -> Optional[RevenueEntity]:
        pass

    @abstractmethod
    def create(self, tenant_id: int, data: RevenueCreateDto) -> RevenueEntity:
        pass

    @abstractmethod
    def update(self, tenant_id: int, revenue_id: int, data: RevenueUpdateDto) -> RevenueEntity:
        pass

    @abstractmethod
    def delete(self, tenant_id: int, revenue_id: int) -> None:
        pass
