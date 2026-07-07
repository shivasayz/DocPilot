from fastapi import APIRouter, HTTPException, status, Depends
from db.connection import db
from schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse, UpdateProfileRequest
from core.security import hash_password, verify_password
from core.jwt import create_token, get_current_user

auth_route = APIRouter()
users = db["users"]


@auth_route.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest):
    existing = await users.find_one({"email": body.email})
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
    result = await users.insert_one(user_doc)
    token = create_token(str(result.inserted_id), body.email)
    return {"access_token": token}


@auth_route.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_token(str(user["_id"]), user["email"])
    return {"access_token": token}


@auth_route.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
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


@auth_route.patch("/me", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    await users.update_one({"email": current_user["email"]}, {"$set": update_data})
    user = await users.find_one({"email": current_user["email"]})
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
