import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSound } from './SoundContext';

const GameContext = createContext();

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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

const normalizeGameQuestions = (questions = []) => {
  return [...questions].map((q, index) => {
    const text = String(q || '').trim();
    if (/^Find someone who\.\.\. \(Square \d+\)$/.test(text) && index < SHARED_CARD_PROMPTS.length) {
      return `Find someone who ${SHARED_CARD_PROMPTS[index]}`;
    }
    return text;
  });
};

const normalizeGamePayload = (game) => {
  if (!game) return game;
  return {
    ...game,
    questions: normalizeGameQuestions(game.questions || [])
  };
};

export const GameProvider = ({ children }) => {
  const { playSound } = useSound();
  
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('admin_token'));
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('player_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const eventSourceRef = useRef(null);
  const firebaseUnsubRef = useRef(null);

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Try to load player card if profile exists
  useEffect(() => {
    if (player && player.id && player.gameId) {
      fetchPlayerCard(player.gameId, player.id);
      loadGameData(player.gameId);
    }
  }, [player]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- REST Calls ---

  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      localStorage.setItem('admin_token', res.data.access_token);
      setIsAdmin(true);
      toast.success('Welcome back, Admin!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
    disconnectSSE();
    setGame(null);
    setPlayers([]);
    setLeaderboard([]);
    setNotifications([]);
    toast.success('Logged out successfully');
  };

  const createGame = async (name, gridSize, timerDuration) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/games`, { name, gridSize, timerDuration });
      toast.success(`Game ${res.data.id} created!`);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadGameData = async (code) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/games/${code}`);
      setGame(normalizeGamePayload(res.data));
      
      const playersRes = await axios.get(`${API_BASE_URL}/games/${code}/players`);
      setPlayers(playersRes.data);

      const leaderboardRes = await axios.get(`${API_BASE_URL}/games/${code}/leaderboard`);
      setLeaderboard(leaderboardRes.data);
      
      return res.data;
    } catch (err) {
      console.error('Failed to load game details:', err);
      return null;
    }
  };

  const updateGameSetup = async (code, name, gridSize, timerDuration, leaderboardVisible, questions) => {
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/games/${code}/setup`,
        { name, gridSize, timerDuration, leaderboardVisible, questions },
        { headers: getAuthHeaders() }
      );
      setGame(res.data);
      toast.success('Game setup updated successfully!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update setup');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const controlGame = async (code, action) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/games/${code}/control`,
        { status: action },
        { headers: getAuthHeaders() }
      );
      setGame(res.data);
      toast.success(`Game status updated to ${action.toUpperCase()}`);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} game`);
      return null;
    }
  };

  const startNewSession = async (code) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/games/${code}/new-session`, {}, { headers: getAuthHeaders() });
      setGame(res.data);
      toast.success(`Started a fresh session with code ${res.data.id}`);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start a new session');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (name, gameCode) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/games/${gameCode}/join`, { name, gameCode });
      const { player: playerProfile, card: playerCard, game: gameDetails } = res.data;
      
      setPlayer(playerProfile);
      setCard(playerCard);
      setGame(gameDetails);
      
      localStorage.setItem('player_profile', JSON.stringify(playerProfile));
      toast.success(`Successfully joined as ${playerProfile.name}!`);
      
      playSound('join');
      return playerProfile;
    } catch (err) {
      // Map common backend errors to friendly messages
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      let message = 'Failed to join game';
      if (status === 404) {
        message = 'Game not found. Check the Game Code.';
      } else if (status === 400) {
        if (detail && typeof detail === 'string') message = detail;
        else message = 'Cannot join this game. Please check the session status.';
      } else if (!err.response) {
        message = 'Connection lost. Check your network and try again.';
      }
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const playerLeaveGame = () => {
    localStorage.removeItem('player_profile');
    setPlayer(null);
    setCard(null);
    setGame(null);
    disconnectSSE();
    toast.success('Left the game lobby');
  };

  const fetchPlayerCard = async (code, playerId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/games/${code}/players/${playerId}/card`);
      setCard(res.data);
    } catch (err) {
      console.error('Failed to fetch player card:', err);
    }
  };

  const fillTile = async (code, playerId, questionIndex, targetPlayerId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/games/${code}/players/${playerId}/fill`, {
        questionIndex,
        filledWithPlayerId: targetPlayerId
      });
      setCard(res.data);
      
      // Update target player profile locally
      const updatedPlayerRes = await axios.get(`${API_BASE_URL}/games/${code}/players`);
      setPlayers(updatedPlayerRes.data);
      
      // Play fill audio chime
      if (targetPlayerId !== null) {
        playSound('fill');
      }
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Validation failed');
      return false;
    }
  };

  // --- Real-time SSE Connection ---

  const connectSSE = (code) => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
  }

  const es = new EventSource(`${API_BASE_URL}/games/${code}/sse`);
  eventSourceRef.current = es;

  es.onopen = () => {
  console.log("✅ SSE Connected");

  if (eventSourceRef.current !== es) {
    eventSourceRef.current = es;
  }
};

  es.addEventListener("initial_state", (e) => {
    const data = JSON.parse(e.data);

    setGame(normalizeGamePayload(data.game));
    setPlayers(data.players || []);
    setLeaderboard(data.leaderboard || []);
    setNotifications(data.notifications || []);
  });

  es.addEventListener("game_update", (e) => {
    setGame(normalizeGamePayload(JSON.parse(e.data)));
  });

  es.addEventListener("player_update", (e) => {
    const data = JSON.parse(e.data);

    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === data.id);

      if (idx === -1) return [...prev, data];

      const updated = [...prev];
      updated[idx] = data;
      return updated;
    });
  });

  es.addEventListener("leaderboard_update", (e) => {
    setLeaderboard(JSON.parse(e.data));
  });

  es.addEventListener("notification", (e) => {
    const data = JSON.parse(e.data);

    setNotifications((prev) => [data, ...prev].slice(0, 30));
  });

 es.onerror = () => {
  console.warn("SSE disconnected");

  es.close();
  eventSourceRef.current = null;

  setTimeout(() => {
    if (game?.id && !eventSourceRef.current) {
      console.log("Reconnecting SSE...");
      connectSSE(game.id);
    }
  }, 3000);
};

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Connect automatically if game code is loaded. Prefer Firestore listeners when config present.
  useEffect(() => {
    const cfg = window.__FIREBASE_CONFIG__;
    let usingFirebase = false;
    if (game?.id) {
      if (cfg) {
        // Lazy-import firebase helper to avoid bundling unless used
        import('../lib/firebase').then(({ initFirebase, subscribeToGame }) => {
          const ok = initFirebase(cfg);
          if (ok.initialized) {
            usingFirebase = true;
            // subscribe and store cleanup
            firebaseUnsubRef.current = subscribeToGame(game.id, {
              onGame: (g) => setGame(g),
              onPlayers: (pl) => setPlayers(pl),
              onCard: (cardPayload) => {
                if (player && cardPayload.playerId === player.id) setCard(cardPayload);
              },
              onResults: (r) => {
                // Results saved in DB; map to leaderboard if provided
                if (r && r.leaderboard) setLeaderboard(r.leaderboard);
              }
            });
          }
        }).catch(err => {
          console.warn('Failed to init firebase listeners', err);
          connectSSE(game.id);
        });
      }

      // If no firebase config, fallback to SSE
      if (!cfg) {
        connectSSE(game.id);
      }
    }

    return () => {
      // cleanup both SSE and firebase listeners
      disconnectSSE();
      if (firebaseUnsubRef.current) {
        try { firebaseUnsubRef.current(); } catch(e){}
        firebaseUnsubRef.current = null;
      }
    };
  }, [game?.id]);

  return (
    <GameContext.Provider value={{
      isAdmin,
      game,
      players,
      leaderboard,
      notifications,
      player,
      card,
      loading,
      isDarkMode,
      toggleDarkMode,
      adminLogin,
      adminLogout,
      createGame,
      loadGameData,
      updateGameSetup,
      controlGame,
      startNewSession,
      joinGame,
      playerLeaveGame,
      fetchPlayerCard,
      fillTile,
      connectSSE,
      disconnectSSE
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
