import logging
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from infrastructure.driving.api.auth import get_current_user
from application.services.report_pdf_service import ReportPdfService
from infrastructure.config.dependencies import get_report_pdf_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{month}/pdf")
def get_monthly_pdf(
    month: str,
    report_service: ReportPdfService = Depends(get_report_pdf_service),
    current_user = Depends(get_current_user)
):
    logger.info(f"PDF request received: month={month}, tenant_id={current_user.tenant_id}")
    year = int(month[:4])
    
    try:
        tenant_id = int(current_user.tenant_id)
        pdf_bytes = report_service.generate_monthly_report(tenant_id, month, year)
        
        if not isinstance(pdf_bytes, bytes):
            raise ValueError(f"Expected PDF bytes, got {type(pdf_bytes).__name__}: {pdf_bytes}")
            
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte-{month}.pdf"
        }
    )