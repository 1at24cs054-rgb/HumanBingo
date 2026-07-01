from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class GameStatus(str, Enum):
    SETUP = "setup"
    LOBBY = "lobby"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"

class NotificationType(str, Enum):
    JOIN = "join"
    FILL = "fill"
    BINGO = "bingo"
    COMPLETE = "complete"

class BingoTile(BaseModel):
    questionIndex: int
    filledWithPlayerId: Optional[str] = None
    filledWithPlayerName: Optional[str] = None

class BingoCard(BaseModel):
    playerId: str
    gameId: str
    grid: List[BingoTile] = []

class Player(BaseModel):
    id: str
    gameId: str
    name: str
    joinedAt: str
    progress: int = 0
    completedRowColDiagCount: int = 0
    bingoCardCompleted: bool = False
    completedAt: Optional[str] = None

class Game(BaseModel):
    id: str  # Game Code (e.g. HB2026)
    name: str
    gridSize: int = 4  # 4 or 5
    timerDuration: int = 20  # minutes
    leaderboardVisible: bool = True
    status: GameStatus = GameStatus.SETUP
    questions: List[str] = []
    createdAt: str
    startedAt: Optional[str] = None
    timerExpiresAt: Optional[str] = None
    timerRemaining: Optional[float] = None  # seconds remaining when paused

class Notification(BaseModel):
    id: str
    gameId: str
    playerId: str
    playerName: str
    type: NotificationType
    message: str
    timestamp: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class GameCreateRequest(BaseModel):
    name: str
    gridSize: int = 4
    timerDuration: int = 20
    questions: Optional[List[str]] = None
    leaderboardVisible: bool = True

class GameSetupRequest(BaseModel):
    name: str
    gridSize: int = 4
    timerDuration: int
    leaderboardVisible: bool
    questions: List[str]

class PlayerJoinRequest(BaseModel):
    name: str
    gameCode: str

class TileFillRequest(BaseModel):
    questionIndex: int
    filledWithPlayerId: Optional[str] = None  # None resets the tile

class StatusChangeRequest(BaseModel):
    status: str  # start, pause, resume, end
