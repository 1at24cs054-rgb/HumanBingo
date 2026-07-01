# HumanBingo

A shared networking bingo game for events and orientation sessions.

## Project Structure

- `backend/` - FastAPI backend server, local JSON persistence, game state, player cards, admin controls.
- `frontend/` - React + Vite frontend application for players and admin interfaces.

## Features

- Admin dashboard for creating and managing bingo sessions
- Selectable 4×4 or 5×5 bingo grid size
- Shared prompt builder for consistent participant cards
- Player join flow with live lobby and active game UI
- Tile fill interactions and progress tracking
- Results screen and leaderboard support

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## How to Use

1. Open the admin panel at `/admin/login`.
2. Create a new game and choose either `4 × 4` or `5 × 5` grid size.
3. Configure the shared card prompts in the setup screen.
4. Start the game and share the join code with players.
5. Players join at `/join` and wait in the lobby until the host starts the session.

## Notes

- The backend persists data in `backend/local_db.json`.
- The frontend fetches game state from `/api` routes.
- Admin setup now supports selecting the grid size and uses it in preview and saved configuration.

## Deployment

Recommended setup:

- Frontend: Deploy the `frontend/` directory to Vercel as a static build. When creating the Vercel project set the "Root Directory" to `frontend` and the build command to `npm run build`. Vercel will serve the `dist` output.

- Backend: Deploy the `backend/` directory to Render as a Python web service. Ensure `backend/requirements.txt` contains `gunicorn` (already added) and the repository's `backend/Procfile` contains the start command. On Render set the service root to `backend` and the start command will be picked up from the `Procfile`.

Quick Render steps:

1. Create a new Web Service on Render and connect your GitHub repo.
2. Set the root to `backend` and the build command to `pip install -r requirements.txt`.
3. Render will run the `Procfile` command to start the service.

Quick Vercel steps:

1. Create a new project on Vercel and link the repo.
2. Set the root directory to `frontend`, install command `npm install`, and build command `npm run build`.
3. Set environment variable `REACT_APP_API_URL` or update frontend config to point to the Render backend URL after deployment.


If you want, I can add a `render.yaml` for automatic Render setup and a minimal Vercel configuration file. Tell me if you'd like Docker-based deployments instead.

## License

MIT
