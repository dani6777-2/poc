from typing import List
from fastapi import APIRouter, Depends
from core.entities.card import CardConfigEntity, CardBalanceEntity
from application.services.card_service import CardService
from infrastructure.config.dependencies import get_card_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/card", tags=["card"])

@router.get("/config", response_model=CardConfigEntity)
def get_config(card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    return card_service.get_config(current_user.tenant_id)

@router.put("/config")
async def update_config(data: dict, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    card_service.update_config(current_user.tenant_id, data)
    return {"ok": True}

@router.get("/balance/{month}", response_model=CardBalanceEntity)
def get_balance(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    return card_service.get_balance(current_user.tenant_id, month)

@router.get("/history/{month}")
def get_history(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    return card_service.get_history(current_user.tenant_id, month)

@router.post("/sync/{month}")
def sync_month(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    card_service.sync_to_debts(current_user.tenant_id, month)
    return {"ok": True, "message": f"Card from {month} synchronized to next month's Debts"}
