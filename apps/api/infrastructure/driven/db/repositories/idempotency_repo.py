from typing import Optional
from sqlalchemy.orm import Session
from infrastructure.driven.db import models
import datetime
import hashlib
import json


class IdempotencyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_key(self, key: str) -> Optional[models.IdempotencyKey]:
        return self.db.query(models.IdempotencyKey).filter(
            models.IdempotencyKey.key == key
        ).first()

    def create(self, tenant_id: int, key: str, endpoint: str, payload: dict, response_data: str) -> models.IdempotencyKey:
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        
        idempotency = models.IdempotencyKey(
            tenant_id=tenant_id,
            key=key,
            endpoint=endpoint,
            payload_hash=payload_hash,
            response_data=response_data,
            expires_at=expires_at
        )
        self.db.add(idempotency)
        self.db.flush()
        return idempotency

    def is_expired(self, record: models.IdempotencyKey) -> bool:
        return record.expires_at < datetime.datetime.utcnow()

    def cleanup_expired(self) -> int:
        expired = self.db.query(models.IdempotencyKey).filter(
            models.IdempotencyKey.expires_at < datetime.datetime.utcnow()
        ).all()
        count = len(expired)
        for e in expired:
            self.db.delete(e)
        if count > 0:
            self.db.flush()
        return count