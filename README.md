# 📊 Sistema de Control Financiero y Gastos del Hogar

Una aplicación web de arquitectura Full-Stack consolidada, de diseño armónico y alto rendimiento para gestionar presupuestos, registrar gastos interactivos, y evaluar la salud financiera del hogar mediante reportes analíticos precisos.

## 🚀 Arquitectura Técnica

El ecosistema cuenta con una separación limpia y robusta, dividida en contenedores, APIs REST modernas, y un frontend dinámico:

### ⚙️ Backend (Python / FastAPI)
- **Framework**: `FastAPI` + `Uvicorn` (Altamente veloz, basado en ASGI).
- **ORM & Database**: `SQLAlchemy` para mapeo objeto-relacional conectado a una instancia de `PostgreSQL` orquestada.
- **Migraciones**: Infraestructura lista para control de esquemas mediante `Alembic` nativo.
- **Environment**: Gestión de variables de desarrollo vía `python-dotenv`.

### 🖥️ Frontend (React / Vite)
- **Engine**: Componentes modulares y empaquetado ultra-rápido impulsado por `Vite` y `React 18`.
- **Enrutamiento**: `React Router DOM` encapsulando arquitectura de Single Page Application (SPA).
- **Consumo de Data**: Interceptor asíncrono y configuración centralizada basado en `Axios`.
- **Diseño Gráfico (UI/UX)**: Hojas de Vanilla CSS (`index.css`) puras, 100% responsivas ("Desktop First" adaptativo con variables nativas) que eliminan dependencias como Tailwind, utilizando modo oscuro _Glassmorphism_ con una alta estética premium personalizable.
- **Visualización Analítica**: Paneles nutridos con librerías de terceros ligeras como `Recharts`.

### 🐋 Base de Datos (Docker)
- Motor: **PostgreSQL 16** alojado mediante `docker-compose.yml`.
- Se emplea _Volumen Persistente_ (`pgdata`) garantizando la integridad de largo plazo contra destrucciones efímeras del contenedor.

---

## 🔥 Funcionalidades Core

1. **Dashboard y Analítica Avanzada**: Tableros generales con distribución de dinero comparativos de "Real vs Plan". Incluye métricas visuales aplicando la "Regla 50/30/20" para la disciplina financiera familiar.
2. **Registro Interactivo**: Diario de asientos contables. Cada desembolso puede categorizarse e incluso marcarse como pago mediante **Tarjeta de Crédito (TC)**.
3. **Tarjeta de Crédito Inteligente**: Lógica interconectada. Todo gasto emitido por "TC" debita de un cupo asincrónico parametrizable y se traslada inteligentemente para diferir pagos, logrando un balance sin que la caja en efectivo sufra sangrías.
4. **Planilla Anual Extensible (Gastos Anuales)**: Tablero holístico de 12 meses donde se elaboran y enfrentan presupuestos contra la vida real para descubrir "Varianzas".
5. **Fuentes Múltiples de Ingresos**: Flujos flexibles que alimentan la Salud Financiera del sistema por sobre un número fijo.
6. **Listas de Compra (Bloque A/B)**: Administrador integrado de ítems y listas al usar supermercados o ferias con control dinámico.

---

## 🛠️ Instalación y Arranque Local

### 1. Iniciar la Base de Datos (PostgreSQL Dockerizado)

Cerciórate de contar con [Docker Desktop](https://www.docker.com/products/docker-desktop) en ejecución.

```bash
docker compose up -d
```
> *Nota: Corre en el puerto `5433` mapeado al 5432 original para evitar coaliciones de puertos.*

### 2. Levantar el Backend (FastAPI)

Ubícate en la carpeta del backend. Preferentemente usa un entorno virtual (`venv`):

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Crea / Configura el archivo `.env` en base a la conexión de Postgres:
```ini
DATABASE_URL=postgresql://admin:password@localhost:5433/gastos
ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Inicia el servidor en modo autorecarga:
```bash
python -m uvicorn main:app --reload --port 8000
```

### 3. Ejecutar el Server Frontend (Vite)

En una nueva pestaña de la consola:
```bash
cd frontend
npm install
npm run dev
```

Navega a `http://localhost:5173` y disfruta de la aplicación.

---

## 🏗️ Estructura del Árbol de Directorios

```plaintext
/poc
 ├── docker-compose.yml       # Orquestador del servicio PostgreSQL
 ├── backend/
 │   ├── main.py              # Router raíz y Entrypoint de FastAPI
 │   ├── database.py          # SQLAlchemy Session y configurador .env
 │   ├── models.py            # Esquemas transaccionales DB (SQLAlchemy)
 │   ├── schemas.py           # Modelos Pydantic para Input/Output validation
 │   ├── migrate_to_pg.py     # Utilidad de script transicional SQLite a Postgres
 │   ├── requirements.txt     # Dependencias crudas de Python
 │   └── routes/              # Módulos descongestionados de Rutas FastAPI
 └── frontend/
     ├── index.html           # Documento raíz Web Vite
     ├── package.json         # Node Scripts / Node modules
     ├── src/
         ├── App.jsx          # Estructura del Router DOM
         ├── index.css        # Motor visual premium nativo central
         ├── api/client.js    # Capa orquestadora Axios a localhost
         ├── components/      # (Navbar.jsx, Modales varios, Componentes reusables)
         ├── constants/       # Diccionarios mapeadores en constantes (Meses, Colores)
         └── pages/           # Vistas (Dashboard, GastosAnuales, Ingresos, Registro, etc.)
```

---

## ✅ Consideraciones de Despliegue
Al llevar a producción, se recomienda compilar Vite usando `npm run build` y correr `Uvicorn` con _gunicorn_ Workers o Dockerizar ambas aplicaciones de cara a un ambiente Cloud como AWS ECS, Railway, u Orchestrador como Kubernetes.
