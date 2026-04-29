"""add granular expense tracking and concept auditing

Revision ID: 8f90a2b5e0c1
Revises: 54cff865a82f
Create Date: 2026-04-24 10:44:26.340671

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f90a2b5e0c1'
down_revision: Union[str, None] = '54cff865a82f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adding columns to expense_details for granular tracking
    op.add_column('expense_details', sa.Column('concept_key', sa.String(length=100), nullable=True))
    op.add_column('expense_details', sa.Column('concept_label', sa.String(length=255), nullable=True))
    op.add_column('expense_details', sa.Column('concept_origin', sa.String(length=50), server_default='manual', nullable=False))
    op.add_column('expense_details', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    
    # Create index for concept_key
    op.create_index(op.f('ix_expense_details_concept_key'), 'expense_details', ['concept_key'], unique=False)

    # Refine reconciliation_snapshots schema for parity
    op.alter_column('reconciliation_snapshots', 'tenant_id', existing_type=sa.Integer(), nullable=False)
    op.alter_column('reconciliation_snapshots', 'year', existing_type=sa.Integer(), nullable=False)
    op.create_index(op.f('ix_reconciliation_snapshots_timestamp'), 'reconciliation_snapshots', ['timestamp'], unique=False)
    op.create_index(op.f('ix_reconciliation_snapshots_year'), 'reconciliation_snapshots', ['year'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reconciliation_snapshots_year'), table_name='reconciliation_snapshots')
    op.drop_index(op.f('ix_reconciliation_snapshots_timestamp'), table_name='reconciliation_snapshots')
    op.alter_column('reconciliation_snapshots', 'year', existing_type=sa.Integer(), nullable=True)
    op.alter_column('reconciliation_snapshots', 'tenant_id', existing_type=sa.Integer(), nullable=True)
    
    op.drop_index(op.f('ix_expense_details_concept_key'), table_name='expense_details')
    op.drop_column('expense_details', 'is_active')
    op.drop_column('expense_details', 'concept_origin')
    op.drop_column('expense_details', 'concept_label')
    op.drop_column('expense_details', 'concept_key')
