"""adding bypass config to triggers

Revision ID: 99b4e25dcf81
Revises: 25703f6230ea
Create Date: 2026-04-17 22:42:24.977895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99b4e25dcf81'
down_revision: Union[str, None] = '25703f6230ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    CREATE OR REPLACE FUNCTION check_is_automatic_immutable()
    RETURNS trigger AS $$
    BEGIN
        IF current_setting('finops.bypass_is_automatic', true) = 'on' THEN
            RETURN NEW;
        END IF;

        IF OLD.is_automatic = true AND NEW.is_automatic = false THEN
            RAISE EXCEPTION 'Architectural Invariant Violation: Cannot unset is_automatic via DB';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE OR REPLACE FUNCTION check_is_automatic_delete()
    RETURNS trigger AS $$
    BEGIN
        IF current_setting('finops.bypass_is_automatic', true) = 'on' THEN
            RETURN OLD;
        END IF;

        IF OLD.is_automatic = true THEN
            RAISE EXCEPTION 'Architectural Invariant Violation: Cannot delete system record via DB';
        END IF;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
    """)

def downgrade() -> None:
    op.execute("""
    CREATE OR REPLACE FUNCTION check_is_automatic_immutable()
    RETURNS trigger AS $$
    BEGIN
        IF OLD.is_automatic = true AND NEW.is_automatic = false THEN
            RAISE EXCEPTION 'Architectural Invariant Violation: Cannot unset is_automatic via DB';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE OR REPLACE FUNCTION check_is_automatic_delete()
    RETURNS trigger AS $$
    BEGIN
        IF OLD.is_automatic = true THEN
            RAISE EXCEPTION 'Architectural Invariant Violation: Cannot delete system record via DB';
        END IF;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
    """)
