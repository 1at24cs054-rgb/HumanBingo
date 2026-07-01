import os
from dotenv import load_dotenv

load_dotenv()

# App Configurations
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Security Configurations
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_freshers_bingo_key_2026_network")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360  # 6 hours for long event sessions

# Firebase configurations
# We search for firebase-credentials.json in the parent backend dir, or current app dir
FIREBASE_CREDENTIALS_PATH = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "firebase-credentials.json")
)

# Mock fallback flag
LOCAL_DB_FILE = os.getenv("LOCAL_DB_FILE", "local_db.json")
