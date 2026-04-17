from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    tenant_id: int
    email: str
    tenant_name: str

class UserRegister(BaseModel):
    email: str
    password: str
    tenant_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserEntity(BaseModel):
    id: int
    email: str
    password_hash: str
    tenant_id: int
    role: str

class TenantEntity(BaseModel):
    id: int
    name: str
    invite_code: Optional[str] = None

class TenantAccessEntity(BaseModel):
    id: int
    name: str
    role: str

class TenantMemberEntity(BaseModel):
    user_id: int
    email: str
    role: str
