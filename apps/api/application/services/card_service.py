from typing import List
from core.entities.card import CardConfigEntity, CardBalanceEntity, CardTransactionEntity
from core.ports.secondary.card_repository import CardRepositoryPort
from core.utils import next_month_str

class CardService:
    def __init__(self, card_repo: CardRepositoryPort):
        self.card_repo = card_repo

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

        # Source 1: Manual entries in Annual Expenses (actual_card_* columns)
        transactions_annual = self.card_repo.get_manual_tc_expenses_from_annual(tenant_id, month)
        
        # Source 2: Registry purchases made via the CC channel (Shopping Center)
        transactions_registry = self.card_repo.get_transactions_from_registry(
            tenant_id, month, config.channel_id
        )
        
        # Merge both sources
        all_transactions = transactions_annual + transactions_registry
        used = sum(t.subtotal for t in all_transactions)
        
        # Monthly state (Manual payment / prev month debt)
        m_state = self.card_repo.get_monthly_state(tenant_id, month)
        man_pay = m_state.get("manual_payment", 0.0) if m_state else 0.0

        limit = config.total_limit
        available = limit - used
        pct_used = round(used / limit * 100, 1) if limit > 0 else 0
        alert_pct = config.alert_pct
        
        return CardBalanceEntity(
            name=config.name,
            channel_name=config.channel_name,
            total_limit=limit,
            used=round(used, 0),
            manual_payment=man_pay,
            net_debt=round(max(0.0, used - man_pay), 0),
            available=round(available, 0),
            pct_used=pct_used,
            alert=pct_used >= alert_pct and limit > 0,
            critical=pct_used >= 100 and limit > 0,
            alert_pct=alert_pct,
            n_transactions=len(all_transactions),
            transactions=sorted(all_transactions, key=lambda x: x.date, reverse=True),
            is_configured=limit > 0,
            cutoff_day=config.cutoff_day,
            payment_day=config.payment_day,
            next_closing=f"{month}-{str(config.cutoff_day).zfill(2)}",
            next_payment=f"{next_month_str(month)}-{str(config.payment_day).zfill(2)}",
        )

    def update_monthly_state(self, tenant_id: int, month: str, data: dict) -> None:
        self.card_repo.update_monthly_state(tenant_id, month, data)

    def _empty_balance(self, config: CardConfigEntity, month: str) -> CardBalanceEntity:
        return CardBalanceEntity(
            name=config.name, channel_name=config.channel_name,
            total_limit=0.0, used=0.0, available=0.0,
            pct_used=0.0, alert=False, critical=False,
            alert_pct=config.alert_pct,
            n_transactions=0, transactions=[], is_configured=False,
            cutoff_day=config.cutoff_day, payment_day=config.payment_day,
            next_closing=f"{month}-{str(config.cutoff_day).zfill(2)}",
            next_payment=f"{next_month_str(month)}-{str(config.payment_day).zfill(2)}"
        )

    def sync_to_debts(self, tenant_id: int, month: str) -> dict:
        balance = self.get_balance(tenant_id, month)
        if not balance.is_configured:
            return {"status": "skipped", "reason": "not_configured"}
        
        if balance.used <= 0:
            return {"status": "skipped", "reason": "no_debt"}
        
        return self.card_repo.sync_to_deudas_next_month(
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
