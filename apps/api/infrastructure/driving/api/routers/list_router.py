from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from infrastructure.driven.db.config import get_db
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])

@router.get("/")
def get_taxonomy_lists(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Sections (Global)
    sections = db.query(models.TaxonomySection).order_by(models.TaxonomySection.sort_order).all()
    
    # 2. Categories (Global + Tenant)
    categories = db.query(models.TaxonomyCategory).filter(
        (models.TaxonomyCategory.tenant_id == None) | 
        (models.TaxonomyCategory.tenant_id == current_user.tenant_id)
    ).order_by(models.TaxonomyCategory.section_id, models.TaxonomyCategory.sort_order).all()
    
    # 3. Channels (Tenant)
    channels = db.query(models.TaxonomyChannel).filter(
        (models.TaxonomyChannel.tenant_id == None) |
        (models.TaxonomyChannel.tenant_id == current_user.tenant_id)
    ).all()
    
    # 4. Units (Global)
    units = db.query(models.TaxonomyUnit).all()

    return {
        "sections": [
            {
                "id": s.id, 
                "name": s.name, 
                "icon": s.icon, 
                "color_bg": s.color_bg, 
                "color_accent": s.color_accent
            } for s in sections
        ],
        "categories": [
            {
                "id": c.id, 
                "name": c.name, 
                "section_id": c.section_id,
                "tenant_id": c.tenant_id
            } for c in categories
        ],
        "channels": [
            {"id": ch.id, "name": ch.name} for ch in channels
        ],
        "units": [
            {"id": u.id, "name": u.name} for u in units
        ]
    }
