'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser, getQuizHistory, getUserProfile, signOut, QuizResult } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Home, Trophy, Users, User, Gift, Calendar, Target, RotateCcw, BarChart3, TrendingUp, Map, FileText, FileEdit, Rocket, Star, PartyPopper, Lightbulb, Ticket, CreditCard, Clock } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)  const [error, setError] = useState<string | null>(null)  const [activeSection, setActiveSection] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    loadUserData()
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab visibile, ricarico profilo...')
        loadUserData()
      }
    }
    
    // Listener per aggiornamento dopo completamento quiz
    const handleQuizCompleted = () => {
      console.log('✅ Quiz completato, ricarico dati dashboard...')
      loadUserData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('quizCompleted', handleQuizCompleted)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('quizCompleted', handleQuizCompleted)
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
      setError(null)
    } catch (error) {
      console.error('Errore caricamento dati:', error)
      setError('Impossibile caricare i dati. Verifica la connessione internet.')
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Errore di Caricamento</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              loadData()
            }}
            className="btn-primary"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  // 🔵 MODALITÀ BETA GRATUITA - Tutti hanno accesso premium
  const isFreeBetaMode = process.env.NEXT_PUBLIC_FREE_BETA_MODE === 'true'
  const isPremium = isFreeBetaMode ? true : profile?.subscription_type !== 'free'

  const allMenuItems = [
    { id: 'overview', label: 'Panoramica', Icon: Home, description: 'Informazioni generali' },
    { id: 'progress', label: 'Progresso', Icon: Trophy, description: 'Livelli e trofei' },
    { id: 'leaderboard', label: 'Classifica', Icon: Users, description: 'Top studenti' },
    { id: 'profile', label: 'Profilo', Icon: User, description: 'Profilo pubblico' },
    { id: 'referral', label: 'Referral', Icon: Gift, description: 'Invita amici' },
    { id: 'exam', label: 'Esame', Icon: Calendar, description: 'Countdown esame' },
    { id: 'quiz', label: 'Avvia Quiz', Icon: Target, description: 'Inizia una simulazione' },
    { id: 'review', label: 'Ripasso', Icon: RotateCcw, description: 'Ripassa gli errori' },
    { id: 'statistics', label: 'Statistiche', Icon: BarChart3, description: 'Analisi prestazioni' },
    { id: 'temporal', label: 'Andamento', Icon: TrendingUp, description: 'Grafici temporali' },
    { id: 'heatmap', label: 'Heatmap', Icon: Map, description: 'Categorie' },
    { id: 'pdf', label: 'Esporta PDF', Icon: FileText, description: 'Download report' },
    { id: 'history', label: 'Storico', Icon: FileEdit, description: 'Quiz completati' },
    // TODO: Riabilitare quando implementeremo le traduzioni complete
    // { id: 'language', label: 'Lingua', Icon: Globe, description: 'Cambia lingua' }
  ]

  // 🔵 BETA MODE: Nascondi referral system
  const menuItems = isFreeBetaMode 
    ? allMenuItems.filter(item => item.id !== 'referral')
    : allMenuItems

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        
        {/* 🔵 BANNER BETA GRATUITA */}
        {isFreeBetaMode && (
          <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.3)] animate-slide-up">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <PartyPopper className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xl sm:text-2xl">Beta Gratuita Attiva!</p>
                  <p className="text-sm sm:text-base text-white/90 mt-1">
                    Tutti i contenuti premium sono gratuiti durante il test
                  </p>
                </div>
              </div>
              <span className="text-4xl sm:text-5xl">🚕</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-900 dark:text-white mb-2">
              Quiz Taxi/NCC
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-dark-text-secondary">
              Ciao, <span className="font-bold text-primary-900 dark:text-dark-text-primary">
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
        <div className="card shadow-card-hover animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 dark:text-dark-text-primary">
              Il Tuo Piano
            </h2>
            {isPremium ? (
              <div className="badge-premium text-base px-4 py-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Premium Attivo
              </div>
            ) : (
              <div className="badge-free text-base px-4 py-2">
                Versione Demo
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-surface dark:to-dark-hover border-2 border-primary-200 dark:border-dark-border shadow-sm">
              <div className="text-sm text-primary-700 dark:text-primary-400 font-semibold mb-2">
                Domande per Quiz
              </div>
              <div className="text-3xl font-bold text-primary-900 dark:text-primary-300">
                {isPremium ? '20' : '10'}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-dark-surface dark:to-dark-hover border-2 border-accent-200 dark:border-dark-border shadow-sm">
              <div className="text-sm text-accent-700 dark:text-accent-400 font-semibold mb-2">
                Tempo Disponibile
              </div>
              <div className="text-3xl font-bold text-accent-900 dark:text-accent-300">
                {isPremium ? '30 min' : '10 min'}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-dark-surface dark:to-dark-hover border-2 border-green-200 dark:border-dark-border shadow-sm">
              <div className="text-sm text-green-700 dark:text-green-400 font-semibold mb-2">
                Spiegazioni
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-300">
                {isPremium ? '✓' : '✗'}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 dark:from-dark-surface dark:to-dark-hover border-2 border-purple-200 dark:border-dark-border shadow-sm">
              <div className="text-sm text-purple-700 dark:text-purple-400 font-semibold mb-2">
                Filtro Categoria
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                {isPremium ? '✓' : '✗'}
              </div>
            </div>
          </div>

          {isPremium && profile?.subscription_expires_at && (
            <div className="mt-6 p-5 rounded-xl bg-primary-50 dark:bg-dark-surface border-2 border-primary-200 dark:border-dark-border">
              <div className="flex items-center gap-3 text-primary-800 dark:text-primary-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-base font-semibold">
                  Piano attivo fino al <span className="font-bold">
                    {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT')}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* 🔵 BETA MODE: Nascondi call-to-action premium */}
          {!isPremium && !isFreeBetaMode && (
            <div className="mt-8 relative overflow-hidden">
              {/* Background decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 rounded-3xl"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
              
              {/* Contenuto - Layout bilanciato desktop */}
              <div className="relative p-8 sm:p-10">
                {/* Mobile: Centrato | Desktop: Grid 2 colonne */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  
                  {/* Colonna Sinistra: Testo e CTA */}
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
                    {/* Icona principale */}
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <Rocket className="w-12 h-12 text-primary-900" />
                    </div>
                    
                    {/* Testo */}
                    <h3 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-3">
                      Passa al Premium!
                    </h3>
                    <p className="text-lg text-primary-800 mb-8 leading-relaxed">
                      Sblocca quiz completi da <strong>20 domande</strong>, più tempo, spiegazioni dettagliate e tanto altro.
                    </p>
                    
                    {/* CTA Button - SUPER PROMINENTE */}
                    <Link
                      href="/pricing"
                      className="btn-cta inline-flex items-center gap-3 shadow-[0_10px_40px_rgba(251,191,36,0.5)] animate-pulse hover:animate-none mb-4"
                    >
                      <Star className="w-6 h-6" fill="currentColor" />
                      <span>Scopri i Piani Premium</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    
                    <p className="text-sm text-primary-800/80 flex items-center justify-center lg:justify-start gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pagamento sicuro con Stripe • Attivazione istantanea
                    </p>
                  </div>
                  
                  {/* Colonna Destra: Features highlights */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md lg:max-w-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-primary-900 hover:bg-white/30 transition-all">
                      <div className="mb-3"><FileEdit className="w-10 h-10" /></div>
                      <div className="font-bold text-xl mb-1">20 Domande</div>
                      <div className="text-sm opacity-90">Quiz completi</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-primary-900 hover:bg-white/30 transition-all">
                      <div className="mb-3"><Clock className="w-10 h-10" /></div>
                      <div className="font-bold text-xl mb-1">30 Minuti</div>
                      <div className="text-sm opacity-90">Tempo extra</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-primary-900 hover:bg-white/30 transition-all">
                      <div className="mb-3"><Lightbulb className="w-10 h-10" /></div>
                      <div className="font-bold text-xl mb-1">Spiegazioni</div>
                      <div className="text-sm opacity-90">Dettagliate</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-primary-900 hover:bg-white/30 transition-all">
                      <div className="mb-3"><Target className="w-10 h-10" /></div>
                      <div className="font-bold text-xl mb-1">Categorie</div>
                      <div className="text-sm opacity-90">Filtra argomenti</div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Redeem Code Card - Solo per utenti free E NON in beta mode */}
        {!isPremium && !isFreeBetaMode && (
          <div className="card bg-gradient-to-br from-purple-50/80 via-white to-pink-50/80 dark:from-dark-card dark:via-dark-card dark:to-dark-hover border-2 border-purple-200 dark:border-purple-900/30 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
                🎟️
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-primary-900 dark:text-dark-text-primary mb-2">
                  Hai un Codice Accesso?
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
                  Attiva il tuo codice per sbloccare l'accesso premium
                </p>
              </div>
              <Link
                href="/redeem"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base font-bold hover:shadow-[0_6px_25px_rgba(168,85,247,0.4)] hover:scale-105 transition-all whitespace-nowrap"
              >
                Attiva Codice
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons - Grid centrato quando c'è solo 1 pulsante */}
        <div className={`grid gap-4 ${isPremium || isFreeBetaMode ? 'sm:grid-cols-1 place-items-center' : 'sm:grid-cols-2'}`}>
          <Link
            href={`/quiz?plan=${isPremium ? 'premium' : 'free'}`}
            className={`group card-hover p-8 flex flex-col items-center text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none ${isPremium || isFreeBetaMode ? 'w-full max-w-md' : 'w-full'}`}
          >
            <div className="mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-16 h-16" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {isPremium ? 'Inizia Quiz Premium' : (isFreeBetaMode ? 'Inizia Quiz Gratuito' : 'Prova Quiz Demo')}
            </h3>
            <p className="text-primary-100">
              {isPremium ? '20 domande • 30 minuti' : '10 domande • 10 minuti'}
            </p>
          </Link>

          {/* 🔵 Beta mode: nascondi bottone piani premium */}
          {!isPremium && !isFreeBetaMode && (
            <Link
              href="/pricing"
              className="group card-hover p-8 flex flex-col items-center text-center w-full"
            >
              <div className="mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-16 h-16 text-accent-400" fill="currentColor" />
              </div>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-accent-400" />
                Il Tuo Progresso
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

        {/* TODO: Riabilitare quando implementeremo le traduzioni complete */}
        {/* Sezione Lingua */}
        {/* {activeSection === 'language' && (
          <div className="space-y-6">
            <LanguageSwitcher />
          </div>
        )} */}

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
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 dark:text-dark-text-primary mb-4 flex items-center gap-3">
                <Target className="w-7 h-7 text-accent-400" />
                Avvia Nuova Simulazione
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Scegli come vuoi esercitarti: quiz completo o per categoria specifica
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Link
                  href={`/quiz?plan=${isPremium ? 'premium' : 'free'}`}
                  className="group card-hover p-6 flex flex-col items-center text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none"
                >
                  <div className="mb-3 group-hover:scale-110 transition-transform">
                    <FileEdit className="w-12 h-12" />
                  </div>
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
                  <p className="text-sm text-primary-800 dark:text-primary-200 flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span><strong>Suggerimento:</strong> Con il piano Premium puoi allenarti su categorie specifiche per migliorare le tue aree deboli!</span>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-orange-500" />
                Ripassa gli Errori
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center gap-3">
              <FileEdit className="w-6 h-6 text-primary-600" />
              Storico Simulazioni
            </h2>
          
          {quizHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <BarChart3 className="w-20 h-20 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                Nessuna simulazione completata
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                Inizia il tuo primo quiz per vedere qui i risultati!
              </p>
              <button
                onClick={() => setActiveSection('quiz')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Target className="w-5 h-5" />
                Inizia Ora
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
