from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.models import Tenant

db = SessionLocal()
tenants = db.query(Tenant).all()
for t in tenants:
    print(f"ID: {t.id}, Name: '{t.name}'")
db.close()
