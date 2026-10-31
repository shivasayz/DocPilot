import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from env import DATABASE_NAME, MONGO_URL

_client_kwargs = {}
if MONGO_URL.startswith("mongodb+srv://") or "tls=true" in MONGO_URL.lower():
    _client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(MONGO_URL, **_client_kwargs)
db = client[DATABASE_NAME]


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
