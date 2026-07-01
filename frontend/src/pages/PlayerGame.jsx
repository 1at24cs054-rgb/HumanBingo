import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Timer } from '../components/Timer';
import { ProgressRing } from '../components/ProgressRing';
import { SearchModal } from './SearchModal';
import { Compass, Users, Sparkles, LogOut, Volume2, VolumeX, Grid, Bell, Flame, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSound } from '../context/SoundContext';

export const PlayerGame = () => {
  const navigate = useNavigate();
  const {
    game,
    player,
    card,
    players,
    notifications,
    fillTile,
    playerLeaveGame
  } = useGame();

  const { isSoundOn, setIsSoundOn } = useSound();
  
  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Verification checks
  useEffect(() => {
    if (!player) {
      navigate('/join');
      return;
    }
    if (!game) {
      navigate('/join');
      return;
    }
    // Redirect if game goes back to lobby or setup
    if (game.status === 'setup' || game.status === 'lobby') {
      navigate('/lobby');
    }
    // Redirect if game ends
    if (game.status === 'ended') {
      navigate('/results');
    }
  }, [player, game, navigate]);

  if (!game || !player || !card) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-cream p-4">
        <Compass className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleCellClick = (index) => {
    if (game.status !== 'active') {
      toast.error('The game is currently paused. Wait for the host to resume.');
      return;
    }
    setSelectedCellIndex(index);
    setIsSearchOpen(true);
  };

  const handleSelectParticipant = async (targetPlayer) => {
    setIsSearchOpen(false);
    if (selectedCellIndex === null) return;

    await fillTile(game.id, player.id, selectedCellIndex, targetPlayer.id);
    setSelectedCellIndex(null);
  };

  const handleClearCell = async (e, index) => {
    e.stopPropagation(); // prevent opening search modal
    if (game.status !== 'active') {
      toast.error('The game is paused. Cannot make changes.');
      return;
    }
    
    const confirmClear = window.confirm('Are you sure you want to clear this square?');
    if (!confirmClear) return;

    await fillTile(game.id, player.id, index, null);
  };

  const handleLeave = () => {
    const confirmLeave = window.confirm('Leave the game? Your progress will remain saved if you rejoin with the same name.');
    if (confirmLeave) {
      playerLeaveGame();
      navigate('/join');
    }
  };

  const gridCount = game.gridSize * game.gridSize;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 bg-background-cream text-text-dark max-w-5xl mx-auto w-full min-h-screen relative pb-8">
      {/* Top Header */}
      <div className="flex justify-between items-center py-2 mb-2 shrink-0 border-b border-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            HB
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary truncate max-w-[120px]">{game.name}</h2>
            <p className="text-[10px] text-primary/60">ID: {player.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="p-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary/75 cursor-pointer"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-error bg-error/10 hover:bg-error/15 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 shrink-0">
        {/* Progress Ring Card */}
        <Card className="p-3 rounded-2xl flex items-center justify-center gap-3 bg-card-cream border border-primary/5 shadow-sm">
          <ProgressRing progress={player.progress} total={gridCount} size={44} strokeWidth={4.5} />
          <div className="leading-none">
            <span className="text-[10px] font-bold text-primary/60 uppercase">Progress</span>
            <div className="text-sm font-black text-primary mt-0.5">
              {player.progress}/{gridCount}
            </div>
          </div>
        </Card>

        {/* Bingos Card */}
        <Card className="p-3 rounded-2xl flex items-center justify-center gap-2 bg-card-cream border border-primary/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="leading-none">
            <span className="text-[10px] font-bold text-primary/60 uppercase">Bingos</span>
            <div className="text-sm font-black text-primary mt-0.5">
              {player.completedRowColDiagCount}
            </div>
          </div>
        </Card>

        {/* Timer Card */}
        <div className="flex items-center justify-center">
          <Timer game={game} />
        </div>
      </div>

      {/* Main Bingo Card */}
      <div className="flex-1 flex flex-col justify-center min-h-0 mb-4 shrink-0">
        <div className="bg-card-cream border border-primary/10 rounded-3xl p-4 shadow-premium">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
              <Grid className="w-3.5 h-3.5" /> Shared bingo card
            </h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">LIVE</span>
          </div>

          {/* Grid Layout */}
          <div className={`grid ${game.gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-2`}>
            {card.grid.slice(0, gridCount).map((cell, idx) => {
              const questionText = (game.questions[cell.questionIndex] || '').trim();
              const cleanQuestion = questionText === ''
                ? ''
                : questionText.match(/^Find someone who\.\.\. \(Square \d+\)$/i)
                  ? ''
                  : questionText.replace(/^Find someone who(?:\.\.\. )?/, '').trim();
              const isFilled = cell.filledWithPlayerId !== null;

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(cell.questionIndex)}
                  className={`aspect-square rounded-xl p-1.5 flex flex-col justify-between border text-center transition-all cursor-pointer select-none relative overflow-hidden group ${
                    isFilled
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 hover:bg-primary/95'
                      : 'bg-background-cream/40 border-primary/10 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {/* Clear cell button */}
                  {isFilled && (
                    <button
                      onClick={(e) => handleClearCell(e, cell.questionIndex)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                      title="Clear selection"
                    >
                      ×
                    </button>
                  )}

                  {/* Question (Top/Center) */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className={`leading-tight font-semibold line-clamp-3 ${
                      game.gridSize === 4 ? 'text-[9px] md:text-xs' : 'text-[8px] md:text-[10px]'
                    } ${isFilled ? 'text-white/80' : 'text-primary/90'}`}>
                      {cleanQuestion}
                    </span>
                  </div>

                  {/* Answer (Bottom) */}
                  <div className={`shrink-0 rounded-lg p-0.5 mt-1 truncate ${
                    isFilled
                      ? 'bg-white/15 text-white font-bold'
                      : 'bg-primary/5 text-primary/60 border border-dashed border-primary/10'
                  } ${game.gridSize === 4 ? 'text-[8px] md:text-[10px]' : 'text-[7px] md:text-[9px]'}`}>
                    {isFilled ? cell.filledWithPlayerName : '+ Add Person'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-32 flex flex-col min-h-0 bg-card-cream border border-primary/10 rounded-2xl p-4 shadow-sm">
        <h4 className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Bell className="w-3 h-3 text-gold" /> Live activity feed
        </h4>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {notifications.length === 0 ? (
            <div className="h-full flex items-center justify-center text-primary/45 text-[10px]">
              No activity yet. Let's make connections!
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className="flex items-start gap-1 text-[11px] leading-tight text-primary/80">
                <span className="text-gold">✨</span>
                <span>{n.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search Modal overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSelectParticipant}
        players={players}
        currentUser={player}
        card={card}
      />
    </div>
  );
};

export default PlayerGame;
