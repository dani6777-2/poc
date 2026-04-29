"""
Shared financial system constants.
Import from here — do NOT redefine locally in services.
"""

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
MONTHS_KEYS = MONTHS  # alias used by some services
ACTUAL_MONTHS = [f"actual_{m}" for m in MONTHS]
CARD_MONTHS = [f"actual_card_{m}" for m in MONTHS]

REGISTRY_DESCRIPTION_PREFIX = "📝 Registry: "
CARD_DESCRIPTION_PREFIX = "💳 Card:"

# Prefixes used by auto-generated rows — manual rows must NOT start with these
AUTO_PREFIXES = (REGISTRY_DESCRIPTION_PREFIX, CARD_DESCRIPTION_PREFIX)

# Expense status constants
STATUS_PLANNED = "Planned"
STATUS_BOUGHT = "Bought"

# Payment method constants
PAYMENT_CASH = "cash"
PAYMENT_CREDIT = "credit"

# Inventory sources
INVENTORY_BLOCK_A = "BA:"
INVENTORY_BLOCK_B = "BB:"
