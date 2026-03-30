from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .schemas import CurrentUserRead

security = HTTPBearer(auto_error=False)

DEMO_USERS = {
    "customer@supportiq.dev": {
        "name": "Zeynep Yildiz",
        "email": "customer@supportiq.dev",
        "password": "demo123",
        "role": "customer",
    },
    "agent@supportiq.dev": {
        "name": "Ece Kaya",
        "email": "agent@supportiq.dev",
        "password": "demo123",
        "role": "agent",
    },
}


def authenticate_user(email: str, password: str) -> CurrentUserRead | None:
    candidate = DEMO_USERS.get(email.lower())
    if not candidate or candidate["password"] != password:
        return None
    return CurrentUserRead(name=candidate["name"], email=candidate["email"], role=candidate["role"])


def create_access_token(user: CurrentUserRead) -> str:
    payload = {
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "exp": int(time.time()) + (settings.auth_token_ttl_hours * 3600),
    }
    return _encode_token(payload)


def decode_access_token(token: str) -> CurrentUserRead:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise _unauthorized("Geçersiz oturum belirteci biçimi") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    expected_signature = _sign(signing_input)
    if not hmac.compare_digest(expected_signature, signature_segment):
        raise _unauthorized("Geçersiz oturum belirteci imzası")

    payload = _loads_segment(payload_segment)
    if int(payload.get("exp", 0)) < int(time.time()):
        raise _unauthorized("Oturumun süresi doldu")

    try:
        return CurrentUserRead(name=payload["name"], email=payload["sub"], role=payload["role"])
    except KeyError as exc:
        raise _unauthorized("Geçersiz oturum verisi") from exc


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> CurrentUserRead:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Kimlik doğrulama gerekli")
    return decode_access_token(credentials.credentials)


def require_agent(current_user: CurrentUserRead = Depends(get_current_user)) -> CurrentUserRead:
    if current_user.role != "agent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu işlem için temsilci yetkisi gerekli")
    return current_user


def _encode_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_segment = _dump_segment(header)
    payload_segment = _dump_segment(payload)
    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    signature_segment = _sign(signing_input)
    return f"{header_segment}.{payload_segment}.{signature_segment}"


def _dump_segment(value: dict) -> str:
    raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _loads_segment(value: str) -> dict:
    padding = "=" * (-len(value) % 4)
    raw = base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))
    return json.loads(raw.decode("utf-8"))


def _sign(value: bytes) -> str:
    secret = settings.auth_secret.encode("utf-8")
    digest = hmac.new(secret, value, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("utf-8")


def _unauthorized(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )
