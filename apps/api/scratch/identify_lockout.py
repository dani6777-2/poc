import sys
import os

# Robust path handling
# Assuming the project root for imports is apps/api
# The script is created in apps/api/scratch/
script_path = os.path.abspath(__file__)
scratch_dir = os.path.dirname(script_path)
api_root = os.path.dirname(scratch_dir)

if api_root not in sys.path:
    sys.path.insert(0, api_root)

print(f"DEBUG: sys.path[0] set to {sys.path[0]}")

from infrastructure.driven.db.session import SessionLocal
from infrastructure.driven.db import models

def identify_lockout():
    db = SessionLocal()
    try:
        print("--- USERS ---")
        users = db.query(models.User).all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Primary Tenant ID: {u.tenant_id}")
            
        print("\n--- TENANTS ---")
        tenants = db.query(models.Tenant).all()
        for t in tenants:
            print(f"ID: {t.id} | Name: {t.name}")
            
        print("\n--- TENANT ACCESS ---")
        access = db.query(models.TenantAccess).all()
        for a in access:
            print(f"ID: {a.id} | User ID: {a.user_id} | Tenant ID: {a.tenant_id} | Role: {a.role}")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    identify_lockout()
