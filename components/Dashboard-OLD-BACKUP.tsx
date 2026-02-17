'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser, getQuizHistory, getUserProfile, signOut, QuizResult } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CategorySelector from './CategorySelector'
import ReviewMode from './ReviewMode'
import StatisticsChart from './StatisticsChart'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    
    // Ricarica dati quando la tab diventa visibile (es: dopo riscatto codice)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab visibile, ricarico profilo...')
        loadUserData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      setUser(currentUser)
      
      const { data: profileData } = await getUserProfile()
      setProfile(profileData)
      
      const { data: historyData } = await getQuizHistory()
      setQuizHistory(historyData || [])
    } catch (error) {
      console.error('Errore caricamento dati:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary dark:border-gold mx-auto mb-4"></div>
          <p className="text-secondary dark:text-gold text-lg">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary dark:bg-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con Logout */}
        <div className="text-center mb-12 relative">
          <button
            onClick={handleLogout}
            className="absolute top-0 right-0 text-secondary/80 hover:text-secondary dark:text-gold dark:hover:text-gold/80 text-sm font-semibold flex items-center gap-2"
          >
            <span>👋 Esci</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary dark:text-gold mb-4">
            Quiz Ruolo Conducenti
          </h1>
          <p className="text-xl text-secondary/80 dark:text-gold/80">
            Ciao {user?.user_metadata?.full_name || user?.email}!
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gold">Piano Attuale</h2>
            {profile?.subscription_type === 'free' ? (
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold">
                VERSIONE DEMO
              </span>
            ) : (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold">
                ✅ PREMIUM ATTIVO
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
              <span className="text-gray-600 dark:text-dark-text">Tipo Account:</span>
              <span className="font-semibold text-primary dark:text-gold capitalize">
                {profile?.subscription_type === 'free' ? 'Freemium' : profile?.subscription_type?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
              <span className="text-gray-600 dark:text-dark-text">Domande per Quiz:</span>
              <span className="font-semibold text-primary dark:text-gold">
                {profile?.subscription_type === 'free' ? '10 domande' : '20 domande'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
              <span className="text-gray-600 dark:text-dark-text">Tempo Quiz:</span>
              <span className="font-semibold text-primary dark:text-gold">
                {profile?.subscription_type === 'free' ? '10 minuti' : '30 minuti'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-dark-text">Spiegazioni Errori:</span>
              {profile?.subscription_type === 'free' ? (
                <span className="font-semibold text-red-600 dark:text-red-400">✗ Non disponibili</span>
              ) : (
                <span className="font-semibold text-green-600 dark:text-green-400">✓ Disponibili</span>
              )}
            </div>
            {profile?.subscription_type !== 'free' && profile?.subscription_expires_at && (
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-dark-border pt-3">
                <span className="text-gray-600 dark:text-dark-text">Scadenza:</span>
                <span className="font-semibold text-primary dark:text-gold">
                  {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT')}
                </span>
              </div>
            )}
          </div>
          
          {/* CTA Upgrade - solo se free */}
          {profile?.subscription_type === 'free' && (
            <div className="mt-6 bg-gradient-to-r from-primary to-blue-900 dark:from-dark-card dark:to-dark-border rounded-xl p-6 text-center">
              <h3 className="text-white dark:text-gold text-xl font-bold mb-2">
                🚀 Passa al Premium!
              </h3>
              <p className="text-secondary/90 dark:text-dark-text mb-4">
                20 domande per quiz, 30 minuti, spiegazioni complete e tanto altro
              </p>
              <Link
              href="/pricing"
              className="inline-block bg-secondary dark:bg-gold text-primary dark:text-navy px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-all transform hover:scale-105"
            >
              Scopri i Piani Premium
            </Link>
            </div>
          )}
        </div>

        {/* Redeem Access Code - New Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                      rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🎟️</span>
                <h3 className="text-xl font-bold text-navy dark:text-gold">
                  Hai un Codice Accesso?
                </h3>
              </div>
              <p className="text-navy/70 dark:text-white/70 text-sm">
                Se la tua scuola guida ti ha fornito un codice, attivalo qui per sbloccare l'accesso premium
              </p>
            </div>
            <Link
              href="/redeem"
              className="ml-4 bg-purple-600 dark:bg-purple-500 text-white px-6 py-3 rounded-lg 
                       font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 
                       transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Attiva Codice →
            </Link>
          </div>
        </div>

        {/* Category Selector */}
        <CategorySelector isPremium={profile?.subscription_type !== 'free'} />

        {/* Review Mode - Ripassa Errori */}
        <ReviewMode isPremium={profile?.subscription_type !== 'free'} />

        {/* Statistics Chart - Premium */}
        <StatisticsChart plan={profile?.subscription_type || 'free'} />

        {/* Quiz History */}
        <div className="bg-white dark:bg-dark-card dark:border dark:border-dark-border rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-primary dark:text-gold mb-6">Storico Simulazioni</h2>
          
          {quizHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                Nessuna simulazione completata
              </h3>
              <p className="text-gray-500 dark:text-dark-text mb-6">
                Inizia il tuo primo quiz per vedere qui i risultati!
              </p>
              <Link
                href={`/quiz?plan=${profile?.subscription_type !== 'free' ? 'premium' : 'free'}`}
                className="inline-block bg-secondary dark:bg-gold text-primary dark:text-navy px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 dark:hover:bg-yellow-500 transition"
              >
                🎯 Inizia Ora
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {quizHistory.map((item) => {
                const date = new Date(item.completed_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                const passed = item.score_percentage >= 90
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:shadow-md transition-shadow dark:bg-dark-bg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-500 dark:text-dark-text text-sm">{date}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          passed
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        }`}>
                          {passed ? 'Superato' : 'Da migliorare'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-primary dark:text-gold font-semibold text-lg">{item.score_percentage}%</span>
                        <span className="text-gray-500 dark:text-dark-text ml-2">
                          ({item.correct_answers}/{item.total_questions} corrette)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-dark-text text-sm italic">
              💡 Con i piani Premium avrai accesso allo storico completo e statistiche dettagliate
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href={`/quiz?plan=${profile?.subscription_type !== 'free' ? 'premium' : 'free'}`}
            className="bg-secondary dark:bg-gold text-primary dark:text-navy px-8 py-5 rounded-xl font-bold text-xl text-center hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-xl"
          >
            {profile?.subscription_type !== 'free' ? '🎯 Inizia Quiz Premium' : '🎯 Inizia Quiz Demo'}
          </Link>
          <Link
            href="/pricing"
            className="bg-white dark:bg-dark-card dark:border-dark-border text-primary dark:text-gold px-8 py-5 rounded-xl font-bold text-xl text-center hover:bg-gray-50 dark:hover:bg-dark-border transition-all transform hover:scale-105 shadow-xl border-4 border-secondary dark:border-gold"
          >
            ⭐ Piani Premium
          </Link>
        </div>

        {/* Features Teaser */}
        <div className="mt-12 bg-white/10 dark:bg-dark-card/50 backdrop-blur-sm rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-secondary dark:text-gold mb-6 text-center">
            Cosa ottieni con il Premium?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📚</div>
              <h4 className="text-secondary dark:text-gold font-bold mb-2">20 Domande</h4>
              <p className="text-secondary/70 dark:text-dark-text text-sm">Quiz completi come l'esame reale</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⏱️</div>
              <h4 className="text-secondary dark:text-gold font-bold mb-2">30 Minuti</h4>
              <p className="text-secondary/70 dark:text-dark-text text-sm">Tempo adeguato per pensare bene</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💡</div>
              <h4 className="text-secondary dark:text-gold font-bold mb-2">Spiegazioni</h4>
              <p className="text-secondary/70 dark:text-dark-text text-sm">Impara dagli errori commessi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
