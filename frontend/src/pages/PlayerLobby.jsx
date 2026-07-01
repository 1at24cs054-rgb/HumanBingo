import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Compass, Users, Sparkles, LogOut, Copy, Check, Clock3, MessageCircleHeart, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';

export const PlayerLobby = () => {
  const navigate = useNavigate();
  const { game, players, player, playerLeaveGame } = useGame();
  const [copied, setCopied] = React.useState(false);

  // Check if player is registered, redirect to join if not
  useEffect(() => {
    if (!player) {
      navigate('/join');
    }
  }, [player, navigate]);

  // Redirect to active game screen if game starts
  useEffect(() => {
    if (game && (game.status === 'active' || game.status === 'paused')) {
      navigate('/game');
    }
  }, [game, navigate]);

  const handleLeave = () => {
    playerLeaveGame();
    navigate('/join');
  };

  const estimatedDuration = game?.timerDuration ? `${game.timerDuration} min` : '20 min';

  const copyInviteLink = async () => {
    if (!game) return;
    const url = `${window.location.origin}/join?code=${game.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (!game || !player) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-cream p-4">
        <Compass className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Predefined avatar color classes based on student name letter
  const getAvatarColor = (name) => {
    const colors = [
      'bg-primary/20 text-primary',
      'bg-gold/20 text-gold',
      'bg-sage/30 text-primary',
      'bg-purple/20 text-purple',
      'bg-error/20 text-error',
      'bg-success/20 text-success'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-background-cream text-text-dark max-w-5xl mx-auto w-full min-h-screen relative">
      {/* Top Bar Actions */}
      <div className="flex justify-between items-center py-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            HB
          </div>
          <span className="font-display font-bold text-primary">Lobby</span>
        </div>
        <button
          onClick={handleLeave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-error bg-error/10 hover:bg-error/15 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Leave
        </button>
      </div>

      <Card className="border border-primary/10 shadow-premium p-5 rounded-3xl bg-card-cream mb-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">
                Waiting for Host
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-primary leading-tight">{game.name}</h2>
              <p className="text-sm text-primary/70 mt-1">Your shared networking card will unlock as soon as the host begins the session.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background-cream/70 p-3 border border-primary/5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60">Player ID</div>
                <div className="text-base font-black text-primary mt-1">{player.id}</div>
              </div>
              <div className="rounded-2xl bg-background-cream/70 p-3 border border-primary/5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60">Game Code</div>
                <div className="text-base font-black text-primary mt-1">{game.id}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 text-sm text-primary/80">
                <Users className="w-4 h-4 text-primary" /> {players.length} joined
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1.5 text-sm text-primary/80">
                <Clock3 className="w-4 h-4 text-gold" /> Est. {estimatedDuration}
              </div>
            </div>
            <button
              onClick={copyInviteLink}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm text-primary bg-primary/5 rounded-xl hover:bg-primary/10 border border-primary/10 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Invite link copied' : 'Copy invite link'}
            </button>
          </div>

          <div className="w-full lg:w-72 rounded-3xl bg-gradient-to-br from-primary/10 via-card-cream to-gold/10 p-4 border border-primary/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <PartyPopper className="w-4 h-4 text-gold" /> Freshers ready to mingle
            </div>
            <div className="mt-4 h-32 rounded-2xl bg-background-cream/70 border border-primary/5 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-black text-primary">{players.length}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60">Live participant count</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-primary/75">
              <MessageCircleHeart className="w-4 h-4 text-primary" />
              Start conversations, swap stories, and make your first campus connections.
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] flex-1">
        <div className="bg-card-cream border border-primary/10 rounded-3xl p-4 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-wider">Who’s joining ({players.length})</h3>
            <span className="text-[10px] font-semibold text-primary/60">Live roster</span>
          </div>
          <div className="space-y-2 max-h-[270px] overflow-y-auto pr-1">
            {players.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-primary/40 text-xs">
                <Users className="w-8 h-8 mb-2 stroke-[1.5]" />
                <span>Lobby is empty. Ask friends to join!</span>
              </div>
            ) : (
              players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    p.id === player.id
                      ? 'bg-primary/5 border-primary/20 shadow-sm'
                      : 'bg-background-cream/50 border-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center ${getAvatarColor(p.name)}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${p.id === player.id ? 'text-primary' : 'text-text-dark'}`}>
                        {p.name} {p.id === player.id && '(You)'}
                      </div>
                      <div className="text-[10px] text-primary/55">{p.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary/60 bg-primary/5 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span>Joined</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4 rounded-3xl bg-card-cream border border-primary/10 shadow-premium">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="w-4 h-4 text-gold" /> Networking tips
            </div>
            <ul className="mt-3 space-y-2 text-sm text-primary/75">
              <li>• Ask about their course, hobbies, or campus favourites.</li>
              <li>• Keep a warm introduction ready for the first conversation.</li>
              <li>• Be curious and enjoy the shared card challenge.</li>
            </ul>
          </Card>
          <Card className="p-4 rounded-3xl bg-card-cream border border-primary/10 shadow-premium">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">Status</div>
            <div className="mt-2 text-sm text-primary/80">The host will start the session shortly. Once it begins, your card will unlock and the game will begin.</div>
          </Card>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-primary/60 border-t border-primary/5 bg-background-cream animate-pulse mt-4">
        The host will start the orientation bingo shortly...
      </div>
    </div>
  );
};

export default PlayerLobby;
