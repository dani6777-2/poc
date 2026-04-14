from fastapi import APIRouter, Depends, HTTPException, status
from core.entities.auth import UserRegister, UserLogin, Token
from core.exceptions import AuthenticationError, UserAlreadyExistsError
from application.services.auth_service import AuthService
from infrastructure.config.dependencies import get_auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return auth_service.register(user_data)
    except UserAlreadyExistsError as e:
        raise HTTPException(status_code=400, detail=str(e.message))

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return auth_service.login(user_data)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message),
            headers={"WWW-Authenticate": "Bearer"},
        )
