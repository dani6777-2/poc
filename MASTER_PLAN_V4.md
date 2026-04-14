# 🚀 MASTER PLAN: Gastos del Hogar 4.0 - Unicornio Fintech SaaS

Bienvenido a la especificación técnica definitiva para la evolución del `Sistema de Control Financiero y Gastos del Hogar`. Como CTO, mi visión es escalar esta plataforma personal a un **SaaS Fintech de Grado Multi-Tenant**, aprovechando la sinergia entre Inteligencia Artificial (AI), Arquitectura Basada en Eventos y un pulso de Diseño de Clase Mundial.

---

## 1. NUEVA VISIÓN ESTRATÉGICA DEL PRODUCTO

**Nombre en Clave:** `FinOps Home 4.0`
**Evolución Conceptual:** Migración estructural desde un registro personal ("Ledger" monousuario local) hacia un "Personal CFO Inteligente en la Nube" (Multi-tenant SaaS). En vez de *anotar* lo que pasó, la plataforma te dice *qué va a pasar*.
**Nuevo Posicionamiento:** El ecosistema Fintech para hogares y freelancers que unifica la elegancia del software empresarial (Stripe, Notion) con finanzas cotidianas en piloto automático.
**Público Objetivo Expandido:** Profesionales modernos, núcleos familiares con finanzas compartidas y freelancers que necesitan aislar ingresos sin complejidad corporativa.
**Diferenciadores Competitivos:**
1. Motor de Predicción Nativo (Forecast AI).
2. Trazabilidad de Tarjetas de Crédito a la par con Efectivo (Cashflow cruzado).
3. Entorno UX Ultra-Premium, adaptativo, Glassmorphism avanzado oscuro.

---

## 2. ARQUITECTURA 4.0 RECOMENDADA

Diseñaremos la nube apuntando a un **Modular Monolith** inicial para MVP, transicionando de forma suave a Microservicios bajo **Domain Driven Design (DDD)**.

### Stack Tecnológico Enterprise
*   **API Gateway & Ingress:** Nginx o Kong API Gateway.
*   **Backend Core:** `FastAPI` (Python) vía Uvicorn (Arquitectura ASGI pura, ideal para I/O y AI ML Models envueltos).
*   **Workers & Cola de Eventos:** `Celery` + `RabbitMQ` (o Redis Streams) para ingesta de transacciones masivas, OCR asíncrono y notificaciones push.
*   **Base de Datos Principal:** `PostgreSQL 16` (con `PgBouncer` para connection pooling en arquitecturas serverless/cloud).
*   **Capa Cache & Sessions:** `Redis` (para caching estático de dashboards y gestión de Rate Limiting/JWT Blacklisting).
*   **Frontend Web:** `Next.js 14` (Migrar de SPA Vite a React Server Components para inyección SSR de datos iniciales en cuadros directivos, optimizando First Paint) + `TailwindCSS` con variables semánticas (estilo Radix UI / Shadcn).
*   **DevOps & Infraestructura:** `Docker` con Orquestación en `Kubernetes (K8s)`. CI/CD en GitHub Actions a AWS EKS o GCP GKE. `Terraform` para Infraestructura como Código.

### Diagrama Textual de Arquitectura
```text
[ Cloudflare CDN / WAF ] 
         │
[ Nginx API Gateway ] ─────── (SSR Requests) ─────── [ Next.js Frontend Cluster ]
         │
         │ (REST / GraphQL / WebSockets)
         ▼
[ FastAPI Core Application ] ─── (CRUD & Auth) ───> [ PostgreSQL + PgBouncer ]
         │
         ├─── (Async Dispatch) ──> [ RabbitMQ / Redis Streams ]
         │                                │
         ├─── (Sync Cache) <────────> [ Redis ]   └──> [ Python Celery Workers ]
         │                                              │ 
         │                                              ├──> [ Módulo AI (Prophet/IsolationForest) ]
         │                                              └──> [ OCR Engine (AWS Textract) ]
         │
         └──> [ SendGrid / AWS SES ] (Notificaciones Mails)
```

---

## 3. NUEVOS MÓDULOS INTELIGENTES 4.0

