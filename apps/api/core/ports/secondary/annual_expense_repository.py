from typing import List, Optional
from abc import ABC, abstractmethod
from core.entities.annual_expense import AnnualExpenseEntity, AnnualExpenseCreateDto

class AnnualExpenseRepositoryPort(ABC):
    @abstractmethod
    def get_all_by_year(self, tenant_id: int, year: int, section_id: Optional[int] = None, for_update: bool = False) -> List[AnnualExpenseEntity]:
        pass

    @abstractmethod
    def get_by_id(self, tenant_id: int, expense_id: int) -> Optional[AnnualExpenseEntity]:
        pass

    @abstractmethod
    def create(self, tenant_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        pass

    @abstractmethod
    def update(self, tenant_id: int, expense_id: int, data: AnnualExpenseCreateDto) -> AnnualExpenseEntity:
        pass

    @abstractmethod
    def delete(self, tenant_id: int, expense_id: int) -> None:
        pass

    def create_snapshot(self, tenant_id: int, year: int, affected_records: int, before_state_json: str, after_state_json: str, affected_records_ids: Optional[str] = None) -> None:
        pass

    def commit_transaction(self) -> None:
        pass

    @abstractmethod
    def get_by_concept(self, tenant_id: int, year: int, section_id: int, description: str) -> Optional[AnnualExpenseEntity]:
        pass

    @abstractmethod
    def delete_by_prefix(self, tenant_id: int, year: int, prefix: str) -> None:
        pass

    @abstractmethod
    def set_values(self, entity_id: int, column_values: dict) -> None:
        """Helper to rapidly set specific month columns (actual_*, actual_card_*, etc)."""
        pass
