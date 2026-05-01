# AGENTS.md - Agentic Coding Guidelines

## Project Overview

FinOps v5.0 - Financial management system with:
- **Backend**: FastAPI (Python) + SQLAlchemy 2.0 + PostgreSQL
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Architecture**: Hexagonal (ports/adapters) on backend; Atomic Design on frontend

## Build/Lint/Test Commands

### Frontend (apps/web)
```bash
cd apps/web && npm install    # Install dependencies
npm run dev                   # Run development server
npm run build                 # Build for production
npm run lint                  # Lint code (ESLint)
npm run preview               # Preview production build
```

### Backend (apps/api)
```bash
cd apps/api && source venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt          # Install dependencies
uvicorn infrastructure.driving.api.main:app --reload --host 0.0.0.0 --port 8000  # Run server
alembic upgrade head                     # Run migrations
alembic revision --autogenerate -m "desc"  # Create migration
```

### Tests
- Frontend: No test framework configured
- Backend: No pytest configured (create `pytest.ini` if needed)

## Code Style Guidelines

### Python (Backend)

**Architecture**
- `core/entities/` - Domain entities and DTOs
- `core/ports/secondary/` - Repository interfaces (ports)
- `application/services/` - Business logic
- `infrastructure/driving/api/` - API routes (adapters)
- `infrastructure/driven/db/` - Database implementations

**Imports**: Standard library → third-party → local (absolute paths)
```python
import logging
from fastapi import FastAPI
from core.entities.expenses import ItemEntity
```

**Naming**
- Classes: `PascalCase` (e.g., `ExpenseService`)
- Functions/methods: `snake_case` (e.g., `get_expenses`)
- Private methods: prefix `_` (e.g., `_calc_subtotal`)
- Exceptions: suffix `Error` (e.g., `DomainException`)

**Error Handling**
- Use `DomainException` from `core.exceptions`
- Domain errors use prefix codes: `"DUPLICATE_409:"`, `"CONFLICT_409:"`
- Handle `StaleDataError` for optimistic concurrency (HTTP 409)
- Use `logger = logging.getLogger(__name__)`

**Types**
- Type hints for all arguments/returns
- Use `Optional[T]` instead of `T | None`
- Use `Decimal` with `ROUND_HALF_UP` for currency

### JavaScript/React (Frontend)

**Atomic Design Structure**
```
src/
├── components/atoms/       (Button, Input, Text, Badge)
├── components/molecules/  (FormField, KpiCard, ConfirmModal)
├── components/organisms/  (RegistryForm, Navbar, BudgetTable)
├── components/templates/  (DashboardTemplate, AuthTemplate)
├── pages/                 Route pages
├── services/              API service modules
├── context/               (AuthContext, ToastContext, FinanceContext)
├── hooks/                 Custom hooks
├── utils/                 Utilities
├── constants/             Config and constants
└── api/                   Axios client
```

**Imports**: Relative paths for local modules
```javascript
import api from '../api/client'
import { expenseService } from '../services'
import { Button } from '../components/atoms'
```

**Naming**
- Components: `PascalCase` (e.g., `RegistryForm`)
- Files: `camelCase` (e.g., `expense.service.js`)
- Hooks: prefix `use` (e.g., `useFetchData`)
- Constants: `UPPER_SNAKE_CASE`

**Component Patterns**
- Functional components with hooks
- Destructure props, use defaults
- Named exports for services, default for pages
- Use `useCallback`/`useMemo` for optimization

**State Management**
- React Context for global (Auth, Toast, Finance)
- `useState` for local state
- `useSearchParams` for URL filters

## Key Patterns

### Optimistic Concurrency (OCC)
Backend uses SQLAlchemy `version_id_col`. Frontend must handle HTTP 409:
```javascript
.catch(err => {
  if (err.response?.status === 409) {
    fetchData()
    showToast('Registro modificado por otro usuario', 'error')
  }
})
```

### Null-Safe Financial Math
- `null` = unknown (prevents inflation of averages)
- `0.0` = explicitly validated zero
- Use `Decimal` with 2-decimal precision

### API Versioning
- Routes prefixed `/api/v3` (via `API_PREFIX` env var)
- Use `ORJSONResponse` for JSON performance

## Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://...
API_VERSION=3.0.0
API_PREFIX=/api/v3
LOG_LEVEL=INFO
ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET=...
```

**Frontend**: Configure API base in `src/api/client.js`

## Common Tasks

**Add API endpoint**: service → repository → router → register in `main.py`

**Add frontend page**: create in `src/pages/` → add route in `App.jsx` → add nav in `constants/navigation.js`

**Run full stack**:
```bash
# Terminal 1: Backend
cd apps/api && source venv/bin/activate && uvicorn infrastructure.driving.api.main:app --reload
# Terminal 2: Frontend
cd apps/web && npm run dev
```