from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.taxonomy import (
    TaxonomyCategoryCreate, 
    TaxonomyCategoryUpdate, 
    TaxonomyChannelCreate, 
    TaxonomyChannelUpdate,
    TaxonomySectionCreate,
    TaxonomySectionUpdate
)

class TaxonomyService:
    def __init__(self, db: Session):
        self.db = db

    # --- SECTIONS ---
    def get_sections(self, tenant_id: int):
        return self.db.query(models.TaxonomySection).filter(
            (models.TaxonomySection.tenant_id == None) | 
            (models.TaxonomySection.tenant_id == tenant_id)
        ).order_by(models.TaxonomySection.sort_order).all()

    def create_section(self, tenant_id: int, data: TaxonomySectionCreate):
        new_sec = models.TaxonomySection(
            tenant_id=tenant_id,
            name=data.name,
            icon=data.icon,
            color_bg=data.color_bg,
            color_accent=data.color_accent,
            sort_order=data.sort_order
        )
        self.db.add(new_sec)
        self.db.commit()
        self.db.refresh(new_sec)
        return new_sec

    def update_section(self, tenant_id: int, section_id: int, data: TaxonomySectionUpdate):
        sec = self.db.query(models.TaxonomySection).filter_by(id=section_id, tenant_id=tenant_id).first()
        if not sec:
            raise ValueError("Section not found or access denied")
        
        if data.name is not None:
            sec.name = data.name
        if data.icon is not None:
            sec.icon = data.icon
        if data.color_bg is not None:
            sec.color_bg = data.color_bg
        if data.color_accent is not None:
            sec.color_accent = data.color_accent
        if data.sort_order is not None:
            sec.sort_order = data.sort_order
            
        self.db.commit()
        self.db.refresh(sec)
        return sec

    def delete_section(self, tenant_id: int, section_id: int):
        sec = self.db.query(models.TaxonomySection).filter_by(id=section_id, tenant_id=tenant_id).first()
        if not sec:
            raise ValueError("Section not found or access denied")
        self.db.delete(sec)
        self.db.commit()
        return True

    # --- CATEGORIES ---
    def get_categories(self, tenant_id: int):
        return self.db.query(models.TaxonomyCategory).filter(
            (models.TaxonomyCategory.tenant_id == None) | 
            (models.TaxonomyCategory.tenant_id == tenant_id)
        ).order_by(models.TaxonomyCategory.section_id, models.TaxonomyCategory.sort_order).all()

    def create_category(self, tenant_id: int, data: TaxonomyCategoryCreate):
        new_cat = models.TaxonomyCategory(
            tenant_id=tenant_id,
            name=data.name,
            section_id=data.section_id,
            sort_order=data.sort_order
        )
        self.db.add(new_cat)
        self.db.commit()
        self.db.refresh(new_cat)
        return new_cat

    def update_category(self, tenant_id: int, category_id: int, data: TaxonomyCategoryUpdate):
        cat = self.db.query(models.TaxonomyCategory).filter_by(id=category_id, tenant_id=tenant_id).first()
        if not cat:
            raise ValueError("Category not found or access denied")
        
        if data.name is not None:
            cat.name = data.name
        if data.section_id is not None:
            cat.section_id = data.section_id
        if data.sort_order is not None:
            cat.sort_order = data.sort_order
            
        self.db.commit()
        self.db.refresh(cat)
        return cat

    def delete_category(self, tenant_id: int, category_id: int):
        cat = self.db.query(models.TaxonomyCategory).filter_by(id=category_id, tenant_id=tenant_id).first()
        if not cat:
            raise ValueError("Category not found or access denied")
        # Check dependencies in items? Optional, but good practice. For now we just delete.
        self.db.delete(cat)
        self.db.commit()
        return True

    # --- CHANNELS ---
    def get_channels(self, tenant_id: int):
        return self.db.query(models.TaxonomyChannel).filter(
            (models.TaxonomyChannel.tenant_id == None) | 
            (models.TaxonomyChannel.tenant_id == tenant_id)
        ).all()

    def create_channel(self, tenant_id: int, data: TaxonomyChannelCreate):
        new_chan = models.TaxonomyChannel(
            tenant_id=tenant_id,
            name=data.name
        )
        self.db.add(new_chan)
        self.db.commit()
        self.db.refresh(new_chan)
        return new_chan

    def update_channel(self, tenant_id: int, channel_id: int, data: TaxonomyChannelUpdate):
        chan = self.db.query(models.TaxonomyChannel).filter_by(id=channel_id, tenant_id=tenant_id).first()
        if not chan:
            raise ValueError("Channel not found or access denied")
        if data.name is not None:
            chan.name = data.name
        self.db.commit()
        self.db.refresh(chan)
        return chan

    def delete_channel(self, tenant_id: int, channel_id: int):
        chan = self.db.query(models.TaxonomyChannel).filter_by(id=channel_id, tenant_id=tenant_id).first()
        if not chan:
            raise ValueError("Channel not found or access denied")
        self.db.delete(chan)
        self.db.commit()
        return True
