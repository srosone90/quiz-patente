'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Grid3x3, Trophy, Medal, Award, BookOpen } from 'lucide-react';

interface CategoryData {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
}

export default function CategoryHeatmap() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, []);

  async function loadCategoryData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id);

    // Group by category
    const categoryMap: Record<string, { correct: number; total: number }> = {};

    quizResults?.forEach((quiz) => {
      const cat = quiz.category || 'Generale';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { correct: 0, total: 0 };
      }
      categoryMap[cat].correct += quiz.correct_answers;
      categoryMap[cat].total += quiz.total_questions;
    });

    const categoryData: CategoryData[] = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
    })).sort((a, b) => b.total - a.total);

    setCategories(categoryData);
    setIsLoading(false);
  }

  function getHeatColor(accuracy: number): string {
    if (accuracy >= 95) return 'bg-green-600 dark:bg-green-500';
    if (accuracy >= 90) return 'bg-green-500 dark:bg-green-400';
    if (accuracy >= 80) return 'bg-blue-500 dark:bg-blue-400';
    if (accuracy >= 70) return 'bg-yellow-500 dark:bg-yellow-400';
    if (accuracy >= 60) return 'bg-orange-500 dark:bg-orange-400';
    return 'bg-red-500 dark:bg-red-400';
  }

  function getHeatIntensity(accuracy: number): string {
    // Returns opacity class
    if (accuracy >= 90) return 'opacity-100';
    if (accuracy >= 75) return 'opacity-80';
    if (accuracy >= 60) return 'opacity-60';
    return 'opacity-40';
  }

  function getPerformanceLabel(accuracy: number): string {
    if (accuracy >= 95) return 'Eccellente';
    if (accuracy >= 90) return 'Ottimo';
    if (accuracy >= 80) return 'Buono';
    if (accuracy >= 70) return 'Discreto';
    if (accuracy >= 60) return 'Sufficiente';
    return 'Da migliorare';
  }

  function getPerformanceIcon(accuracy: number) {
    const className = "w-7 h-7";
    if (accuracy >= 90) return <Trophy className={className} />;
    if (accuracy >= 80) return <Medal className={className} />;
    if (accuracy >= 70) return <Award className={className} />;
    if (accuracy >= 60) return <Award className={className} />;
    return <BookOpen className={className} />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Grid3x3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Heatmap Categorie
        </h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Caricamento dati...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nessuna categoria disponibile. Completa qualche quiz per vedere le statistiche!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid View */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className={`relative group rounded-lg p-4 transition-all hover:scale-105 cursor-pointer ${getHeatColor(cat.accuracy)} ${getHeatIntensity(cat.accuracy)}`}
              >
                <div className="text-white">
                  <div className="text-2xl mb-1">{getPerformanceIcon(cat.accuracy)}</div>
                  <div className="font-semibold text-sm truncate" title={cat.category}>
                    {cat.category}
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {Math.round(cat.accuracy)}%
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {cat.correct}/{cat.total} corrette
                  </div>
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  <div className="font-semibold">{cat.category}</div>
                  <div>Accuratezza: {cat.accuracy.toFixed(1)}%</div>
                  <div>{getPerformanceLabel(cat.accuracy)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed List */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dettaglio Performance
            </h3>
            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="text-2xl">{getPerformanceIcon(cat.accuracy)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {cat.category}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {cat.correct} corrette su {cat.total} domande
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      cat.accuracy >= 80 ? 'text-green-600 dark:text-green-400' :
                      cat.accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.round(cat.accuracy)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getPerformanceLabel(cat.accuracy)}
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getHeatColor(cat.accuracy)}`}
                      style={{ width: `${Math.min(cat.accuracy, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Legenda Colori
            </h3>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">95%+ Eccellente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-gray-700 dark:text-gray-300">80-90% Buono</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-gray-700 dark:text-gray-300">70-80% Discreto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-gray-700 dark:text-gray-300">60-70% Sufficiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-gray-700 dark:text-gray-300">&lt;60% Da migliorare</span>
              </div>
            </div>
          </div>

          {/* Best/Worst Categories */}
          {categories.length >= 2 && (
            <div className="grid md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Categoria Migliore
                  </h4>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {categories[0].category}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {Math.round(categories[0].accuracy)}% di accuratezza
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📚</span>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">
                    Da Migliorare
                  </h4>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {categories[categories.length - 1].category}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {Math.round(categories[categories.length - 1].accuracy)}% di accuratezza
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
