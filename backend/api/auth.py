from fastapi import APIRouter, Depends
from schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse, UpdateProfileRequest
from services.auth import signup_user, login_user, get_profile, update_profile
from core.jwt import get_current_user

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest):
    return await signup_user(body)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    return await login_user(body.email, body.password)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return await get_profile(current_user["email"])


@router.patch("/me", response_model=UserResponse)
async def patch_me(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return await update_profile(current_user["email"], body)
