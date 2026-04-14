import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.models import User, Tenant

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db: Session = SessionLocal()
    try:
        # 1. Asegurar que exista un Tenant
        tenant_name = "Default Tenant"
        tenant = db.query(Tenant).filter(Tenant.name == tenant_name).first()
        if not tenant:
            tenant = Tenant(name=tenant_name)
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"[*] Tenant '{tenant_name}' creado exitosamente (ID: {tenant.id}).")
        else:
            print(f"[*] Tenant '{tenant_name}' ya existe (ID: {tenant.id}).")

        # 2. Asegurar que exista el usuario
        email = "admin@admin.com"
        password = "admin"
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            hashed_pw = pwd_context.hash(password)
            user = User(
                email=email,
                password_hash=hashed_pw,
                role="owner",
                tenant_id=tenant.id
            )
            db.add(user)
            db.commit()
            print(f"[+] Usuario creado exitosamente!")
            print(f"    - Email: {email}")
            print(f"    - Password: {password}")
        else:
            print(f"[*] El usuario ya existe!")
            print(f"    - Email: {email}")
            print(f"    - Password: {password} (Asumiendo que no la has cambiado)")
            
    except Exception as e:
        print(f"[!] Error creando el usuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()