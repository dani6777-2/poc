import os
import sys
import hashlib
import re
import unicodedata
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add api path to sys.path
sys.path.append('/Users/PERSONAL/Documents/poc/apps/api')

from infrastructure.driven.db.models import ExpenseDetail, Item, TaxonomyCategory, TaxonomySection
from application.services.annual_expense_service import AnnualExpenseService
from infrastructure.driven.db.repositories.annual_expense_repo import SQLAnnualExpenseRepository
from infrastructure.driven.db.repositories.expense_repo import SQLExpenseRepository
from infrastructure.driven.db.repositories.card_repo import SQLCardRepository
from application.services.taxonomy_service import TaxonomyService

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@localhost:5433/gastos")

def normalize(name):
    if not name: return ""
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('ASCII')
    name = re.sub(r'[^a-z0-9]', '', name.lower())
    return name

def verify():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    tenant_id = 1
    year = 2026
    month_str = "2026-01"
    
    # Use a unique identifier to avoid existing data collisions
    import random
    TEST_PREFIX = f"Z{random.randint(100, 999)}_STAB_"

    print(f"--- Verifying Robust Stability for Year {year} ---")

    # 1. Setup Data
    section = db.query(TaxonomySection).first()
    category = db.query(TaxonomyCategory).filter_by(section_id=section.id).first()
    
    print(f"Using Category: {category.name} (ID: {category.id})")

    # Clear previous test data (Items can be deleted, ExpenseDetails might be protected if automatic)
    db.execute(text(f"DELETE FROM items WHERE name LIKE '{TEST_PREFIX}%'"))
    try:
        db.execute(text(f"DELETE FROM expense_details WHERE description LIKE '%{TEST_PREFIX}%'"))
    except:
        db.rollback()
        print("Warning: Could not clear automatic test rows from matrix (Protected). Using unique prefix.")
    db.commit()

    # 2. Add Registry Items with variations (Should collapse)
    item_a = Item(
        tenant_id=tenant_id, month=month_str, category_id=category.id,
        name=f"{TEST_PREFIX} Concept", subtotal=150.0, status="Bought", payment_method="cash"
    )
    item_b = Item(
        tenant_id=tenant_id, month=month_str, category_id=category.id,
        name=f"{TEST_PREFIX} concept  ", subtotal=250.0, status="Bought", payment_method="cash"
    )
    db.add_all([item_a, item_b])
    db.commit()

    # 3. Add Manual Row
    manual_row = ExpenseDetail(
        tenant_id=tenant_id, year=year, section_id=section.id, category_id=category.id,
        description=f"{TEST_PREFIX} MANUAL", is_automatic=False, concept_origin="manual",
        jan=777.0
    )
    db.add(manual_row)
    db.commit()

    # 4. Run Reconcile
    annual_repo = SQLAnnualExpenseRepository(db)
    expense_repo = SQLExpenseRepository(db)
    card_repo = SQLCardRepository(db)
    taxonomy_svc = TaxonomyService(db)
    service = AnnualExpenseService(annual_repo, expense_repo, card_repo, taxonomy_service=taxonomy_svc)
    
    print("Running sync...")
    service.sync_registry_to_expenses(tenant_id, year)

    # 5. Verify Results
    rows = db.query(ExpenseDetail).filter(
        ExpenseDetail.description.like(f"%{TEST_PREFIX}%")
    ).all()

    print(f"Found {len(rows)} test matrix rows:")
    for r in rows:
        print(f" - [{r.concept_origin}] {r.description} | {r.concept_key} | Jan Budget/Actual: {r.jan}/{r.actual_jan}")

    # Checks
    registry_rows = [r for r in rows if r.concept_origin == "registry"]
    manual_rows = [r for r in rows if r.concept_origin == "manual"]
    
    success = True
    # Name Variations -> same hash -> 1 row
    if len(registry_rows) == 1:
        print("✅ SUCCESS: Registry items collapsed correctly.")
        # Subtotal should be 150 + 250 = 400
        if float(registry_rows[0].actual_jan) == 400.0:
            print("✅ SUCCESS: Total aggregated correctly (400.0).")
        else:
            print(f"❌ FAILURE: Expected actual_jan 400.0, found {registry_rows[0].actual_jan}")
            success = False
    else:
        print(f"❌ FAILURE: Expected 1 registry row, found {len(registry_rows)}.")
        success = False

    if len(manual_rows) == 1 and float(manual_rows[0].jan) == 777.0:
        print("✅ SUCCESS: Manual row preserved correctly.")
    else:
        print(f"❌ FAILURE: Manual row data issues. Count: {len(manual_rows)}, Value: {manual_rows[0].jan if manual_rows else 'N/A'}")
        success = False

    # Cleanup
    db.execute(text(f"DELETE FROM items WHERE name LIKE '{TEST_PREFIX}%'"))
    try:
        db.execute(text(f"DELETE FROM expense_details WHERE description LIKE '%{TEST_PREFIX}%'"))
    except:
        db.rollback()
    db.commit()
    db.close()
    
    if success:
        print("\n🏆 ALL STRUCTURAL TESTS PASSED")
    else:
        sys.exit(1)

if __name__ == "__main__":
    verify()
