import os
import re
import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

from app import config, models, database, auth

logger = logging.getLogger("app.main")

app = FastAPI(title="Human Bingo API", version="1.0.0")

SHARED_CARD_PROMPTS = [
    "loves to swim",
    "can play a musical instrument",
    "has the most letters in their last name",
    "does not like broccoli",
    "is afraid of spiders",
    "has had stitches",
    "is an only child",
    "wakes up early",
    "is a couch potato",
    "can whistle",
    "was born in January",
    "drank coffee this morning",
    "wears socks to bed",
    "bites his/her fingernails",
    "has more than four siblings",
    "has argued with a friend recently",
    "snores",
    "has seen a snake in the wild",
    "won a contest",
    "has fallen or thrown up in public",
    "enjoys maths",
    "can use chopsticks",
    "likes very spicy food",
    "hasn't had breakfast today",
    "watches more than one hour of TV every day"
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Preseed admin on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Human Bingo backend starting up...")


async def _timer_monitor_task():
    """
    Background task: broadcasts timer ticks for active games and auto-ends games when expired.
    """
    from app import database
    while True:
        try:
            all_games = list(database.local_db.data.get("games", {}).values()) if not database.firebase_initialized else []
            now = datetime.utcnow()
            for g in all_games:
                status = g.get("status")
                game_id = g.get("id")
                # Status stored in DB is a string; compare against enum value
                if str(status) == models.GameStatus.ACTIVE.value:
                    expires_at = g.get("timerExpiresAt")
                    remaining = None
                    if expires_at:
                        expires_dt = datetime.fromisoformat(expires_at.replace("Z", ""))
                        remaining = max(0, int((expires_dt - now).total_seconds()))
                    else:
                        remaining = g.get("timerDuration", 0) * 60

                    # publish tick event
                    database.publish_sse_event(game_id, "timer_tick", {
                        "remaining": remaining,
                        "timerExpiresAt": g.get("timerExpiresAt"),
                        "status": g.get("status")
                    })

                    # auto-end if expired
                    if remaining <= 0:
                        # End the game via the control endpoint logic: mark ended and publish notification
                        g["status"] = models.GameStatus.ENDED.value
                        g["timerExpiresAt"] = None
                        g["timerRemaining"] = None
                        g["questions"] = normalize_game_questions(list(g.get("questions") or []))
                        await database.save_game(game_id, g)

                        # compute final leaderboard and save results
                        leaderboard = await database.get_leaderboard(game_id)
                        results_payload = {
                            "game": normalize_game_payload(g),
                            "leaderboard": leaderboard,
                            "generatedAt": datetime.utcnow().isoformat() + "Z"
                        }
                        # Save results persistently
                        if not database.firebase_initialized:
                            await database.local_db.save_results(game_id, results_payload)
                        else:
                            # If using Firestore, write to results collection
                            db_client = database.db_client
                            try:
                                db_client.collection("results").document(game_id).set(results_payload)
                                database.publish_sse_event(game_id, "results_updated", results_payload)
                            except Exception:
                                pass

        except Exception as e:
            logger.exception("Timer monitor error: %s", e)
        await asyncio.sleep(1)

# start background timer monitor
@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(_timer_monitor_task())

# --- Helper Logic ---

def calculate_completed_lines(grid: List[dict], size: int) -> int:
    """
    Calculate the number of completed rows, columns, and diagonals on a bingo grid.
    Grid cell is considered filled if filledWithPlayerId is present.
    """
    # Grid elements is size * size
    filled = [cell.get("filledWithPlayerId") is not None for cell in grid]
    
    # Pad if grid is not fully formed
    if len(filled) < size * size:
        filled += [False] * (size * size - len(filled))
        
    completed_count = 0
    
    # Check Rows
    for r in range(size):
        row_completed = True
        for c in range(size):
            if not filled[r * size + c]:
                row_completed = False
                break
        if row_completed:
            completed_count += 1
            
    # Check Columns
    for c in range(size):
        col_completed = True
        for r in range(size):
            if not filled[r * size + c]:
                col_completed = False
                break
        if col_completed:
            completed_count += 1
            
    # Check Diagonal (Top Left to Bottom Right)
    diag1_completed = True
    for i in range(size):
        if not filled[i * size + i]:
            diag1_completed = False
            break
    if diag1_completed:
        completed_count += 1
        
    # Check Anti-Diagonal (Top Right to Bottom Left)
    diag2_completed = True
    for i in range(size):
        if not filled[i * size + (size - 1 - i)]:
            diag2_completed = False
            break
    if diag2_completed:
        completed_count += 1
        
    return completed_count


# --- API Routes ---

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "firebaseEnabled": database.firebase_initialized,
        "databaseMode": "Firebase Firestore" if database.firebase_initialized else "Local JSON Store",
        "time": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/api/admin/login")
async def admin_login(req: models.AdminLoginRequest):
    if req.username != auth.DEFAULT_ADMIN_USERNAME or not auth.verify_password(req.password, auth.DEFAULT_ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    token = auth.create_access_token(data={"sub": req.username})
    return {"access_token": token, "token_type": "bearer"}

# --- Game Operations ---

@app.post("/api/games", response_model=models.Game)
async def create_game(req: models.GameCreateRequest):
    # Create unique game code e.g. HB1234
    game_code = f"HB{str(uuid.uuid4().int)[:4].zfill(4)}"
    
    # Initialize basic grid questions depending on grid size
    grid_count = req.gridSize * req.gridSize
    req_questions = list(req.questions or [])

    if not req_questions:
        req_questions = [f"Find someone who {SHARED_CARD_PROMPTS[i]}" for i in range(grid_count)]
    else:
        req_questions = req_questions[:grid_count]
        if len(req_questions) < grid_count:
            req_questions.extend([f"Find someone who {SHARED_CARD_PROMPTS[i]}" for i in range(len(req_questions), grid_count)])
        
    new_game = models.Game(
        id=game_code,
        name=req.name,
        gridSize=req.gridSize,
        timerDuration=req.timerDuration,
        leaderboardVisible=req.leaderboardVisible,
        status=models.GameStatus.SETUP,
        questions=req_questions,
        createdAt=datetime.utcnow().isoformat() + "Z"
    )
    
    game_payload = normalize_game_payload(new_game.dict())
    await database.save_game(new_game.id, game_payload)
    return game_payload

def normalize_game_questions(questions: List[str]) -> List[str]:
    normalized = []
    for idx, q in enumerate(questions or []):
        text = str(q or '').strip()
        if re.match(r"^Find someone who\.\.\. \(Square \d+\)$", text):
            if idx < len(SHARED_CARD_PROMPTS):
                normalized.append(f"Find someone who {SHARED_CARD_PROMPTS[idx]}")
                continue
        normalized.append(text)
    return normalized


def normalize_game_payload(game: dict) -> dict:
    if not game:
        return game
    normalized_game = dict(game)
    normalized_game["questions"] = normalize_game_questions(list(game.get("questions") or []))
    return normalized_game

@app.get("/api/games/{code}", response_model=models.Game)
async def get_game_details(code: str):
    game = await database.get_game(code)
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    return normalize_game_payload(game)

@app.delete("/api/games/{code}")
async def delete_game_session(code: str, admin: str = Depends(auth.get_current_admin)):
    game = await database.get_game(code)
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    await database.delete_game(code)
    return {"message": f"Game {code} and all associated data deleted successfully"}

@app.post("/api/games/{code}/new-session", response_model=models.Game)
async def create_new_session(code: str, admin: str = Depends(auth.get_current_admin)):
    previous_game = await database.get_game(code)
    if not previous_game:
        raise HTTPException(status_code=404, detail="Game session not found")

    new_game_code = f"HB{str(uuid.uuid4().int)[:4].zfill(4)}"
    now_str = datetime.utcnow().isoformat() + "Z"
    questions = list(previous_game.get("questions") or [])

    if not questions:
        grid_count = (previous_game.get("gridSize") or 4) * (previous_game.get("gridSize") or 4)
        questions = [f"Find someone who {SHARED_CARD_PROMPTS[i]}" for i in range(grid_count)]

    questions = normalize_game_questions(questions)
    new_game = models.Game(
        id=new_game_code,
        name=previous_game.get("name") or "Freshers Orientation",
        gridSize=previous_game.get("gridSize", 4),
        timerDuration=previous_game.get("timerDuration", 20),
        leaderboardVisible=previous_game.get("leaderboardVisible", True),
        status=models.GameStatus.SETUP,
        questions=questions,
        createdAt=now_str
    )

    await database.save_game(new_game_code, new_game.dict())
    return normalize_game_payload(new_game.dict())

@app.put("/api/games/{code}/setup", response_model=models.Game)
async def update_game_setup(code: str, req: models.GameSetupRequest, admin: str = Depends(auth.get_current_admin)):
    game_dict = await database.get_game(code)
    if not game_dict:
        raise HTTPException(status_code=404, detail="Game session not found")
        
    if game_dict["status"] != models.GameStatus.SETUP.value:
        raise HTTPException(
            status_code=400, 
            detail="Cannot update setup because game has already started or ended. Setup is locked."
        )
        
    expected_questions = req.gridSize * req.gridSize
    normalized_questions = normalize_game_questions(list(req.questions[:expected_questions]))
    if len(normalized_questions) < expected_questions:
        normalized_questions.extend([
            f"Find someone who {SHARED_CARD_PROMPTS[i]}"
            for i in range(len(normalized_questions), expected_questions)
        ])
        
    game_dict["name"] = req.name
    game_dict["gridSize"] = req.gridSize
    game_dict["timerDuration"] = req.timerDuration
    game_dict["leaderboardVisible"] = req.leaderboardVisible
    game_dict["questions"] = normalized_questions
    
    await database.save_game(code, game_dict)
    return normalize_game_payload(game_dict)

@app.post("/api/games/{code}/control", response_model=models.Game)
async def control_game_state(code: str, req: models.StatusChangeRequest, admin: str = Depends(auth.get_current_admin)):
    game_dict = await database.get_game(code)
    if not game_dict:
        raise HTTPException(status_code=404, detail="Game session not found")
        
    current_status = game_dict["status"]
    action = req.status.lower()
    
    now_str = datetime.utcnow().isoformat() + "Z"
    
    if action == "start":
        if current_status not in [models.GameStatus.SETUP.value, models.GameStatus.LOBBY.value]:
            raise HTTPException(status_code=400, detail=f"Cannot start game from state: {current_status}")
        game_dict["status"] = models.GameStatus.ACTIVE.value
        game_dict["startedAt"] = now_str
        game_dict["timerExpiresAt"] = (datetime.utcnow() + timedelta(minutes=game_dict["timerDuration"])).isoformat() + "Z"
        game_dict["timerRemaining"] = None
        game_dict["questions"] = normalize_game_questions(list(game_dict.get("questions") or []))
        
        # Log notification
        notif = models.Notification(
            id=str(uuid.uuid4()),
            gameId=code,
            playerId="ADMIN",
            playerName="Host",
            type=models.NotificationType.COMPLETE,
            message="The Human Bingo game has officially started! Let's network!",
            timestamp=now_str
        )
        await database.add_notification(notif.dict())
        
    elif action == "pause":
        if current_status != models.GameStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Can only pause active games")
        
        game_dict["status"] = models.GameStatus.PAUSED.value
        # Calculate remaining time in seconds
        expires = datetime.fromisoformat(game_dict["timerExpiresAt"].replace("Z", ""))
        rem_sec = (expires - datetime.utcnow()).total_seconds()
        game_dict["timerRemaining"] = max(0.0, rem_sec)
        game_dict["timerExpiresAt"] = None
        
    elif action == "resume":
        if current_status != models.GameStatus.PAUSED.value:
            raise HTTPException(status_code=400, detail="Can only resume paused games")
            
        game_dict["status"] = models.GameStatus.ACTIVE.value
        rem_sec = game_dict.get("timerRemaining", 0.0) or 0.0
        game_dict["timerExpiresAt"] = (datetime.utcnow() + timedelta(seconds=rem_sec)).isoformat() + "Z"
        game_dict["timerRemaining"] = None
        
    elif action == "end":
        if current_status in [models.GameStatus.SETUP.value, models.GameStatus.ENDED.value]:
            raise HTTPException(status_code=400, detail=f"Cannot end game from state: {current_status}")
            
        game_dict["status"] = models.GameStatus.ENDED.value
        game_dict["timerExpiresAt"] = None
        game_dict["timerRemaining"] = None
        
        # Log notification
        notif = models.Notification(
            id=str(uuid.uuid4()),
            gameId=code,
            playerId="ADMIN",
            playerName="Host",
            type=models.NotificationType.COMPLETE,
            message="The game has ended! Check the final Leaderboard results.",
            timestamp=now_str
        )
        await database.add_notification(notif.dict())
        
    elif action == "lobby":
        # Reset game back to lobby (useful for testing or event restarts)
        game_dict["status"] = models.GameStatus.LOBBY.value
        game_dict["startedAt"] = None
        game_dict["timerExpiresAt"] = None
        game_dict["timerRemaining"] = None
        
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
        
    game_dict["questions"] = normalize_game_questions(list(game_dict.get("questions") or []))
    await database.save_game(code, game_dict)
    return normalize_game_payload(game_dict)

# --- Player Operations ---

@app.post("/api/games/{code}/join")
async def join_game(code: str, req: models.PlayerJoinRequest):
    # Normalize code
    code = code.upper().strip()
    game_dict = await database.get_game(code)
    if not game_dict:
        raise HTTPException(status_code=404, detail="Game code invalid or does not exist")
        
    if game_dict["status"] in [models.GameStatus.ENDED.value]:
        raise HTTPException(status_code=400, detail="This game session has already ended")
        
    # Check if a player with this name already exists in this game
    players = await database.get_players_in_game(code)
    normalized_new_name = req.name.strip().lower()
    
    existing_player = None
    for p in players:
        if p["name"].strip().lower() == normalized_new_name:
            existing_player = p
            break
            
    now_str = datetime.utcnow().isoformat() + "Z"
    
    if existing_player:
        # Re-join: return their existing session details
        logger.info(f"Player {req.name} re-joined game {code}")
        card = await database.get_bingo_card(existing_player["id"])
        return {
            "player": existing_player,
            "card": card,
            "game": normalize_game_payload(game_dict)
        }
        
    # Create new Player
    player_id = f"P{str(uuid.uuid4().int)[:5].zfill(5)}"
    new_player = models.Player(
        id=player_id,
        gameId=code,
        name=req.name.strip(),
        joinedAt=now_str
    )
    
    # Initialize card grid based on identical questions
    grid_size = game_dict["gridSize"]
    grid_cells = []
    for idx in range(grid_size * grid_size):
        grid_cells.append(models.BingoTile(questionIndex=idx))
        
    new_card = models.BingoCard(
        playerId=player_id,
        gameId=code,
        grid=grid_cells
    )
    
    # Save both
    await database.save_player(player_id, new_player.dict())
    await database.save_bingo_card(player_id, new_card.dict())
    
    # Log joining notification
    notif = models.Notification(
        id=str(uuid.uuid4()),
        gameId=code,
        playerId=player_id,
        playerName=req.name.strip(),
        type=models.NotificationType.JOIN,
        message=f"{req.name.strip()} joined the game!",
        timestamp=now_str
    )
    await database.add_notification(notif.dict())
    
    # Auto-move game from setup to lobby when first player joins
    if game_dict["status"] == models.GameStatus.SETUP.value:
        game_dict["status"] = models.GameStatus.LOBBY.value
        # Normalize questions before saving so SSE game updates always deliver exact prompts
        game_dict["questions"] = normalize_game_questions(list(game_dict.get("questions") or []))
        await database.save_game(code, game_dict)
        
    return {
        "player": new_player,
        "card": new_card,
        "game": normalize_game_payload(game_dict)
    }

@app.get("/api/games/{code}/players")
async def get_game_players(code: str):
    # Check game existence
    game = await database.get_game(code)
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
    players = await database.get_players_in_game(code)
    return players

@app.get("/api/games/{code}/players/{playerId}/card", response_model=models.BingoCard)
async def get_player_card(code: str, playerId: str):
    card = await database.get_bingo_card(playerId)
    if not card:
        raise HTTPException(status_code=404, detail="Bingo card not found")
    return card

@app.post("/api/games/{code}/players/{playerId}/fill", response_model=models.BingoCard)
async def fill_player_tile(code: str, playerId: str, req: models.TileFillRequest):
    game_dict = await database.get_game(code)
    if not game_dict:
        raise HTTPException(status_code=404, detail="Game session not found")
        
    if game_dict["status"] != models.GameStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Tiles can only be filled while the game is Active")
        
    player_dict = await database.get_player(playerId)
    if not player_dict:
        raise HTTPException(status_code=404, detail="Player not found")
        
    card_dict = await database.get_bingo_card(playerId)
    if not card_dict:
        raise HTTPException(status_code=404, detail="Player's bingo card not found")
        
    grid = card_dict["grid"]
    grid_size = game_dict["gridSize"]
    
    # Validate index range
    if req.questionIndex < 0 or req.questionIndex >= len(grid):
        raise HTTPException(status_code=400, detail="Invalid tile question index")
        
    # Case 1: Clearing a tile
    if req.filledWithPlayerId is None:
        cleared_name = grid[req.questionIndex]["filledWithPlayerName"]
        grid[req.questionIndex]["filledWithPlayerId"] = None
        grid[req.questionIndex]["filledWithPlayerName"] = None
        
        # Recalculate progress, completions
        filled_count = sum(1 for c in grid if c.get("filledWithPlayerId") is not None)
        player_dict["progress"] = filled_count
        
        old_bingos = player_dict.get("completedRowColDiagCount", 0)
        new_bingos = calculate_completed_lines(grid, grid_size)
        player_dict["completedRowColDiagCount"] = new_bingos
        
        if filled_count < len(grid):
            player_dict["bingoCardCompleted"] = False
            player_dict["completedAt"] = None
            
        await database.save_bingo_card(playerId, card_dict)
        await database.save_player(playerId, player_dict)
        return card_dict
        
    # Case 2: Filling a tile
    target_id = req.filledWithPlayerId
    
    # Rule 1: Target player must exist and be in the same game
    target_player_dict = await database.get_player(target_id)
    if not target_player_dict or target_player_dict["gameId"] != code:
        raise HTTPException(status_code=404, detail="Target participant is not registered in this game")
        
    # Rule 2: Cannot fill with self
    if target_id == playerId:
        raise HTTPException(status_code=400, detail="You cannot put yourself on your own card! Network with others.")
        
    # Rule 3: Same participant cannot fill multiple squares on one player's card
    for idx, cell in enumerate(grid):
        if idx != req.questionIndex and cell.get("filledWithPlayerId") == target_id:
            raise HTTPException(
                status_code=400, 
                detail=f"{target_player_dict['name']} has already been placed in another square. Each person can only fill one square on your card."
            )
            
    # Apply change
    grid[req.questionIndex]["filledWithPlayerId"] = target_id
    grid[req.questionIndex]["filledWithPlayerName"] = target_player_dict["name"]
    
    # Recalculate progress, completions
    filled_count = sum(1 for c in grid if c.get("filledWithPlayerId") is not None)
    player_dict["progress"] = filled_count
    
    old_bingos = player_dict.get("completedRowColDiagCount", 0)
    new_bingos = calculate_completed_lines(grid, grid_size)
    player_dict["completedRowColDiagCount"] = new_bingos
    
    now_str = datetime.utcnow().isoformat() + "Z"
    
    # Detect row completion bingo
    if new_bingos > old_bingos:
        # Create bingo notification
        notif = models.Notification(
            id=str(uuid.uuid4()),
            gameId=code,
            playerId=playerId,
            playerName=player_dict["name"],
            type=models.NotificationType.BINGO,
            message=f"{player_dict['name']} completed a row/column BINGO! 🎉",
            timestamp=now_str
        )
        await database.add_notification(notif.dict())
        
    # Detect full grid completion
    if filled_count == len(grid) and not player_dict["bingoCardCompleted"]:
        player_dict["bingoCardCompleted"] = True
        player_dict["completedAt"] = now_str
        
        # Create full completion notification
        notif = models.Notification(
            id=str(uuid.uuid4()),
            gameId=code,
            playerId=playerId,
            playerName=player_dict["name"],
            type=models.NotificationType.COMPLETE,
            message=f"🌟 AMAZING! {player_dict['name']} completed their entire Bingo card! 🌟",
            timestamp=now_str
        )
        await database.add_notification(notif.dict())
        
    # Log tile filled notification
    tile_notif = models.Notification(
        id=str(uuid.uuid4()),
        gameId=code,
        playerId=playerId,
        playerName=player_dict["name"],
        type=models.NotificationType.FILL,
        message=f"{player_dict['name']} met {target_player_dict['name']}!",
        timestamp=now_str
    )
    await database.add_notification(tile_notif.dict())
    
    await database.save_bingo_card(playerId, card_dict)
    await database.save_player(playerId, player_dict)
    
    return card_dict

# --- Real-Time SSE Stream ---

@app.get("/api/games/{code}/sse")
async def game_sse_stream(code: str, request: Request):
    """
    Establish Server-Sent Events stream for real-time game notifications, progress, and leaderboards.
    """
    # Verify game exists
    code = code.upper().strip()
    game_dict = await database.get_game(code)
    if not game_dict:
        raise HTTPException(status_code=404, detail="Game session not found")
        
    async def event_generator():
        # Create client queue
        queue = asyncio.Queue()
        database.sse_queues.append(queue)
        
        try:
            # Send initial state dump immediately so the client can synchronize state
            players = await database.get_players_in_game(code)
            leaderboard = await database.get_leaderboard(code)
            notifications = await database.get_notifications(code)
            # Take last 15 notifications for feed
            notifications = notifications[-15:]
            
            initial_payload = {
                "game": normalize_game_payload(await database.get_game(code)),
                "players": players,
                "leaderboard": leaderboard,
                "notifications": notifications
            }
            
            # Send initial state
            try:
                yield f"event: initial_state\ndata: {json.dumps(initial_payload)}\n\n"
            except Exception:
                logger.exception("Failed to send initial_state SSE payload")

            while True:
                # Stop if client disconnected
                if await request.is_disconnected():
                    logger.info("SSE client disconnected for game %s", code)
                    break

                try:
                    logger.debug("SSE waiting for event for game %s", code)
                    # Wait for next event or timeout for ping
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)

                    logger.debug("SSE received event for game %s: %s", code, str(event.get('type') if isinstance(event, dict) else event))

                    # Only yield events belonging to this specific game code
                    if isinstance(event, dict) and event.get("gameId") == code:
                        try:
                            payload = event.get('data')
                            yield f"event: {event.get('type')}\ndata: {json.dumps(payload)}\n\n"
                        except Exception:
                            logger.exception("Failed to serialize SSE event payload for game %s", code)
                except asyncio.TimeoutError:
                    # Ping keep-alive
                    try:
                        yield "event: ping\ndata: {}\n\n"
                    except Exception:
                        logger.exception("Failed to send SSE ping to client for game %s", code)
                    
        except asyncio.CancelledError:
            pass
        finally:
            # Cleanup queue on disconnect
            if queue in database.sse_queues:
                database.sse_queues.remove(queue)
                
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*"
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream; charset=utf-8", headers=headers)

# --- Results and Leaderboard Statistics ---

@app.get("/api/games/{code}/leaderboard")
async def get_game_leaderboard(code: str):
    return await database.get_leaderboard(code)

@app.get("/api/games/{code}/results")
async def get_game_results(code: str):
    game = await database.get_game(code)
    if not game:
        raise HTTPException(status_code=404, detail="Game session not found")
        
    players = await database.get_players_in_game(code)
    leaderboard = await database.get_leaderboard(code)
    
    # Calculate stats
    total_players = len(players)
    completed_cards = sum(1 for p in players if p.get("bingoCardCompleted", False))
    total_fills = sum(p.get("progress", 0) for p in players)
    avg_fills = round(total_fills / total_players, 1) if total_players > 0 else 0
    
    # Calculate average completion time in seconds
    completion_times = []
    if game.get("startedAt"):
        start_time = datetime.fromisoformat(game["startedAt"].replace("Z", ""))
        for p in players:
            if p.get("bingoCardCompleted", False) and p.get("completedAt"):
                comp_time = datetime.fromisoformat(p["completedAt"].replace("Z", ""))
                completion_times.append((comp_time - start_time).total_seconds())
                
    avg_completion_time = round(sum(completion_times) / len(completion_times), 1) if completion_times else 0
    
    return {
        "game": normalize_game_payload(game),
        "totalPlayers": total_players,
        "completedCardsCount": completed_cards,
        "averageFills": avg_fills,
        "averageCompletionTimeSeconds": avg_completion_time,
        "leaderboard": leaderboard
    }
