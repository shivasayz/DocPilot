from pydantic import BaseModel, EmailStr
from typing import Optional


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    gender: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    heard_from: Optional[str] = None
    use_case: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    gender: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    heard_from: Optional[str] = None
    use_case: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    use_case: Optional[str] = None
