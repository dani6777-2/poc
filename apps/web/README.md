# Frontend v3.0

Aplicacion React para control de finanzas del hogar, integrada con la API FastAPI.

## Novedades v3.0

- Configuracion por entorno con `.env`.
- Cliente HTTP centralizado con:
- prefijo de version API (`/api/v3`), timeout por defecto y normalizacion de errores.
- Compatibilidad con rutas legacy del backend.

## Requisitos

- Node.js 20+
- npm 10+

## Instalacion

```bash
npm install
cp .env.example .env
```

## Variables de entorno

- `VITE_API_BASE_URL`: URL base del backend.
- `VITE_API_PREFIX`: prefijo de version para endpoints (default recomendado: `/api/v3`).

## Scripts

- `npm run dev`: inicia entorno local.
- `npm run build`: build de produccion.
- `npm run preview`: sirve build localmente.
- `npm run lint`: lint del codigo.

## Ejecucion local

```bash
npm run dev
```

Aplicacion disponible en `http://localhost:5173`.
