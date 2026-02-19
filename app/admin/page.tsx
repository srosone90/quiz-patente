'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  isAdmin, 
  getAdminGlobalStats, 
  generateAccessCode, 
  getAllAccessCodes,
  getAllUsers,
  getAdminQuestionStats,
  getB2BDashboardStats
} from '@/lib/supabase'
import B2BClients from '@/components/B2BClients'
import B2BCalendar from '@/components/B2BCalendar'
import B2BContracts from '@/components/B2BContracts'
import CRMPipeline from '@/components/CRMPipeline'
import EnhancedCodeManagement from '@/components/EnhancedCodeManagement'
import AdvancedAnalytics from '@/components/AdvancedAnalytics'

interface GlobalStats {
  total_users: number
  premium_users: number
  total_quizzes: number
  passed_quizzes: number
  avg_score: number
  active_codes: number
  total_redemptions: number
}

interface AccessCode {
  id: number
  code: string
  school_name: string
  plan_type: string
  duration_days: number
  max_uses: number
  used_count: number
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  subscription_type: string
  subscription_expires_at: string | null
  created_at: string
  role?: string
}

interface QuestionStat {
  question_id: number
  question_text: string
  category: string
  times_asked: number
  correct_count: number
  success_rate: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [b2bStats, setB2bStats] = useState<any>(null)
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'users' | 'questions' | 'b2b_clients' | 'b2b_calendar' | 'b2b_contracts' | 'crm' | 'analytics'>('overview')
  
  // Form state per generazione codici
  const [schoolName, setSchoolName] = useState('')
  const [planType, setPlanType] = useState<'last_minute' | 'senza_pensieri'>('last_minute')
  const [durationDays, setDurationDays] = useState(30)
  const [maxUses, setMaxUses] = useState(1)
  const [generating, setGenerating] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const isAdminUser = await isAdmin()
      
      if (!isAdminUser) {
        router.push('/dashboard')
        return
      }
      
