import os
from sqlalchemy.orm import Session
from infrastructure.driven.db.config import SessionLocal, engine
from infrastructure.driven.db.models import TaxonomyUnit, TaxonomySection

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

# Estructura basada en estándares de Gestión de Finanzas Personales (PFM)
# Abarcando las áreas del presupuesto 50/30/20, pero preservando las prioridades del usuario.
SECCIONES_GLOBALES = [
    # Necesidades Básicas (Esenciales)
    {"name": "Comida y Despensa", "icon": "🛒", "color_bg": "bg-success-soft", "color_accent": "text-success", "sort_order": 1},
    {"name": "Hogar y Vivienda", "icon": "🏠", "color_bg": "bg-info-soft", "color_accent": "text-info", "sort_order": 2},
    {"name": "Servicios y Gastos Fijos", "icon": "📄", "color_bg": "bg-primary-soft", "color_accent": "text-primary", "sort_order": 3},
    {"name": "Transporte y Movilidad", "icon": "🚗", "color_bg": "bg-warning-soft", "color_accent": "text-warning", "sort_order": 4},
    {"name": "Salud y Cuidado", "icon": "⚕️", "color_bg": "bg-danger-soft", "color_accent": "text-danger", "sort_order": 5},
    
    # Obligaciones y Metas Financieras
    {"name": "Pago de Deudas", "icon": "💳", "color_bg": "bg-danger-soft", "color_accent": "text-danger", "sort_order": 6},
    {"name": "Ahorro e Inversión", "icon": "📈", "color_bg": "bg-success-soft", "color_accent": "text-success", "sort_order": 7},
    
    # Familia Miau (Personalizado del usuario)
    {"name": "Mascotas", "icon": "🐾", "color_bg": "bg-warning-soft", "color_accent": "text-warning", "sort_order": 8},
    {"name": "Citas con mi gatito", "icon": "😻", "color_bg": "bg-primary-soft", "color_accent": "text-primary", "sort_order": 9},
    
    # Estilo de Vida y Ocio
    {"name": "Ocio y Entretenimiento", "icon": "🍿", "color_bg": "bg-secondary-soft", "color_accent": "text-secondary", "sort_order": 10},
    {"name": "Compras Personales", "icon": "🛍️", "color_bg": "bg-info-soft", "color_accent": "text-info", "sort_order": 11},
    {"name": "Educación y Cursos", "icon": "📚", "color_bg": "bg-primary-soft", "color_accent": "text-primary", "sort_order": 12},
]

def seed_database():
    print("--- Starting Minimal Seeding ---")
    db = SessionLocal()
    try:
        # 1. Update Units only (global data)
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

        # 2. Seeding Global Sections
        print("Migrating Global Sections...")
        for sec in SECCIONES_GLOBALES:
            existing = db.query(TaxonomySection).filter(TaxonomySection.name == sec["name"], TaxonomySection.tenant_id == None).first()
            if not existing:
                db.add(TaxonomySection(
                    name=sec["name"],
                    icon=sec["icon"],
                    color_bg=sec["color_bg"],
                    color_accent=sec["color_accent"],
                    sort_order=sec["sort_order"],
                    tenant_id=None
                ))
        db.commit()

        print("--- Minimal seeding completed successfully ---")

    except Exception as e:
        print(f"Error during seeding/migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
