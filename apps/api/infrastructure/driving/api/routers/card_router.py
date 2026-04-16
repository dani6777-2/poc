from typing import List
import re
from fastapi import APIRouter, Depends, HTTPException
from core.entities.card import CardConfigEntity, CardBalanceEntity
from application.services.card_service import CardService
from infrastructure.config.dependencies import get_card_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/card", tags=["card"])

def _validate_month(month: str):
    if not re.match(r'^\d{4}-\d{2}$', month):
        raise HTTPException(status_code=422, detail="Month must be in YYYY-MM format (e.g. 2026-04)")

@router.get("/config", response_model=CardConfigEntity)
def get_config(card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    return card_service.get_config(current_user.tenant_id)

@router.put("/config")
async def update_config(data: dict, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    card_service.update_config(current_user.tenant_id, data)
    return {"ok": True}

@router.get("/balance/{month}", response_model=CardBalanceEntity)
def get_balance(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    _validate_month(month)
    return card_service.get_balance(current_user.tenant_id, month)

@router.get("/history/{month}")
def get_history(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    _validate_month(month)
    return card_service.get_history(current_user.tenant_id, month)

@router.post("/sync/{month}")
def sync_month(month: str, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    _validate_month(month)
    card_service.sync_to_debts(current_user.tenant_id, month)
    return {"ok": True, "message": f"Card from {month} synchronized to next month's Debts"}

@router.post("/monthly-state/{month}")
async def update_monthly_state(month: str, data: dict, card_service: CardService = Depends(get_card_service), current_user: models.User = Depends(get_current_user)):
    _validate_month(month)
    card_service.update_monthly_state(current_user.tenant_id, month, data)
    return {"ok": True}
