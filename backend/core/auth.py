from fastapi import APIRouter

auth_route = APIRouter()

@auth_route.get("/")
async def read_root():
    return {"Message": "Authencation"}

