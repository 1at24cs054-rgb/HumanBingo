import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  Settings, Trash2, LogOut, RefreshCw, AlertTriangle, 
  ShieldCheck, Info, Calendar, Database 
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const AdminSettings = () => {
  const navigate = useNavigate();
  const { game, adminLogout, controlGame, loadGameData } = useGame();
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-restore game state if saved in localStorage
  useEffect(() => {
    if (!game) {
      const savedCode = localStorage.getItem('admin_game_code');
      if (savedCode) {
        loadGameData(savedCode);
      }
    }
  }, [game, loadGameData]);

  if (!game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark flex flex-col items-center justify-center p-4 md:pl-64 text-center">
        <Settings className="w-12 h-12 text-primary/30 mb-2" />
        <h3 className="text-lg font-bold text-primary">No active session</h3>
        <p className="text-xs text-primary/60 max-w-xs mt-1">Please create a game session on the Dashboard before editing settings.</p>
      </div>
    );
  }

  // Action: Reset session back to lobby
  const handleResetSession = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset this game back to the Lobby? This will unlock editing, reset timers, but KEEP the player roster."
    );
    if (confirmReset) {
      await controlGame(game.id, 'lobby');
    }
  };

  // Action: Delete game session completely
  const handleDeleteSession = async () => {
    const confirmDelete = window.confirm(
      "CRITICAL WARNING: This will permanently delete the game session, all players, all bingo cards, and all statistics from the database. This action is irreversible. Proceed?"
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(`${API_BASE_URL}/games/${game.id}`, { headers });
      
      toast.success('Game session and all associated database records deleted successfully!');
      
      // Cleanup locally
      localStorage.removeItem('admin_game_code');
      adminLogout(); // disconnect SSE & clear context
      navigate('/admin/login');
    } catch (err) {
      console.error('Failed to delete game session:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete the session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background-cream text-text-dark p-6 md:p-8 md:pl-72 space-y-6">
      
      {/* Top Header */}
      <div className="pb-4 border-b border-primary/10">
        <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
          Console Settings
        </span>
        <h1 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
          Admin Control & Settings
        </h1>
        <p className="text-xs text-primary/60 mt-1.5 font-mono">Session ID: {game.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Info & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Overview Card */}
          <Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-4 h-4 text-gold" /> Active Session Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div className="p-3 bg-background-cream/40 rounded-xl border border-primary/5 flex items-center gap-3">
                <Database className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-[10px] text-primary/50 block font-bold uppercase leading-none mb-0.5">Database Store Mode</span>
                  <span>Local JSON Storage</span>
                </div>
              </div>

              <div className="p-3 bg-background-cream/40 rounded-xl border border-primary/5 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-[10px] text-primary/50 block font-bold uppercase leading-none mb-0.5">Creation Timestamp</span>
                  <span>{game.createdAt ? new Date(game.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security details card */}
          <Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" /> Credentials & Access
            </h3>
            <p className="text-xs text-primary/75 leading-relaxed">
              This admin dashboard is authenticated using a JWT bearer token stored securely in local session. 
              The session automatically logs out upon token expiration (configured for 6 hours).
            </p>
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-error bg-error/10 hover:bg-error/15 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" /> End Admin Session (Log Out)
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column - Destructive Danger Zone */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl bg-card-cream border border-error/15 shadow-premium space-y-4 relative overflow-hidden">
            {/* Danger strip top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-error"></div>

            <h3 className="text-xs font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-error" /> Danger Zone Actions
            </h3>

            <p className="text-xs text-primary/70 leading-relaxed mb-4">
              These commands modify database records permanently. Exercise extreme caution.
            </p>

            <div className="space-y-3.5">
              {/* Reset session button */}
              <div className="space-y-1">
                <button
                  onClick={handleResetSession}
                  className="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-xs text-primary bg-sage/20 border border-sage/40 hover:bg-sage/35 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Game back to Lobby
                </button>
                <span className="block text-[9px] text-primary/50 text-center">Resets countdown and grid fills lock. Roster remains intact.</span>
              </div>

              <hr className="border-primary/5 my-2" />

              {/* Delete session button */}
              <div className="space-y-1">
                <button
                  onClick={handleDeleteSession}
                  disabled={isDeleting}
                  className="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-xs text-white bg-error hover:bg-error/90 disabled:opacity-50 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-error/10"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting Session...' : 'Delete Session Permanently'}
                </button>
                <span className="block text-[9px] text-error/70 text-center font-semibold">Wipes game session, players, cards, and all metrics.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