1.  **Motor IA Predictivo (Cashflow Forecast):** Uso de modelos de series temporales (`Facebook Prophet` o `ARIMA`) sobre `recurring_transactions` para predecir cuándo el usuario se quedará en descubierto, proyectando meses a futuro según su inflación histórica de gastos.
2.  **Detección de Anomalías Constantes:** Algoritmos `Isolation Forest` analizan Background Tasks. Si hay un cobro recurrente un 30% más caro (ej. subida en cuenta eléctrica), activa una alerta *Push* inmediata.
3.  **Simulador de Metas y Recomendador:** Simulaciones de *Monte Carlo* sobre variables financieras. "¿Qué pasa si compro un auto a 48 cuotas con el TC actual?" → Genera la variación en tu % de ahorro global (Regla 50/30/20).
4.  **OCR de Facturas:** Subir foto de boleta. El Worker en RabbitMQ llama a OCR. Parsea Proveedor, Monto y Categoriza la transacción y la deja en *"Revisión"* en tu Dashboard.
5.  **Conciliación Bancaria Automática:** (Futuro) Modulo Plaid/Fintoc para machear el banco con la entrada manual usando lógica difusa (Fuzzy String Matching).

---

## 4. REDISEÑO UX/UI PREMIUM

El estándar es: *Limpio como Stripe, Fluido como Revolut, Flexible como Notion.*

### Principios de Diseño
*   **Glassmorphism Premium Profundo:** Fondos difuminados con transparencias calculadas en GPU y gradientes mesh interactivos en fondos que reaccionan sutilmente al cursor (Microinteracciones).
*   **Tipografía Bancaria:** Familias *Inter* y *Geist* combinadas con números *Tabaular-lining* estrictos para tablas financieras impecables.
*   **Adaptive Theme:** Light/Dark modes administrados mediante Custom Properties, sin brincos de "flashbang".

### Wireframes Conceptuales Executive-Level
*   **Lobby (Dashboard):** Un saludo contextual arriba ("Buenos días, tienes $4k seguros este mes"). Un KPI central con "Net Worth" histórico curvo interactivo. Debajo, tarjetas pequeñas (Alertas) en scroll horizontal. A la derecha un panel Feed con transacciones entrando en vivo en formato Lista compacta.
*   **Radar de TC:** Un gauge circular de Deuda vs Límite disponible en tiempo real con colores cambiantes según el uso, proyectado contra el ingreso para evitar la asfixia crediticia el próximo ciclo.

---

## 5. MODELO DE DATOS 4.0 (Normalizado Multi-Tenant)

```sql
-- DDL Conceptual Core Simplificado
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR,
    created_at TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants, -- Multi-tenant isolation por hogar/familia
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    role VARCHAR -- ADMIN, SPOUSE, VIEWER
);

CREATE TABLE categories ( -- Sustituye los diccionarios hardcore
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name VARCHAR,
    type VARCHAR, -- INCOME, EXPENSE
    icon VARCHAR
);

CREATE TABLE accounts ( -- Efectivo, Banco Local, etc
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name VARCHAR,
    balance DECIMAL
);

CREATE TABLE credit_cards ( -- La TC es una caja especializada
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name VARCHAR,
    limit_amount DECIMAL,
    cut_day INT,
    payment_day INT
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    category_id UUID,
    account_id UUID NULL, 
    credit_card_id UUID NULL, -- constraint: either account or CC
    amount DECIMAL,
    transaction_date DATE,
    concept VARCHAR,
    is_recurring BOOLEAN,
    status VARCHAR -- PENDING, CLEARED, VOIDED
);
```

---

## 6. SEGURIDAD Y PRODUCCIÓN

1.  **Autenticación y Autorización:**
    *   **JWT en Cookies `HttpOnly`** para máxima seguridad contra XSS para los tokens principales. Refresh tokens con rotación.
    *   RBAC Completo (Dueño, Editor, Solo-Lectura para adolescentes o contadores en modo Sandbox).
2.  **Aislamiento de Inquilinos (Multi-Tenant):** Todos los Endpoints FastAPI inyectan una dependencia que asegura que el `tenant_id` en JWT iguale a la consulta SQL. Reglas a nivel Row-Level Security (RLS) en Postgres para mitigar fugas cruzadas (Data leaks).
3.  **Seguridad a Reposo y en Vuelo:**
    *   Soporte nativo HTTPS/TLS 1.3 con Cloudflare Strict HSTS.
    *   Secretos manejados por `HashiCorp Vault` o AWS Secrets Manager. Ninguna contraseña en GitHub o env vars crudos.
