import os
from sqlalchemy.orm import Session
from infrastructure.driven.db.config import SessionLocal, engine
from infrastructure.driven.db.models import (
    Tenant, User, TaxonomySection, TaxonomyCategory, 
    TaxonomyChannel, TaxonomyUnit, CardConfig
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Master data in English
SECCIONES = [
    {"name": "Food", "icon": "🍽️", "color_bg": "bg-success-soft", "color_accent": "text-success", "sort_order": 1},
    {"name": "Home", "icon": "🏠", "color_bg": "bg-info-soft", "color_accent": "text-info", "sort_order": 2},
    {"name": "Pets", "icon": "🐾", "color_bg": "bg-orange-soft", "color_accent": "text-orange", "sort_order": 3},
    {"name": "Misc", "icon": "🗂️", "color_bg": "bg-slate-soft", "color_accent": "text-slate", "sort_order": 4},
    {"name": "Fixed Expenses", "icon": "📌", "color_bg": "bg-accent-soft", "color_accent": "text-accent", "sort_order": 5},
    {"name": "Transport", "icon": "🚗", "color_bg": "bg-warning-soft", "color_accent": "text-warning", "sort_order": 6},
    {"name": "Health", "icon": "🏥", "color_bg": "bg-teal-soft", "color_accent": "text-teal", "sort_order": 7},
    {"name": "Daily Life", "icon": "🎭", "color_bg": "bg-purple-soft", "color_accent": "text-purple", "sort_order": 8},
    {"name": "Debts", "icon": "💳", "color_bg": "bg-danger-soft", "color_accent": "text-danger", "sort_order": 9},
    {"name": "Savings", "icon": "🏦", "color_bg": "bg-success-soft", "color_accent": "text-success", "sort_order": 10},
]

CATEGORIAS_GLOBALES = [
    ("Dairy", "Food"),
    ("Groceries", "Food"),
    ("Proteins", "Food"),
    ("Market/Vegetables", "Food"),
    ("Frozen", "Food"),
    ("Drinks", "Food"),
    ("Cleaning", "Home"),
    ("Bathroom", "Home"),
    ("Kitchen", "Home"),
    ("Pets", "Pets"),
    ("Rent/Mortgage", "Fixed Expenses"),
    ("Electricity", "Fixed Expenses"),
    ("Water", "Fixed Expenses"),
    ("Gas", "Fixed Expenses"),
    ("Internet", "Fixed Expenses"),
    ("Common Expenses", "Fixed Expenses"),
    ("Fuel", "Transport"),
    ("Tolls", "Transport"),
    ("Vehicle Insurance", "Transport"),
    ("Pharmacy", "Health"),
    ("Doctor/Dental", "Health"),
    ("Subscriptions", "Daily Life"),
    ("Dining/Delivery", "Daily Life"),
    ("Gifts", "Daily Life"),
    ("Credit Cards", "Debts"),
    ("Personal Loans", "Debts"),
    ("Emergency Fund", "Savings"),
    ("Investments", "Savings"),
    ("Goal Savings", "Savings"),
    ("Other", "Misc"),
]

UNIDADES_MAP = {
    "kg": "kg",
    "g": "g",
    "L": "L",
    "mL": "mL",
    "un": "units",
    "pack": "pack",
    "caja": "box",
    "bolsa": "bag",
    "litro": "liter"
}

CANALES_MAP = {
    "Lider": "Lider",
    "Tottus": "Tottus",
    "Feria": "Market",
    "Multifrut": "Multifrut",
    "JP": "JP",
    "Super Congelados": "Frozen Market",
    "Unimark": "Unimarc",
    "Tienda Barrio": "Local Store",
    "Online": "Online",
    "Mayorista": "Wholesale",
    "Otro": "Other",
    "Crédito": "Credit"
}

# Translation Map for Sections
SECTION_TRANSLATION = {
    "Comida": "Food",
    "Hogar": "Home",
    "Mascotas": "Pets",
    "Varios": "Misc",
    "Gastos Fijos": "Fixed Expenses",
    "Transporte": "Transport",
    "Salud": "Health",
    "Vida Diaria": "Daily Life",
    "Deudas": "Debts",
    "Ahorro": "Savings"
}

CATEGORY_TRANSLATION = {
    "Lacteos": "Dairy",
    "Abarrotes": "Groceries",
    "Proteinas": "Proteins",
    "Feria/Verduras": "Market/Vegetables",
    "Congelados": "Frozen",
    "Bebidas": "Drinks",
    "Limpieza": "Cleaning",
    "Baño": "Bathroom",
    "Cocina": "Kitchen",
    "Mascotas": "Pets",
    "Arriendo/Hipoteca": "Rent/Mortgage",
    "Electricidad": "Electricity",
    "Agua": "Water",
    "Gas": "Gas",
    "Internet": "Internet",
    "Gastos Comunes": "Common Expenses",
    "Combustible": "Fuel",
    "TAG / Peajes": "Tolls",
    "Seguro Vehículo": "Vehicle Insurance",
    "Farmacia": "Pharmacy",
    "Médico / Dental": "Doctor/Dental",
    "Suscripciones": "Subscriptions",
    "Salidas / Delivery": "Dining/Delivery",
    "Regalos": "Gifts",
    "Tarjetas de Crédito": "Credit Cards",
    "Préstamo Consumo": "Personal Loans",
    "Fondo Emergencia": "Emergency Fund",
    "Inversiones": "Investments",
    "Ahorro Proyectos": "Goal Savings",
    "Otro": "Other"
}


def seed_database():
    print("--- Starting English Migration & Seeding ---")
    db = SessionLocal()
    try:
        # 1. Update Existing Sections
        print("Migrating Sections...")
        existing_secs = db.query(TaxonomySection).all()
        for s in existing_secs:
            if s.name in SECTION_TRANSLATION:
                new_name = SECTION_TRANSLATION[s.name]
                # Check if new name already exists elsewhere
                check = db.query(TaxonomySection).filter(TaxonomySection.name == new_name).first()
                if not check:
                    s.name = new_name
        db.commit()

        # Update remaining from SECCIONES list
        sec_map = {}
        for s in SECCIONES:
            existing = db.query(TaxonomySection).filter(TaxonomySection.name == s["name"]).first()
            if not existing:
                new_sec = TaxonomySection(**s)
                db.add(new_sec)
                db.commit()
                db.refresh(new_sec)
                sec_map[s["name"]] = new_sec.id
            else:
                for k,v in s.items():
                    setattr(existing, k, v)
                sec_map[s["name"]] = existing.id
        db.commit()

        # 2. Update Units
        print("Migrating Units...")
        for old, new in UNIDADES_MAP.items():
            existing_old = db.query(TaxonomyUnit).filter(TaxonomyUnit.name == old).first()
            existing_new = db.query(TaxonomyUnit).filter(TaxonomyUnit.name == new).first()
            if existing_old and not existing_new:
                existing_old.name = new
                db.commit()
            elif not existing_new:
                db.add(TaxonomyUnit(name=new))
                db.commit()
        db.commit()

        # 3. Tenant
        tenant_name = "Main House"
        tenant = db.query(Tenant).filter(Tenant.name.in_(["Casa Principal", "Main House"])).first()
        if not tenant:
            tenant = Tenant(name=tenant_name)
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        else:
            tenant.name = tenant_name
            db.commit()
        
        # 4. Categories
        print("Migrating Categories...")
        for old, new in CATEGORY_TRANSLATION.items():
            existing_old = db.query(TaxonomyCategory).filter(TaxonomyCategory.name == old).first()
            existing_new = db.query(TaxonomyCategory).filter(TaxonomyCategory.name == new).first()
            if existing_old and not existing_new:
                existing_old.name = new
                db.commit()

        for cat_name, sec_name in CATEGORIAS_GLOBALES:
            sec_id = sec_map.get(sec_name)
            if sec_id:
                if not db.query(TaxonomyCategory).filter(TaxonomyCategory.name == cat_name).first():
                    db.add(TaxonomyCategory(name=cat_name, section_id=sec_id, tenant_id=None))
        db.commit()

        # 5. Channels
        print("Migrating Channels...")
        for old, new in CANALES_MAP.items():
            existing_old = db.query(TaxonomyChannel).filter(TaxonomyChannel.name == old, TaxonomyChannel.tenant_id == tenant.id).first()
            existing_new = db.query(TaxonomyChannel).filter(TaxonomyChannel.name == new, TaxonomyChannel.tenant_id == tenant.id).first()
            if existing_old and not existing_new:
                existing_old.name = new
                db.commit()
            elif not existing_new:
                db.add(TaxonomyChannel(name=new, tenant_id=tenant.id))
        db.commit()

        # 6. Card Config
        print("Configuring default Credit Card...")
        credit_channel = db.query(TaxonomyChannel).filter(TaxonomyChannel.name == "Credit", TaxonomyChannel.tenant_id == tenant.id).first()
        channel_id = credit_channel.id if credit_channel else None

        card_config = db.query(CardConfig).filter(CardConfig.tenant_id == tenant.id).first()
        if not card_config:
            card_config = CardConfig(tenant_id=tenant.id)
            db.add(card_config)
            db.commit()
            db.refresh(card_config)
        
        card_config.name = "Silver Credit"
        card_config.total_limit = 1000000.0 # Standard default limit to enable sync
        card_config.channel_id = channel_id
        db.commit()

        print("--- English content migration completed successfully ---")

    except Exception as e:
        print(f"Error during seeding/migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
