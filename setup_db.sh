#!/bin/bash

# Script de configuración de base de datos para Producción
# Este script resetea Docker, aplica migraciones y puebla datos iniciales.

echo "--- Reiniciando Entorno de Datos (POSTGRES) ---"

# 1. Detener contenedores y eliminar volúmenes
echo "Deteniendo contenedores y eliminando volúmenes persistentes..."
docker compose down -v

# 2. Levantar la base de datos únicamente
echo "Levantando servicio de base de datos..."
docker compose up -d db

# 3. Esperar a que Postgres esté listo
echo "Esperando a que la base de datos esté lista..."
until docker exec gastos_db pg_isready -U admin -d gastos; do
  sleep 1
done

echo "Base de datos lista."

# 4. Aplicar Migraciones de Alembic
echo "Aplicando migraciones unificadas..."
cd apps/api
./venv/bin/alembic upgrade head

# 5. Ejecutar Seeding
echo "Poblando base de datos con usuario por defecto..."
./venv/bin/python seed_db.py

echo "--- Configuración de producción completada con éxito ---"
echo "Ahora puedes iniciar la API normalmente con: python main.py"
