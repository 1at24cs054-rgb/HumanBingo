import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, query, where } from 'firebase/firestore';

let app = null;
let db = null;

export function initFirebase(config) {
  try {
    if (!config) return { initialized: false };
    app = initializeApp(config);
    db = getFirestore(app);
    return { initialized: true };
  } catch (err) {
    console.warn('Firebase init failed', err);
    return { initialized: false };
  }
}

// Subscribe to game-related documents/collections and call back with consistent shapes
export function subscribeToGame(gameId, handlers = {}) {
  if (!db) return () => {};
  const unsubscribes = [];

  try {
    const gameDoc = doc(db, 'games', gameId);
    const unsubGame = onSnapshot(gameDoc, (snap) => {
      if (!snap.exists()) return;
      const data = { ...snap.data(), id: snap.id };
      handlers.onGame && handlers.onGame(data);
    });
    unsubscribes.push(unsubGame);

    const playersCol = collection(db, 'players');
    const qPlayers = query(playersCol, where('gameId', '==', gameId));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      const players = [];
      snap.forEach(d => players.push({ ...d.data(), id: d.id }));
      handlers.onPlayers && handlers.onPlayers(players);
    });
    unsubscribes.push(unsubPlayers);

    const cardsCol = collection(db, 'bingoCards');
    const qCards = query(cardsCol, where('gameId', '==', gameId));
    const unsubCards = onSnapshot(qCards, (snap) => {
      snap.forEach(d => {
        const payload = { ...d.data(), playerId: d.id };
        handlers.onCard && handlers.onCard(payload);
      });
    });
    unsubscribes.push(unsubCards);

    const resultsDoc = doc(db, 'results', gameId);
    const unsubResults = onSnapshot(resultsDoc, (snap) => {
      if (!snap.exists()) return;
      handlers.onResults && handlers.onResults(snap.data());
    });
    unsubscribes.push(unsubResults);
  } catch (err) {
    console.warn('subscribeToGame error', err);
  }

  return () => unsubscribes.forEach(u => typeof u === 'function' && u());
}
