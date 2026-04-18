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

    @abstractmethod
    def get_by_invite_code(self, code: str) -> Optional[TenantEntity]:
        pass

    @abstractmethod
    def update_invite_code(self, tenant_id: int, code: str) -> None:
        pass



    @abstractmethod
    def get_user_access_list(self, user_id: int) -> list:
        pass

    @abstractmethod
    def add_user_access(self, user_id: int, tenant_id: int, role: str) -> None:
        pass

    @abstractmethod
    def get_user_role(self, user_id: int, tenant_id: int) -> Optional[str]:
        pass
