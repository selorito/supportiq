from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import authenticate_user, create_access_token, get_current_user
from ..schemas import AuthTokenRead, CurrentUserRead, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthTokenRead)
def login(payload: LoginRequest):
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-posta veya şifre hatalı")
    token = create_access_token(user)
    return AuthTokenRead(access_token=token, user=user)


@router.get("/me", response_model=CurrentUserRead)
def me(current_user: CurrentUserRead = Depends(get_current_user)):
    return current_user
