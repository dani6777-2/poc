from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean, UniqueConstraint, event, DateTime
from sqlalchemy.orm import relationship
import datetime
from .config import Base

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    invite_code = Column(String, unique=True, nullable=True)


class TenantAccess(Base):
    __tablename__ = "tenant_access"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    role = Column(String, default="owner") # "owner" or "guest"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # Home / Primary Tenant
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="owner")

    tenants = relationship("TenantAccess", back_populates="user")

TenantAccess.user = relationship("User", back_populates="tenants")

# ─── Taxonomies (Normalization) ──────────────────────────────────────────

class TaxonomySection(Base):
    """Sections (Food, Home, etc.)"""
    __tablename__ = "taxonomy_sections"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True) 
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    color_bg = Column(String, nullable=True)
    color_accent = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)

class TaxonomyCategory(Base):
    """Categories linked to sections (Dairy, Groceries, etc.)"""
    __tablename__ = "taxonomy_categories"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True) 
    section_id = Column(Integer, ForeignKey("taxonomy_sections.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    section = relationship("TaxonomySection")

class TaxonomyChannel(Base):
    """Purchase channels (Walmart, Local Market, etc.)"""
    __tablename__ = "taxonomy_channels"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)

class TaxonomyUnit(Base):
    """Measurement units (kg, un, etc.)"""
    __tablename__ = "taxonomy_units"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)

# ─── Business Entities ───────────────────────────────────────────────────

