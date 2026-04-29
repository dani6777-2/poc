def next_month_str(month_str: str) -> str:
    """
    Calculate the next month in YYYY-MM format.
    Example: '2024-12' -> '2025-01'
    """
    year, month = int(month_str[:4]), int(month_str[5:7])
    if month == 12:
        return f"{year + 1}-01"
    return f"{year}-{str(month + 1).zfill(2)}"


def prev_month_str(month_str: str) -> str:
    """
    Calculate the previous month in YYYY-MM format.
    Example: '2025-01' -> '2024-12'
    """
    year, month = int(month_str[:4]), int(month_str[5:7])
    if month == 1:
        return f"{year - 1}-12"
    return f"{year}-{str(month - 1).zfill(2)}"