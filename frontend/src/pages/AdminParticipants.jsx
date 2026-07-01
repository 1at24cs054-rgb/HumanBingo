import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeletons';
import { 
  Users, Search, Award, Flame, Calendar, Clock, 
  X, Filter, Eye, RefreshCw, AlertCircle, Sparkles, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = '/api';

export const AdminParticipants = () => {
  const { game, players, loadGameData, loading } = useGame();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [sortOption, setSortOption] = useState('progress');
  
  // Drawer/Modal for viewing individual card detail
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);

  // Auto-restore game state if saved in localStorage
  useEffect(() => {
    if (!game) {
      const savedCode = localStorage.getItem('admin_game_code');
      if (savedCode) {
        loadGameData(savedCode);
      }
    }
  }, [game, loadGameData]);

  // Trigger loading player card when modal opens
  const handleViewCard = async (player) => {
    if (!game) return;
    setSelectedPlayer(player);
    setSelectedPlayerCard(null);
    setLoadingCard(true);
    
    try {
      const res = await axios.get(`${API_BASE_URL}/games/${game.id}/players/${player.id}/card`);
      setSelectedPlayerCard(res.data);
    } catch (err) {
      console.error('Failed to fetch player card:', err);
      toast.error("Failed to retrieve participant's card details.");
      setSelectedPlayer(null);
    } finally {
      setLoadingCard(false);
    }
  };

  const handleRefreshRoster = async () => {
    if (!game) return;
    try {
      await loadGameData(game.id);
      toast.success('Roster refreshed!');
    } catch (err) {
      toast.error('Failed to refresh roster');
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark flex flex-col items-center justify-center p-4 md:pl-64 text-center">
        <Users className="w-12 h-12 text-primary/30 mb-2" />
        <h3 className="text-lg font-bold text-primary">No active session</h3>
        <p className="text-xs text-primary/60 max-w-xs mt-1">Please create a game session on the Dashboard before monitoring participants.</p>
      </div>
    );
  }

  // Filter players based on search and filters
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'completed') {
      return matchesSearch && p.bingoCardCompleted;
    }
    if (statusFilter === 'active') {
      return matchesSearch && !p.bingoCardCompleted && p.progress > 0;
    }
    if (statusFilter === 'empty') {
      return matchesSearch && (p.progress || 0) === 0;
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === 'joined') {
      return new Date(a.joinedAt || 0) - new Date(b.joinedAt || 0);
    }
    return (b.progress || 0) - (a.progress || 0);
  });

  const gridCount = game.gridSize * game.gridSize;

  return (
    <div className="min-h-screen bg-background-cream text-text-dark p-6 md:p-8 md:pl-72 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-primary/10">
        <div>
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
            Orientation Roster
          </span>
          <h1 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
            Registered Freshers ({players.length})
          </h1>
          <p className="text-xs text-primary/60 mt-1.5 font-mono">Game Code: {game.id}</p>
        </div>

        <button
          onClick={handleRefreshRoster}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Roster
        </button>
      </div>

      <Card className="p-4 rounded-2xl bg-card-cream border border-primary/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/45" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-cream border border-primary/10 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all placeholder:text-primary/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
          <span className="text-[10px] font-bold text-primary/60 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'bg-background-cream text-primary/75 hover:bg-primary/5'
            }`}
          >
            All ({players.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'bg-background-cream text-primary/75 hover:bg-primary/5'
            }`}
          >
            Completed ({players.filter(p => p.bingoCardCompleted).length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'bg-background-cream text-primary/75 hover:bg-primary/5'
            }`}
          >
            In Progress ({players.filter(p => !p.bingoCardCompleted && p.progress > 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('empty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'empty'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'bg-background-cream text-primary/75 hover:bg-primary/5'
            }`}
          >
            No Fills ({players.filter(p => (p.progress || 0) === 0).length})
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-background-cream px-2 py-1 border border-primary/10">
            <ArrowUpDown className="w-3.5 h-3.5 text-primary/60" />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-transparent text-xs font-bold text-primary/80 outline-none cursor-pointer">
              <option value="progress">Progress</option>
              <option value="name">Name</option>
              <option value="joined">Joined Time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Roster List */}
      {loading && players.length === 0 ? (
        <ListSkeleton count={4} />
      ) : filteredPlayers.length === 0 ? (
        <div className="py-20 text-center text-primary/45 text-sm bg-card-cream rounded-3xl border border-primary/5 shadow-sm">
          <Users className="w-10 h-10 mx-auto mb-2 text-primary/20 stroke-[1.25]" />
          No matching participants found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPlayers.map((p) => {
            const timeStr = p.joinedAt 
              ? new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'N/A';
            const progressPercent = Math.round(((p.progress || 0) / gridCount) * 100);
            return (
              <Card 
                key={p.id} 
                onClick={() => handleViewCard(p)}
                hoverable
                className="p-5 rounded-2xl bg-card-cream border border-primary/10 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                {p.bingoCardCompleted && (
                  <div className="absolute top-0 right-0 bg-success text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
                    COMPLETED
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-dark truncate max-w-[150px]">{p.name}</h4>
                      <span className="block text-[10px] font-mono text-primary/50 leading-none">ID: {p.id}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-background-cream/70 p-3 border border-primary/5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-primary/70">
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-gold" /> Progress</span>
                      <span className="font-black text-primary">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-primary/65">
                      <span>{p.progress || 0}/{gridCount} filled</span>
                      <span>{p.completedRowColDiagCount || 0} bingos</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/5 text-[10px] text-primary/60 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {timeStr}
                  </span>
                  <span className="text-primary hover:text-primary/95 flex items-center gap-0.5 font-bold cursor-pointer group-hover:translate-x-0.5 transition-transform">
                    View Card <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Participant Card Detail Drawer Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedPlayer(null)}
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-card-cream border border-primary/10 rounded-3xl p-6 shadow-premium z-10 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-primary/5 pb-3">
              <div>
                <span className="text-[10px] font-mono bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded font-semibold">
                  Participant Preview
                </span>
                <h3 className="text-xl text-primary font-black mt-1 leading-none">{selectedPlayer.name}</h3>
                <p className="text-[10px] text-primary/65 mt-1 font-mono">ID: {selectedPlayer.id} | Joined: {selectedPlayer.joinedAt ? new Date(selectedPlayer.joinedAt).toLocaleTimeString() : 'N/A'}</p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-xl hover:bg-primary/5 text-primary/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Loader */}
            {loadingCard ? (
              <div className="py-20 flex flex-col items-center justify-center text-primary/60">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
                <span className="text-xs font-semibold">Fetching bingo grid...</span>
              </div>
            ) : selectedPlayerCard ? (
              <div className="space-y-4">
                {/* Stats recap inside drawer */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-background-cream rounded-2xl border border-primary/5 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest block">Squares Filled</span>
                    <span className="text-lg font-black text-primary font-mono">{selectedPlayer.progress}/{gridCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest block">Bingos Formed</span>
                    <span className="text-lg font-black text-gold flex items-center justify-center gap-1"><Award className="w-4 h-4 fill-current text-gold" /> {selectedPlayer.completedRowColDiagCount || 0}</span>
                  </div>
                </div>

                {/* Grid UI */}
                <div className={`grid ${game.gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-1.5 p-2 bg-background-cream/50 border border-primary/5 rounded-2xl`}>
                  {selectedPlayerCard.grid.slice(0, gridCount).map((cell, idx) => {
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
                        className={`aspect-square rounded-lg p-1 flex flex-col justify-between border text-center relative overflow-hidden select-none ${
                          isFilled
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-white border-primary/5 text-primary/45'
                        }`}
                      >
                        {/* Index */}
                        <span className={`text-[7px] font-mono text-left font-bold ${isFilled ? 'text-white/40' : 'text-primary/20'}`}>
                          {idx + 1}
                        </span>

                        {/* Question Text */}
                        <div className="flex-1 flex items-center justify-center p-0.5">
                          <span className={`leading-none font-semibold line-clamp-3 text-[7px] ${
                            isFilled ? 'text-white/80' : 'text-primary/80'
                          }`}>
                            {cleanQuestion}
                          </span>
                        </div>

                        {/* Filled Name */}
                        <div className={`shrink-0 rounded p-0.5 text-[6px] truncate ${
                          isFilled ? 'bg-white/15 text-white font-bold' : 'bg-primary/5 text-primary/30 border border-dashed border-primary/10'
                        }`}>
                          {isFilled ? cell.filledWithPlayerName : 'Empty'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-error">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs font-semibold">Failed to load grid layout.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParticipants;
