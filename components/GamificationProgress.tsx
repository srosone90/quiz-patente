'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, TrendingUp, Award, Lock } from 'lucide-react';
import { 
  getUserProgress, 
  getUserAchievements, 
  getAchievements,
  getXPProgress,
  type UserProgress, 
  type Achievement,
  type UserAchievement
} from '@/lib/supabase';

interface GamificationProgressProps {
  userId: string;
}

export default function GamificationProgress({ userId }: GamificationProgressProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [userId]);

  const loadGamificationData = async () => {
    setLoading(true);
    const [progressData, allAchievements, unlockedAchievements] = await Promise.all([
      getUserProgress(userId),
      getAchievements(),
      getUserAchievements(userId)
    ]);

    setProgress(progressData);
    setAchievements(allAchievements);
    setUserAchievements(unlockedAchievements);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-8 text-gray-500">
        Inizia a fare quiz per vedere il tuo progresso!
      </div>
    );
  }

  const xpProgress = getXPProgress(progress.total_xp, progress.level);
  const unlockedCodes = userAchievements.map(ua => ua.achievement?.code);

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-90">Livello</div>
            <div className="text-4xl font-bold">{progress.level}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">XP Totale</div>
            <div className="text-2xl font-semibold">{progress.total_xp.toLocaleString()}</div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs opacity-90">
            <span>{Math.floor(xpProgress.current)} XP</span>
            <span>{xpProgress.needed} XP per livello {progress.level + 1}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${xpProgress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-5 h-5 ${progress.current_streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Streak</span>
          </div>
          <div className="text-2xl font-bold">{progress.current_streak}</div>
          <div className="text-xs text-gray-500 mt-1">Record: {progress.longest_streak}</div>
        </div>

        {/* Quiz Completati */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Quiz</span>
          </div>
          <div className="text-2xl font-bold">{progress.total_quizzes_completed}</div>
          <div className="text-xs text-gray-500 mt-1">Completati</div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Precisione</span>
          </div>
          <div className="text-2xl font-bold">
            {progress.total_questions_answered > 0 
              ? Math.round((progress.correct_answers / progress.total_questions_answered) * 100) 
              : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {progress.correct_answers}/{progress.total_questions_answered}
          </div>
        </div>

        {/* Trofei */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Trofei</span>
          </div>
          <div className="text-2xl font-bold">{userAchievements.length}</div>
          <div className="text-xs text-gray-500 mt-1">su {achievements.length}</div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">Trofei e Achievement</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {achievements.map(achievement => {
            const unlocked = unlockedCodes.includes(achievement.code);
            const tierColors = {
              bronze: 'from-amber-700 to-amber-900',
              silver: 'from-gray-400 to-gray-600',
              gold: 'from-yellow-400 to-yellow-600',
              platinum: 'from-purple-400 to-purple-600'
            };

            return (
              <div 
                key={achievement.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  unlocked 
                    ? `bg-gradient-to-br ${tierColors[achievement.tier]} text-white shadow-lg` 
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
                }`}
              >
                {/* Lock Icon for locked achievements */}
                {!unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                  </div>
                )}

                {/* Icon */}
                <div className="text-3xl mb-2">{achievement.icon}</div>

                {/* Name */}
                <div className="font-semibold text-sm mb-1">
                  {achievement.name_it}
                </div>

                {/* Description */}
                <div className={`text-xs ${unlocked ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                  {achievement.description_it}
                </div>

                {/* XP Reward */}
                <div className={`text-xs font-semibold mt-2 ${unlocked ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                  +{achievement.xp_reward} XP
                </div>

                {/* Unlocked date */}
                {unlocked && (
                  <div className="text-xs mt-1 opacity-75">
                    {new Date(
                      userAchievements.find(ua => ua.achievement?.code === achievement.code)?.unlocked_at || ''
                    ).toLocaleDateString('it-IT')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t dark:border-gray-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progresso Trofei</span>
            <span className="font-semibold">
              {userAchievements.length} / {achievements.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${(userAchievements.length / achievements.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      {progress.current_streak > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <div>
              <div className="font-semibold text-orange-900 dark:text-orange-100">
                Stai andando alla grande! 🎉
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Hai studiato per {progress.current_streak} {progress.current_streak === 1 ? 'giorno' : 'giorni'} consecutivi. 
                Continua così!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