class Item(Base):
    """Shopping registry"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    month = Column(String, nullable=False)
    date = Column(String, nullable=True)
    name = Column(String, nullable=False)
    
    category_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=True, index=True)
    channel_id = Column(Integer, ForeignKey("taxonomy_channels.id"), nullable=True, index=True)
    unit_id = Column(Integer, ForeignKey("taxonomy_units.id"), nullable=True, index=True)
    
    quantity = Column(Float, nullable=True, default=0)
    unit_price = Column(Float, nullable=True, default=0)
    subtotal = Column(Float, nullable=True, default=0)
    prev_month_price = Column(Float, nullable=True)
    status = Column(String, nullable=True, default="Planned")
    source = Column(String, nullable=True, index=True)
    payment_method = Column(String, nullable=True, default="cash")
    version_id = Column(Integer, nullable=False, default=1)

    category = relationship("TaxonomyCategory")
    channel = relationship("TaxonomyChannel")
    unit = relationship("TaxonomyUnit")

    __mapper_args__ = {
        "version_id_col": version_id
    }

class Budget(Base):
    """Monthly budget by category"""
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    month = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=False, index=True)
    budget = Column(Float, nullable=True, default=0)
    actual_spending = Column(Float, nullable=True, default=0)

    category = relationship("TaxonomyCategory")

    __table_args__ = (
        UniqueConstraint('tenant_id', 'month', 'category_id', name='uix_tenant_month_category'),
    )

class InventoryBlockA(Base):
    """Supermarket list — Pantry"""
    __tablename__ = "inventory_block_a"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    month = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    
    unit_id = Column(Integer, ForeignKey("taxonomy_units.id"), nullable=True, index=True)
    channel_id = Column(Integer, ForeignKey("taxonomy_channels.id"), nullable=True, index=True)
    
    quantity = Column(Float, nullable=True, default=0)
    unit_price = Column(Float, nullable=True, default=0)
    subtotal = Column(Float, nullable=True, default=0)
    prev_month_price = Column(Float, nullable=True)
    status = Column(String, nullable=True, default="Planned")

    category = relationship("TaxonomyCategory")
    unit = relationship("TaxonomyUnit")
    channel = relationship("TaxonomyChannel")
    version_id = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }

class InventoryBlockB(Base):
    """Fresh market list — Perishables"""
    __tablename__ = "inventory_block_b"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    month = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    
    channel_id = Column(Integer, ForeignKey("taxonomy_channels.id"), nullable=True, index=True)
    unit_id = Column(Integer, ForeignKey("taxonomy_units.id"), nullable=True, index=True)
    
    price_per_kg = Column(Float, nullable=True, default=0)
    subtotal = Column(Float, nullable=True, default=0)
    prev_month_price = Column(Float, nullable=True)
    price_delta = Column(Float, nullable=True, default=0)
    status = Column(String, nullable=True, default="Planned")

    category = relationship("TaxonomyCategory")
    channel = relationship("TaxonomyChannel")
    unit = relationship("TaxonomyUnit")
    version_id = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }

class Revenue(Base):
    __tablename__ = "revenues"
    id    = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    year  = Column(Integer, nullable=False)
    source = Column(String, nullable=False)
    sort_order  = Column(Integer, nullable=True, default=0)
    jan = Column(Float, nullable=True, default=0)
    feb = Column(Float, nullable=True, default=0)
    mar = Column(Float, nullable=True, default=0)
    apr = Column(Float, nullable=True, default=0)
    may = Column(Float, nullable=True, default=0)
    jun = Column(Float, nullable=True, default=0)
    jul = Column(Float, nullable=True, default=0)
    aug = Column(Float, nullable=True, default=0)
    sep = Column(Float, nullable=True, default=0)
    oct = Column(Float, nullable=True, default=0)
    nov = Column(Float, nullable=True, default=0)
    dec = Column(Float, nullable=True, default=0)

class ExpenseDetail(Base):
    __tablename__ = "expense_details"
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), index=True)
    year       = Column(Integer, nullable=False)
    section_id = Column(Integer, ForeignKey("taxonomy_sections.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=True, index=True)
    description   = Column(String, nullable=False)
    sort_order      = Column(Integer, nullable=True, default=0)
    is_automatic = Column(Boolean, default=False)
    
    # New structural keys & Auditability
    concept_key    = Column(String(100), nullable=True, index=True)
    concept_label  = Column(String(255), nullable=True) # Human readable normalized name
    concept_origin = Column(String(50),  nullable=False, default="manual") # 'registry' or 'manual'
    is_active      = Column(Boolean,     nullable=False, default=True) # Soft status for discontinued concepts
    
    jan = Column(Float, nullable=True, default=0)
    feb = Column(Float, nullable=True, default=0)
    mar = Column(Float, nullable=True, default=0)
    apr = Column(Float, nullable=True, default=0)
    may = Column(Float, nullable=True, default=0)
    jun = Column(Float, nullable=True, default=0)
    jul = Column(Float, nullable=True, default=0)
    aug = Column(Float, nullable=True, default=0)
    sep = Column(Float, nullable=True, default=0)
    oct = Column(Float, nullable=True, default=0)
    nov = Column(Float, nullable=True, default=0)
    dec = Column(Float, nullable=True, default=0)
    
    actual_jan = Column(Float, nullable=True, default=0)
    actual_feb = Column(Float, nullable=True, default=0)
    actual_mar = Column(Float, nullable=True, default=0)
    actual_apr = Column(Float, nullable=True, default=0)
    actual_may = Column(Float, nullable=True, default=0)
    actual_jun = Column(Float, nullable=True, default=0)
    actual_jul = Column(Float, nullable=True, default=0)
    actual_aug = Column(Float, nullable=True, default=0)
    actual_sep = Column(Float, nullable=True, default=0)
    actual_oct = Column(Float, nullable=True, default=0)
    actual_nov = Column(Float, nullable=True, default=0)
    actual_dec = Column(Float, nullable=True, default=0)
    
    actual_card_jan = Column(Float, nullable=True, default=0)
    actual_card_feb = Column(Float, nullable=True, default=0)
    actual_card_mar = Column(Float, nullable=True, default=0)
    actual_card_apr = Column(Float, nullable=True, default=0)
    actual_card_may = Column(Float, nullable=True, default=0)
    actual_card_jun = Column(Float, nullable=True, default=0)
    actual_card_jul = Column(Float, nullable=True, default=0)
    actual_card_aug = Column(Float, nullable=True, default=0)
    actual_card_sep = Column(Float, nullable=True, default=0)
    actual_card_oct = Column(Float, nullable=True, default=0)
    actual_card_nov = Column(Float, nullable=True, default=0)
    actual_card_dec = Column(Float, nullable=True, default=0)

    section = relationship("TaxonomySection")
    category = relationship("TaxonomyCategory")
    version_id = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }

    __table_args__ = (
        UniqueConstraint('tenant_id', 'year', 'section_id', 'description', name='uix_tenant_year_section_description'),
    )

@event.listens_for(ExpenseDetail, 'before_update')
def receive_expense_before_update(mapper, connection, target):
    state = target._sa_instance_state
    if 'is_automatic' in state.committed_state:
        old_val = state.committed_state['is_automatic']
        if old_val is True and target.is_automatic is False:
            raise ValueError("Architectural Invariant Violation: Cannot unset 'is_automatic' flag.")

@event.listens_for(ExpenseDetail, 'before_delete')
def receive_expense_before_delete(mapper, connection, target):
    if target.is_automatic:
        raise ValueError("Architectural Invariant Violation: Cannot delete a system-managed entity.")

class CardConfig(Base):
    __tablename__ = "card_configs"
    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(Integer, ForeignKey("tenants.id"), index=True)
    name         = Column(String, nullable=False, default="Credit Card")
    total_limit  = Column(Float,  nullable=True,  default=0)
    channel_id   = Column(Integer, ForeignKey("taxonomy_channels.id"), nullable=True)
    alert_pct    = Column(Integer, nullable=True, default=80)
    closing_day  = Column(Integer, nullable=True, default=1)
    payment_day  = Column(Integer, nullable=True, default=5)
    
    channel = relationship("TaxonomyChannel")

class CardMonthlyState(Base):
    __tablename__ = "card_monthly_states"
    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(Integer, ForeignKey("tenants.id"), index=True)
    month        = Column(String, nullable=False, index=True) # e.g. "2024-04"
    manual_payment = Column(Float, default=0.0)

    __table_args__ = (
        UniqueConstraint('tenant_id', 'month', name='uix_card_monthly_state'),
    )

class SystemHealthLog(Base):
    __tablename__ = "system_health_logs"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)
    delta = Column(Float)
    duplicate_clusters = Column(Integer)

class ReconciliationSnapshot(Base):
    __tablename__ = "reconciliation_snapshots"
    id               = Column(Integer, primary_key=True, index=True)
    tenant_id        = Column(Integer, index=True, nullable=False)
    year             = Column(Integer, index=True, nullable=False)
    timestamp        = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    affected_records = Column(Integer, default=0)
    affected_records_ids = Column(String, nullable=True) # CSV of row IDs
    before_state_json = Column(String, nullable=True)  # Serialized payload
    after_state_json  = Column(String, nullable=True)   # Serialized payload

