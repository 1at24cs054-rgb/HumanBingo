import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Users, Compass, Play, Sparkles, ArrowRight } from 'lucide-react';

export const PlayerJoin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinGame, loading } = useGame();
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Auto-extract code from URL query params (e.g. ?code=HB1234)
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!code.trim()) return;

    const playerProfile = await joinGame(name.trim(), code.toUpperCase().trim());
    if (playerProfile) {
      navigate('/lobby');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background-cream text-text-dark min-h-screen">
      {/* Floating Elements Background Effect */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-sage/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-12 right-8 w-32 h-32 bg-gold/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-primary/10 rounded-3xl text-primary animate-bounce">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl text-primary font-black tracking-tight leading-none uppercase">
            Human Bingo
          </h1>
          <p className="text-primary/75 font-medium text-sm">
            Freshers Orientation Networking Platform
          </p>
        </div>

        {/* Form Card */}
        <Card className="border border-primary/10 shadow-premium p-8 relative overflow-hidden bg-card-cream rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-sage"></div>

          <h2 className="text-xl font-bold text-primary mb-6 text-center">Join Event Lobby</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Your Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Game Code
              </label>
              <input
                id="code"
                type="text"
                required
                placeholder="e.g. HB1234"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !name.trim() || !code.trim()}
              className="w-full py-3.5 shadow-md shadow-primary/15 font-bold tracking-wide"
              icon={ArrowRight}
            >
              {loading ? 'Entering Lobby...' : 'Join the Lobby'}
            </Button>
          </form>
        </Card>

        {/* Networking Tips */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/5">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary/85">Welcome to the freshers experience.</p>
            <p className="text-xs text-primary/75 leading-relaxed">
              Join the lobby, meet your host, and get ready for a shared networking card that unlocks once the event begins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoin;
