from typing import Optional
from abc import ABC, abstractmethod
from core.entities.auth import UserEntity, TenantEntity

class UserRepositoryPort(ABC):
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[UserEntity]:
        pass

    @abstractmethod
    def create(self, email: str, password_hash: str, tenant_id: int, role: str) -> UserEntity:
        pass


class TenantRepositoryPort(ABC):
    @abstractmethod
    def get_by_name(self, name: str) -> Optional[TenantEntity]:
        pass

    @abstractmethod
    def get_by_id(self, tenant_id: int) -> Optional[TenantEntity]:
        pass

    @abstractmethod
    def create(self, name: str) -> TenantEntity:
        pass
