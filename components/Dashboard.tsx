'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser, getQuizHistory, getUserProfile, signOut, QuizResult } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CategorySelector from './CategorySelector'
import ReviewMode from './ReviewMode'
import StatisticsChart from './StatisticsChart'
import DashboardMenu from './DashboardMenu'
import GamificationProgress from './GamificationProgress'
import Leaderboard from './Leaderboard'
import PublicProfile from './PublicProfile'
import ReferralSystem from './ReferralSystem'
import ExamCountdown from './ExamCountdown'
import TemporalChart from './TemporalChart'
import CategoryHeatmap from './CategoryHeatmap'
import PDFExport from './PDFExport'
import LanguageSwitcher from './LanguageSwitcher'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-dark-text-secondary font-medium">
            Caricamento...
          </p>
        </div>
      </div>
    )
  }

  const isPremium = profile?.subscription_type !== 'free'

  const menuItems = [
    { id: 'overview', label: 'Panoramica', icon: '🏠', description: 'Informazioni generali' },
    { id: 'progress', label: 'Progresso', icon: '🏆', description: 'Livelli e trofei' },
    { id: 'leaderboard', label: 'Classifica', icon: '👥', description: 'Top studenti' },
    { id: 'profile', label: 'Profilo', icon: '👤', description: 'Profilo pubblico' },
    { id: 'referral', label: 'Referral', icon: '🎁', description: 'Invita amici' },
    { id: 'exam', label: 'Esame', icon: '📅', description: 'Countdown esame' },
    { id: 'quiz', label: 'Avvia Quiz', icon: '🎯', description: 'Inizia una simulazione' },
    { id: 'review', label: 'Ripasso', icon: '🔄', description: 'Ripassa gli errori' },
    { id: 'statistics', label: 'Statistiche', icon: '📊', description: 'Analisi prestazioni' },
    { id: 'temporal', label: 'Andamento', icon: '📈', description: 'Grafici temporali' },
    { id: 'heatmap', label: 'Heatmap', icon: '🗺️', description: 'Categorie' },
    { id: 'pdf', label: 'Esporta PDF', icon: '📄', description: 'Download report' },
    { id: 'history', label: 'Storico', icon: '📝', description: 'Quiz completati' },
    { id: 'language', label: 'Lingua', icon: '🌐', description: 'Cambia lingua' }
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent mb-2">
              Quiz Taxi/NCC
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-dark-text-secondary">
              Ciao, <span className="font-semibold text-gray-900 dark:text-dark-text-primary">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </span>! 👋
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition-all text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Esci</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Dashboard Menu */}
        <DashboardMenu 
          items={menuItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Sezione Panoramica */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Subscription Card */}
        <div className="card p-6 sm:p-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              Il Tuo Piano
            </h2>
            {isPremium ? (
              <div className="badge-premium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Premium Attivo
              </div>
            ) : (
              <div className="badge-free">
                Versione Demo
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-surface dark:to-dark-hover border border-primary-200 dark:border-dark-border">
              <div className="text-sm text-primary-700 dark:text-primary-400 font-medium mb-1">
                Domande per Quiz
              </div>
              <div className="text-2xl font-bold text-primary-900 dark:text-primary-300">
                {isPremium ? '20' : '10'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-dark-surface dark:to-dark-hover border border-accent-200 dark:border-dark-border">
              <div className="text-sm text-accent-700 dark:text-accent-400 font-medium mb-1">
                Tempo Disponibile
              </div>
              <div className="text-2xl font-bold text-accent-900 dark:text-accent-300">
                {isPremium ? '30 min' : '10 min'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-dark-surface dark:to-dark-hover border border-green-200 dark:border-dark-border">
              <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                Spiegazioni
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                {isPremium ? '✓' : '✗'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 dark:from-dark-surface dark:to-dark-hover border border-purple-200 dark:border-dark-border">
              <div className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-1">
                Filtro Categoria
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                {isPremium ? '✓' : '✗'}
              </div>
            </div>
          </div>

          {isPremium && profile?.subscription_expires_at && (
            <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-dark-surface border border-primary-200 dark:border-dark-border">
              <div className="flex items-center gap-2 text-primary-800 dark:text-primary-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">
                  Piano attivo fino al <span className="font-bold">
                    {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT')}
                  </span>
                </span>
              </div>
            </div>
          )}

          {!isPremium && (
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🚀</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Passa al Premium!</h3>
                  <p className="text-primary-100 mb-4">
                    Sblocca quiz completi, più tempo, spiegazioni dettagliate e tanto altro.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-all hover:scale-105"
                  >
                    Scopri i Piani
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Redeem Code Card - Solo per utenti free */}
        {!isPremium && (
          <div className="card p-4 sm:p-6 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-dark-card dark:via-dark-card dark:to-dark-hover border-purple-100 dark:border-purple-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl sm:text-2xl">
                🎟️
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-1">
                  Hai un Codice Accesso?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary">
                  Attiva il tuo codice per sbloccare l'accesso premium
                </p>
              </div>
              <Link
                href="/redeem"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
              >
                Attiva
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href={`/quiz?plan=${isPremium ? 'premium' : 'free'}`}
            className="group card-hover p-8 flex flex-col items-center text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-2xl font-bold mb-2">
              {isPremium ? 'Inizia Quiz Premium' : 'Prova Quiz Demo'}
            </h3>
            <p className="text-primary-100">
              {isPremium ? '20 domande • 30 minuti' : '10 domande • 10 minuti'}
            </p>
          </Link>

          {!isPremium && (
            <Link
              href="/pricing"
              className="group card-hover p-8 flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⭐</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                Piani Premium
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Scopri tutte le opzioni disponibili
              </p>
            </Link>
          )}
        </div>
          </div>
        )}

        {/* Sezione Progresso (Gamification) */}
        {activeSection === 'progress' && user && (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                🏆 Il Tuo Progresso
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                Livelli, trofei e statistiche di gamification
              </p>
            </div>
            <GamificationProgress />
          </div>
        )}

        {/* Sezione Profilo */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <PublicProfile />
          </div>
        )}

        {/* Sezione Referral */}
        {activeSection === 'referral' && (
          <div className="space-y-6">
            <ReferralSystem />
          </div>
        )}

        {/* Sezione Esame */}
        {activeSection === 'exam' && (
          <div className="space-y-6">
            <ExamCountdown />
          </div>
        )}

        {/* Sezione Grafici Temporali */}
        {activeSection === 'temporal' && (
          <div className="space-y-6">
            <TemporalChart />
          </div>
        )}

        {/* Sezione Heatmap */}
        {activeSection === 'heatmap' && (
          <div className="space-y-6">
            <CategoryHeatmap />
          </div>
        )}

        {/* Sezione PDF Export */}
        {activeSection === 'pdf' && (
          <div className="space-y-6">
            <PDFExport />
          </div>
        )}

        {/* Sezione Lingua */}
        {activeSection === 'language' && (
          <div className="space-y-6">
            <LanguageSwitcher />
          </div>
        )}

        {/* Sezione Classifica */}
        {activeSection === 'leaderboard' && (
          <div className="space-y-6">
            <Leaderboard />
          </div>
        )}

        {/* Sezione Avvia Quiz */}
        {activeSection === 'quiz' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
                🎯 Avvia Nuova Simulazione
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Scegli come vuoi esercitarti: quiz completo o per categoria specifica
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Link
                  href={`/quiz?plan=${isPremium ? 'premium' : 'free'}`}
                  className="group card-hover p-6 flex flex-col items-center text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                  <h3 className="text-xl font-bold mb-2">
                    Quiz Completo
                  </h3>
                  <p className="text-primary-100 text-sm">
                    {isPremium ? '20 domande • 30 minuti' : '10 domande • 10 minuti'}
                  </p>
                </Link>

                {!isPremium ? (
                  <Link
                    href="/pricing"
                    className="group card-hover p-6 flex flex-col items-center text-center border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <div className="text-4xl mb-3">🔒</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Quiz per Categoria
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Solo Premium
                    </p>
                  </Link>
                ) : (
                  <div className="card p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Seleziona Categoria</h4>
                    <CategorySelector isPremium={true} />
                  </div>
                )}
              </div>

              {!isPremium && (
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    💡 <strong>Suggerimento:</strong> Con il piano Premium puoi allenarti su categorie specifiche per migliorare le tue aree deboli!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sezione Ripasso */}
        {activeSection === 'review' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
                🔄 Ripassa gli Errori
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Rivedi le domande a cui hai risposto in modo errato per migliorare la tua preparazione
              </p>
            </div>
            <ReviewMode isPremium={isPremium} />
          </div>
        )}

        {/* Sezione Statistiche */}
        {activeSection === 'statistics' && (
          <div>
            <StatisticsChart plan={profile?.subscription_type || 'free'} />
          </div>
        )}

        {/* Sezione Storico */}
        {activeSection === 'history' && (
          <div className="card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-6">
              📝 Storico Simulazioni
            </h2>
          
          {quizHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                Nessuna simulazione completata
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Inizia il tuo primo quiz per vedere qui i risultati!
              </p>
              <button
                onClick={() => setActiveSection('quiz')}
                className="btn-primary inline-block"
              >
                🎯 Inizia Ora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizHistory.map((item) => {
                const date = new Date(item.completed_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                const passed = item.score_percentage >= 90
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                          {date}
                        </span>
                        <span className={`badge ${
                          passed
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        }`}>
                          {passed ? '✓ Superato' : '○ Da migliorare'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                          {item.score_percentage}%
                        </span>
                        <span className="text-gray-600 dark:text-dark-text-secondary">
                          ({item.correct_answers}/{item.total_questions} corrette)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}
