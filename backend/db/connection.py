import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from env import MONGO_URL

client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client["intellisource"]


async def connect_db():
    try:
        await client.admin.command("ping")
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise e


async def close_db():
    client.close()
    print("🔌 MongoDB connection closed")
