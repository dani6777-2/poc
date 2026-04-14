from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from application.services.ocr_app_service import OCRAppService
from infrastructure.config.dependencies import get_ocr_service
from infrastructure.driven.db import models
from infrastructure.driving.api.auth import get_current_user

router = APIRouter(prefix="/ocr", tags=["AI OCR"])

@router.post("/upload")
async def upload_invoice(
    file: UploadFile = File(...),
    service: OCRAppService = Depends(get_ocr_service),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload an invoice image and return extracted items.
    """
    content = await file.read()
    items = service.process_image(content)
    
    return {
        "items": items,
        "count": len(items),
        "message": "Items extracted successfully"
    }

@router.post("/ingest")
async def ingest_items(
    items: List[dict],
    service: OCRAppService = Depends(get_ocr_service),
    current_user: models.User = Depends(get_current_user)
):
    """
    Massively save items confirmed by the user.
    """
    try:
        count = service.ingest_items(current_user.tenant_id, items)
        return {"status": "success", "added": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
