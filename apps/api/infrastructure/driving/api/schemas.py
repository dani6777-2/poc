from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


def _validate_mes(v: str) -> str:
    try:
        datetime.strptime(v, "%Y-%m")
        return v
    except ValueError as exc:
        raise ValueError("mes debe tener formato YYYY-MM") from exc


def _validate_fecha(v: Optional[str]) -> Optional[str]:
    if v in (None, ""):
        return None
    try:
        datetime.strptime(v, "%Y-%m-%d")
        return v
    except ValueError as exc:
        raise ValueError("fecha debe tener formato YYYY-MM-DD") from exc


def _validate_required_text(v: str, field_name: str) -> str:
    text = (v or "").strip()
    if not text:
        raise ValueError(f"{field_name} no puede estar vacio")
    return text


def _validate_non_negative(v: Optional[float], field_name: str) -> Optional[float]:
    if v is None:
        return v
    if v < 0:
        raise ValueError(f"{field_name} no puede ser negativo")
    return v


# ─── ITEM (Registro) ────────────────────────────────────────────────────────

class ItemBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    mes: str
    fecha: Optional[str] = None
    nombre: str
    categoria: Optional[str] = None
    canal: Optional[str] = None
    unidad: Optional[str] = None
    cantidad: Optional[float] = 0
    precio_unit: Optional[float] = 0
    precio_mes_ant: Optional[float] = None
    estado: Optional[str] = "Planificado"
    fuente: Optional[str] = None   # 'BA:{id}' | 'BB:{id}' | None (manual)

    @field_validator("mes")
    @classmethod
    def validate_mes(cls, v: str) -> str:
        return _validate_mes(v)

    @field_validator("fecha")
    @classmethod
    def validate_fecha(cls, v: Optional[str]) -> Optional[str]:
        return _validate_fecha(v)

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v: str) -> str:
        return _validate_required_text(v, "nombre")

    @field_validator("cantidad", "precio_unit", "precio_mes_ant")
    @classmethod
    def validate_non_negative_numbers(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class ItemOut(ItemBase):
    id: int
    subtotal: float
    model_config = ConfigDict(from_attributes=True)


# ─── PRESUPUESTO ────────────────────────────────────────────────────────────

class PresupuestoBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    mes: str
    categoria: str
    presupuesto: Optional[float] = 0
    gasto_real: Optional[float] = 0

    @field_validator("mes")
    @classmethod
    def validate_mes(cls, v: str) -> str:
        return _validate_mes(v)

    @field_validator("categoria")
    @classmethod
    def validate_categoria(cls, v: str) -> str:
        return _validate_required_text(v, "categoria")

    @field_validator("presupuesto", "gasto_real")
    @classmethod
    def validate_non_negative_numbers(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class PresupuestoCreate(PresupuestoBase):
    pass

class PresupuestoOut(PresupuestoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ─── BLOQUE A ───────────────────────────────────────────────────────────────

class BloqueABase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    mes: str
    seccion: str
    nombre: str
    unidad: Optional[str] = None
    cantidad: Optional[float] = 0
    canal: Optional[str] = None
    precio_unit: Optional[float] = 0
    precio_mes_ant: Optional[float] = None

    @field_validator("mes")
    @classmethod
    def validate_mes(cls, v: str) -> str:
        return _validate_mes(v)

    @field_validator("seccion", "nombre")
    @classmethod
    def validate_required_text_fields(cls, v: str, info) -> str:
        return _validate_required_text(v, info.field_name)

    @field_validator("cantidad", "precio_unit", "precio_mes_ant")
    @classmethod
    def validate_non_negative_numbers(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class BloqueACreate(BloqueABase):
    pass

class BloqueAOut(BloqueABase):
    id: int
    subtotal: float
    model_config = ConfigDict(from_attributes=True)


# ─── BLOQUE B ───────────────────────────────────────────────────────────────

class BloqueBBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    mes: str
    seccion: str
    nombre: str
    canal: Optional[str] = None
    kg_un: Optional[str] = None
    precio_kg: Optional[float] = 0
    precio_mes_ant: Optional[float] = None

    @field_validator("mes")
    @classmethod
    def validate_mes(cls, v: str) -> str:
        return _validate_mes(v)

    @field_validator("seccion", "nombre")
    @classmethod
    def validate_required_text_fields(cls, v: str, info) -> str:
        return _validate_required_text(v, info.field_name)

    @field_validator("precio_kg", "precio_mes_ant")
    @classmethod
    def validate_non_negative_numbers(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class BloqueBCreate(BloqueBBase):
    pass

class BloqueBOut(BloqueBBase):
    id: int
    subtotal: float
    delta_precio: float
    model_config = ConfigDict(from_attributes=True)


# ─── INGRESOS ────────────────────────────────────────────────────────────────

MESES_COLS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

class IngresoBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    anio: int
    fuente: str
    orden: Optional[int] = 0
    ene: Optional[float] = 0
    feb: Optional[float] = 0
    mar: Optional[float] = 0
    abr: Optional[float] = 0
    may: Optional[float] = 0
    jun: Optional[float] = 0
    jul: Optional[float] = 0
    ago: Optional[float] = 0
    sep: Optional[float] = 0
    oct: Optional[float] = 0
    nov: Optional[float] = 0
    dic: Optional[float] = 0

    @field_validator("anio")
    @classmethod
    def validate_anio(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("anio fuera de rango permitido")
        return v

    @field_validator("fuente")
    @classmethod
    def validate_fuente(cls, v: str) -> str:
        return _validate_required_text(v, "fuente")

    @field_validator(*MESES_COLS)
    @classmethod
    def validate_month_amounts(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class IngresoCreate(IngresoBase):
    pass

class IngresoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    anio: Optional[int] = None
    fuente: Optional[str] = None
    orden: Optional[int] = None
    ene: Optional[float] = None
    feb: Optional[float] = None
    mar: Optional[float] = None
    abr: Optional[float] = None
    may: Optional[float] = None
    jun: Optional[float] = None
    jul: Optional[float] = None
    ago: Optional[float] = None
    sep: Optional[float] = None
    oct: Optional[float] = None
    nov: Optional[float] = None
    dic: Optional[float] = None

class IngresoOut(IngresoBase):
    id: int
    total_anual: float = 0
    model_config = ConfigDict(from_attributes=True)


# ─── GASTO DETALLE ───────────────────────────────────────────────────────────

MESES_PLAN = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
MESES_REAL = ['real_ene','real_feb','real_mar','real_abr','real_may','real_jun',
              'real_jul','real_ago','real_sep','real_oct','real_nov','real_dic']

class GastoDetalleBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    anio: int
    seccion: str
    concepto: str
    orden: Optional[int] = 0
    # ── Presupuesto (plan) ────────────────────
    ene: Optional[float] = 0
    feb: Optional[float] = 0
    mar: Optional[float] = 0
    abr: Optional[float] = 0
    may: Optional[float] = 0
    jun: Optional[float] = 0
    jul: Optional[float] = 0
    ago: Optional[float] = 0
    sep: Optional[float] = 0
    oct: Optional[float] = 0
    nov: Optional[float] = 0
    dic: Optional[float] = 0
    # ── Gasto Real total (efectivo + TC) ─────────────────
    real_ene: Optional[float] = 0
    real_feb: Optional[float] = 0
    real_mar: Optional[float] = 0
    real_abr: Optional[float] = 0
    real_may: Optional[float] = 0
    real_jun: Optional[float] = 0
    real_jul: Optional[float] = 0
    real_ago: Optional[float] = 0
    real_sep: Optional[float] = 0
    real_oct: Optional[float] = 0
    real_nov: Optional[float] = 0
    real_dic: Optional[float] = 0
    # ── Porción TC del gasto real (diferido al mes siguiente) ─
    real_tc_ene: Optional[float] = 0
    real_tc_feb: Optional[float] = 0
    real_tc_mar: Optional[float] = 0
    real_tc_abr: Optional[float] = 0
    real_tc_may: Optional[float] = 0
    real_tc_jun: Optional[float] = 0
    real_tc_jul: Optional[float] = 0
    real_tc_ago: Optional[float] = 0
    real_tc_sep: Optional[float] = 0
    real_tc_oct: Optional[float] = 0
    real_tc_nov: Optional[float] = 0
    real_tc_dic: Optional[float] = 0

    @field_validator("anio")
    @classmethod
    def validate_anio(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("anio fuera de rango permitido")
        return v

    @field_validator("seccion", "concepto")
    @classmethod
    def validate_required_text_fields(cls, v: str, info) -> str:
        return _validate_required_text(v, info.field_name)

    @field_validator("orden")
    @classmethod
    def validate_orden(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("orden no puede ser negativo")
        return v

    @field_validator(*MESES_PLAN, *MESES_REAL, "real_tc_ene", "real_tc_feb", "real_tc_mar", "real_tc_abr", "real_tc_may", "real_tc_jun", "real_tc_jul", "real_tc_ago", "real_tc_sep", "real_tc_oct", "real_tc_nov", "real_tc_dic")
    @classmethod
    def validate_monthly_amounts(cls, v: Optional[float], info) -> Optional[float]:
        return _validate_non_negative(v, info.field_name)

class GastoDetalleCreate(GastoDetalleBase):
    pass

class GastoDetalleOut(GastoDetalleBase):
    id: int
    total_anual: float = 0       # sum(ene...dic)     — presupuesto anual
    total_real_anual: float = 0  # sum(real_*)        — gasto real anual
    total_tc_anual: float = 0    # sum(real_tc_*)     — porción TC anual
    model_config = ConfigDict(from_attributes=True)

# -------------------------------------------------------------
# AUTH & USER
# -------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    tenant_id: int
    email: str
    tenant_name: str

class UserRegister(BaseModel):
    email: str
    password: str
    tenant_name: str

class UserLogin(BaseModel):
    email: str
    password: str



# ─── AI & ANALYTICS ──────────────────────────────────────────────────────────

class AIInsight(BaseModel):
    id: str
    tipo: str  # 'warning', 'info', 'success'
    mensaje: str
    valor: Optional[str] = None

class AIForecast(BaseModel):
    mes: str
    gasto_actual: float
    gasto_proyectado: float
    run_rate_diario: float
    ahorro_estimado: float
    ahorro_rate: float        # % de ahorro sobre ingreso
    salud_score: int          # 0-100
    kpis_detalle: dict        # {'esenciales': 0.6, 'vulnerabilidad': 0.2, etc}
    insights: list[AIInsight]
    model_config = ConfigDict(from_attributes=True)
