import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SoundProvider } from './context/SoundContext';
import { GameProvider } from './context/GameContext';

// Player Pages
import PlayerJoin from './pages/PlayerJoin';
import PlayerLobby from './pages/PlayerLobby';
import PlayerGame from './pages/PlayerGame';
import Results from './pages/Results';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetup from './pages/AdminSetup';
import AdminParticipants from './pages/AdminParticipants';
import AdminLeaderboard from './pages/AdminLeaderboard';
import AdminSettings from './pages/AdminSettings';

// Admin Layout
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <SoundProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            {/* Player Routes */}
            <Route path="/" element={<Navigate to="/join" replace />} />
            <Route path="/join" element={<PlayerJoin />} />
            <Route path="/lobby" element={<PlayerLobby />} />
            <Route path="/game" element={<PlayerGame />} />
            <Route path="/results" element={<Results />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Nested Console Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="setup" element={<AdminSetup />} />
                    <Route path="participants" element={<AdminParticipants />} />
                    <Route path="leaderboard" element={<AdminLeaderboard />} />
                    <Route path="results" element={<Results />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/join" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
      </GameProvider>
    </SoundProvider>
  );
}

export default App;