4.  **Auditoría y Límite:**
    *   `Rate Limiting` en FastAPI a través de Redis (Ej: Máximo 30 API calls / minuto para evitar DOS / Scrape).
    *   Store inmutable en DB tipo Log para Auditar modificaciones críticas de capital.

---

## 7. ROADMAP DE IMPLEMENTACIÓN SPRINT-DRIVEN

*   **FASE 1: Refactor Arquitectónico (Mes 1):** Migración del repo monolítico al estándar Modular. Despliegue de Postgres con Migraciones Alembic automáticas. Cambio visual profundo de componentes UI base.
*   **FASE 2: Multiusuario y Entidades SaaS (Mes 2):** Autenticación JWT. RBAC multicuenta. Soporte para familias compartidas.
*   **FASE 3: Motor Async, TC y Automatizaciones (Mes 3):** Despliegue de Workers (RabbitMQ). Nueva lógica estricta para Tarjetas de Crédito de corte mensual. Cronjobs de transacciones recurrentes automatizables.
*   **FASE 4: Cerebro de Negocio e Inteligencia (Mes 4):** Modelos Prophet de Forecast, Regla de 50/30/20 conectada a gráficos radiales, integraciones con OCR y lectura de PDFs bancarios. Mobile-first optimizations.
*   **FASE 5: Launch Producción Cloud (Mes 5):** Kubernetes YAMLs / Docker Swarm, Stress Testing, Logs (Datadog/Elastic), Configuración Pasarelas de Pago Stripe para monetización.

---

## 8. PLAN DE MIGRACIÓN DESDE ARCHIVO VERSION ACTUAL

Para pasar del actual PostgreSQL v3 al Cloud v4 garantizando **Zero Downtime**:
1.  **Schema Evolution:** Creamos un script `Alembic` que añade la columna `tenant_id` a tus tablas en cascada.
2.  **Backfill Data:** Se crea el Default Tenant (Tú). Todas las filas históricas sin `tenant_id` asumen ese UUID por defecto usando Batch Updates para no saturar memoria.
3.  **Blue-Green Deployment:** Desplegamos los microservicios v4. El Frontend antiguo apuntando al v3 convive. Cuando v4 pasa QA y Postman Collections Unit Tests, hacemos Swapping DNS en Cloudflare del Frontend SPA V4.

---

## 9. ENTREGAS EXTRAS

### A) Folder Structure (Monorepo Enterprise)
```plaintext
/apps
  /web           # Next.js Frontend
  /api           # FastAPI Backend Gateway
  /workers       # Celery Workers AI / Batch Jobs
/packages
  /db            # SQLAlchemy models compartidos, migraciones
  /ui            # UI Design System interno (Storybook, shadcn)
  /ai-models     # Scripts Python puro para forecasting / pipelines
```

### B) MVP Priorizado 4.0
El MVP crítico a alcanzar *antes* de soltar marketing o invites es:
- Inicio de Sesión seguro JWT (No más localhost sin Auth).
- Ledger Multi-tenant para soportar a tu primera cuota de Beta Users.
- 1 Tarjeta de Crédito funcional por hogar, con corte dinámico.

### C) Riesgos Técnicos (Watch-out)
1.  **Bloqueo GIL por AI:** Python FastAPI es async, pero los modelos predictivos pesados bloquean el CPU. Deben correr off-thread 100% (usar Celery siempre, jamás dentro de la `def ruta`).
2.  **Acumulación de Timezones:** Al ser SaaS, un pago en Japón (UTC+9) puede restar presupuesto el 1ro del mes, mientras otra persona viaja en USA (UTC-5) en el mes 31. Trazar todos los `TIMESTAMP` globalmente a UTC y convertir en la presentación del cliente React.

### D) Monetización SaaS
- **FREEMIUM:** Manejo presupuestal crudo manual gratis. Máximo 1 usuario por familia.
- **PRO ($7/mo):** Invitación a Cónyuge, Automatización ilimitada de gastos, Soporte Ilimitado CSV/PDF export, Integraciones y Tarjetas de Crédito de ciclo complejo. Asesor IA predictivo.
