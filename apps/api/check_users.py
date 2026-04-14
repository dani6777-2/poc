from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.models import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: '{u.email}'")
db.close()
