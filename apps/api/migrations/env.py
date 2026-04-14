from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# access to the values within the .ini file in use.
config = context.config

import os
import sys
from dotenv import load_dotenv

# Añadir el directorio actual al sys.path para importar modelos
# El directorio base es apps/api
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

# Cargar variables de entorno
load_dotenv()

from infrastructure.driven.db.config import Base
from infrastructure.driven.db import models # Asegurar que los modelos se registren en Base

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Verificamos si hay una URL de base de datos en el entorno
    db_url = os.getenv("DATABASE_URL")
    
    # Si existe, la usamos para sobreescribir la del .ini
    configuration = config.get_section(config.config_ini_section, {})
    if db_url:
        configuration["sqlalchemy.url"] = db_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
