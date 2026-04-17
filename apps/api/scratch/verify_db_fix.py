import os
import sys

# Add the API directory to the path
sys.path.append(os.path.join(os.getcwd(), "apps/api"))

from infrastructure.driven.db.session import SessionLocal
from infrastructure.driven.db import models

def test_inventory_status():
    db = SessionLocal()
    try:
        # Test fetching
        items_a = db.query(models.InventoryBlockA).limit(1).all()
        print(f"Successfully fetched {len(items_a)} items from Block A")
        
        if items_a:
            item = items_a[0]
            original_status = item.status
            print(f"Original status: {original_status}")
            
            # Test updating
            item.status = "Bought" if original_status != "Bought" else "Planned"
            db.commit()
            db.refresh(item)
            print(f"Updated status: {item.status}")
            
            # Revert
            item.status = original_status
            db.commit()
            print("Successfully reverted status change")
        
        items_b = db.query(models.InventoryBlockB).limit(1).all()
        print(f"Successfully fetched {len(items_b)} items from Block B")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    test_inventory_status()
