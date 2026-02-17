'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getWrongAnswers } from '@/lib/supabase'

interface ReviewModeProps {
  isPremium: boolean
}

export default function ReviewMode({ isPremium }: ReviewModeProps) {
  const [wrongCount, setWrongCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWrongAnswers()
  }, [])

  const loadWrongAnswers = async () => {
    try {
      const { data } = await getWrongAnswers(100)
      const uniqueQuestions = new Set(data?.map(d => d.question_id))
      setWrongCount(uniqueQuestions.size)
    } catch (error) {
      console.error('Errore caricamento errori:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-dark-border rounded-lg w-2/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-dark-border rounded-lg"></div>
      </div>
    )
  }

  if (wrongCount === 0) {
    return (
      <div className="card p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-dark-card dark:via-dark-hover dark:to-dark-surface border-green-200 dark:border-green-900/30">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-4xl shadow-lg">
            🎉
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
              Nessun errore da ripassare!
            </h3>
            <p className="text-gray-700 dark:text-dark-text-secondary text-sm">
              Hai risposto correttamente a tutte le domande finora. Continua così!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const maxQuestions = isPremium ? 20 : 10
  const actualQuestions = Math.min(wrongCount, maxQuestions)

  return (
    <div className="card p-6 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-dark-card dark:via-dark-hover dark:to-dark-surface border-red-200 dark:border-red-900/30">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-4xl shadow-lg">
          🔄
        </div>
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
            Ripassa gli Errori
          </h3>
          <p className="text-gray-700 dark:text-dark-text-secondary mb-6">
            Hai <span className="font-bold text-red-600 dark:text-red-400">{wrongCount} {wrongCount === 1 ? 'domanda' : 'domande'}</span> sbagliate in passato.
            <br className="hidden sm:block" />
            <span className="text-sm">Ripassale per migliorare il tuo punteggio!</span>
          </p>
          
          <Link
            href={`/quiz?plan=${isPremium ? 'premium' : 'free'}&mode=review`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ripassa Ora ({actualQuestions} domande)
          </Link>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-900/30">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-text-secondary mb-2">
          <span className="font-medium">Progressi nel ripasso</span>
          <span className="font-bold">0 / {wrongCount}</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-2">
          Inizia a ripassare per vedere i tuoi progressi
        </p>
      </div>
    </div>
  )
}
