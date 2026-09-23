from db.connection import db

users = db["users"]


async def find_user_by_email(email: str):
    normalized = email.strip().lower()
    user = await users.find_one({"email": normalized})
    if user:
        return user
    return await users.find_one(
        {
            "$expr": {
                "$eq": [
                    {"$toLower": {"$trim": {"input": {"$ifNull": ["$email", ""]}}}},
                    normalized,
                ]
            }
        }
    )


async def create_user(user_doc: dict):
    user_doc = {**user_doc, "email": user_doc["email"].strip().lower()}
    return await users.insert_one(user_doc)


async def update_user_by_email(email: str, update_data: dict):
    user = await find_user_by_email(email)
    if not user:
        return None
    await users.update_one({"_id": user["_id"]}, {"$set": update_data})
    return await users.find_one({"_id": user["_id"]})
