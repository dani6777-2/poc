from typing import Optional
from sqlalchemy.orm import Session
from core.ports.secondary.user_repository import UserRepositoryPort, TenantRepositoryPort
from core.entities.auth import UserEntity, TenantEntity
from infrastructure.driven.db import models # using existing models for the PoC migration

class SQLUserRepository(UserRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[UserEntity]:
        user_model = self.db.query(models.User).filter(models.User.email == email).first()
        if not user_model:
            return None
        return UserEntity(
            id=user_model.id,
            email=user_model.email,
            password_hash=user_model.password_hash,
            tenant_id=user_model.tenant_id,
            role=user_model.role
        )

    def create(self, email: str, password_hash: str, tenant_id: int, role: str) -> UserEntity:
        new_user = models.User(
            email=email,
            password_hash=password_hash,
            tenant_id=tenant_id,
            role=role
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return UserEntity(
            id=new_user.id,
            email=new_user.email,
            password_hash=new_user.password_hash,
            tenant_id=new_user.tenant_id,
            role=new_user.role
        )

class SQLTenantRepository(TenantRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: str) -> Optional[TenantEntity]:
        tenant_model = self.db.query(models.Tenant).filter(models.Tenant.name == name).first()
        if not tenant_model:
            return None
        return TenantEntity(id=tenant_model.id, name=tenant_model.name)

    def get_by_id(self, tenant_id: int) -> Optional[TenantEntity]:
        tenant_model = self.db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant_model:
            return None
        return TenantEntity(id=tenant_model.id, name=tenant_model.name)

    def create(self, name: str) -> TenantEntity:
        new_tenant = models.Tenant(name=name)
        self.db.add(new_tenant)
        self.db.commit()
        self.db.refresh(new_tenant)
        return TenantEntity(id=new_tenant.id, name=new_tenant.name)