      setAuthorized(true)
      await loadAllData()
    } catch (error) {
      console.error('Errore verifica admin:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadAllData() {
    try {
      // Carica statistiche globali
      const { data: globalStats } = await getAdminGlobalStats()
      setStats(globalStats)
      
      // Carica statistiche B2B
      const b2bData = await getB2BDashboardStats()
      setB2bStats(b2bData)
      
      // Carica codici di accesso
      const { data: accessCodes } = await getAllAccessCodes()
      setCodes(accessCodes || [])
      
      // Carica utenti
      const { data: allUsers } = await getAllUsers()
      setUsers(allUsers || [])
      
      // Carica statistiche domande
      const { data: qStats } = await getAdminQuestionStats()
      setQuestionStats(qStats?.slice(0, 20) || []) // Top 20
    } catch (error) {
      console.error('Errore caricamento dati admin:', error)
    }
  }

  async function handleGenerateCode() {
    if (!schoolName.trim()) {
      alert('Inserisci il nome della scuola guida')
      return
    }
    
    setGenerating(true)
    try {
      const newCode = await generateAccessCode(
        schoolName,
        planType,
        durationDays,
        maxUses
      )
      
      alert(`Codice generato con successo!\n\nCodice: ${newCode}\n\nInvia questo codice alla scuola guida.`)
      
      // Reset form
      setSchoolName('')
      setPlanType('last_minute')
      setDurationDays(30)
      setMaxUses(1)
      
      // Ricarica codici
      const { data: accessCodes } = await getAllAccessCodes()
      setCodes(accessCodes || [])
    } catch (error: any) {
      console.error('Errore generazione codice:', error)
      alert(`Errore nella generazione del codice:\n\n${error.message || error}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">Verifica accesso...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pannello di controllo gestione sistema
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition border border-gray-300 dark:border-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Indietro
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Panoramica' },
            { id: 'analytics', label: '📊 Analytics Avanzata' },
            { id: 'codes', label: 'Codici Accesso' },
            { id: 'users', label: 'Utenti' },
            { id: 'questions', label: 'Statistiche Domande' },
            { id: 'b2b_clients', label: 'Clienti B2B' },
            { id: 'b2b_calendar', label: 'Calendario' },
            { id: 'b2b_contracts', label: 'Contratti' },
            { id: 'crm', label: 'Pipeline CRM' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenuto Tab: Overview */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Sezione Quiz */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">Sistema Quiz</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Utenti Totali</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_users}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Utenti Premium</span>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.premium_users}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quiz Completati</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total_quizzes}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Punteggio Medio</span>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{Math.round(stats.avg_score)}%</div>
                </div>
              </div>
            </div>

            {/* Sezione B2B */}
            {b2bStats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">Gestionale B2B</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Clienti Attivi</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{b2bStats.activeClients}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-red-700 dark:text-red-400">Fatture Non Pagate</span>
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-semibold text-red-700 dark:text-red-400">{b2bStats.unpaidInvoices}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-amber-700 dark:text-amber-400">Contratti in Scadenza</span>
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{b2bStats.expiringContracts}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Appuntamenti Prossimi</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{b2bStats.upcomingAppointments}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Tasso di Successo</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Quiz Superati</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.passed_quizzes} / {stats.total_quizzes}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stats.total_quizzes > 0 ? (stats.passed_quizzes / stats.total_quizzes * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                      {stats.total_quizzes > 0 ? Math.round((stats.passed_quizzes / stats.total_quizzes) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">tasso di successo complessivo</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Codici di Accesso</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Codici Attivi</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.active_codes}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Riscatti Totali</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total_redemptions}</span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('codes')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Gestisci Codici
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenuto Tab: Codici */}
        {activeTab === 'codes' && (
          <EnhancedCodeManagement />
        )}

        {/* Contenuto Tab: Utenti */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestione Utenti</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Elenco completo degli utenti registrati - Totale: {users.length}</p>
            </div>
            {users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nessun utente trovato
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Gli utenti registrati appariranno qui
                </p>
                <button
                  onClick={() => loadAllData()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Ricarica
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Piano</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ruolo</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Scadenza</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Registrato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(user => {
                      const expiresDate = user.subscription_expires_at 
                        ? new Date(user.subscription_expires_at).toLocaleDateString('it-IT')
                        : 'N/A'
                      const createdDate = new Date(user.created_at).toLocaleDateString('it-IT')
                      const isUserAdmin = user.role === 'admin'
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="py-3 px-6 text-sm text-gray-900 dark:text-gray-100">{user.email || 'N/A'}</td>
                          <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300">{user.full_name || '-'}</td>
                          <td className="py-3 px-6 text-sm">
                            <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                              user.subscription_type === 'free'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}>
                              {user.subscription_type === 'free' ? 'Free' : user.subscription_type}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm">
                            <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                              isUserAdmin
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {isUserAdmin ? '👑 Admin' : 'User'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300">{expiresDate}</td>
                          <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300">{createdDate}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Nota:</strong> Per modificare i ruoli degli utenti e gestire i permessi admin, 
                è necessario accedere direttamente al database di Supabase tramite SQL:
                <code className="block mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs">
                  UPDATE user_profiles SET role = 'admin' WHERE email = 'user@example.com';
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Contenuto Tab: Question Stats */}
        {activeTab === 'questions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiche Domande</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Top 20 domande più frequenti</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Domanda</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Volte Chiesta</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tasso Successo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {questionStats.map(stat => (
                    <tr key={stat.question_id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="py-3 px-6 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                        {stat.question_text}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300">{stat.category}</td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300 font-medium">{stat.times_asked}</td>
                      <td className="py-3 px-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                stat.success_rate >= 70 ? 'bg-green-600' :
                                stat.success_rate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${stat.success_rate}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 w-12 text-right">{stat.success_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenuto Tab: B2B Clients */}
        {activeTab === 'b2b_clients' && <B2BClients />}

        {/* Contenuto Tab: B2B Calendar */}
        {activeTab === 'b2b_calendar' && <B2BCalendar />}

        {/* Contenuto Tab: B2B Contracts */}
        {activeTab === 'b2b_contracts' && <B2BContracts />}

        {/* Contenuto Tab: CRM Pipeline */}
        {activeTab === 'crm' && <CRMPipeline />}

        {/* Contenuto Tab: Analytics Avanzata */}
        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📊 Analytics Avanzata - Tutto il Traffico
            </h2>
            <AdvancedAnalytics />
          </div>
        )}
      </div>
    </div>
  )
}
