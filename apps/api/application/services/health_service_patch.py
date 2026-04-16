import re

with open("/Users/PERSONAL/Documents/poc/apps/api/application/services/health_service.py", "r") as f:
    text = f.read()

pattern_rules = re.compile(r'RULES = \{.*?\n\}', re.DOTALL)
pattern_groups = re.compile(r'GROUPS = \{.*?\n\}', re.DOTALL)

new_rules = """RULES = {
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
}"""

new_groups = """GROUPS = {
    "needs": {"sections": ["Servicios y Gastos Fijos", "Comida y Despensa", "Salud y Cuidado", "Transporte y Movilidad", "Hogar y Vivienda"], "meta": 50, "label": "Needs", "icon": "🏠"},
    "lifestyle": {"sections": ["Mascotas", "Citas con mi gatito", "Ocio y Entretenimiento", "Compras Personales", "Educación y Cursos"], "meta": 30, "label": "Lifestyle", "icon": "🎭"},
    "debts": {"sections": ["Pago de Deudas"], "meta": 15, "label": "Debts", "icon": "💳"},
    "savings": {"sections": ["Ahorro e Inversión"], "meta": 20, "label": "Savings", "icon": "🏦"},
}"""

text = pattern_rules.sub(new_rules, text)
text = pattern_groups.sub(new_groups, text)

with open("/Users/PERSONAL/Documents/poc/apps/api/application/services/health_service.py", "w") as f:
    f.write(text)
