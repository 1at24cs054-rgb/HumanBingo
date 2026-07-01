import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { LayoutDashboard, Settings as SettingsIcon, Users, Trophy, ClipboardList, LogOut, Compass } from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { isAdmin, adminLogout, game } = useGame();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-cream">
        <Compass className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Game Setup', path: '/admin/setup', icon: ClipboardList },
    { name: 'Participants', path: '/admin/participants', icon: Users },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: Trophy },
    { name: 'Results', path: '/admin/results', icon: Trophy },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background-cream text-text-dark flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-white fixed h-screen top-0 left-0 z-20 p-5 shadow-lg">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-2xl bg-gold flex items-center justify-center text-primary font-black shadow-md shadow-gold/10">
            HB
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider leading-none uppercase text-white">Human Bingo</h1>
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1 block">Admin Console</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Current Active Session Badge */}
        {game && (
          <div className="bg-primary/30 border border-primary/20 p-3 rounded-2xl mb-4 text-xs space-y-1">
            <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">Active Session</span>
            <div className="font-bold truncate text-white">{game.name}</div>
            <div className="font-mono text-white/60 font-medium">Code: {game.id}</div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={adminLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-error/80 hover:bg-error/10 hover:text-error transition-all text-left w-full cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          Log Out
        </button>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-white/10 z-30 flex justify-around py-2 shadow-xl px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
                isActive ? 'text-gold' : 'text-white/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight leading-none uppercase">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Page Area Container */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
