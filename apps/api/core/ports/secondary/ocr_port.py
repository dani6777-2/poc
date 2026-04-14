from typing import List, Dict
from abc import ABC, abstractmethod

class OCRPort(ABC):
    @abstractmethod
    def process_invoice(self, content: bytes) -> List[Dict]:
        """Extrae items de una imagen de factura/boleta."""
        pass
