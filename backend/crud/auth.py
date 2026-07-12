from db.connection import db

users = db["users"]


async def find_user_by_email(email: str):
    return await users.find_one({"email": email})


async def create_user(user_doc: dict):
    return await users.insert_one(user_doc)


async def update_user_by_email(email: str, update_data: dict):
    await users.update_one({"email": email}, {"$set": update_data})
    return await users.find_one({"email": email})
