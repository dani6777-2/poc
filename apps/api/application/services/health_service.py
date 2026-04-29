
from core.entities.health import (
    HealthResponse, SectionAlert, Group503020, CardAlert
)
from core.ports.secondary.expense_repository import ExpenseRepositoryPort
from core.ports.secondary.revenue_repository import RevenueRepositoryPort
from core.ports.secondary.annual_expense_repository import AnnualExpenseRepositoryPort
from core.ports.secondary.card_repository import CardRepositoryPort
from core.constants import MONTHS_KEYS, AUTO_PREFIXES

RULES = {
    # ── Needs (50%) ──
    "Servicios y Gastos Fijos": {
        "max_ok": 30, "max_warning": 40, "icon": "📄", "group": "needs",
        "advice_ok": "Gastos fijos controlados ✓",
        "advice_warning": "Gastos fijos altos — revisa recibos y suscripciones",
        "advice_danger": "Crítico: Más del 40% en compromisos fijos destruye tu ahorro",
        "reference": "Recomendado: Máx 30% del ingreso",
    },
    "Comida y Despensa": {
        "max_ok": 15, "max_warning": 22, "icon": "🛒", "group": "needs",
        "advice_ok": "Inversión en alimentación saludable ✓",
        "advice_warning": "Altos gastos en comida — planifica con listas semanales",
        "advice_danger": "Alimentación crítica: Supera el 22% de ingresos",
        "reference": "Recomendado: 10–15% del ingreso",
    },
    "Transporte y Movilidad": {
        "max_ok": 12, "max_warning": 18, "icon": "🚗", "group": "needs",
        "advice_ok": "Transporte en rango óptimo ✓",
        "advice_warning": "Altos costos en transporte — evalúa alternativas de movilidad",
        "advice_danger": "Transporte crítico: Más de 18% del ingreso",
        "reference": "Recomendado: Máx 12% del ingreso",
    },
    "Salud y Cuidado": {
        "max_ok": 8, "max_warning": 12, "icon": "⚕️", "group": "needs",
        "advice_ok": "Gasto razonable en salud ✓",
        "advice_warning": "Gastos médicos altos — revisa tus planes de salud actuales",
        "advice_danger": "Salud en alerta: Supera el 12% del ingreso",
        "reference": "Recomendado: Máx 8% del ingreso",
    },
    "Hogar y Vivienda": {
        "max_ok": 20, "max_warning": 30, "icon": "🏠", "group": "needs",
        "advice_ok": "Mantenimiento residencial adecuado ✓",
        "advice_warning": "Alto gasto en vivienda — vigila de cerca los arreglos",
        "advice_danger": "Vivienda crítica: Supera el 30% de tus ingresos",
        "reference": "Recomendado: Máx 20% del ingreso",
    },

    # ── Debts/Savings (20%) ──
    "Pago de Deudas": {
        "max_ok": 15, "max_warning": 25, "icon": "💳", "group": "debts",
        "advice_ok": "Deudas bajo control ✓",
        "advice_warning": "Apalancamiento al límite — suspende uso de crédito",
        "advice_danger": "Riesgo de sobreendeudamiento permanente detectado",
        "reference": "Recomendado: Máx 15% del ingreso",
    },
    "Ahorro e Inversión": {
        "min_ok": 20, "min_warning": 10, "icon": "📈", "group": "savings", "invert": True,
        "advice_ok": "Construyendo capital futuro ✓",
        "advice_warning": "Debes inyectar al menos 10% mensual",
        "advice_danger": "Alerta estratégica: No estás construyendo riqueza",
        "reference": "Recomendado: Mínimo 20%",
    },

    # ── Lifestyle (30%) ──
    "Mascotas": {
        "max_ok": 5, "max_warning": 10, "icon": "🐾", "group": "lifestyle",
        "advice_ok": "Mascotas felices y presupuesto sano ✓",
        "advice_warning": "Gasto en mascotas elevado — optimiza sus insumos regulares",
        "advice_danger": "Mascotas críticas: Superan el 10% del presupuesto mensual",
        "reference": "Recomendado: 3–5% del ingreso",
    },
    "Citas con mi gatito": {
        "max_ok": 10, "max_warning": 15, "icon": "😻", "group": "lifestyle",
        "advice_ok": "Disfrute romántico presupuestado ✓",
        "advice_warning": "Salidas en pareja encareciéndose",
        "advice_danger": "Presupuesto amoroso crítico: Evaluar alternativas más económicas",
        "reference": "Recomendado: Máx 10% del ingreso",
    },
    "Ocio y Entretenimiento": {
        "max_ok": 10, "max_warning": 15, "icon": "🍿", "group": "lifestyle",
        "advice_ok": "Presupuesto de ocio en rango ideal ✓",
        "advice_warning": "Gastos superfluos altos — modera las salidas y delivery",
        "advice_danger": "Ocio crítico: Supera el 15% de los ingresos",
        "reference": "Recomendado: Máx 10% del ingreso",
    },
    "Compras Personales": {
        "max_ok": 5, "max_warning": 10, "icon": "🛍️", "group": "lifestyle",
        "advice_ok": "Compras equilibradas ✓",
        "advice_warning": "Consumismo elevado temporalmente",
        "advice_danger": "Compras críticas: Compras compulsivas detectadas",
        "reference": "Recomendado: Máx 5% del ingreso",
    },
    "Educación y Cursos": {
        "max_ok": 5, "max_warning": 10, "icon": "📚", "group": "lifestyle",
        "advice_ok": "Inversión educativa constante ✓",
        "advice_warning": "Gasto formativo subiendo — revisa suscripciones",
        "advice_danger": "Educación crítica: Supera el 10% del ingreso mensual",
        "reference": "Recomendado: Máx 5% del ingreso",
    }
}

