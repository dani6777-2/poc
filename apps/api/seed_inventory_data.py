from infrastructure.driven.db.config import SessionLocal
from infrastructure.driven.db.models import InventoryBlockA, InventoryBlockB

def seed_sample_inventory():
    db = SessionLocal()
    tenant_id = 1
    month = "2026-04"

    print(f"--- Seeding Inventory Data for {month} ---")

    # Clear existing data for this month to avoid duplicates if run multiple times
    db.query(InventoryBlockA).filter(InventoryBlockA.month == month, InventoryBlockA.tenant_id == tenant_id).delete()
    db.query(InventoryBlockB).filter(InventoryBlockB.month == month, InventoryBlockB.tenant_id == tenant_id).delete()
    db.commit()

    # Block A Assets (Pantry)
    # ids: Cat 4 (Abarrotes), Cat 3 (Lacteos)
    # units: 6 (pack), 5 (units)
    # channels: 1 (Lider), 4 (Jumbo)
    block_a_items = [
        {
            "name": "Arroz Grano Largo Premium",
            "category_id": 4,
            "unit_id": 6, # pack
            "channel_id": 1, # Lider
            "quantity": 5.0,
            "unit_price": 1250.0,
            "subtotal": 6250.0,
            "prev_month_price": 1200.0
        },
        {
            "name": "Leche Entera Vector-P",
            "category_id": 3,
            "unit_id": 5, # units
            "channel_id": 4, # Jumbo
            "quantity": 12.0,
            "unit_price": 980.0,
            "subtotal": 11760.0,
            "prev_month_price": 980.0
        },
        {
            "name": "Aceite Vegetal Insumo-X",
            "category_id": 4,
            "unit_id": 5, # units
            "channel_id": 1, # Lider
            "quantity": 2.0,
            "unit_price": 2450.0,
            "subtotal": 4900.0,
            "prev_month_price": 2600.0
        }
    ]

    for item_data in block_a_items:
        db.add(InventoryBlockA(tenant_id=tenant_id, month=month, **item_data))

    # Block B Assets (Fresh Market)
    # ids: Cat 1 (Proteinas)
    # units: 1 (kg)
    # channels: 5 (Unimarc), 4 (Jumbo)
    block_b_items = [
        {
            "name": "Pechuga de Pollo Premium",
            "category_id": 1,
            "unit_id": 1, # kg
            "channel_id": 5, # Unimarc
            "price_per_kg": 4500.0,
            "subtotal": 9000.0, # Assumed 2kg for internal logic if needed
            "prev_month_price": 4200.0,
            "price_delta": 300.0
        },
        {
            "name": "Salmón Atlántico Fresco",
            "category_id": 1,
            "unit_id": 1, # kg
            "channel_id": 4, # Jumbo
            "price_per_kg": 12500.0,
            "subtotal": 18750.0, # 1.5kg
            "prev_month_price": 13000.0,
            "price_delta": -500.0
        },
        {
            "name": "Palta Hass Selecta",
            "category_id": 4, # Fallback to Abarrotes if no Produce
            "unit_id": 1, # kg
            "channel_id": 5, # Unimarc
            "price_per_kg": 5600.0,
            "subtotal": 5600.0,
            "prev_month_price": 5400.0,
            "price_delta": 200.0
        }
    ]

    for item_data in block_b_items:
        db.add(InventoryBlockB(tenant_id=tenant_id, month=month, **item_data))

    db.commit()
    print("--- Seeding Completed Successfully ---")
    db.close()

if __name__ == "__main__":
    seed_sample_inventory()
