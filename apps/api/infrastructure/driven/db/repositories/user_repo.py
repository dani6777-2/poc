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
        self.db.flush() # Get ID before commit
        
        # Add primary tenant access
        access = models.TenantAccess(user_id=new_user.id, tenant_id=tenant_id, role="owner")
        self.db.add(access)
        
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
        return TenantEntity(id=tenant_model.id, name=tenant_model.name, invite_code=tenant_model.invite_code)

    def get_by_id(self, tenant_id: int) -> Optional[TenantEntity]:
        tenant_model = self.db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant_model:
            return None
        return TenantEntity(id=tenant_model.id, name=tenant_model.name, invite_code=tenant_model.invite_code)

    def create(self, name: str) -> TenantEntity:
        new_tenant = models.Tenant(name=name)
        self.db.add(new_tenant)
        self.db.commit()
        self.db.refresh(new_tenant)
        return TenantEntity(id=new_tenant.id, name=new_tenant.name, invite_code=new_tenant.invite_code)

    def get_by_invite_code(self, code: str) -> Optional[TenantEntity]:
        m = self.db.query(models.Tenant).filter(models.Tenant.invite_code == code).first()
        if not m: return None
        return TenantEntity(id=m.id, name=m.name, invite_code=m.invite_code)

    def update_invite_code(self, tenant_id: int, code: str) -> None:
        m = self.db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if m:
            m.invite_code = code
            self.db.commit()

    def get_user_access_list(self, user_id: int) -> list:
        # Returns list of {id, name, role}
        accesses = self.db.query(models.TenantAccess, models.Tenant)\
            .join(models.Tenant, models.TenantAccess.tenant_id == models.Tenant.id)\
            .filter(models.TenantAccess.user_id == user_id).all()
        return [{"id": t.id, "name": t.name, "role": ta.role} for ta, t in accesses]

    def add_user_access(self, user_id: int, tenant_id: int, role: str) -> None:
        # Check if already exists
        exists = self.db.query(models.TenantAccess)\
            .filter(models.TenantAccess.user_id == user_id, models.TenantAccess.tenant_id == tenant_id).first()
        if not exists:
            new_acc = models.TenantAccess(user_id=user_id, tenant_id=tenant_id, role=role)
            self.db.add(new_acc)
            self.db.commit()

    def get_user_role(self, user_id: int, tenant_id: int) -> Optional[str]:
        acc = self.db.query(models.TenantAccess)\
            .filter(models.TenantAccess.user_id == user_id, models.TenantAccess.tenant_id == tenant_id).first()
        return acc.role if acc else None
