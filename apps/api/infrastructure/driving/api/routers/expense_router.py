from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from core.entities.expenses import ItemEntity, ItemCreateDto, ItemUpdateDto
from application.services.expense_service import ExpenseService
from core.exceptions import DomainException
from infrastructure.config.dependencies import get_expense_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("/", response_model=List[ItemEntity])
def get_expenses(month: Optional[str] = None, expense_service: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user)):
    return expense_service.get_expenses(current_user.tenant_id, month)

@router.post("/", response_model=ItemEntity)
def create_expense(item: ItemCreateDto, expense_service: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user)):
    try:
        return expense_service.create_expense(current_user.tenant_id, item)
    except DomainException as e:
        if "DUPLICATE_409" in str(e.message):
            raise HTTPException(status_code=409, detail=str(e.message))
        raise HTTPException(status_code=400, detail=str(e.message))

@router.put("/{item_id}", response_model=ItemEntity)
def update_expense(item_id: int, item: ItemUpdateDto, expense_service: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user)):
    try:
        return expense_service.update_expense(current_user.tenant_id, item_id, item)
    except DomainException as e:
        status = 404 if "not found" in str(e.message).lower() else 400
        if "CONFLICT_409" in str(e.message):
            status = 409
        raise HTTPException(status_code=status, detail=str(e.message))

@router.delete("/{item_id}")
def delete_expense(item_id: int, expense_service: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user)):
    try:
        expense_service.delete_expense(current_user.tenant_id, item_id)
        return {"ok": True}
    except DomainException as e:
        status = 404 if "not found" in str(e.message).lower() else 400
        if "CONFLICT_409" in str(e.message):
            status = 409
        raise HTTPException(status_code=status, detail=str(e.message))
