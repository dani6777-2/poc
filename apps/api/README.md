# Backend FinOps v4.5 — Arquitectura Hexagonal (Ports & Adapters)

Este backend ha sido reestructurado siguiendo principios de arquitectura hexagonal para garantizar el desacoplamiento entre las reglas de negocio y los detalles técnicos.

## 🏗️ Estructura del Proyecto

*   `core/`: Entidades de dominio y Puertos (interfaces).
*   `application/`: Servicios de aplicación (casos de uso).
*   `infrastructure/`: Adaptadores Driving (API FastAPI) y Driven (SQLAlchemy Repositories).
    *   `infrastructure/driving/api/`: Punto de entrada, rutas y esquemas.
    *   `infrastructure/driven/db/` : Modelos y configuración de db.

## 🚀 Cómo ejecutar la API

Debido a la reubicación del archivo principal, el comando para iniciar el servidor desde la carpeta `apps/api` es:

```bash
python -m uvicorn infrastructure.driving.api.main:app --reload --port 8000
```

---

# Arquitectura de Base de Datos - FinOps v4.5

Este documento describe la estructura de datos del sistema, diseñada para soportar multi-tenancy, gestión de presupuesto anual y registro granular de transacciones.

## Diagrama Entidad-Relación

```mermaid
erDiagram
    TENANT ||--o{ USER : "posee"
    TENANT ||--o{ ITEM : "registra"
    TENANT ||--o{ PRESUPUESTO : "define"
    TENANT ||--o{ BLOQUE_A : "gestiona"
    TENANT ||--o{ BLOQUE_B : "gestiona"
    TENANT ||--o{ INGRESO : "percibe"
    TENANT ||--o{ GASTO_DETALLE : "proyecta"
    TENANT ||--o{ CONFIG_TARJETA : "configura"

    TENANT {
        int id PK
        string name "Único"
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
        comment "columnas repetidas para cada mes feb...dic"
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

## Diccionario de Datos

### 1. Núcleo de Identidad (Multi-Tenancy)
*   **tenants**: Entidad raíz para el aislamiento de datos. Cada cuenta o "casa" es un tenant.
*   **users**: Usuarios autenticados. Se vinculan a un tenant mediante `tenant_id`.

### 2. Operatividad Mensual
*   **items**: El "Libro de Transacciones". Registra cada compra individual. Es la fuente de verdad para el gasto real.
*   **presupuesto**: Define límites mensuales por categoría. Se sincroniza con el gasto real calculado desde los `items`.

### 3. Planificación Anual (Plan Maestro)
*   **ingresos**: Matriz de 12 meses para proyectar flujos de entrada por diversas fuentes (Salarios, Junaeb, etc.).
*   **gastos_detalle**: El corazón del sistema "Anual". Contiene proyecciones (Plan), ejecuciones reales y deuda en tarjeta de crédito para cada mes del año.

### 4. Inventarios Avanzados
*   **bloque_a**: Gestión de despensa (supermercado, limpieza, abarrotes).
*   **bloque_b**: Gestión de ferias y perecederos (frutas, verduras, proteínas).

### 5. Configuración Financiera
*   **config_tarjeta**: Parámetros de la tarjeta de crédito (ciclo de facturación, cupo y alertas).

## Índices y Restricciones de Producción
*   **Unicidad**: Se han implementado restricciones `UniqueConstraint` para evitar duplicidad de presupuestos en el mismo mes/categoría y gastos duplicados en el plan anual.
*   **Performance**: Índices en `tenant_id` en todas las tablas para asegurar consultas rápidas en entornos multi-usuario.
*   **Seguridad**: El campo `email` en la tabla `users` posee un índice único para optimizar el login.
