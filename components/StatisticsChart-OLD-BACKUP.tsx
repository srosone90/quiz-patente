'use client'

import { useState, useEffect } from 'react'
import { getQuizHistory, QuizResult } from '@/lib/supabase'
import Link from 'next/link'

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
  const maxScore = 100
  
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
      <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary dark:text-gold">📊 Statistiche Dettagliate</h2>
          <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-semibold">
            🔒 PREMIUM
          </span>
        </div>
        
        <div className="text-center py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-dark-card/50 dark:to-dark-card backdrop-blur-sm rounded-lg"></div>
          
          <div className="relative z-10">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
              Visualizza le tue prestazioni
            </h3>
            <p className="text-gray-600 dark:text-dark-text mb-6">
              Grafici dettagliati, analisi del trend, aree di miglioramento e molto altro
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-navy dark:bg-gold text-white dark:text-navy px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all transform hover:scale-105"
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
      <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-navy dark:border-gold mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-dark-text">Caricamento statistiche...</p>
        </div>
      </div>
    )
  }

  if (totalQuizzes === 0) {
    return (
      <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-primary dark:text-gold mb-6">📊 Statistiche Dettagliate</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
            Completa alcuni quiz per vedere le statistiche
          </h3>
          <p className="text-gray-600 dark:text-dark-text">
            Le tue prestazioni verranno visualizzate qui con grafici e analisi dettagliate
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
      <h2 className="text-2xl font-bold text-primary dark:text-gold mb-6">📊 Statistiche Dettagliate</h2>
      
      {/* Metriche Chiave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalQuizzes}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Quiz Totali</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{averageScore}%</div>
          <div className="text-sm text-green-700 dark:text-green-300 mt-1">Media Punteggi</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{passRate}%</div>
          <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Tasso Successo</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
          <div className={`text-3xl font-bold ${improvement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">Trend</div>
        </div>
      </div>

      {/* Grafico a Barre */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4">
          📈 Andamento Ultimi Quiz
        </h3>
        <div className="space-y-2">
          {recentQuizzes.map((quiz, index) => {
            const date = new Date(quiz.completed_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
            const isPassed = quiz.score_percentage >= 90
            
            return (
              <div key={quiz.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-dark-text w-16">{date}</span>
                <div className="flex-1 bg-gray-200 dark:bg-dark-border rounded-full h-8 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isPassed 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`}
                    style={{ width: `${quiz.score_percentage}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-white">
                    {quiz.score_percentage}%
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-dark-text w-20">
                  {quiz.correct_answers}/{quiz.total_questions}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analisi Prestazioni */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-3">
          🎯 Analisi Prestazioni
        </h3>
        <div className="space-y-2 text-sm">
          {averageScore >= 90 && (
            <p className="text-green-700 dark:text-green-300">
              ✓ Eccellente! Stai mantenendo una media superiore al 90%
            </p>
          )}
          {averageScore >= 75 && averageScore < 90 && (
            <p className="text-blue-700 dark:text-blue-300">
              ↗ Buon lavoro! Ancora un piccolo sforzo per raggiungere il 90%
            </p>
          )}
          {averageScore < 75 && (
            <p className="text-orange-700 dark:text-orange-300">
              ⚠ Continua ad esercitarti per migliorare la tua preparazione
            </p>
          )}
          
          {improvement > 5 && (
            <p className="text-green-700 dark:text-green-300">
              📈 Ottimo trend! I tuoi punteggi stanno migliorando costantemente
            </p>
          )}
          {improvement < -5 && (
            <p className="text-orange-700 dark:text-orange-300">
              📉 Attenzione: i punteggi recenti sono in calo. Ripassa gli errori!
            </p>
          )}
          
          {passRate === 100 && totalQuizzes >= 5 && (
            <p className="text-green-700 dark:text-green-300">
              🏆 Perfetto! Hai superato tutti i quiz. Sei pronto per l'esame!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
