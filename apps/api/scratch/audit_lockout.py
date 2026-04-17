import sys
import os
from infrastructure.driven.db.session import SessionLocal
from infrastructure.driven.db import models

# Add the apps/api directory to sys.path
# The script is in apps/api/scratch/audit_lockout.py
# So project_root is apps/api
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

print(f"DEBUG: sys.path includes {project_root}")



def audit_access():
    db = SessionLocal()
    try:
        print("--- USERS ---")
        users = db.query(models.User).all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Home Tenant ID: {u.tenant_id} | Role: {u.role}")
        
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
    audit_access()
