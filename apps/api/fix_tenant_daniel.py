from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.models import User, Tenant

db = SessionLocal()
tenant = db.query(Tenant).filter(Tenant.name == "Main House").first()
user = db.query(User).filter(User.email.ilike("daniel@gmail.com")).first()

if tenant and user:
    user.tenant_id = tenant.id
    db.commit()
    print("User mapped to Main House")
else:
    print(f"Tenant: {tenant}, User: {user}")

