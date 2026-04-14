from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.card import CardConfigEntity, CardTransactionEntity
from core.ports.secondary.card_repository import CardRepositoryPort, CARD_DESCRIPTION_TEMPLATE

MONTHS_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

class SQLCardRepository(CardRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def _month_key(self, month_str: str) -> str:
        return MONTHS_KEYS[int(month_str[5:7]) - 1]

    def _next_month_str(self, month_str: str) -> str:
        year, month = int(month_str[:4]), int(month_str[5:7])
        if month == 12:
            return f"{year + 1}-01"
        return f"{year}-{str(month + 1).zfill(2)}"

    def get_config(self, tenant_id: int) -> CardConfigEntity:
        row = self.db.query(models.CardConfig).filter(models.CardConfig.tenant_id == tenant_id).first()
        if not row:
            row = models.CardConfig(tenant_id=tenant_id)
            self.db.add(row)
            self.db.commit()
            self.db.refresh(row)
        
        return CardConfigEntity(
            id=row.id,
            tenant_id=row.tenant_id,
            name=row.name,
            total_limit=row.total_limit,
            channel_id=row.channel_id,
            channel_name=row.channel.name if row.channel else None,
            alert_pct=row.alert_pct,
            closing_day=row.closing_day,
            payment_day=row.payment_day
        )

    def update_config(self, tenant_id: int, config: CardConfigEntity) -> CardConfigEntity:
        row = self.db.query(models.CardConfig).filter(models.CardConfig.tenant_id == tenant_id).first()
        if row:
            row.name = config.name
            row.total_limit = config.total_limit
            row.channel_id = config.channel_id
            row.alert_pct = config.alert_pct
            row.closing_day = config.closing_day
            row.payment_day = config.payment_day
            self.db.commit()
        return self.get_config(tenant_id)

    def get_transactions_from_registry(self, tenant_id: int, month: str, channel_id: Optional[int]) -> List[CardTransactionEntity]:
        if not channel_id:
            return []
            
        rows = self.db.query(models.Item).filter(
            models.Item.tenant_id == tenant_id,
            models.Item.month    == month,
            models.Item.status   == "Bought",
            models.Item.channel_id == channel_id
        ).all()
        return [CardTransactionEntity(name=r.name, subtotal=r.subtotal, date=r.date) for r in rows]

    def get_manual_tc_expenses_from_annual(self, tenant_id: int, month: str) -> List[CardTransactionEntity]:
        year = int(month[:4])
        mk   = self._month_key(month)
        actual_card_mk = f"actual_card_{mk}"
        
        rows = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year == year
        ).outerjoin(models.TaxonomySection, models.ExpenseDetail.section_id == models.TaxonomySection.id).all()
        
        AUTO_PREFIXES = ('📝 Registry:', '💳 Card:', '🛒 Supermarket')
        tx_gs = []
        for r in rows:
            val = getattr(r, actual_card_mk) or 0
            if val > 0 and hasattr(r, 'description') and r.description and not any(r.description.startswith(p) for p in AUTO_PREFIXES):
                sec_icon = r.section.icon + " " if (r.section and r.section.icon) else "🏷️ "
                
                tx_gs.append(CardTransactionEntity(
                    name=f"{sec_icon}{r.description} (Annual Expenses)",
                    subtotal=val,
                    date=f"{month}-01"
                ))
        return tx_gs

    def sync_to_deudas_next_month(self, tenant_id: int, month: str, card_name: str, total_used: float) -> None:
        next_month_str = self._next_month_str(month)
        next_year = int(next_month_str[:4])
        next_mk = self._month_key(next_month_str)
        actual_next_mk = f"actual_{next_mk}"
        description_name = CARD_DESCRIPTION_TEMPLATE.format(name=card_name)

        # Search for "Debts" section
        sec_debts = self.db.query(models.TaxonomySection).filter(models.TaxonomySection.name == "Debts").first()
        if not sec_debts:
            return

        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year     == next_year,
            models.ExpenseDetail.section_id == sec_debts.id,
            models.ExpenseDetail.description == description_name
        ).first()

        if not row:
            row = models.ExpenseDetail(
                tenant_id=tenant_id,
                year=next_year, 
                section_id=sec_debts.id,
                description=description_name, 
                sort_order=0
            )
            self.db.add(row)

        val = round(total_used, 0)
        setattr(row, next_mk, val)
        setattr(row, actual_next_mk, val)
        self.db.commit()
