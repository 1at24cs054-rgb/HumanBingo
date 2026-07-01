import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  ClipboardList, Sparkles, Save, Info, Lock, Plus, Trash2, GripVertical, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const SHARED_CARD_PROMPTS = [
  "loves to swim",
  "can play a musical instrument",
  "has the most letters in their last name",
  "does not like broccoli",
  "is afraid of spiders",
  "has had stitches",
  "is an only child",
  "wakes up early",
  "is a couch potato",
  "can whistle",
  "was born in January",
  "drank coffee this morning",
  "wears socks to bed",
  "bites his/her fingernails",
  "has more than four siblings",
  "has argued with a friend recently",
  "snores",
  "has seen a snake in the wild",
  "won a contest",
  "has fallen or thrown up in public",
  "enjoys maths",
  "can use chopsticks",
  "likes very spicy food",
  "hasn't had breakfast today",
  "watches more than one hour of TV every day"
];

const normalizeLoadedQuestions = (questions = [], gridCount) => {
  const normalized = [...questions].slice(0, gridCount);

  return normalized.map((q, index) => {
    if (/^Find someone who\.\.\. \(Square \d+\)$/.test(q.trim())) {
      return `Find someone who ${SHARED_CARD_PROMPTS[index]}`;
    }
    return q;
  });
};

export const AdminSetup = () => {
  const { game, updateGameSetup, loading, loadGameData } = useGame();

  const [name, setName] = useState('');
  const [gridSize, setGridSize] = useState(4);
  const [timerDuration, setTimerDuration] = useState(15);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Auto-restore game state if saved in localStorage
  useEffect(() => {
    if (!game) {
      const savedCode = localStorage.getItem('admin_game_code');
      if (savedCode) {
        loadGameData(savedCode);
      }
    }
  }, [game, loadGameData]);

  // Load current settings into form when game data is available
  useEffect(() => {
    if (game) {
      setName(game.name || '');
      setGridSize(game.gridSize || 4);
      setTimerDuration(game.timerDuration || 15);
      setLeaderboardVisible(game.leaderboardVisible !== false);
      
      const expectedCount = (game.gridSize || 4) * (game.gridSize || 4);
      let existingQs = normalizeLoadedQuestions(game.questions || [], expectedCount);
      
      // Ensure exact array size matching gridSize
      if (existingQs.length < expectedCount) {
        existingQs = [
          ...existingQs,
          ...Array(expectedCount - existingQs.length).fill('').map((_, i) => `Find someone who... (Square ${existingQs.length + i + 1})`)
        ];
      }
      setQuestions(existingQs.slice(0, expectedCount));
    }
  }, [game]);

  if (!game) {
    return (
      <div className="min-h-screen bg-background-cream text-text-dark flex flex-col items-center justify-center p-4 md:pl-64 text-center">
        <ClipboardList className="w-12 h-12 text-primary/30 mb-2" />
        <h3 className="text-lg font-bold text-primary">No active session</h3>
        <p className="text-xs text-primary/60 max-w-xs mt-1">Please create a game session on the Dashboard before configuring setup parameters.</p>
      </div>
    );
  }

  const gridCount = gridSize * gridSize;
  const isLocked = game.status !== 'setup';

  // Handle individual question change
  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleGridSizeChange = (size) => {
    if (isLocked || size === gridSize) return;
    const newCount = size * size;
    let updated = [...questions];

    if (updated.length > newCount) {
      updated = updated.slice(0, newCount);
    } else if (updated.length < newCount) {
      updated = [
        ...updated,
        ...Array(newCount - updated.length).fill('').map((_, i) => `Find someone who... (Square ${updated.length + i + 1})`)
      ];
    }

    setGridSize(size);
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    if (isLocked || questions.length >= gridCount) return;
    setQuestions([...questions, '']);
  };

  const handleDeleteQuestion = (index) => {
    if (isLocked) return;
    const updated = questions.filter((_, idx) => idx !== index);
    while (updated.length < gridCount) {
      updated.push('');
    }
    setQuestions(updated.slice(0, gridCount));
  };

  const handleMoveQuestion = (fromIndex, toIndex) => {
    if (isLocked) return;
    const updated = [...questions];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setQuestions(updated.slice(0, gridCount));
  };

  // Preseed questions helper
  const handlePreseedQuestions = () => {
    if (isLocked) return;
    
    // Apply the exact shared card prompts in fixed order
    const selected = SHARED_CARD_PROMPTS.slice(0, gridCount).map(q => `Find someone who ${q}`);
    setQuestions(selected);
    toast.success('Preseeded card squares with shared networking prompts!');
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast.error('Session configuration is locked. Setup cannot be changed after starting.');
      return;
    }

    // Validation: make sure all questions are filled out
    const emptyCount = questions.filter(q => !q.trim()).length;
    if (emptyCount > 0) {
      toast.error(`Please fill in all ${gridCount} bingo questions.`);
      return;
    }

    const success = await updateGameSetup(
      game.id,
      name.trim(),
      gridSize,
      timerDuration,
      leaderboardVisible,
      questions
    );

    if (success) {
      // Reload game context
      await loadGameData(game.id);
    }
  };

  return (
    <div className="min-h-screen bg-background-cream text-text-dark p-6 md:p-8 md:pl-72 space-y-6">
      
      {/* Top Header */}
      <div className="pb-4 border-b border-primary/10">
        <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
          Game Configuration
        </span>
        <h1 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
          Customise Bingo Setup
        </h1>
        <p className="text-xs text-primary/60 mt-2 font-mono">
          Game Code: {game.id} | Grid: {gridSize}×{gridSize} ({gridCount} squares)
        </p>
      </div>

      {/* Lock Notice banner if started */}
      {isLocked && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-semibold leading-relaxed">
          <Lock className="w-5 h-5 shrink-0" />
          <div>
            <strong>Configuration Locked:</strong> The game is currently in state <strong>{game.status.toUpperCase()}</strong>. 
            Setup values cannot be edited once the session has moved past setup.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Parameters Card */}
        <Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium space-y-5">
          <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
            <Info className="w-4 h-4 text-gold" /> Core Setup Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Event Name
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all font-medium disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Bingo Grid Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleGridSizeChange(4)}
                  disabled={isLocked}
                  className={`py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    gridSize === 4
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                      : 'bg-background-cream/50 border-primary/10 text-primary hover:bg-primary/5'
                  }`}
                >
                  4 × 4
                </button>
                <button
                  type="button"
                  onClick={() => handleGridSizeChange(5)}
                  disabled={isLocked}
                  className={`py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    gridSize === 5
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                      : 'bg-background-cream/50 border-primary/10 text-primary hover:bg-primary/5'
                  }`}
                >
                  5 × 5
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary/75 uppercase tracking-wider mb-2">
                Timer Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                required
                disabled={isLocked}
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-background-cream border border-primary/10 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all font-bold disabled:opacity-60"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isLocked}
                  checked={leaderboardVisible}
                  onChange={(e) => setLeaderboardVisible(e.target.checked)}
                  className="w-5 h-5 accent-primary border-primary/20 rounded focus:ring-primary/40 disabled:opacity-60 cursor-pointer"
                />
                <span className="text-xs font-semibold text-primary/75 uppercase tracking-wider">
                  Leaderboard Visible to Players
                </span>
              </label>
            </div>
          </div>
        </Card>

