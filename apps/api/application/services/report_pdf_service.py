import logging
from io import BytesIO
from typing import List, Dict, Optional
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from core.entities.expenses import ItemEntity
from core.entities.revenue import RevenueEntity
from application.services.revenue_service import RevenueService
from application.services.expense_service import ExpenseService

logger = logging.getLogger(__name__)

MONTHS_NAMES = {
    "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
    "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
    "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
}
MONTHS_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]


class ReportPdfService:
    def __init__(
        self,
        expense_service: ExpenseService,
        revenue_service: RevenueService
    ):
        self.expense_service = expense_service
        self.revenue_service = revenue_service

    def generate_monthly_report(self, tenant_id: int, month: str, year: int) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=20
        )
        subtitle_style = ParagraphStyle(
            "CustomSubtitle",
            parent=styles["Heading2"],
            fontSize=12,
            alignment=TA_CENTER,
            spaceAfter=15
        )
        normal_style = styles["Normal"]
        
        month_name = MONTHS_NAMES.get(month[5:7], month)
        report_title = f"Reporte Mensual {month_name} {year}"
        story.append(Paragraph(report_title, title_style))
        
        expenses = self.expense_service.get_expenses(tenant_id, month)
        revenues = self.revenue_service.get_revenue_by_year(tenant_id, year)
        
        month_idx = int(month[5:7]) - 1
        month_key = MONTHS_KEYS[month_idx]
        
        total_income = sum(getattr(r, month_key, 0) or 0 for r in revenues)
        total_expenses = sum(e.subtotal for e in expenses)
        
        story.append(Paragraph("Ingresos", subtitle_style))
        if revenues:
            income_data = [["Fuente", "Monto"]]
            for rev in revenues:
                val = getattr(rev, month_key, 0) or 0
                if val > 0:
                    income_data.append([rev.source, f"${val:,.0f}"])
            income_data.append(["TOTAL", f"${total_income:,.0f}"])
            
            income_table = Table(income_data, colWidths=[3.5*inch, 1.5*inch])
            income_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5530")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8f5e9")),
("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(income_table)
            story.append(Spacer(1, 20))
        else:
            story.append(Paragraph("No hay ingresos registrados", normal_style))
            story.append(Spacer(1, 10))
        
        story.append(Paragraph("Gastos", subtitle_style))
        if expenses:
            expense_data = [["Categoría", "Nombre", "Monto"]]
            for exp in expenses:
                cat = exp.category_name or "Sin categoría"
                name = exp.name[:30] + "..." if len(exp.name) > 30 else exp.name
                expense_data.append([cat, name, f"${exp.subtotal:,.0f}"])
            expense_data.append(["TOTAL", "", f"${total_expenses:,.0f}"])
            
            exp_table = Table(expense_data, colWidths=[1.2*inch, 2.3*inch, 1.5*inch])
            exp_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#b71c1c")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ffebee")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(exp_table)
            story.append(Spacer(1, 20))
        else:
            story.append(Paragraph("No hay gastos registrados", normal_style))
            story.append(Spacer(1, 10))
        
        balance = total_income - total_expenses
        story.append(Paragraph("Resumen", subtitle_style))
        summary_data = [
            ["Total Ingresos", f"${total_income:,.0f}"],
            ["Total Gastos", f"${total_expenses:,.0f}"],
            ["Balance Neto", f"${balance:,.0f}"],
        ]
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#e8f5e9") if balance >= 0 else colors.HexColor("#ffebee")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(summary_table)
        
        story.append(Spacer(1, 30))
        story.append(Paragraph(f" Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()