GROUPS = {
    "needs": {"sections": ["Servicios y Gastos Fijos", "Comida y Despensa", "Salud y Cuidado", "Transporte y Movilidad", "Hogar y Vivienda"], "meta": 50, "label": "Needs", "icon": "🏠"},
    "lifestyle": {"sections": ["Mascotas", "Citas con mi gatito", "Ocio y Entretenimiento", "Compras Personales", "Educación y Cursos"], "meta": 30, "label": "Lifestyle", "icon": "🎭"},
    "debts": {"sections": ["Pago de Deudas"], "meta": 15, "label": "Debts", "icon": "💳"},
    "savings": {"sections": ["Ahorro e Inversión"], "meta": 20, "label": "Savings", "icon": "🏦"},
}

class HealthService:
    def __init__(
        self,
        expense_repo: ExpenseRepositoryPort,
        revenue_repo: RevenueRepositoryPort,
        annual_repo: AnnualExpenseRepositoryPort,
        card_repo: CardRepositoryPort
    ):
        self.expense_repo = expense_repo
        self.revenue_repo = revenue_repo
        self.annual_repo = annual_repo
        self.card_repo = card_repo

    def _month_key(self, month: str) -> str:
        return MONTHS_KEYS[int(month[5:7]) - 1]

    def _get_level(self, pct: float, rule: dict) -> str:
        if rule.get("invert"):
            if pct >= rule["min_ok"]: return "ok"
            if pct >= rule["min_warning"]: return "warning"
            return "danger"
        else:
            if pct <= rule["max_ok"]: return "ok"
            if pct <= rule["max_warning"]: return "warning"
            return "danger"

    def _level_score(self, level: str) -> int:
        return {"ok": 100, "warning": 50, "danger": 0, "no_data": 0}.get(level, 0)

    def get_health(self, tenant_id: int, month: str) -> HealthResponse:
        year = int(month[:4])
        mk = self._month_key(month)
        
        revenues = self.revenue_repo.get_all_by_year(tenant_id, year)
        total_revenue = sum(getattr(r, mk) or 0 for r in revenues)
        no_revenue = total_revenue == 0
        base_inc = total_revenue if not no_revenue else None

        card_config = self.card_repo.get_config(tenant_id)
        card_channel_id = card_config.channel_id if card_config and (card_config.total_limit or 0) > 0 else None

        items = self.expense_repo.get_all(tenant_id, month)
        bought_items = [i for i in items if i.status == "Bought"]
        
        card_items = [i for i in bought_items if card_channel_id and i.channel_id == card_channel_id]
        cash_items = [i for i in bought_items if not (card_channel_id and i.channel_id == card_channel_id)]
        
        card_expense_reg = sum(i.subtotal or 0 for i in card_items)
        cash_expense_reg = sum(i.subtotal or 0 for i in cash_items)

        annuals = self.annual_repo.get_all_by_year(tenant_id, year)
        actual_mk = f"actual_{mk}"
        actual_card_mk = f"actual_card_{mk}"
        
        section_planned: dict = {}
        section_actual: dict = {}
        card_expense_gs = 0
        cash_expense_gs = 0
        auto_card_pay = 0
        
        for r in annuals:
            plan_v = getattr(r, mk) or 0
            actual_v = getattr(r, actual_mk) or 0
            actual_card = getattr(r, actual_card_mk) or 0
            
            sec_name = r.section_name or "Various"
            is_card_pay = r.description and r.description.startswith('💳 Card:')
            
            section_planned[sec_name] = section_planned.get(sec_name, 0) + plan_v
            if not is_card_pay:
                section_actual[sec_name] = section_actual.get(sec_name, 0) + actual_v
            else:
                auto_card_pay += actual_v
            
            if r.description and not any(r.description.startswith(p) for p in AUTO_PREFIXES):
                card_expense_gs += actual_card
                cash_expense_gs += (actual_v - actual_card)

        total_cash_expense = cash_expense_reg + cash_expense_gs + auto_card_pay
        total_card_expense = card_expense_reg + card_expense_gs

        section_alerts = []
        scores = []
        for sec, rule in RULES.items():
            expense = section_actual.get(sec, 0) if section_actual.get(sec, 0) > 0 else section_planned.get(sec, 0)
            pct = round(expense / base_inc * 100, 1) if base_inc and base_inc > 0 and expense > 0 else None
            level = self._get_level(pct, rule) if pct is not None else "no_data"
            scores.append(self._level_score(level))
            
            section_alerts.append(SectionAlert(
                section=sec, icon=rule["icon"], expense=round(expense, 0),
                pct_income=pct, level=level, advice=rule.get(f"advice_{level}", ""),
                reference=rule["reference"], max_ok=rule.get("max_ok"),
                max_warning=rule.get("max_warning"), min_ok=rule.get("min_ok"),
                min_warning=rule.get("min_warning"), invert=rule.get("invert", False),
                group=rule.get("group")
            ))

        rule_50_30_20 = {}
        for k, cfg in GROUPS.items():
            total_g = sum((section_actual.get(s, 0) or section_planned.get(s, 0)) for s in cfg["sections"])
            pct_g = round(total_g / base_inc * 100, 1) if base_inc and base_inc > 0 else None
            goal = cfg["meta"]
            if pct_g is None: level_g = "no_data"
            elif k == "savings": level_g = "ok" if pct_g >= goal else ("warning" if pct_g >= goal*0.5 else "danger")
            else: level_g = "ok" if pct_g <= goal else ("warning" if pct_g <= goal*1.25 else "danger")
            
            rule_50_30_20[k] = Group503020(
                label=cfg["label"], icon=cfg["icon"], meta=goal, total=round(total_g, 0),
                pct=pct_g, level=level_g, sections=cfg["sections"]
            )

        card_alert = None
        if card_config and (card_config.total_limit or 0) > 0:
            card_pct = round(total_card_expense / card_config.total_limit * 100, 1) if card_config.total_limit > 0 else 0
            alert_threshold = card_config.alert_pct or 70
            tc_level = "ok" if card_pct <= alert_threshold else ("warning" if card_pct <= 90 else "danger")
            advice_map = {
                "ok": "Credit card usage under control ✓",
                "warning": f"Card usage at {card_pct}% — approaching limit",
                "danger": f"Critical: Card at {card_pct}% — over safe threshold"
            }
            card_alert = CardAlert(
                name=card_config.name or "Credit Card",
                channel_name=card_config.channel_name or "Not Linked",
                total_limit=card_config.total_limit, used=round(total_card_expense, 0),
                available=round(card_config.total_limit - total_card_expense, 0),
                pct_used=card_pct, level=tc_level, advice=advice_map.get(tc_level, ""),
                reference=f"Alert set at {alert_threshold}%", n_transactions=len(card_items),
                note="Tracked separately — deducted only via manual settlement"
            )
            scores.append(self._level_score(tc_level))

        global_score = round(sum(scores) / len(scores)) if scores and not no_revenue else 0
        global_level = "ok" if global_score >= 80 else ("warning" if global_score >= 55 else "danger")
        if no_revenue and (total_cash_expense + total_card_expense) == 0:
            global_level = "no_data"
        active_alerts_list = [a for a in section_alerts if a.level in ("warning", "danger")]

        return HealthResponse(
            month=month, total_revenue=round(total_revenue, 0), no_revenue=no_revenue,
            global_score=global_score, global_level=global_level,
            sections=section_alerts, rule_50_30_20=rule_50_30_20,
            card=card_alert, active_alerts=len(active_alerts_list),
            alerts_summary=active_alerts_list[:3],
            cash_expense=round(total_cash_expense, 0),
            card_expense_month=round(card_expense_reg, 0),
            card_expense_annuals=round(card_expense_gs, 0),
            total_card_expense=round(total_card_expense, 0),
            cash_balance=round(total_revenue - total_cash_expense, 0) if not no_revenue else None,
            projected_balance=round(total_revenue - total_cash_expense - total_card_expense, 0) if not no_revenue else None
        )
