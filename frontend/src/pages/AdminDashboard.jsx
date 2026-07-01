import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { QRCodeModal } from '../components/QRCodeModal';
import { 
  Play, Pause, RefreshCw, Square, Award, Users, Flame, 
  Share2, Compass, Plus, ClipboardList, Bell, Shield, ChevronRight, Clock3, Sparkles, Layers3 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const {
    game,
    players,
    notifications,
    loading,
    createGame,
    loadGameData,
    controlGame,
    startNewSession
  } = useGame();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Form states for creating a new game
  const [newGameName, setNewGameName] = useState('');
  const [gridSize, setGridSize] = useState(4); // default 4x4
  const [timerDuration, setTimerDuration] = useState(15); // default 15 minutes

  // Auto-restore game state if saved in localStorage
  useEffect(() => {
    if (!game) {
      const savedCode = localStorage.getItem('admin_game_code');
      if (savedCode) {
        loadGameData(savedCode);
      }
    }
  }, [game, loadGameData]);

  // Handle creating a new game session
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newGame = await createGame(newGameName.trim(), gridSize, timerDuration);
    if (newGame) {
      localStorage.setItem('admin_game_code', newGame.id);
      await loadGameData(newGame.id);
    }
  };

  // Game control handlers
  const handleStartGame = async () => {
    if (!game) return;
    await controlGame(game.id, 'start');
  };

  const handlePauseGame = async () => {
    if (!game) return;
    await controlGame(game.id, 'pause');
  };

  const handleResumeGame = async () => {
    if (!game) return;
    await controlGame(game.id, 'resume');
  };

  const handleEndGame = async () => {
    if (!game) return;
    const confirmEnd = window.confirm('Are you sure you want to end the game? This will lock all player cards and calculate final results.');
    if (confirmEnd) {
      await controlGame(game.id, 'end');
    }
  };

  const handleStartNewSession = async () => {
    if (!game) return;
    const confirmReset = window.confirm('Start a fresh session? This will create a new game code and clear the current roster and progress while keeping the existing networking questions and game settings.');
    if (confirmReset) {
      const nextGame = await startNewSession(game.id);
      if (nextGame) {
        localStorage.setItem('admin_game_code', nextGame.id);
        await loadGameData(nextGame.id);
      }
    }
  };

  const copyGameCode = async () => {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.id);
      toast.success('Game code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  // Loading spinner
  if (loading && !game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark flex flex-col items-center justify-center p-4 md:pl-64">
        <Compass className="w-8 h-8 text-primary animate-spin mb-2" />
        <span className="text-xs text-primary/60 font-semibold">Loading Admin Dashboard...</span>
      </div>
    );
  }

  // --- Render Create Game Form (if no session active) ---
  if (!game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark p-6 md:p-10 md:pl-72 flex flex-col justify-center max-w-3xl">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
              Host Panel
            </span>
            <h1 className="text-3xl md:text-4xl text-primary font-black mt-2 leading-none">
              Setup a New Bingo Session
            </h1>
            <p className="text-sm text-primary/60 mt-2">
              Create an identical shared bingo card session for freshers to network on campus.
            </p>
          </div>

          <Card className="border border-primary/10 shadow-premium p-8 relative overflow-hidden bg-card-cream rounded-3xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-sage"></div>

            <form onSubmit={handleCreateGame} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                  Session Name / Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freshers Meetup 2026"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30 text-text-dark font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                    Bingo Grid Size
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGridSize(4)}
                      className={`py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        gridSize === 4
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                          : 'bg-background-cream/50 border-primary/10 text-primary hover:bg-primary/5'
                      }`}
                    >
                      4 × 4 (16 Squares)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGridSize(5)}
                      className={`py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        gridSize === 5
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                          : 'bg-background-cream/50 border-primary/10 text-primary hover:bg-primary/5'
                      }`}
                    >
                      5 × 5 (25 Squares)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                    Timer Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3.5 bg-background-cream border border-primary/10 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-text-dark font-bold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !newGameName.trim()}
                className="w-full py-4 font-bold tracking-wide shadow-md shadow-primary/15"
                icon={Plus}
              >
                {loading ? 'Initializing Session...' : 'Create Bingo Game'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // --- Calculate Dashboard Stats ---
  const totalPlayers = players.length;
  const completedCardsCount = players.filter(p => p.bingoCardCompleted).length;
  const totalFills = players.reduce((sum, p) => sum + (p.progress || 0), 0);
  const averageFills = totalPlayers > 0 ? (totalFills / totalPlayers).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background-cream text-text-dark p-6 md:p-8 md:pl-72 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-primary/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
              Session Status: {game.status.toUpperCase()}
            </span>
            {game.status === 'active' && (
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping"></span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
            {game.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-primary/60 mt-2">
            <span className="font-mono bg-primary/5 px-2 py-0.5 rounded border border-primary/10 font-bold">Code: {game.id}</span>
            <button onClick={copyGameCode} className="hover:text-primary transition-colors flex items-center gap-1 font-semibold cursor-pointer">
              <Share2 className="w-3 h-3" /> Copy Code
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Timer game={game} />
          <Button 
            onClick={() => setIsQRModalOpen(true)} 
            variant="secondary" 
            size="sm"
            icon={Share2}
          >
            Invite QR
          </Button>
        </div>
      </div>

      {/* Main Game Control Actions Panel */}
      <Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium">
        <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-gold" /> Session Control Panel
        </h3>

        <div className="flex flex-wrap gap-3">
          {/* Start button - active in Setup or Lobby */}
          {(game.status === 'setup' || game.status === 'lobby') && (
            <Button
              onClick={handleStartGame}
              variant="primary"
              icon={Play}
              className="px-6 shadow-sm shadow-primary/20"
            >
              Start Game Session
            </Button>
          )}

          {/* Pause button - active in Active */}
          {game.status === 'active' && (
            <Button
              onClick={handlePauseGame}
              variant="gold"
              icon={Pause}
              className="px-6"
            >
              Pause Networking
            </Button>
          )}

          {/* Resume button - active in Paused */}
          {game.status === 'paused' && (
            <Button
              onClick={handleResumeGame}
              variant="primary"
              icon={Play}
              className="px-6"
            >
              Resume Networking
            </Button>
          )}

          {/* End button - active in Active or Paused */}
          {(game.status === 'active' || game.status === 'paused') && (
            <Button
              onClick={handleEndGame}
              variant="danger"
              icon={Square}
              className="px-6"
            >
              End Session & Lock
            </Button>
          )}

          <Button
            onClick={handleStartNewSession}
            variant="secondary"
            icon={RefreshCw}
            className="px-6"
          >
            Start New Session
          </Button>
        </div>
      </Card>

      <Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Layers3 className="w-3.5 h-3.5" /> Current Game
            </div>
            <h2 className="text-2xl md:text-3xl text-primary font-black mt-3 leading-none">{game.name}</h2>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-primary/70">
              <span className="inline-flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full"><ClipboardList className="w-4 h-4" /> Code {game.id}</span>
              <span className="inline-flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full"><Sparkles className="w-4 h-4" /> {game.gridSize}×{game.gridSize}</span>
              <span className="inline-flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full"><Clock3 className="w-4 h-4" /> {game.timerDuration} min</span>
            </div>
          </div>
          <div className="lg:w-72 rounded-3xl bg-background-cream/70 border border-primary/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-primary/60">Players joined</span><span className="font-black text-primary">{totalPlayers} / {game.gridSize * game.gridSize}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-primary/60">Status</span><span className="font-black text-primary">{game.status.toUpperCase()}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-primary/60">Completed</span><span className="font-black text-primary">{completedCardsCount}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-primary/60">Timer</span><span className="font-black text-primary">{game.timerDuration} min</span></div>
          </div>
        </div>
      </Card>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl flex items-center gap-4 bg-card-cream border border-primary/5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Joined Roster</span>
            <div className="text-2xl font-black text-primary leading-tight mt-0.5">{totalPlayers}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center gap-4 bg-card-cream border border-primary/5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Average Fills</span>
            <div className="text-2xl font-black text-primary leading-tight mt-0.5">{averageFills}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center gap-4 bg-card-cream border border-primary/5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Cards Completed</span>
            <div className="text-2xl font-black text-primary leading-tight mt-0.5">{completedCardsCount}</div>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Activity Feed and Roster Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Live Activity Feed */}
        <Card className="p-5 rounded-3xl bg-card-cream border border-primary/10 shadow-premium flex flex-col h-[350px]">
          <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-4 flex items-center gap-1.5 shrink-0">
            <Bell className="w-4 h-4 text-gold" /> Live Activity Notifications Feed
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 text-sm">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/45 py-10">
                <Bell className="w-8 h-8 mb-2 stroke-[1.25]" />
                <span>No gameplay activity has occurred yet.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2 p-2.5 bg-background-cream/40 rounded-xl border border-primary/5 hover:bg-background-cream transition-colors">
                  <span className="text-gold shrink-0">✨</span>
                  <div className="flex-1 leading-tight text-text-dark font-medium">
                    {n.message}
                    <span className="block text-[9px] text-primary/40 mt-0.5">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Roster Preview */}
        <Card className="p-5 rounded-3xl bg-card-cream border border-primary/10 shadow-premium flex flex-col h-[350px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Roster Preview
            </h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {totalPlayers} registered
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {players.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/45 py-10">
                <Users className="w-8 h-8 mb-2 stroke-[1.25]" />
                <span>Roster is empty. Share the game code!</span>
              </div>
            ) : (
              players.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-background-cream/40 rounded-xl border border-primary/5 hover:bg-background-cream transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-dark">{p.name}</span>
                      <span className="block text-[9px] font-mono text-primary/50">ID: {p.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary/75 bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 font-bold">
                    <Flame className="w-3 h-3 text-gold fill-current" /> {p.progress || 0} fills
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Invite QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        gameCode={game.id}
      />
    </div>
  );
};

export default AdminDashboard;
