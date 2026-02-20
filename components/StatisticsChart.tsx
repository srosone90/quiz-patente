'use client'

import { useState, useEffect } from 'react'
import { getQuizHistory, QuizResult } from '@/lib/supabase'
import Link from 'next/link'
import { BarChart3, TrendingUp, Target, Trophy } from 'lucide-react'

interface StatisticsChartProps {
  plan?: 'free' | 'premium'
}

export default function StatisticsChart({ plan = 'free' }: StatisticsChartProps) {
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    try {
      const { data } = await getQuizHistory()
      setQuizHistory(data || [])
    } catch (error) {
      console.error('Errore caricamento statistiche:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFree = plan === 'free'

  // Calcoli statistiche
  const totalQuizzes = quizHistory.length
  const passedQuizzes = quizHistory.filter(q => q.score_percentage >= 90).length
  const averageScore = totalQuizzes > 0 
    ? Math.round(quizHistory.reduce((sum, q) => sum + q.score_percentage, 0) / totalQuizzes)
    : 0
  const passRate = totalQuizzes > 0
    ? Math.round((passedQuizzes / totalQuizzes) * 100)
    : 0

  // Ultimi 10 quiz per il grafico
  const recentQuizzes = quizHistory.slice(0, 10).reverse()
  
  // Trend: confronta prima metà con seconda metà
  const firstHalf = quizHistory.slice(Math.floor(quizHistory.length / 2))
  const secondHalf = quizHistory.slice(0, Math.floor(quizHistory.length / 2))
  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, q) => sum + q.score_percentage, 0) / firstHalf.length
    : 0
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, q) => sum + q.score_percentage, 0) / secondHalf.length
    : 0
  const improvement = secondHalfAvg - firstHalfAvg

  if (isFree) {
    return (
      <div className="card relative overflow-hidden">
        {/* Badge Premium */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600 dark:text-accent-400" />
            Statistiche Dettagliate
          </h2>
          <span className="badge-premium">
            🔒 PREMIUM
          </span>
        </div>
        
        <div className="text-center py-16 relative">
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-dark-card/80 dark:to-dark-card backdrop-blur-sm rounded-xl z-10"></div>
          
          <div className="relative z-20">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">📈</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Visualizza le tue prestazioni
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Grafici dettagliati, analisi del trend, aree di miglioramento e molto altro
            </p>
            <Link
              href="/pricing"
              className="btn-primary inline-block"
            >
              Sblocca Statistiche Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-accent-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Caricamento statistiche...</p>
        </div>
      </div>
    )
  }

  if (totalQuizzes === 0) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent mb-8 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-600 dark:text-accent-400" />
          Statistiche Dettagliate
        </h2>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Completa alcuni quiz per vedere le statistiche
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Le tue prestazioni verranno visualizzate qui con grafici e analisi dettagliate
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent mb-8 flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-primary-600 dark:text-accent-400" />
        Statistiche Dettagliate
      </h2>
      
      {/* Metriche Chiave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700 text-center transform hover:scale-105 transition-transform">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{totalQuizzes}</div>
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Quiz Totali</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-700 text-center transform hover:scale-105 transition-transform">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{averageScore}%</div>
          <div className="text-sm font-semibold text-green-700 dark:text-green-300">Media Punteggi</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700 text-center transform hover:scale-105 transition-transform">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{passRate}%</div>
          <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">Tasso Successo</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700 text-center transform hover:scale-105 transition-transform">
          <div className={`text-4xl font-bold mb-1 ${improvement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
          </div>
          <div className="text-sm font-semibold text-orange-700 dark:text-orange-300">Trend</div>
        </div>
      </div>

      {/* Grafico a Barre */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 rounded-lg flex items-center justify-center text-white text-sm">
            <TrendingUp className="w-5 h-5" />
          </span>
          Andamento Ultimi Quiz
        </h3>
        <div className="space-y-3">
          {recentQuizzes.map((quiz, index) => {
            const date = new Date(quiz.completed_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
            const isPassed = quiz.score_percentage >= 90
            
            return (
              <div key={quiz.id} className="flex items-center gap-4 group">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">{date}</span>
                <div className="flex-1 bg-gray-200 dark:bg-dark-border rounded-xl h-10 relative overflow-hidden group-hover:shadow-lg transition-shadow">
                  <div 
                    className={`h-full rounded-xl transition-all duration-500 ${
                      isPassed 
                        ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600'
                    }`}
                    style={{ width: `${quiz.score_percentage}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white drop-shadow-md">
                    {quiz.score_percentage}%
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 text-right">
                  {quiz.correct_answers}/{quiz.total_questions}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analisi Prestazioni */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 rounded-lg flex items-center justify-center text-white text-sm">
            <Target className="w-5 h-5" />
          </span>
          Analisi Prestazioni
        </h3>
        <div className="space-y-3 text-sm">
          {averageScore >= 90 && (
            <div className="flex items-start gap-3 bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <p className="text-green-800 dark:text-green-200 font-medium">
                Eccellente! Stai mantenendo una media superiore al 90%
              </p>
            </div>
          )}
          {averageScore >= 75 && averageScore < 90 && (
            <div className="flex items-start gap-3 bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
              </svg>
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Buon lavoro! Ancora un piccolo sforzo per raggiungere il 90%
              </p>
            </div>
          )}
          {averageScore < 75 && (
            <div className="flex items-start gap-3 bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-orange-800 dark:text-orange-200 font-medium">
                Continua ad esercitarti per migliorare la tua preparazione
              </p>
            </div>
          )}
          
          {improvement > 5 && (
            <div className="flex items-start gap-3 bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
              </svg>
              <p className="text-green-800 dark:text-green-200 font-medium">
                Ottimo trend! I tuoi punteggi stanno migliorando costantemente
              </p>
            </div>
          )}
          {improvement < -5 && (
            <div className="flex items-start gap-3 bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd"/>
              </svg>
              <p className="text-orange-800 dark:text-orange-200 font-medium">
                Attenzione: i punteggi recenti sono in calo. Ripassa gli errori!
              </p>
            </div>
          )}
          
          {passRate === 100 && totalQuizzes >= 5 && (
            <div className="flex items-start gap-3 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 p-4 rounded-xl border-2 border-yellow-400 dark:border-yellow-600">
              <Trophy className="w-7 h-7 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-900 dark:text-yellow-200 font-bold">
                Perfetto! Hai superato tutti i quiz. Sei pronto per l'esame!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
