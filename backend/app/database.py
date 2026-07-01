import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from app import config

logger = logging.getLogger("app.database")
logging.basicConfig(level=logging.INFO)

# Global variables for real-time pubsub
sse_queues: List[asyncio.Queue] = []

def publish_sse_event(game_id: str, event_type: str, data: Any):
    """
    Publish an event to all connected SSE clients for a specific game.
    """
    event = {
        "gameId": game_id,
        "type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": data
    }

    # Ensure the payload is JSON-serializable; fall back to string if not
    try:
        json.dumps(event["data"])
    except Exception:
        try:
            event["data"] = str(event["data"])
        except Exception:
            event["data"] = "<unserializable>"

    # Broadcast to all queues (copy list to avoid mutation during iteration)
    disconnected = []
    for queue in list(sse_queues):
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning("SSE client queue full, removing client queue")
            disconnected.append(queue)
        except Exception:
            logger.exception("Error publishing SSE event to a client queue")
            disconnected.append(queue)

    logger.debug("publish_sse_event: queued event '%s' for game %s to %d queues", event_type, game_id, len(sse_queues))

    # Clean up any full/broken queues
    for q in disconnected:
        if q in sse_queues:
            try:
                sse_queues.remove(q)
            except ValueError:
                pass

# Check if Firebase credentials exist
firebase_initialized = False
db_client = None

if os.path.exists(config.FIREBASE_CREDENTIALS_PATH):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        cred = credentials.Certificate(config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db_client = firestore.client()
        firebase_initialized = True
        logger.info("Firebase Firestore successfully initialized!")
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}. Falling back to Local JSON database.")
else:
    logger.info(f"Firebase credentials not found at {config.FIREBASE_CREDENTIALS_PATH}. Running in Local JSON Database Mode.")

