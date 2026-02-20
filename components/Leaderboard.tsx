'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp, Lightbulb } from 'lucide-react';
import { getWeeklyLeaderboard } from '@/lib/supabase';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: number;
  total_quizzes_completed: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getWeeklyLeaderboard(10);
    setLeaderboard(data);
    
    // Get current user ID
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-600 to-amber-800';
      default:
        return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-500" />
          <div>
            <h3 className="text-2xl font-bold">Classifica Settimanale</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Top 10 studenti per XP totale
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            Nessun dato disponibile. Inizia a fare quiz per comparire in classifica!
          </p>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.user_id === currentUserId;

          return (
            <div
              key={entry.user_id}
              className={`
                relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                ${isCurrentUser 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-lg' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${rank <= 3 ? 'shadow-md' : ''}
              `}
            >
              {/* Rank Badge */}
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(rank)}
                ${rank <= 3 ? 'shadow-lg' : ''}
              `}>
                {getRankBadge(rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {isCurrentUser ? 'Tu' : `Utente ${entry.user_id.slice(0, 8)}`}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Lvl {entry.level}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.total_quizzes_completed} quiz completati
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {entry.total_xp.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
              </div>

              {/* Current User Indicator */}
              {isCurrentUser && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-lg">
                  Sei tu!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Message */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <p className="text-sm text-purple-900 dark:text-purple-100 flex items-start gap-2">
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span><strong>Come salire in classifica:</strong> Completa più quiz, mantieni la streak attiva e sblocca achievement per guadagnare XP bonus!</span>
        </p>
      </div>
    </div>
  );
}
