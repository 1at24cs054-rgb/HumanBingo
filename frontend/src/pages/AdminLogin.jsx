import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Lock, Compass, Eye, EyeOff } from 'lucide-react';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdmin, loading } = useGame();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    const success = await adminLogin(username, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background-cream min-h-screen text-text-dark">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-12 right-8 w-32 h-32 bg-gold/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-primary/10 rounded-3xl text-primary animate-bounce">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl text-primary font-black tracking-tight uppercase">Admin Console</h1>
          <p className="text-primary/75 font-medium text-sm">
            Control the Human Bingo network session
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-primary/10 shadow-premium p-8 relative overflow-hidden bg-card-cream rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-sage"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary/45 hover:text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !username || !password}
              className="w-full py-3.5 shadow-md shadow-primary/15 font-bold tracking-wide"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Credentials Reminder */}
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5 text-center">
          <p className="text-xs text-primary/75 leading-relaxed">
            <strong>Testing Account:</strong> Use username <code className="bg-primary/10 px-1 py-0.5 rounded text-primary font-bold">admin</code> and password <code className="bg-primary/10 px-1 py-0.5 rounded text-primary font-bold">password123</code> to evaluate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
