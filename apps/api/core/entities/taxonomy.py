from pydantic import BaseModel
from typing import Optional

class TaxonomySectionBase(BaseModel):
    name: str
    icon: Optional[str] = None
    color_bg: Optional[str] = None
    color_accent: Optional[str] = None
    sort_order: Optional[int] = 0

class TaxonomySectionCreate(TaxonomySectionBase):
    pass

class TaxonomySectionUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color_bg: Optional[str] = None
    color_accent: Optional[str] = None
    sort_order: Optional[int] = None

class TaxonomySectionOut(TaxonomySectionBase):
    id: int
    tenant_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class TaxonomyCategoryBase(BaseModel):
    name: str
    section_id: int
    sort_order: Optional[int] = 0

class TaxonomyCategoryCreate(TaxonomyCategoryBase):
    pass

class TaxonomyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    section_id: Optional[int] = None
    sort_order: Optional[int] = None

class TaxonomyCategoryOut(TaxonomyCategoryBase):
    id: int
    tenant_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class TaxonomyChannelBase(BaseModel):
    name: str

class TaxonomyChannelCreate(TaxonomyChannelBase):
    pass

class TaxonomyChannelUpdate(BaseModel):
    name: Optional[str] = None

class TaxonomyChannelOut(TaxonomyChannelBase):
    id: int
    tenant_id: Optional[int] = None
    
    class Config:
        from_attributes = True

