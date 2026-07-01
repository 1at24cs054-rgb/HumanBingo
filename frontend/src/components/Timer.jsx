import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const Timer = ({ game, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!game) return;

    const calculateTimeLeft = () => {
      if (game.status === 'setup' || game.status === 'lobby') {
        return game.timerDuration * 60;
      }
      
      if (game.status === 'paused') {
        return Math.max(0, Math.floor(game.timerRemaining || 0));
      }
      
      if (game.status === 'ended') {
        return 0;
      }

      if (game.status === 'active' && game.timerExpiresAt) {
        const expires = new Date(game.timerExpiresAt).getTime();
        const now = new Date().getTime();
        const difference = Math.floor((expires - now) / 1000);
        
        if (difference <= 0) {
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return difference;
      }

      return 0;
    };

    // Set initial value
    setTimeLeft(calculateTimeLeft());

    // Only set interval if game is actively running
    if (game.status !== 'active') {
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft > 0 && timeLeft < 60;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold transition-all ${
      isLowTime
        ? 'bg-error/10 border-error text-error animate-pulse scale-105'
        : game.status === 'paused'
        ? 'bg-gold/10 border-gold/30 text-gold'
        : 'bg-primary/5 border-primary/10 text-primary'
    }`}>
      <Clock className={`w-4 h-4 ${isLowTime ? 'animate-spin' : ''}`} />
      <span className="text-lg">{formatTime(timeLeft)}</span>
      {game.status === 'paused' && (
        <span className="text-xs uppercase font-sans tracking-wide px-1.5 py-0.5 rounded bg-gold/20 font-semibold">Paused</span>
      )}
    </div>
  );
};

export default Timer;
