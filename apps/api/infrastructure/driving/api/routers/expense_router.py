from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from core.entities.expenses import ItemEntity, ItemCreateDto, ItemUpdateDto
from application.services.expense_service import ExpenseService
from core.exceptions import DomainException
from infrastructure.config.dependencies import get_expense_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["expenses"])


def check_idempotency(
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    db_session = None
):
    if not x_idempotency_key or not db_session:
        return None
    
    from infrastructure.driven.db.repositories.idempotency_repo import IdempotencyRepository
    repo = IdempotencyRepository(db_session)
    existing = repo.get_by_key(x_idempotency_key)
    if existing and not repo.is_expired(existing):
        return existing
    return None


@router.get("/", response_model=List[ItemEntity])
def get_expenses(month: Optional[str] = None, expense_service: ExpenseService = Depends(get_expense_service), current_user: models.User = Depends(get_current_user)):
    return expense_service.get_expenses(current_user.tenant_id, month)


@router.post("/", response_model=ItemEntity)
def create_expense(
    item: ItemCreateDto, 
    expense_service: ExpenseService = Depends(get_expense_service), 
    current_user: models.User = Depends(get_current_user),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    db_session = None
):
    from infrastructure.driven.db.config import get_db
    db = next(get_db())
    
    if x_idempotency_key:
        from infrastructure.driven.db.repositories.idempotency_repo import IdempotencyRepository
        idem_repo = IdempotencyRepository(db)
        existing = idem_repo.get_by_key(x_idempotency_key)
        if existing and not idem_repo.is_expired(existing) and existing.response_data:
            logger.info(f"Idempotency hit for key: {x_idempotency_key}")
            return json.loads(existing.response_data)
    
    try:
        result = expense_service.create_expense(current_user.tenant_id, item)
        
        if x_idempotency_key:
            from infrastructure.driven.db.repositories.idempotency_repo import IdempotencyRepository
            idem_repo = IdempotencyRepository(db)
            idem_repo.create(
                tenant_id=current_user.tenant_id,
                key=x_idempotency_key,
                endpoint="POST /expenses/",
                payload=item.model_dump(),
                response_data=json.dumps(result.model_dump(), default=str)
            )
            db.commit()
        
        return result
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
