'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Calendar } from 'lucide-react';

interface DataPoint {
  date: string;
  accuracy: number;
  xp: number;
  quizCount: number;
}

export default function TemporalChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [maxAccuracy, setMaxAccuracy] = useState(100);
  const [maxXP, setMaxXP] = useState(100);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get quiz results
    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Get activity log for XP
    const { data: activityLog } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const dateMap: Record<string, { correct: number; total: number; xp: number; count: number }> = {};

    quizResults?.forEach((quiz) => {
      const date = new Date(quiz.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      if (!dateMap[date]) {
        dateMap[date] = { correct: 0, total: 0, xp: 0, count: 0 };
      }
      dateMap[date].correct += quiz.correct_answers;
      dateMap[date].total += quiz.total_questions;
      dateMap[date].count += 1;
    });

    activityLog?.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      if (!dateMap[date]) {
        dateMap[date] = { correct: 0, total: 0, xp: 0, count: 0 };
      }
      if (log.xp_gained) {
        dateMap[date].xp += log.xp_gained;
      }
    });

    const chartData: DataPoint[] = Object.entries(dateMap).map(([date, stats]) => ({
      date,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      xp: stats.xp,
      quizCount: stats.count,
    }));

    setData(chartData);
    setMaxAccuracy(Math.max(...chartData.map(d => d.accuracy), 100));
    setMaxXP(Math.max(...chartData.map(d => d.xp), 100));
    setIsLoading(false);
  }

  function getBarHeight(value: number, max: number): string {
    return `${Math.max((value / max) * 100, 2)}%`;
  }

  function getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 75) return 'bg-blue-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Andamento Temporale
          </h2>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range}g
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Caricamento dati...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nessun dato disponibile per questo periodo</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Accuracy Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></span>
              Accuratezza %
            </h3>
            <div className="h-48 flex items-end gap-2 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
              {data.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className={`w-full ${getAccuracyColor(point.accuracy)} rounded-t transition-all hover:opacity-80 cursor-pointer`}
                      style={{ height: getBarHeight(point.accuracy, maxAccuracy) }}
                      title={`${point.date}: ${point.accuracy}%`}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {point.accuracy}%
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-top-left mt-6">
                    {point.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* XP Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
              Punti Esperienza (XP)
            </h3>
            <div className="h-48 flex items-end gap-2 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
              {data.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: getBarHeight(point.xp, maxXP) }}
                      title={`${point.date}: ${point.xp} XP`}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {point.xp} XP
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-top-left mt-6">
                    {point.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>0 XP</span>
              <span className="text-center">Max: {maxXP} XP</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Media Accuratezza</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.reduce((sum, d) => sum + d.xp, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">XP Totali</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.reduce((sum, d) => sum + d.quizCount, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Quiz Completati</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
