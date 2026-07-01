import os
from dotenv import load_dotenv

load_dotenv()

# App Configurations
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Security Configurations
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_freshers_bingo_key_2026_network")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 360))  # 6 hours for long event sessions

# Firebase configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREBASE_CREDENTIALS_PATH = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    os.path.join(BASE_DIR, "firebase-credentials.json")
)
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "").strip()
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n").strip()
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "").strip()

# Frontend & CORS settings
FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
for default_origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    if default_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(default_origin)
if FRONTEND_URL and FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)

# Mock fallback flag
LOCAL_DB_FILE = os.getenv("LOCAL_DB_FILE", os.path.join(BASE_DIR, "local_db.json"))