<Card className="p-6 rounded-3xl bg-card-cream border border-primary/10 shadow-premium space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-primary/5">
          <div>
            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Shared Card Builder
            </h3>
            <p className="text-[10px] text-primary/50 mt-1">Design the identical networking prompts that every participant receives</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-gold" />
              {previewMode ? 'Hide Preview' : 'Preview Card'}
            </button>
            {!isLocked && (
              <button
                type="button"
                onClick={handlePreseedQuestions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Use Starter Questions
              </button>
            )}
          </div>
        </div>

        <div className={`grid ${gridSize === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5'} gap-4`}>
          {questions.map((q, idx) => (
            <div 
              key={`${idx}-${q}`} 
              className={`p-3 rounded-2xl border bg-background-cream/40 flex flex-col justify-between ${
                q.trim() ? 'border-primary/10' : 'border-error/25 bg-error/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-primary/55 font-mono">
                  SQUARE {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  {!isLocked && (
                    <>
                      <button type="button" onClick={() => handleMoveQuestion(idx, Math.max(0, idx - 1))} className="p-1 rounded hover:bg-primary/10 text-primary/60 cursor-pointer" title="Move up">↑</button>
                      <button type="button" onClick={() => handleMoveQuestion(idx, Math.min(questions.length - 1, idx + 1))} className="p-1 rounded hover:bg-primary/10 text-primary/60 cursor-pointer" title="Move down">↓</button>
                      <button type="button" onClick={() => handleDeleteQuestion(idx)} className="p-1 rounded hover:bg-error/10 text-error cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>
              <textarea
                rows="3"
                required
                disabled={isLocked}
                placeholder="e.g. Find someone who plays guitar..."
                value={q}
                onChange={(e) => handleQuestionChange(idx, e.target.value)}
                className="w-full bg-white border border-primary/5 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-transparent transition-all resize-none placeholder:text-primary/20 text-text-dark"
              />
            </div>
          ))}
        </div>

        {!isLocked && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleAddQuestion} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all cursor-pointer shadow-sm">
              <Plus className="w-3.5 h-3.5 text-gold" /> Add Question
            </button>
          </div>
        )}

        {previewMode && (
          <div className="rounded-3xl border border-primary/10 bg-background-cream/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-primary/60 uppercase tracking-widest">Live Preview</div>
              <div className="text-[10px] text-primary/60">Shared card for every player</div>
            </div>
            <div className={`grid ${gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-2`}>
              {questions.slice(0, gridCount).map((q, idx) => (
                <div key={idx} className="rounded-2xl border border-primary/10 bg-card-cream p-2 text-[9px] text-primary/80 min-h-16 flex items-center justify-center text-center">
                  {q || `Question ${idx + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

        {/* Actions bar */}
        {!isLocked && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-8 font-bold shadow-md shadow-primary/25"
              icon={Save}
            >
              {loading ? 'Saving Changes...' : 'Save Bingo Card Setup'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminSetup;
