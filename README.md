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

## License

MIT
