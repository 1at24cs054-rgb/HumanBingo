import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Award, Download, ArrowLeft, RefreshCw, Trophy, Users, Compass, Flame, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = '/api';

export const Results = () => {
  const navigate = useNavigate();
  const { game, player, isAdmin, playerLeaveGame } = useGame();
  
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    if (!game?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/games/${game.id}/results`);
      setResultsData(res.data);
    } catch (err) {
      console.error('Failed to load results:', err);
      toast.error('Failed to load results data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (game?.id) {
      fetchResults();
    }
  }, [game?.id]);

  const handleExit = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      playerLeaveGame();
      navigate('/join');
    }
  };

  // CSV Export utility
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!resultsData || !resultsData.leaderboard) return;

    const headers = ['Rank', 'Player ID', 'Name', 'Squares Filled', 'Bingos Completed', 'Full Completion', 'Completed At'];
    const rows = resultsData.leaderboard.map(row => [
      row.rank,
      row.playerId,
      `"${row.name.replace(/"/g, '""')}"`,
      row.progress,
      row.bingos,
      row.completed ? 'YES' : 'NO',
      row.completedAt ? row.completedAt : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    downloadFile(csvContent, `Human_Bingo_${game?.id}_Results.csv`, 'text/csv;charset=utf-8;');
    toast.success('CSV results exported successfully!');
  };

  const exportToExcel = () => {
    if (!resultsData || !resultsData.leaderboard) return;
    const rows = resultsData.leaderboard.map((row) => [
      row.rank,
      row.playerId,
      row.name,
      row.progress,
      row.bingos,
      row.completed ? 'YES' : 'NO',
      row.completedAt || 'N/A'
    ]);
    const excelContent = ['Rank\tPlayer ID\tName\tSquares Filled\tBingos Completed\tFull Completion\tCompleted At', ...rows.map(row => row.join('\t'))].join('\n');
    downloadFile(excelContent, `Human_Bingo_${game?.id}_Results.xls`, 'application/vnd.ms-excel;charset=utf-8;');
    toast.success('Excel export downloaded successfully!');
  };

  const exportToPDF = () => {
    if (!resultsData || !resultsData.leaderboard) return;
    const lines = [
      `Human Bingo Results - ${game?.id}`,
      `Total Players: ${resultsData.totalPlayers}`,
      `Completed Players: ${resultsData.completedCardsCount}`,
      `Average Completion Time: ${Math.round(resultsData.averageCompletionTimeSeconds / 60)} min`,
      '',
      ...resultsData.leaderboard.map((row) => `${row.rank}. ${row.name} | Progress ${row.progress} | Bingos ${row.bingos}`)
    ];
    const pdfContent = `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length 0 >>stream\n${lines.join('\n')}\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000206 00000 n \n0000000300 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF`;
    downloadFile(pdfContent, `Human_Bingo_${game?.id}_Results.pdf`, 'application/pdf');
    toast.success('PDF export downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-cream p-4">
        <Compass className="w-8 h-8 text-primary animate-spin mb-2" />
        <span className="text-xs text-primary/60 font-semibold">Compiling final scores...</span>
      </div>
    );
  }

  if (!resultsData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-cream p-4 text-center">
        <Trophy className="w-12 h-12 text-primary/30 mb-2" />
        <h3 className="text-lg font-bold text-primary">No results found</h3>
        <p className="text-xs text-primary/60 max-w-xs mt-1">Make sure a game is in progress and has been ended by the host.</p>
        <Button onClick={handleExit} variant="secondary" className="mt-4">
          Exit Page
        </Button>
      </div>
    );
  }

  const { leaderboard, totalPlayers, completedCardsCount, averageFills, averageCompletionTimeSeconds } = resultsData;

  // Extract Podium
  // 1st is middle (index 0), 2nd is left (index 1), 3rd is right (index 2)
  const first = leaderboard[0] || null;
  const second = leaderboard[1] || null;
  const third = leaderboard[2] || null;

  return (
    <div className={`flex-1 flex flex-col p-4 md:p-8 bg-background-cream text-text-dark w-full min-h-screen ${
      isAdmin ? 'md:pl-64' : 'max-w-2xl mx-auto'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-primary/10">
        <div>
          <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
            Game Completed 🏆
          </span>
          <h2 className="text-2xl md:text-3xl text-primary font-black mt-2 leading-none">
            {game?.name} Results
          </h2>
          <p className="text-xs text-primary/60 mt-1.5 font-mono">Game Code: {game?.id}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={exportToCSV} variant="secondary" size="sm" icon={Download}>
            CSV
          </Button>
          <Button onClick={exportToExcel} variant="secondary" size="sm" icon={Download}>
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="secondary" size="sm" icon={Download}>
            PDF
          </Button>
          <Button onClick={handleExit} variant="primary" size="sm" icon={ArrowLeft}>
            {isAdmin ? 'Back to Dashboard' : 'Leave Game'}
          </Button>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <Card className="bg-gradient-to-b from-primary/10 via-card-cream to-card-cream border border-primary/10 rounded-3xl p-6 shadow-premium mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-primary/65 uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4 text-gold" /> Winner Podium
          </div>
          
          <div className="flex items-end justify-center w-full max-w-md h-56 gap-2 md:gap-4 pb-2">
            
            {/* 2nd Place */}
            {second && (
              <div className="flex flex-col items-center flex-1">
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-primary/10 border-2 border-slate-300 flex items-center justify-center font-bold text-primary shadow-sm relative mb-2">
                  {second.name.charAt(0).toUpperCase()}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                </div>
                <div className="text-xs font-bold text-primary text-center truncate max-w-[80px]">{second.name}</div>
                <div className="text-[10px] text-primary/70 font-bold mb-2">{second.progress} fills</div>
                <div className="w-full bg-slate-300/40 rounded-t-xl h-20 border-t border-x border-slate-300 flex items-center justify-center">
                  <span className="font-display font-black text-slate-500 text-2xl">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {first && (
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-gold/10 border-3 border-gold flex items-center justify-center font-bold text-primary shadow-md relative mb-2 animate-bounce">
                  {first.name.charAt(0).toUpperCase()}
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold text-white text-[11px] flex items-center justify-center font-bold shadow-sm">
                    <Trophy className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>
                <div className="text-sm font-black text-primary text-center truncate max-w-[100px]">{first.name}</div>
                <div className="text-xs font-bold text-gold mb-2">{first.progress} fills</div>
                <div className="w-full bg-gold/25 rounded-t-xl h-28 border-t border-x border-gold/40 flex items-center justify-center shadow-lg">
                  <span className="font-display font-black text-gold text-3xl">1st</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 border-2 border-amber-600/60 flex items-center justify-center font-bold text-primary shadow-sm relative mb-2">
                  {third.name.charAt(0).toUpperCase()}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                </div>
                <div className="text-xs font-bold text-primary text-center truncate max-w-[80px]">{third.name}</div>
                <div className="text-[10px] text-primary/70 font-bold mb-2">{third.progress} fills</div>
                <div className="w-full bg-amber-600/20 rounded-t-xl h-14 border-t border-x border-amber-600/30 flex items-center justify-center">
                  <span className="font-display font-black text-amber-700 text-lg">3rd</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 rounded-2xl flex items-center gap-3.5 bg-card-cream border border-primary/5 shadow-sm">
          <div className="p-3 rounded-xl bg-primary/5 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Total Roster</span>
            <div className="text-xl font-black text-primary">{totalPlayers}</div>
          </div>
        </Card>
        
        <Card className="p-4 rounded-2xl flex items-center gap-3.5 bg-card-cream border border-primary/5 shadow-sm">
          <div className="p-3 rounded-xl bg-gold/10 text-gold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Card Complete</span>
            <div className="text-xl font-black text-primary">{completedCardsCount}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center gap-3.5 bg-card-cream border border-primary/5 shadow-sm">
          <div className="p-3 rounded-xl bg-sage/20 text-primary">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Avg Fills</span>
            <div className="text-xl font-black text-primary">{averageFills}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center gap-3.5 bg-card-cream border border-primary/5 shadow-sm">
          <div className="p-3 rounded-xl bg-purple/10 text-purple">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-primary/60 uppercase">Avg Finish</span>
            <div className="text-xl font-black text-primary">
              {averageCompletionTimeSeconds > 0 ? `${Math.round(averageCompletionTimeSeconds / 60)} min` : 'N/A'}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-4">
          Roster Leaderboard ({leaderboard.length})
        </h3>
        
        <div className="bg-card-cream border border-primary/10 rounded-3xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 border-b border-primary/10 text-primary text-xs font-bold uppercase">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4 text-center">Fills</th>
                  <th className="py-3.5 px-4 text-center">Bingos</th>
                  <th className="py-3.5 px-4 text-center">Finished</th>
                  <th className="py-3.5 px-4 text-right">Player ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 text-sm">
                {leaderboard.map((row) => (
                  <tr
                    key={row.playerId}
                    className={`hover:bg-primary/5 transition-colors ${
                      row.playerId === player?.id ? 'bg-primary/5 font-semibold text-primary' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                    </td>
                    <td className="py-3 px-4">{row.name} {row.playerId === player?.id && '(You)'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-primary">{row.progress}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gold">{row.bingos}</td>
                    <td className="py-3 px-4 text-center">
                      {row.completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/20 text-success uppercase">
                          Done
                        </span>
                      ) : (
                        <span className="text-xs text-primary/45 font-medium">In Progress</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-primary/60">{row.playerId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
