from typing import Optional, List, Dict
from abc import ABC, abstractmethod
from core.entities.card import CardConfigEntity, CardTransactionEntity

CARD_DESCRIPTION_TEMPLATE = "💳 Card: {name} (auto)"
DEBTS_SECTION = "Debts"

class CardRepositoryPort(ABC):
    @abstractmethod
    def get_config(self, tenant_id: int) -> CardConfigEntity:
        pass

    @abstractmethod
    def update_config(self, tenant_id: int, config: CardConfigEntity) -> CardConfigEntity:
        pass

    @abstractmethod
    def get_transactions_from_registry(self, tenant_id: int, month: str, channel_id: Optional[int]) -> List[CardTransactionEntity]:
        pass

    @abstractmethod
    def get_manual_tc_expenses_from_annual(self, tenant_id: int, month: str) -> List[CardTransactionEntity]:
        pass

    @abstractmethod
    def sync_to_deudas_next_month(self, tenant_id: int, month: str, card_name: str, total_used: float) -> None:
        pass

    @abstractmethod
    def get_monthly_state(self, tenant_id: int, month: str) -> Optional[dict]:
        pass

    @abstractmethod
    def update_monthly_state(self, tenant_id: int, month: str, data: dict) -> None:
        pass
