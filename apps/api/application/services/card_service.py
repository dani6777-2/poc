from typing import List
from core.entities.card import CardConfigEntity, CardBalanceEntity, CardTransactionEntity
from core.ports.secondary.card_repository import CardRepositoryPort

class CardService:
    def __init__(self, card_repo: CardRepositoryPort):
        self.card_repo = card_repo

    def _next_month_str(self, month_str: str) -> str:
        year, month = int(month_str[:4]), int(month_str[5:7])
        if month == 12:
            return f"{year + 1}-01"
        return f"{year}-{str(month + 1).zfill(2)}"

    def get_config(self, tenant_id: int) -> CardConfigEntity:
        return self.card_repo.get_config(tenant_id)

    def update_config(self, tenant_id: int, config_data: dict) -> CardConfigEntity:
        # Get existing first to merge
        existing = self.card_repo.get_config(tenant_id)
        for k, v in config_data.items():
            if hasattr(existing, k) and k != "id":
                setattr(existing, k, v)
        return self.card_repo.update_config(tenant_id, existing)

    def get_balance(self, tenant_id: int, month: str) -> CardBalanceEntity:
        config = self.card_repo.get_config(tenant_id)
        
        if not config.total_limit or config.total_limit == 0:
            return self._empty_balance(config, month)

        # Transactions from Annual Expenses (manual actual_card_*)
        transactions = self.card_repo.get_manual_tc_expenses_from_annual(tenant_id, month)
        
        used = sum(t.subtotal for t in transactions)
        
        limit = config.total_limit
        available = limit - used
        pct_used = round(used / limit * 100, 1) if limit > 0 else 0
        alert_pct = config.alert_pct
        
        return CardBalanceEntity(
            name=config.name,
            channel_name=config.channel_name,
            total_limit=limit,
            used=round(used, 0),
            available=round(available, 0),
            pct_used=pct_used,
            alert=pct_used >= alert_pct and limit > 0,
            critical=pct_used >= 100 and limit > 0,
            alert_pct=alert_pct,
            n_transactions=len(transactions),
            transactions=sorted(transactions, key=lambda x: x.date, reverse=True),
            is_configured=limit > 0,
            cutoff_day=config.cutoff_day,
            payment_day=config.payment_day,
            next_cutoff=f"{month}-{str(config.cutoff_day).zfill(2)}",
            next_payment=f"{self._next_month_str(month)}-{str(config.payment_day).zfill(2)}",
        )

    def _empty_balance(self, config: CardConfigEntity, month: str) -> CardBalanceEntity:
        return CardBalanceEntity(
            name=config.name, channel_name=config.channel_name,
            total_limit=0.0, used=0.0, available=0.0,
            pct_used=0.0, alert=False, critical=False,
            alert_pct=config.alert_pct,
            n_transactions=0, transactions=[], is_configured=False,
            cutoff_day=config.cutoff_day, payment_day=config.payment_day,
            next_cutoff=f"{month}-{str(config.cutoff_day).zfill(2)}",
            next_payment=f"{self._next_month_str(month)}-{str(config.payment_day).zfill(2)}"
        )

    def sync_to_debts(self, tenant_id: int, month: str) -> None:
        balance = self.get_balance(tenant_id, month)
        if not balance.is_configured:
            return
        
        self.card_repo.sync_to_deudas_next_month(
            tenant_id=tenant_id,
            month=month,
            card_name=balance.name,
            total_used=balance.used
        )

    def get_history(self, tenant_id: int, month: str) -> List[dict]:
        history = []
        cur = month
        for _ in range(6):
            bal = self.get_balance(tenant_id, cur)
            # Flatten to dict for backward compat if needed or use entity
            history.append({"month": cur, **bal.model_dump()})
            # Regression month
            year, month_int = int(cur[:4]), int(cur[5:7])
            if month_int == 1:
                cur = f"{year - 1}-12"
            else:
                cur = f"{year}-{str(month_int - 1).zfill(2)}"
        return history
