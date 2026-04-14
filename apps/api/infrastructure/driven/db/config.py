import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Intenta cargar un archivo .env si existe localmente
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gastos.db")

engine_kwargs = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Optimización p/ Producción en BDs robustas (PostgreSQL, MySQL)
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", 20))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", 40))
    engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", 1800))  # Recomendado para conexiones largas

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
