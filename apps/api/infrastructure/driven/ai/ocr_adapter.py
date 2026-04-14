from typing import List, Dict
from core.ports.secondary.ocr_port import OCRPort
from .ocr_service import process_invoice

class LegacyOCRAdapter(OCRPort):
    def process_invoice(self, content: bytes) -> List[Dict]:
        # Wraps existing logic in services/ocr_service.py
        return process_invoice(content)
