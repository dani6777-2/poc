from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from infrastructure.driven.db.config import get_db
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])

@router.get("/")
def get_taxonomy_lists(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Sections (Global + Tenant)
    sections = db.query(models.TaxonomySection).filter(
        (models.TaxonomySection.tenant_id == None) | 
        (models.TaxonomySection.tenant_id == current_user.tenant_id)
    ).order_by(models.TaxonomySection.sort_order).all()
    
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
                "color_accent": s.color_accent,
                "tenant_id": s.tenant_id
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

from core.entities.taxonomy import (
    TaxonomyCategoryCreate,
    TaxonomyCategoryUpdate,
    TaxonomyCategoryOut,
    TaxonomyChannelCreate,
    TaxonomyChannelUpdate,
    TaxonomyChannelOut,
    TaxonomySectionCreate,
    TaxonomySectionUpdate,
    TaxonomySectionOut
)
from application.services.taxonomy_service import TaxonomyService
from infrastructure.config.dependencies import get_taxonomy_service

# --- SECTIONS CRUD ---
@router.post("/sections", response_model=TaxonomySectionOut)
def create_section(
    data: TaxonomySectionCreate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    return service.create_section(current_user.tenant_id, data)

@router.put("/sections/{section_id}", response_model=TaxonomySectionOut)
def update_section(
    section_id: int,
    data: TaxonomySectionUpdate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return service.update_section(current_user.tenant_id, section_id, data)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.delete("/sections/{section_id}")
def delete_section(
    section_id: int,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        service.delete_section(current_user.tenant_id, section_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

# --- CATEGORIES CRUD ---
@router.post("/categories", response_model=TaxonomyCategoryOut)
def create_category(
    data: TaxonomyCategoryCreate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    return service.create_category(current_user.tenant_id, data)

@router.put("/categories/{category_id}", response_model=TaxonomyCategoryOut)
def update_category(
    category_id: int,
    data: TaxonomyCategoryUpdate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return service.update_category(current_user.tenant_id, category_id, data)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        service.delete_category(current_user.tenant_id, category_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

# --- CHANNELS CRUD ---
@router.post("/channels", response_model=TaxonomyChannelOut)
def create_channel(
    data: TaxonomyChannelCreate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    return service.create_channel(current_user.tenant_id, data)

@router.put("/channels/{channel_id}", response_model=TaxonomyChannelOut)
def update_channel(
    channel_id: int,
    data: TaxonomyChannelUpdate,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return service.update_channel(current_user.tenant_id, channel_id, data)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.delete("/channels/{channel_id}")
def delete_channel(
    channel_id: int,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_current_user)
):
    try:
        service.delete_channel(current_user.tenant_id, channel_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

