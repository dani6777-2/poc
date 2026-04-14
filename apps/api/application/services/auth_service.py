from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

from core.entities.auth import UserRegister, UserLogin, Token
from core.ports.secondary.user_repository import UserRepositoryPort, TenantRepositoryPort
from core.exceptions import AuthenticationError, UserAlreadyExistsError

# We could also inject CryptContext and JWT signers via ports if we wanted pure domain,
# but keeping them in service is an acceptable pragmatic hexagonal compromise 
# or placing them in an external adapter for CryptoPort. For simplicity:

class AuthService:
    def __init__(
        self, 
        user_repo: UserRepositoryPort, 
        tenant_repo: TenantRepositoryPort,
        secret_key: str,
        algorithm: str
    ):
        self.user_repo = user_repo
        self.tenant_repo = tenant_repo
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.access_token_expire_minutes = 60 * 24 * 7

    def _create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def register(self, data: UserRegister) -> Token:
        if self.user_repo.get_by_email(data.email):
            raise UserAlreadyExistsError()
        
        tenant = self.tenant_repo.get_by_name(data.tenant_name)
        if not tenant:
            tenant = self.tenant_repo.create(data.tenant_name)

        hashed_pw = self.pwd_context.hash(data.password)
        new_user = self.user_repo.create(
            email=data.email,
            password_hash=hashed_pw,
            tenant_id=tenant.id,
            role="owner"
        )

        token_str = self._create_access_token(data={"sub": str(new_user.id)})
        return Token(
            access_token=token_str,
            token_type="bearer",
            user_id=new_user.id,
            tenant_id=tenant.id,
            email=new_user.email,
            tenant_name=tenant.name
        )

    def login(self, data: UserLogin) -> Token:
        user = self.user_repo.get_by_email(data.email)
        if not user or not self.pwd_context.verify(data.password, user.password_hash):
            raise AuthenticationError()

        tenant = self.tenant_repo.get_by_id(user.tenant_id)
        token_str = self._create_access_token(data={"sub": str(user.id)})
        return Token(
            access_token=token_str,
            token_type="bearer",
            user_id=user.id,
            tenant_id=user.tenant_id,
            email=user.email,
            tenant_name=tenant.name if tenant else "Default"
        )
