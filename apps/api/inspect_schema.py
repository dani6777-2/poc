import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)
inspector = inspect(engine)

def check_table(table_name):
    print(f"\n--- Checking table: {table_name} ---")
    columns = inspector.get_columns(table_name)
    for col in columns:
        print(f"Column: {col['name']} ({col['type']})")

check_table("gastos_detalle")
check_table("config_tarjeta")
