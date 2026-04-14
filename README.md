# 📊 FinOps Enterprise - Sistema de Control Financiero y Gastos

Una aplicación web de arquitectura Full-Stack consolidada, diseñada para gestionar presupuestos interactivos, registrar gastos, evaluar la salud financiera y llevar un control estricto mediante reportes analíticos precisos.

Este repositorio es un **Monorepo** que contiene tanto el Backend (API) como el Frontend (Web App), con arquitecturas modernas, escalables y orientadas al dominio.

---

## 🚀 Arquitectura Técnica (Monorepo)

El ecosistema cuenta con una separación limpia y robusta, divida en dos aplicaciones principales ubicadas dentro del subdirectorio `apps/`.

### ⚙️ Backend (`apps/api/`) - Hexagonal & DDD
El backend ha sido diseñado siguiendo los principios de **Arquitectura Hexagonal (Ports & Adapters)** y **Domain-Driven Design (DDD)** para garantizar el desacoplamiento estricto entre las reglas de negocio y los detalles técnicos del framework.

- **Estructura Interna**:
  - `core/`: Entidades de dominio primarias y Puertos (interfaces).
  - `application/`: Servicios de aplicación, orquestación y casos de uso.
  - `infrastructure/`: Adaptadores *Driving* (API REST mediante **FastAPI**) y *Driven* (Repositorios **SQLAlchemy** interconectados).
- **Base de Datos**: PostgreSQL gestionado vía Docker, con todos los esquemas versionados mediante control de migraciones en **Alembic**.
- **Multi-Tenancy**: Aislamiento de datos nativo estructural por `tenant_id` para soportar de manera segura múltiples usuarios/familias en la misma base de datos relacional.

### 🖥️ Frontend (`apps/web/`) - Atomic Design
La interfaz de usuario ha sido construida bajo la rigurosa metodología de **Atomic Design** (Átomos, Moléculas, Organismos, Plantillas y Páginas) garantizando una alta reutilización y estandarización del código UI.

- **Navegador y Empaquetado**: Impulsado por **React 18** y empaquetado de forma ultrarrápida mediante **Vite**.
- **Enrutamiento**: Arquitectura SPA controlada fluidamente por `React Router DOM`.
- **Consumo de Data**: Interceptor asíncrono HTTP centralizado basado en `Axios` con soporte inteligente para versiones de API (`/api/v3`).
- **Diseño Gráfico (UI/UX)**: Estilizado con **Tailwind CSS** usando utilidades puras para conformar un diseño 100% responsivo, fuertemente estético (inspiración *Glassmorphism* y modo oscuro *premium*).

---

## 🗄️ Arquitectura de Base de Datos

Diseñada para soportar multi-tenancy, proyecciones avanzadas de presupuestos anuales y registros granulares de transacciones.

```mermaid
erDiagram
    TENANTS ||--o{ USERS : "has"
    TENANTS ||--o{ TAXONOMY_CATEGORIES : "owns"
    TENANTS ||--o{ TAXONOMY_CHANNELS : "owns"
    TENANTS ||--o{ ITEMS : "records"
    TENANTS ||--o{ BUDGETS : "defines"
    TENANTS ||--o{ INVENTORY_BLOCK_A : "manages"
    TENANTS ||--o{ INVENTORY_BLOCK_B : "manages"
    TENANTS ||--o{ REVENUES : "receives"
    TENANTS ||--o{ EXPENSE_DETAILS : "projects"
    TENANTS ||--o{ CARD_CONFIGS : "configures"

    TAXONOMY_SECTIONS ||--o{ TAXONOMY_CATEGORIES : "groups"
    TAXONOMY_SECTIONS ||--o{ EXPENSE_DETAILS : "categorizes"

    TAXONOMY_CATEGORIES ||--o{ ITEMS : "classifies"
    TAXONOMY_CATEGORIES ||--o{ BUDGETS : "allocates"
    TAXONOMY_CATEGORIES ||--o{ INVENTORY_BLOCK_A : "classifies"
    TAXONOMY_CATEGORIES ||--o{ INVENTORY_BLOCK_B : "classifies"

    TAXONOMY_CHANNELS ||--o{ ITEMS : "purchased at"
    TAXONOMY_CHANNELS ||--o{ INVENTORY_BLOCK_A : "purchased at"
    TAXONOMY_CHANNELS ||--o{ INVENTORY_BLOCK_B : "purchased at"
    TAXONOMY_CHANNELS ||--o{ CARD_CONFIGS : "links to"

    TAXONOMY_UNITS ||--o{ ITEMS : "measured in"
    TAXONOMY_UNITS ||--o{ INVENTORY_BLOCK_A : "measured in"
    TAXONOMY_UNITS ||--o{ INVENTORY_BLOCK_B : "measured in"

    TENANTS {
        int id PK
        string name "Unique"
    }

    USERS {
        int id PK
        int tenant_id FK
        string email "Unique, Index"
        string role "owner/admin"
    }

    TAXONOMY_SECTIONS {
        int id PK
        string name "Unique"
    }

    TAXONOMY_CATEGORIES {
        int id PK
        int tenant_id FK
        int section_id FK
        string name
    }

    ITEMS {
        int id PK
        int tenant_id FK
        string month "YYYY-MM"
        string date
        string name
        int category_id FK
        int channel_id FK
        int unit_id FK
        float quantity
        float unit_price
        float subtotal
        string status
    }

    BUDGETS {
        int id PK
        int tenant_id FK
        string month "YYYY-MM"
        int category_id FK
        float budget
        float actual_spending
    }

    EXPENSE_DETAILS {
        int id PK
        int tenant_id FK
        int year
        int section_id FK
        string description
        float jan_to_dec "Plan/Actual/Card"
    }

    CARD_CONFIGS {
        int id PK
        int tenant_id FK
        string name
        float total_limit
        int channel_id FK
        int alert_pct
        int closing_day
        int payment_day
    }

    USER {
        int id PK
        int tenant_id FK
        string email "Único, Index"
        string password_hash
        string role "owner/admin"
    }

    ITEM {
        int id PK
        int tenant_id FK
        string mes "YYYY-MM"
        string fecha
        string nombre
        string categoria
        string canal
        string unidad
        float cantidad
        float precio_unit
        float subtotal
        string estado "Planificado/Comprado"
        string fuente "Origen (BA/BB)"
    }

    PRESUPUESTO {
        int id PK
        int tenant_id FK
        string mes "YYYY-MM"
        string categoria
        float presupuesto
        float gasto_real
    }

    GASTO_DETALLE {
        int id PK
        int tenant_id FK
        int anio
        string seccion
        string concepto
        float ene "Presupuesto Enero"
        float real_ene "Gasto Real Enero"
        float real_tc_ene "Gasto en TC Enero"
    }

    CONFIG_TARJETA {
        int id PK
        int tenant_id FK
        string nombre
        float cupo_total
        string canal_nombre "Match con ITEM.canal"
        int alerta_pct
        int dia_corte
        int dia_pago
    }
```

