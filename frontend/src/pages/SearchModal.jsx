import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserCheck, Flame } from 'lucide-react';

export const SearchModal = ({
  isOpen,
  onClose,
  onSelect,
  players = [],
  currentUser = {},
  card = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Extract player IDs already filled on the current user's card
  const alreadyFilledPlayerIds = card?.grid
    ? card.grid.map(cell => cell.filledWithPlayerId).filter(Boolean)
    : [];

  // Filter players list:
  // 1. Cannot select self
  // 2. Cannot select player already placed on any cell of their card
  const eligiblePlayers = players.filter(p => {
    const isSelf = p.id === currentUser.id;
    const isAlreadyAdded = alreadyFilledPlayerIds.includes(p.id);
    return !isSelf && !isAlreadyAdded;
  });

  // Filter based on search query
  const filteredPlayers = eligiblePlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Avatar helper
  const getAvatarColor = (name) => {
    const colors = [
      'bg-primary/20 text-primary',
      'bg-gold/20 text-gold',
      'bg-sage/35 text-primary',
      'bg-purple/20 text-purple',
      'bg-error/20 text-error',
      'bg-success/20 text-success'
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-md bg-card-cream border border-primary/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-premium overflow-hidden z-10 max-h-[85vh] sm:max-h-[75vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h3 className="text-lg text-primary font-bold">Search Registered Freshers</h3>
              <p className="text-xs text-primary/60">Find and select your new classmate</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-primary/5 text-primary/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/45" />
            <input
              type="text"
              placeholder="Search classmates by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background-cream border border-primary/10 rounded-2xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder:text-primary/30"
              autoFocus
            />
          </div>

          {/* Roster list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {filteredPlayers.length === 0 ? (
              <div className="py-12 text-center text-primary/45 text-sm">
                {searchQuery ? 'No matching freshers found.' : 'All eligible freshers are already on your card!'}
              </div>
            ) : (
              filteredPlayers.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="flex items-center justify-between p-3.5 bg-background-cream/45 border border-primary/5 rounded-2xl hover:bg-primary/5 hover:border-primary/15 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center ${getAvatarColor(p.name)}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-dark group-hover:text-primary transition-colors">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-primary/65 mt-0.5">
                        <span className="font-mono">ID: {p.id}</span>
                        {p.progress > 0 && (
                          <span className="flex items-center gap-0.5 text-gold font-bold">
                            <Flame className="w-2.5 h-2.5 fill-current" /> {p.progress} tiles
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-primary/5 text-primary opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SearchModal;