# --- Local File DB Mock Database ---
class LocalJSONDatabase:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.data: Dict[str, Any] = {
            "games": {},
            "players": {},
            "bingoCards": {},
            "notifications": [],
            "results": {}
        }
        self.lock = asyncio.Lock()
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r") as f:
                    content = f.read().strip()
                    if content:
                        self.data = json.loads(content)
                        # Ensure fields exist
                        for field in ["games", "players", "bingoCards", "notifications", "results"]:
                            if field not in self.data:
                                # notifications is a list, others are dicts
                                if field == "notifications":
                                    self.data[field] = []
                                else:
                                    self.data[field] = {}
            except Exception as e:
                logger.error(f"Failed to read local DB file: {e}")

    def _save(self):
        try:
            with open(self.filepath, "w") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write to local DB file: {e}")

    async def get_game(self, game_id: str) -> Optional[dict]:
        async with self.lock:
            return self.data["games"].get(game_id)

    async def save_game(self, game_id: str, game_data: dict):
        async with self.lock:
            self.data["games"][game_id] = game_data
            self._save()
        # Publish real-time event
        publish_sse_event(game_id, "game_update", game_data)

    async def delete_game(self, game_id: str):
        async with self.lock:
            if game_id in self.data["games"]:
                del self.data["games"][game_id]
                
                # Delete related players and cards
                player_ids_to_del = [pid for pid, p in self.data["players"].items() if p.get("gameId") == game_id]
                for pid in player_ids_to_del:
                    if pid in self.data["players"]:
                        del self.data["players"][pid]
                    if pid in self.data["bingoCards"]:
                        del self.data["bingoCards"][pid]
                
                # Filter notifications
                self.data["notifications"] = [n for n in self.data["notifications"] if n.get("gameId") != game_id]
                self._save()
        publish_sse_event(game_id, "game_deleted", {"gameId": game_id})

    async def get_player(self, player_id: str) -> Optional[dict]:
        async with self.lock:
            return self.data["players"].get(player_id)

    async def get_players_in_game(self, game_id: str) -> List[dict]:
        async with self.lock:
            return [p for p in self.data["players"].values() if p.get("gameId") == game_id]

    async def save_player(self, player_id: str, player_data: dict):
        game_id = player_data.get("gameId")
        async with self.lock:
            self.data["players"][player_id] = player_data
            self._save()
        
        # Publish updates
        publish_sse_event(game_id, "player_update", player_data)
        
        # Send leaderboard update trigger
        leaderboard = await self.get_leaderboard(game_id)
        publish_sse_event(game_id, "leaderboard_update", leaderboard)

    async def get_bingo_card(self, player_id: str) -> Optional[dict]:
        async with self.lock:
            return self.data["bingoCards"].get(player_id)

    async def save_bingo_card(self, player_id: str, card_data: dict):
        game_id = card_data.get("gameId")
        async with self.lock:
            self.data["bingoCards"][player_id] = card_data
            self._save()
        publish_sse_event(game_id, "card_update", card_data)

    async def add_notification(self, notification_data: dict):
        game_id = notification_data.get("gameId")
        async with self.lock:
            self.data["notifications"].append(notification_data)
            self._save()
        publish_sse_event(game_id, "notification", notification_data)

    async def get_notifications(self, game_id: str) -> List[dict]:
        async with self.lock:
            return [n for n in self.data["notifications"] if n.get("gameId") == game_id]

    async def get_leaderboard(self, game_id: str) -> List[dict]:
        players = await self.get_players_in_game(game_id)
        # Sort players: bingoCardCompleted first, then progress (descending), completedRowColDiagCount (descending), completedAt (ascending)
        # For completedAt, we treat None as high (i.e. not completed)
        def sort_key(p):
            card_done = 1 if p.get("bingoCardCompleted", False) else 0
            prog = p.get("progress", 0)
            bingos = p.get("completedRowColDiagCount", 0)
            comp_time = p.get("completedAt") or None
            # Parse completedAt defensively
            ts = 0
            if comp_time:
                try:
                    ts = datetime.fromisoformat(comp_time.replace("Z", "")).timestamp()
                except Exception:
                    try:
                        # Some legacy values might be numeric
                        ts = float(comp_time)
                    except Exception:
                        ts = 0
            return (card_done, prog, bingos, -ts)

        # Python sorts ascending, so we return reverse sort where higher score is better
        players.sort(key=sort_key, reverse=True)
        
        # Format list
        leaderboard = []
        for i, p in enumerate(players):
            leaderboard.append({
                "rank": i + 1,
                "playerId": p.get("id"),
                "name": p.get("name"),
                "progress": p.get("progress", 0),
                "bingos": p.get("completedRowColDiagCount", 0),
                "completed": p.get("bingoCardCompleted", False),
                "completedAt": p.get("completedAt")
            })
        return leaderboard

    # Results storage APIs
    async def save_results(self, game_id: str, results_data: dict):
        async with self.lock:
            self.data["results"][game_id] = results_data
            self._save()
        publish_sse_event(game_id, "results_updated", results_data)

    async def get_results(self, game_id: str) -> Optional[dict]:
        async with self.lock:
            return self.data["results"].get(game_id)


local_db = LocalJSONDatabase(config.LOCAL_DB_FILE)


# --- Database Interfacing APIs ---

