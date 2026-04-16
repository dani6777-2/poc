import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from core.entities.auth import TenantEntity, TenantAccessEntity
from infrastructure.config.dependencies import get_db
from infrastructure.driving.api.auth import get_current_user
from infrastructure.driven.db.repositories.user_repo import SQLTenantRepository
from sqlalchemy.orm import Session

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("/access", response_model=List[TenantAccessEntity])
def get_my_access(
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = SQLTenantRepository(db)
    return repo.get_user_access_list(user_context.user_id)

@router.post("/invite-code", response_model=TenantEntity)
def get_or_generate_invite_code(
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = SQLTenantRepository(db)
    # Only owners can manage invite codes
    if user_context.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can manage invite codes.")
    
    tenant = repo.get_by_id(user_context.tenant_id)
    if not tenant.invite_code:
        new_code = str(uuid.uuid4())[:8].upper()
        repo.update_invite_code(tenant.id, new_code)
        tenant.invite_code = new_code
    
    return tenant

@router.post("/join", response_model=TenantAccessEntity)
def join_tenant(
    code: str,
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = SQLTenantRepository(db)
    tenant = repo.get_by_invite_code(code)
    if not tenant:
        raise HTTPException(status_code=404, detail="Invalid invite code.")
    
    # Add as guest
    repo.add_user_access(user_context.user_id, tenant.id, "guest")
    return TenantAccessEntity(id=tenant.id, name=tenant.name, role="guest")
