import os
import sqlite3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gastos.db")

def migrate():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking for existing columns in expense_details...")
        # Check if concept_key exists
        try:
            if "sqlite" in DATABASE_URL:
                # SQLite specific check
                cursor = conn.execute(text("PRAGMA table_info(expense_details)"))
                columns = [row[1] for row in cursor]
            else:
                # Postgres/Generic check
                cursor = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='expense_details'"))
                columns = [row[0] for row in cursor]
            
            if "concept_key" not in columns:
                print("Adding concept_key column...")
                conn.execute(text("ALTER TABLE expense_details ADD COLUMN concept_key VARCHAR(100)"))
                conn.commit()
            
            if "concept_label" not in columns:
                print("Adding concept_label column...")
                conn.execute(text("ALTER TABLE expense_details ADD COLUMN concept_label VARCHAR(255)"))
                conn.commit()

            if "concept_origin" not in columns:
                print("Adding concept_origin column...")
                conn.execute(text("ALTER TABLE expense_details ADD COLUMN concept_origin VARCHAR(50) DEFAULT 'manual' NOT NULL"))
                conn.commit()

            if "is_active" not in columns:
                print("Adding is_active column...")
                if "sqlite" in DATABASE_URL:
                    conn.execute(text("ALTER TABLE expense_details ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL"))
                else:
                    conn.execute(text("ALTER TABLE expense_details ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL"))
                conn.commit()
                
            print("Migration successful.")
        except Exception as e:
            print(f"Error during manual migration: {e}")
            # Try to force it if it's sqlite
            if "sqlite" in DATABASE_URL:
                db_path = DATABASE_URL.replace("sqlite:///", "")
                try:
                    sq_conn = sqlite3.connect(db_path)
                    sq_conn.execute("ALTER TABLE expense_details ADD COLUMN concept_key TEXT")
                    sq_conn.execute("ALTER TABLE expense_details ADD COLUMN concept_origin TEXT DEFAULT 'manual'")
                    sq_conn.commit()
                    sq_conn.close()
                    print("Migration successful via sqlite3.")
                except Exception as sq_e:
                    print(f"SQLite specific error: {sq_e}")

if __name__ == "__main__":
    migrate()