async def get_game(game_id: str) -> Optional[dict]:
    if firebase_initialized:
        doc = db_client.collection("games").document(game_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        return await local_db.get_game(game_id)

async def save_game(game_id: str, game_data: dict):
    if firebase_initialized:
        db_client.collection("games").document(game_id).set(game_data)
        publish_sse_event(game_id, "game_update", game_data)
    else:
        await local_db.save_game(game_id, game_data)

async def delete_game(game_id: str):
    if firebase_initialized:
        # Delete game
        db_client.collection("games").document(game_id).delete()
        
        # Batch delete players and cards (simple logic)
        players = db_client.collection("players").where("gameId", "==", game_id).stream()
        for p in players:
            db_client.collection("players").document(p.id).delete()
            db_client.collection("bingoCards").document(p.id).delete()
            
        # Delete notifications
        notifs = db_client.collection("notifications").where("gameId", "==", game_id).stream()
        for n in notifs:
            db_client.collection("notifications").document(n.id).delete()
            
        publish_sse_event(game_id, "game_deleted", {"gameId": game_id})
    else:
        await local_db.delete_game(game_id)

async def get_player(player_id: str) -> Optional[dict]:
    if firebase_initialized:
        doc = db_client.collection("players").document(player_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        return await local_db.get_player(player_id)

async def get_players_in_game(game_id: str) -> List[dict]:
    if firebase_initialized:
        players = db_client.collection("players").where("gameId", "==", game_id).stream()
        return [p.to_dict() for p in players]
    else:
        return await local_db.get_players_in_game(game_id)

async def save_player(player_id: str, player_data: dict):
    game_id = player_data.get("gameId")
    if firebase_initialized:
        db_client.collection("players").document(player_id).set(player_data)
        publish_sse_event(game_id, "player_update", player_data)
        # Update leaderboard
        leaderboard = await get_leaderboard(game_id)
        publish_sse_event(game_id, "leaderboard_update", leaderboard)
    else:
        await local_db.save_player(player_id, player_data)

async def get_bingo_card(player_id: str) -> Optional[dict]:
    if firebase_initialized:
        doc = db_client.collection("bingoCards").document(player_id).get()
        return doc.to_dict() if doc.exists else None
    else:
        return await local_db.get_bingo_card(player_id)

async def save_bingo_card(player_id: str, card_data: dict):
    game_id = card_data.get("gameId")
    if firebase_initialized:
        db_client.collection("bingoCards").document(player_id).set(card_data)
        publish_sse_event(game_id, "card_update", card_data)
    else:
        await local_db.save_bingo_card(player_id, card_data)

async def add_notification(notification_data: dict):
    game_id = notification_data.get("gameId")
    if firebase_initialized:
        db_client.collection("notifications").document(notification_data["id"]).set(notification_data)
        publish_sse_event(game_id, "notification", notification_data)
    else:
        await local_db.add_notification(notification_data)

async def get_notifications(game_id: str) -> List[dict]:
    if firebase_initialized:
        notifs = db_client.collection("notifications").where("gameId", "==", game_id).order_by("timestamp").stream()
        return [n.to_dict() for n in notifs]
    else:
        return await local_db.get_notifications(game_id)

async def get_leaderboard(game_id: str) -> List[dict]:
    if firebase_initialized:
        # In actual Firebase, we load all players and sort them here since complex multi-property inequalities are slow
        players = await get_players_in_game(game_id)
        def sort_key(p):
            card_done = 1 if p.get("bingoCardCompleted", False) else 0
            prog = p.get("progress", 0)
            bingos = p.get("completedRowColDiagCount", 0)
            comp_time = p.get("completedAt") or None
            ts = 0
            if comp_time:
                try:
                    ts = datetime.fromisoformat(comp_time.replace("Z", "")).timestamp()
                except Exception:
                    try:
                        ts = float(comp_time)
                    except Exception:
                        ts = 0
            return (card_done, prog, bingos, -ts)

        players.sort(key=sort_key, reverse=True)
        
        leaderboard = []
        for i, p in enumerate(players):
            leaderboard.append({
                "rank": i + 1,
                "playerId": p.get("id"),
                "name": p.get("name"),
                "progress": p.get("progress", 0),
                "bingos": p.get("completedRowColDiagCount", 0),
                "completed": p.get("bingoCardCompleted", False),
                "completedAt": p.get("completedAt")
            })
        return leaderboard
    else:
        return await local_db.get_leaderboard(game_id)


async def save_results(game_id: str, results_data: dict):
    if firebase_initialized:
        try:
            db_client.collection("results").document(game_id).set(results_data)
            publish_sse_event(game_id, "results_updated", results_data)
        except Exception as e:
            logger.error(f"Failed to save results to Firestore: {e}")
    else:
        await local_db.save_results(game_id, results_data)


async def get_results(game_id: str) -> Optional[dict]:
    if firebase_initialized:
        try:
            doc = db_client.collection("results").document(game_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"Failed to read results from Firestore: {e}")
            return None
    else:
        return await local_db.get_results(game_id)
