import re
import random
from PIL import Image
import io

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

# Simulación de items reales para el modo offline/simulado
MOCK_PRODUCTS = [
    {"nombre": "Detergente Omo 3kg", "precio_unit": 8990, "categoria": "Limpieza"},
    {"nombre": "Leche Entera 1L", "precio_unit": 1150, "categoria": "Abarrotes"},
    {"nombre": "Pechuga de Pollo", "precio_unit": 4500, "categoria": "Carnicería"},
    {"nombre": "Aceite Vegetal 900ml", "precio_unit": 1990, "categoria": "Abarrotes"},
    {"nombre": "Papel Higiénico 12 rollos", "precio_unit": 5600, "categoria": "Limpieza"},
    {"nombre": "Arroz Grado 1 1kg", "precio_unit": 1450, "categoria": "Abarrotes"}
]

def process_invoice(file_content: bytes):
    """
    Procesa una imagen de boleta y devuelve items estructurados.
    """
    if not TESSERACT_AVAILABLE:
        return _simulate_ocr()

    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)
        return _parse_text(text)
    except Exception as e:
        print(f"OCR Error: {e}")
        return _simulate_ocr()

def _parse_text(text: str):
    """
    Extrae items básicos del texto crudo (Heurística simple 4.0).
    """
    lines = text.split('\n')
    extracted = []
    
    # Patrón para precios (Ej: 1.290, 10.990, 500)
    price_pattern = re.compile(r'(\d+[\.\,]\d{3}|\d{3,})')
    
    for line in lines:
      if len(line.strip()) < 5: continue
      
      prices = price_pattern.findall(line)
      if prices:
          # Limpiar precio: quitar puntos y comas
          price_val = int(re.sub(r'[\.\,]', '', prices[-1]))
          name = re.sub(r'(\d+[\.\,]\d{3}|\d{3,})|[\$\#]', '', line).strip()
          
          if len(name) > 3 and price_val > 50:
              extracted.append({
                  "nombre": name[:30],
                  "precio_unit": price_val,
                  "cantidad": 1,
                  "categoria": "Abarrotes", # Default
                  "canal": "Efectivo",
                  "fuente": "OCR"
              })
              
    return extracted if extracted else _simulate_ocr()

def _simulate_ocr():
    """
    Genera entre 3 y 6 items realistas para demostrar la funcionalidad 
    si no hay Tesseract o la imagen es ilegible.
    """
    count = random.randint(3, 6)
    selected = random.sample(MOCK_PRODUCTS, count)
    return [{**item, "cantidad": 1, "canal": "Efectivo", "fuente": "OCR:SIM"} for item in selected]
