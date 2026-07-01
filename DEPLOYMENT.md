# Deployment Guide

## Backend Deployment

### Render settings
- Root Directory: backend
- Build Command: pip install -r requirements.txt
- Start Command: gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT

### Environment Variables
- JWT_SECRET_KEY
- ACCESS_TOKEN_EXPIRE_MINUTES
- FIREBASE_CREDENTIALS_PATH (optional if using a JSON credentials file)
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_STORAGE_BUCKET
- FRONTEND_URL
- CORS_ALLOWED_ORIGINS

## Frontend Deployment

### Vercel settings
- Framework: Vite
- Build Command: npm run build
- Output Directory: frontend/dist

### Environment Variables
- VITE_API_URL=https://your-render-backend-url.onrender.com/api

## Firebase setup
- Create a Firebase project and enable Firestore.
- Add a service account and provide the project ID, client email, and private key via environment variables.
- Alternatively, upload a credentials JSON file and point FIREBASE_CREDENTIALS_PATH to it.

## CORS configuration
- The backend accepts localhost origins during development and the configured frontend origin in production.
- Set FRONTEND_URL to the deployed Vercel app URL.

## Testing checklist
- [ ] Backend health endpoint responds on Render.
- [ ] Frontend builds successfully with npm run build.
- [ ] Admin login works against the deployed backend.
- [ ] Game creation and joining work with the deployed API.
- [ ] Firebase-backed data persists across requests.
