from pydantic import BaseModel
from typing import Optional

class TaxonomySectionCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color_bg: Optional[str] = None
    color_accent: Optional[str] = None
    sort_order: Optional[int] = 0

class TaxonomySectionUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color_bg: Optional[str] = None
    color_accent: Optional[str] = None
    sort_order: Optional[int] = None

class TaxonomySectionOut(BaseModel):
    id: int
    tenant_id: Optional[int] = None
    name: str
    icon: Optional[str] = None
    color_bg: Optional[str] = None
    color_accent: Optional[str] = None
    sort_order: Optional[int] = 0
    
    class Config:
        from_attributes = True

class TaxonomyCategoryCreate(BaseModel):
    name: str
    section_id: int
    sort_order: Optional[int] = 0

class TaxonomyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    section_id: Optional[int] = None
    sort_order: Optional[int] = None

class TaxonomyCategoryOut(BaseModel):
    id: int
    tenant_id: Optional[int] = None
    name: str
    section_id: int
    sort_order: Optional[int] = 0
    
    class Config:
        from_attributes = True

class TaxonomyChannelCreate(BaseModel):
    name: str

class TaxonomyChannelUpdate(BaseModel):
    name: Optional[str] = None

class TaxonomyChannelOut(BaseModel):
    id: int
    tenant_id: Optional[int] = None
    name: str
    
    class Config:
        from_attributes = True

