from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
from core.entities.card import CardConfigEntity, CardTransactionEntity
from core.ports.secondary.card_repository import CardRepositoryPort, CARD_DESCRIPTION_TEMPLATE
from core.constants import REGISTRY_DESCRIPTION_PREFIX
from core.utils import next_month_str

MONTHS_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

class SQLCardRepository(CardRepositoryPort):
    def __init__(self, db: Session):
        self.db = db

    def _month_key(self, month_str: str) -> str:
        return MONTHS_KEYS[int(month_str[5:7]) - 1]

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
            cutoff_day=row.closing_day,
            payment_day=row.payment_day
        )

    def update_config(self, tenant_id: int, config: CardConfigEntity) -> CardConfigEntity:
        row = self.db.query(models.CardConfig).filter(models.CardConfig.tenant_id == tenant_id).first()
        if row:
            row.name = config.name
            row.total_limit = config.total_limit
            row.channel_id = config.channel_id
            row.alert_pct = config.alert_pct
            row.closing_day = config.cutoff_day
            row.payment_day = config.payment_day
            self.db.commit()
        return self.get_config(tenant_id)

    def get_transactions_from_registry(self, tenant_id: int, month: str, channel_id: Optional[int], limit: int = 100, offset: int = 0) -> List[CardTransactionEntity]:
        from sqlalchemy import or_
        conditions = [
            models.Item.tenant_id == tenant_id,
            models.Item.month == month,
            models.Item.status == "Bought",
        ]
        # Include if: payment_method is 'credit' OR channel matches the configured CC channel
        if channel_id:
            conditions.append(or_(
                models.Item.payment_method == "credit",
                models.Item.channel_id == channel_id
            ))
        else:
            conditions.append(models.Item.payment_method == "credit")

        rows = self.db.query(models.Item).filter(*conditions).offset(offset).limit(limit).all()
        return [
            CardTransactionEntity(
                name=f"🛒 {r.name}",
                subtotal=r.subtotal or 0,
                date=r.date or f"{month}-01"
            )
            for r in rows
        ]

    def get_manual_tc_expenses_from_annual(self, tenant_id: int, month: str, limit: int = 100, offset: int = 0) -> List[CardTransactionEntity]:
        year = int(month[:4])
        mk   = self._month_key(month)
        actual_card_mk = f"actual_card_{mk}"
        
        rows = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year == year
        ).outerjoin(models.TaxonomySection, models.ExpenseDetail.section_id == models.TaxonomySection.id).offset(offset).limit(limit).all()
        
        tx_gs = []
        for r in rows:
            val = getattr(r, actual_card_mk) or 0
            if val > 0 and hasattr(r, 'description') and r.description:
                if r.description.startswith(REGISTRY_DESCRIPTION_PREFIX): # Hardcoded prefix check to avoid circular import of constants
                    continue
                
                sec_icon = r.section.icon + " " if (r.section and r.section.icon) else "🏷️ "
                
                tx_gs.append(CardTransactionEntity(
                    name=f"{sec_icon}{r.description} (Annual Expenses)",
                    subtotal=val,
                    date=f"{month}-01"
                ))
        return tx_gs

    def sync_to_deudas_next_month(self, tenant_id: int, month: str, card_name: str, total_used: float) -> dict:
        import logging
        logger = logging.getLogger(__name__)
        
        next_month_calc = next_month_str(month)
        next_year = int(next_month_calc[:4])
        next_mk = self._month_key(next_month_calc)
        actual_next_mk = f"actual_{next_mk}"
        description_name = CARD_DESCRIPTION_TEMPLATE.format(name=card_name)

        sec_debts = self.db.query(models.TaxonomySection).filter(models.TaxonomySection.name == "Debts").first()
        if not sec_debts:
            sec_debts = models.TaxonomySection(name="Debts", icon="💳", sort_order=0)
            self.db.add(sec_debts)
            self.db.commit()
            self.db.refresh(sec_debts)
            logger.warning(f"Auto-created missing 'Debts' section for tenant {tenant_id}")

        row = self.db.query(models.ExpenseDetail).filter(
            models.ExpenseDetail.tenant_id == tenant_id,
            models.ExpenseDetail.year     == next_year,
            models.ExpenseDetail.section_id == sec_debts.id,
            models.ExpenseDetail.description == description_name
        ).first()

        if total_used <= 0:
            if row:
                self.db.delete(row)
                self.db.commit()
                logger.info(f"Deleted card debt for {next_month_calc} as total_used is {total_used}")
                return {"status": "cleared", "reason": "deleted", "month": next_month_calc}
            logger.debug(f"Skipping sync: no debt to carry over (used={total_used})")
            return {"status": "skipped", "reason": "no_debt"}
        
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
        setattr(row, actual_next_mk, val)
        self.db.commit()
        
        logger.info(f"Synced card debt {val} from {month} to {next_month_calc} ({description_name})")
        return {"status": "synced", "month": next_month_calc, "amount": val}

    def get_monthly_state(self, tenant_id: int, month: str) -> Optional[dict]:
        row = self.db.query(models.CardMonthlyState).filter_by(tenant_id=tenant_id, month=month).first()
        if not row: return None
        return {"manual_payment": row.manual_payment}

    def update_monthly_state(self, tenant_id: int, month: str, data: dict) -> None:
        row = self.db.query(models.CardMonthlyState).filter_by(tenant_id=tenant_id, month=month).first()
        if not row:
            row = models.CardMonthlyState(tenant_id=tenant_id, month=month)
            self.db.add(row)
        
        if "manual_payment" in data:
            row.manual_payment = data["manual_payment"]
        
        self.db.commit()
