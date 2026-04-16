import sys
import os

# Set up paths for the script to find the modules
sys.path.append(os.getcwd())

from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db import models

def backfill_tenant_access():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        for user in users:
            # Check if access already exists
            exists = db.query(models.TenantAccess).filter(
                models.TenantAccess.user_id == user.id,
                models.TenantAccess.tenant_id == user.tenant_id
            ).first()
            
            if not exists:
                print(f"Backfilling access for user {user.email} (Tenant {user.tenant_id})")
                access = models.TenantAccess(
                    user_id=user.id,
                    tenant_id=user.tenant_id,
                    role="owner"
                )
                db.add(access)
        db.commit()
        print("Backfill complete.")
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_tenant_access()
