
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from core.entities.auth import TenantEntity, TenantAccessEntity, TenantMemberEntity
from infrastructure.config.dependencies import get_db
from infrastructure.driving.api.auth import get_current_user
from infrastructure.driven.db.repositories.user_repo import SQLTenantRepository
from sqlalchemy.orm import Session

router = APIRouter(prefix="/tenants", tags=["Tenants"])







@router.get("/access", response_model=List[TenantAccessEntity])
def get_user_tenants(
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = SQLTenantRepository(db)
    return repo.get_user_access_list(user_context.user_id)

@router.post("/invite-code")
def generate_invite_code(
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_context.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can manage invite codes.")
    
    import uuid
    code = str(uuid.uuid4())[:8].upper()
    repo = SQLTenantRepository(db)
    repo.update_invite_code(user_context.tenant_id, code)
    return {"code": code}

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

@router.delete("/leave/{tenant_id}")
def leave_tenant(
    tenant_id: int,
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = SQLTenantRepository(db)
    repo.remove_user_access(user_context.user_id, tenant_id)
    return {"status": "success"}

@router.get("/members", response_model=List[TenantMemberEntity])
def get_tenant_members(
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only owners can see members
    if user_context.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can view member lists.")
    
    repo = SQLTenantRepository(db)
    return repo.get_tenant_members(user_context.tenant_id)

@router.delete("/members/{user_id}")
def revoke_member_access(
    user_id: int,
    user_context = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_context.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can revoke access.")
    
    repo = SQLTenantRepository(db)
    repo.remove_user_access(user_id, user_context.tenant_id)
    return {"status": "success"}


