from typing import List, Optional
from fastapi import APIRouter, Depends
from core.entities.inventory import InventoryItemA, InventoryItemB, InventoryItemACreate, InventoryItemBCreate
from application.services.inventory_service import InventoryService
from infrastructure.config.dependencies import get_inventory_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router_a = APIRouter(prefix="/inventory/block-a", tags=["block-a"])
router_b = APIRouter(prefix="/inventory/block-b", tags=["block-b"])

# ─── BLOCK A ───────────────────────────────────────────────────────────────

@router_a.get("/", response_model=List[InventoryItemA])
def get_block_a(month: Optional[str] = None, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.get_items_a(current_user.tenant_id, month)

@router_a.post("/", response_model=InventoryItemA)
def create_block_a(item: InventoryItemACreate, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.create_item_a(current_user.tenant_id, item)

@router_a.put("/{item_id}", response_model=InventoryItemA)
def update_block_a(item_id: int, item: InventoryItemACreate, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.update_item_a(current_user.tenant_id, item_id, item)

@router_a.delete("/{item_id}")
def delete_block_a(item_id: int, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    service.delete_item_a(current_user.tenant_id, item_id)
    return {"ok": True}

# ─── BLOCK B ───────────────────────────────────────────────────────────────

@router_b.get("/", response_model=List[InventoryItemB])
def get_block_b(month: Optional[str] = None, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.get_items_b(current_user.tenant_id, month)

@router_b.post("/", response_model=InventoryItemB)
def create_block_b(item: InventoryItemBCreate, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.create_item_b(current_user.tenant_id, item)

@router_b.put("/{item_id}", response_model=InventoryItemB)
def update_block_b(item_id: int, item: InventoryItemBCreate, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    return service.update_item_b(current_user.tenant_id, item_id, item)

@router_b.delete("/{item_id}")
def delete_block_b(item_id: int, service: InventoryService = Depends(get_inventory_service), current_user: models.User = Depends(get_current_user)):
    service.delete_item_b(current_user.tenant_id, item_id)
    return {"ok": True}