---

## 🔥 Funcionalidades Core

1. **Dashboard y Analítica Avanzada**: Tableros interactivos con distribuciones dinámicas, comparativos "Real vs Plan", e integración con la regla de salud 50/30/20.
2. **Registro Transaccional Intuitivo**: Diario de contabilidad granular para cada desembolso categorizable, incluyendo soporte diferencial temporal nativo para **Tarjeta de Crédito (TC)**.
3. **Arquitectura de Tarjetización**: Control asincrónico por desfase del ciclo de facturación. Traslada costos de manera predictiva asegurando liquidez del flujo base de caja.
4. **Plan Maestro Anual**: Planilla 360 holística de 12 cuotas. Cruza presupuestos base con el mundo real para revelar "Varianzas" al céntimo.
5. **Esquema de Múltiples Ingresos**: Capacidad de enclavar n-fuentes de ingresos (Salarios, bonos, remesas, pasivos) para consolidar el vector de Vida/Salud Financiera de cada inquilino.
6. **Bóvedas Sectorizadas (Bloque A/B)**: Administrador de abastecimiento bifurcado en (A) No-perecederos y despensas extensas, frente a (B) Frescos del día / vegetales limitados.

---

## 🛠️ Instalación y Arranque Local

### 1. Iniciar la Base de Datos (PostgreSQL Dockerizado)

Cerciórate de contar con contenedor corriendo [Docker Desktop](https://www.docker.com/products/docker-desktop). En la raíz del proyecto, ejecuta:

```bash
docker compose up -d
```
> *El entorno mapea PostgreSQL. Revisa `docker-compose.yml` para parámetros de conexión.*

### 2. Levantar el Backend (FastAPI)

Posiciónate en la API, engendra tu entorno virtual y arranca Uvicorn apuntando a la arquitectura Driving (Hexagonal):

```bash
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

No olvides confeccionar tu archivo `.env` en `apps/api/` con la configuración de tu DB:
```ini
DATABASE_URL=postgresql://admin:password@localhost:5433/gastos
ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Procede a encender el nodo lógico:
```bash
python -m uvicorn infrastructure.driving.api.main:app --reload --port 8000
```

### 3. Ejecutar el App Frontend (Vite)

Levanta una nueva terminal:
```bash
cd apps/web
npm install
cp .env.example .env  # Configura VITE_API_BASE_URL (http://localhost:8000)
npm run dev
```

El portal abrirá las puertas al control hiperconectado desde: `http://localhost:5173`.

---

## 🏗️ Estructura Central de Directorios

```plaintext
/poc
 ├── docker-compose.yml       # Orquestador del servicio Master PostgreSQL
 ├── README.md                # Main Entry Doc (Este archivo)
 └── apps/
     ├── api/                 # Ecosistema Backend (FastAPI, Hexagonal)
     │   ├── alembic.ini      # Regulador de migraciones
     │   ├── core/            # Entidades Primarias y Puertos (Interfaces)
     │   ├── application/     # Servicios core y Casos de Uso
     │   ├── infrastructure/  # Modelos DB, Rutas Endpoints Driving y Adaptadores Driven
     │   └── migrations/      # Tracking físico de esquemas DB
     │
     └── web/                 # Ecosistema Frontend (React + Vite)
         ├── eslint.config.js # Lint rules
         ├── package.json     # Declaración NPM de motor UI
         ├── vite.config.js   # Configurador de pre-rutas de compresión
         └── src/
             ├── components/  # Core UI (Atoms, Molecules, Organisms, Templates)
             ├── pages/       # Inyecciones visuales terminales de router
             ├── context/     # Módulos globales de estados Hooks (React Context)
             └── services/    # Capa de enlazado HTTP Axios contra el puerto `api/`
```
