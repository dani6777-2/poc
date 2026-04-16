import os
from typing import Optional
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import PyJWTError
from pydantic import BaseModel

from infrastructure.driven.db.config import get_db
from infrastructure.driven.db import models

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_dev_key_4.0")
ALGORITHM = "HS256"

class UserContext(BaseModel):
    user_id: int
    email: str
    tenant_id: int
    role: str # 'owner' or 'guest'

# Token extractor from Authorization: Bearer Header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db),
    x_tenant_id: Optional[int] = Header(None, alias="X-Tenant-Id")
) -> UserContext:
    """
    Decodes the JWT and identifies the active tenant context.
    If X-Tenant-Id is provided, verifies guest/owner access.
    Enforces READ-ONLY for guests on non-GET methods.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    # Resolve active tenant
    active_tenant_id = x_tenant_id if x_tenant_id is not None else user.tenant_id
    
    # Verify access in TenantAccess table
    access = db.query(models.TenantAccess).filter(
        models.TenantAccess.user_id == user.id,
        models.TenantAccess.tenant_id == active_tenant_id
    ).first()

    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have access to this home."
        )

    # Enforce READ-ONLY for guests
    if access.role == "guest" and request.method not in ["GET", "HEAD", "OPTIONS"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-Only: Guests cannot modify data in this home."
        )

    return UserContext(
        user_id=user.id,
        email=user.email,
        tenant_id=active_tenant_id,
        role=access.role
    )
