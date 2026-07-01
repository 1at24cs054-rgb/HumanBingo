import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Timer } from '../components/Timer';
import { 
  Trophy, Users, Award, Flame, Maximize2, Minimize2, 
  Sparkles, Compass, Bell, Volume2, VolumeX, Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminLeaderboard = () => {
  const { game, leaderboard, notifications, loadGameData } = useGame();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevNotificationsLength = useRef(0);

  // Auto-restore game state if saved in localStorage
  useEffect(() => {
    if (!game) {
      const savedCode = localStorage.getItem('admin_game_code');
      if (savedCode) {
        loadGameData(savedCode);
      }
    }
  }, [game, loadGameData]);

  // Listen to new notifications and trigger confetti on Bingo or Completions
  useEffect(() => {
    if (notifications && notifications.length > prevNotificationsLength.current) {
      const latestNotif = notifications[0]; // notifications are unshifted (newest first)
      
      if (latestNotif) {
        if (latestNotif.type === 'complete') {
          // School-wide completion explosion
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });
          // Secondary bursts
          setTimeout(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
          }, 200);
          setTimeout(() => {
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
          }, 400);
        } else if (latestNotif.type === 'bingo') {
          // Normal bingo burst
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      }
    }
    prevNotificationsLength.current = notifications ? notifications.length : 0;
  }, [notifications]);

  if (!game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark flex flex-col items-center justify-center p-4 md:pl-64 text-center">
        <Trophy className="w-12 h-12 text-primary/30 mb-2" />
        <h3 className="text-lg font-bold text-primary">No active session</h3>
        <p className="text-xs text-primary/60 max-w-xs mt-1">Please create a game session on the Dashboard before displaying the leaderboard.</p>
      </div>
    );
  }

  const gridCount = game.gridSize * game.gridSize;

  // Extract Podium
  const podiumTop3 = leaderboard.slice(0, 3);
  const leaderboardRest = leaderboard.slice(3, 15); // Show up to top 15

  const first = podiumTop3[0] || null;
  const second = podiumTop3[1] || null;
  const third = podiumTop3[2] || null;

  // Outer Wrapper Class matching Fullscreen mode
  const pageContainerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background-cream text-text-dark p-6 overflow-y-auto flex flex-col justify-between"
    : "min-h-screen bg-background-cream text-text-dark p-6 md:p-8 md:pl-72 space-y-6 flex flex-col justify-between";

  return (
    <div className={pageContainerClass}>
      
      {/* Top Banner Control Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-primary/10 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-gold fill-current" /> Live Scoreboard
            </span>
            {game.status === 'active' && (
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping"></span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
            {game.name} Leaderboard
          </h1>
          <p className="text-xs text-primary/60 mt-1.5 font-mono">Game Code: {game.id} | Size: {game.gridSize}x{game.gridSize}</p>
        </div>

        <div className="flex items-center gap-3">
          <Timer game={game} />
          
          {/* Fullscreen project toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all cursor-pointer shadow-sm shadow-primary/5"
            title="Toggle Projector Mode"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" /> Projector Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main score layout splits: left podium & leaderboard lists, right notification stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 my-6 min-h-0">
        
        {/* Left Columns (Podium and score lists) */}
        <div className="lg:col-span-2 flex flex-col space-y-6 min-h-0">
          
          {/* Winner Podium */}
          {leaderboard.length > 0 && (
            <Card className="bg-gradient-to-b from-primary/10 via-card-cream to-card-cream border border-primary/10 rounded-3xl p-5 shadow-premium flex flex-col items-center shrink-0">
              <div className="flex items-end justify-center w-full max-w-sm h-48 gap-3 pb-1">
                
                {/* 2nd Place */}
                {second && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-slate-300 flex items-center justify-center font-bold text-primary shadow-sm relative mb-2 text-xs">
                      {second.name.charAt(0).toUpperCase()}
                      <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-300 text-white text-[9px] flex items-center justify-center font-bold">2</span>
                    </div>
                    <div className="text-[11px] font-bold text-primary text-center truncate max-w-[70px]">{second.name}</div>
                    <div className="text-[9px] text-primary/70 font-black mb-1.5">{second.progress} fills</div>
                    <div className="w-full bg-slate-300/35 rounded-t-xl h-16 border-t border-x border-slate-300/50 flex items-center justify-center">
                      <span className="font-display font-black text-slate-500 text-lg">2nd</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {first && (
                  <div className="flex flex-col items-center flex-1 z-10">
                    <div className="w-13 h-13 rounded-full bg-gold/10 border-3 border-gold flex items-center justify-center font-bold text-primary shadow-md relative mb-2 animate-bounce">
                      {first.name.charAt(0).toUpperCase()}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                        🥇
                      </span>
                    </div>
                    <div className="text-xs font-black text-primary text-center truncate max-w-[85px]">{first.name}</div>
                    <div className="text-[10px] font-black text-gold mb-1.5">{first.progress} fills</div>
                    <div className="w-full bg-gold/20 rounded-t-xl h-24 border-t border-x border-gold/30 flex items-center justify-center shadow-md">
                      <span className="font-display font-black text-gold text-xl">1st</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {third && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-amber-600/50 flex items-center justify-center font-bold text-primary shadow-sm relative mb-2 text-xs">
                      {third.name.charAt(0).toUpperCase()}
                      <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-600 text-white text-[9px] flex items-center justify-center font-bold">3</span>
                    </div>
                    <div className="text-[11px] font-bold text-primary text-center truncate max-w-[70px]">{third.name}</div>
                    <div className="text-[9px] text-primary/70 font-black mb-1.5">{third.progress} fills</div>
                    <div className="w-full bg-amber-600/15 rounded-t-xl h-11 border-t border-x border-amber-600/25 flex items-center justify-center">
                      <span className="font-display font-black text-amber-700 text-sm">3rd</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Roster leaderboard rest list */}
          <div className="flex-1 bg-card-cream border border-primary/10 rounded-3xl p-4 overflow-y-auto shadow-premium min-h-[220px]">
            {leaderboard.length === 0 ? (
              <div className="h-full flex items-center justify-center text-primary/45 py-20 text-xs">
                Roster is empty. No participants have registered.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((row, idx) => {
                  const percent = Math.round((row.progress / gridCount) * 100);
                  
                  return (
                    <div
                      key={row.playerId}
                      className="flex items-center gap-3 p-3 bg-background-cream/45 border border-primary/5 rounded-2xl hover:bg-background-cream transition-all shadow-sm"
                    >
                      {/* Rank badge */}
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-black text-xs text-primary font-mono shrink-0">
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs font-bold text-text-dark mb-1">
                          <span className="truncate">{row.name}</span>
                          <span className="font-mono text-[10px] text-primary/60">{row.progress}/{gridCount} tiles ({percent}%)</span>
                        </div>
                        {/* Progress Bar Gauge */}
                        <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden border border-primary/5">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Badges / Extras */}
                      <div className="flex gap-1.5 items-center shrink-0">
                        {row.bingos > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black bg-gold/10 text-gold border border-gold/15 uppercase">
                            <Flame className="w-2.5 h-2.5 fill-current" /> {row.bingos}
                          </span>
                        )}
                        {row.completed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black bg-success text-white uppercase tracking-wider">
                            COMPLETE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live activity notification feed ticker */}
        <Card className="p-5 rounded-3xl bg-card-cream border border-primary/10 shadow-premium flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-gold animate-bounce" /> Orientation Feed
            </h3>
            <span className="text-[9px] font-bold bg-gold/15 text-gold border border-gold/25 px-2.5 py-0.5 rounded-full">
              LIVE BROADCAST
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 text-xs">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/45 py-20">
                <Bell className="w-8 h-8 mb-2 stroke-[1.25]" />
                <span>Waiting for student connections...</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-xl border transition-all ${
                    n.type === 'complete' 
                      ? 'bg-success/15 border-success/35 text-text-dark font-black' 
                      : n.type === 'bingo' 
                      ? 'bg-gold/10 border-gold/25 text-text-dark font-bold' 
                      : 'bg-background-cream/40 border-primary/5 text-primary/85'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gold shrink-0">
                      {n.type === 'complete' ? '👑' : n.type === 'bingo' ? '🎉' : '⚡'}
                    </span>
                    <div className="flex-1 leading-snug">
                      {n.message}
                      <span className="block text-[8px] text-primary/40 mt-1">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Footer Branding Info */}
      <div className="py-2 text-center text-[10px] text-primary/40 uppercase tracking-widest border-t border-primary/5 shrink-0">
        Orientations 2026 • Powered by Human Bingo
      </div>
    </div>
  );
};

export default AdminLeaderboard;
