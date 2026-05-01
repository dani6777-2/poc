import logging
import os
import time
import uuid
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, ORJSONResponse
from sqlalchemy.orm.exc import StaleDataError
from core.exceptions import DomainException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from infrastructure.driven.db.config import engine, Base
from infrastructure.driven.db import models

# Create all tables - Moved to Alembic migrations for production readiness
# Base.metadata.create_all(bind=engine)

from infrastructure.driving.api.routers import auth_router as auth
from infrastructure.driving.api.routers import budget_router as budget
from infrastructure.driving.api.routers import expense_router as expenses
from infrastructure.driving.api.routers import card_router as card
from infrastructure.driving.api.routers import revenue_router as revenues
from infrastructure.driving.api.routers import annual_expense_router as annual_expenses
from infrastructure.driving.api.routers import analysis_router as analysis
from infrastructure.driving.api.routers import health_router as health
from infrastructure.driving.api.routers import list_router as taxonomy
from infrastructure.driving.api.routers import ai_router as ai
from infrastructure.driving.api.routers import ocr_router as ocr
from infrastructure.driving.api.routers import tenant_router as tenants
from infrastructure.driving.api.routers.inventory_router import router_a as block_a, router_b as block_b


class RateLimiter:
    def __init__(self, requests_per_minute: int = 100):
        self.requests_per_minute = requests_per_minute
        self.tenant_requests = defaultdict(list)
    
    def is_allowed(self, tenant_id: int) -> bool:
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        
        self.tenant_requests[tenant_id] = [
            ts for ts in self.tenant_requests[tenant_id] if ts > minute_ago
        ]
        
        if len(self.tenant_requests[tenant_id]) >= self.requests_per_minute:
            return False
        
        self.tenant_requests[tenant_id].append(now)
        return True
    
    def cleanup(self):
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        for tenant_id in list(self.tenant_requests.keys()):
            self.tenant_requests[tenant_id] = [
                ts for ts in self.tenant_requests[tenant_id] if ts > minute_ago
            ]
            if not self.tenant_requests[tenant_id]:
                del self.tenant_requests[tenant_id]

rate_limiter = RateLimiter(requests_per_minute=100)


def _parse_origins(raw: str) -> list[str]:
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]


API_VERSION = os.getenv("API_VERSION", "3.0.0")
API_PREFIX = os.getenv("API_PREFIX", "/api/v3")
ALLOW_ORIGINS = _parse_origins(
    os.getenv("ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("expenses-api")

app = FastAPI(
    title="Home Expenses Control API",
    description="API for home expenses management — v3.0 (Hexagonal Translated)",
    version=API_VERSION,
    default_response_class=ORJSONResponse,
)

# Activar compresión para mejorar el performance en JSON arrays muy grandes
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROUTERS = [
    expenses.router,
    budget.router,
    analysis.router,
    taxonomy.router,
    block_a,
    block_b,
    revenues.router,
    annual_expenses.router,
    card.router,
    health.router,
    auth.router,
    tenants.router,
    ai.router,
    ocr.router,
]

# Centralized versioned routes (v3)
for r in ROUTERS:
    app.include_router(r, prefix=API_PREFIX)


@app.exception_handler(StaleDataError)
async def stale_data_exception_handler(request: Request, exc: StaleDataError):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "CONFLICTO_OCC: El registro ha sido modificado por otro usuario. Por favor, recargue e intente nuevamente.",
            "code": "OCC_CONFLICT",
        },
    )


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    status_code = 400
    if "DUPLICATE_409" in str(exc) or "CONFLICT_409" in str(exc):
        status_code = 409
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc), "code": "DOMAIN_ERROR"},
    )



@app.middleware("http")
async def request_log_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error request_id=%s path=%s", request_id, request.url.path)
        return ORJSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
        )

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    tenant_id = request.headers.get("X-Tenant-Id")
    
    if tenant_id and request.url.path.startswith("/api/") and request.method in ["POST", "PUT", "DELETE"]:
        try:
            tenant_id_int = int(tenant_id)
            if not rate_limiter.is_allowed(tenant_id_int):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please try again later.", "code": "RATE_LIMIT_EXCEEDED"},
                )
        except (ValueError, TypeError):
            pass
    
    response = await call_next(request)
    
    if os.getenv("RATE_LIMIT_CLEANUP", "false").lower() == "true":
        rate_limiter.cleanup()
    
    return response


@app.get("/")
def root():
    return {
        "message": "Home Expenses Control API v3.0",
        "version": API_VERSION,
        "docs": "/docs",
        "api_prefix": API_PREFIX,
    }


@app.get("/health-check")
def health_check():
    return {"status": "ok", "version": API_VERSION}
