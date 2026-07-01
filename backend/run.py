import uvicorn
import os
from app import config

if __name__ == "__main__":
    port = int(os.environ.get("PORT", config.PORT))
    host = os.environ.get("HOST", config.HOST)
    
    print(f"Starting Human Bingo API Server on {host}:{port}...")
    print(f"Database Mode: {'Firebase Firestore' if os.path.exists(config.FIREBASE_CREDENTIALS_PATH) else 'Local JSON Fallback'}")
    
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
