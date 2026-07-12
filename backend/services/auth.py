from fastapi import HTTPException, status
from crud.auth import find_user_by_email, create_user, update_user_by_email
from core.security import hash_password, verify_password
from core.jwt import create_token
from schemas.auth import SignupRequest, UpdateProfileRequest


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "gender": user.get("gender"),
        "occupation": user.get("occupation"),
        "organization": user.get("organization"),
        "heard_from": user.get("heard_from"),
        "use_case": user.get("use_case"),
    }


async def signup_user(body: SignupRequest) -> dict:
    existing = await find_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "gender": body.gender,
        "occupation": body.occupation,
        "organization": body.organization,
        "heard_from": body.heard_from,
        "use_case": body.use_case,
    }
    result = await create_user(user_doc)
    token = create_token(str(result.inserted_id), body.email)
    return {"access_token": token}


async def login_user(email: str, password: str) -> dict:
    user = await find_user_by_email(email)
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_token(str(user["_id"]), user["email"])
    return {"access_token": token}


async def get_profile(email: str) -> dict:
    user = await find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _serialize_user(user)


async def update_profile(email: str, body: UpdateProfileRequest) -> dict:
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    user = await update_user_by_email(email, update_data)
    return _serialize_user(user)
