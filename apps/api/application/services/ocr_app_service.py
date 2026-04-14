from typing import List, Dict
from core.ports.secondary.ocr_port import OCRPort
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.entities.expenses import ItemCreateDto
from application.services.annual_expense_service import AnnualExpenseService

class OCRAppService:
    def __init__(
        self,
        ocr_port: OCRPort,
        expense_repo: ExpenseRepositoryPort,
        annual_service: AnnualExpenseService
    ):
        self.ocr_port = ocr_port
        self.expense_repo = expense_repo
        self.annual_service = annual_service

    def process_image(self, content: bytes) -> List[Dict]:
        return self.ocr_port.process_invoice(content)

    def ingest_items(self, tenant_id: int, items_data: List[Dict]) -> int:
        added_count = 0
        months_to_sync = set()
        
        for it in items_data:
            month = it.get("month")
            if month:
                months_to_sync.add(month)
                
            qty = it.get("quantity", 1)
            price = it.get("unit_price", 0)
            
            dto = ItemCreateDto(
                name=it.get("name", "OCR Item"),
                category_id=it.get("category_id"),
                channel_id=it.get("channel_id"),
                unit_id=it.get("unit_id"),
                quantity=qty,
                unit_price=price,
                month=month,
                status="Bought",
                source=it.get("source", "OCR")
            )
            self.expense_repo.create(tenant_id, dto, qty * price)
            added_count += 1
            
        # Trigger syncs for each modified month
        for m in months_to_sync:
            if m:
                year = int(m[:4])
                self.annual_service.sync_registry_to_expenses(tenant_id, year)
                self.annual_service.sync_card_to_debts_for_month(tenant_id, m)
                
        return added_count
