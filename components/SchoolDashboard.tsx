'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  isSchoolAdmin,
  getMySchool,
  getSchoolStudents,
  getSchoolStudentStats,
  updateSchool,
  School,
} from '@/lib/supabase'
import { Building2, Users, TrendingUp, CheckCircle, Clock, LogOut, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Tipi locali ─────────────────────────────────────────────────────────────

interface Student {
  id: string
  full_name?: string
  email?: string
  subscription_type: string
  subscription_expires_at?: string
  created_at: string
  // arricchiti da stats
  quiz_count?: number
  avg_score?: number
  last_quiz?: string
  passed_count?: number
}

type ActiveTab = 'students' | 'settings'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(score?: number) {
  if (score === undefined) return 'text-gray-400'
  if (score >= 90) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function SchoolDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<School | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('students')

  // Settings form
  const [editSchool, setEditSchool] = useState<Partial<School>>({})
  const [savingSchool, setSavingSchool] = useState(false)
  const [schoolSaveMsg, setSchoolSaveMsg] = useState<string | null>(null)

  // Espansione dettaglio studente
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // ─── Carica dati ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)

    const ok = await isSchoolAdmin()
    if (!ok) { router.push('/login'); return }

    const { data: schoolData } = await getMySchool()
    setSchool(schoolData)
    setEditSchool(schoolData ? {
      name: schoolData.name,
      city: schoolData.city,
      address: schoolData.address,
      phone: schoolData.phone,
      email: schoolData.email,
    } : {})

    const { data: rawStudents } = await getSchoolStudents()
    if (!rawStudents || rawStudents.length === 0) {
      setStudents([])
      setLoading(false)
      return
    }

    // Arricchisci con stats quiz
    const ids = rawStudents.map((s: any) => s.id)
    const { data: quizStats } = await getSchoolStudentStats(ids)

    const enriched: Student[] = rawStudents.map((s: any) => {
      const studentResults = (quizStats || []).filter((r: any) => r.user_id === s.id)
      const quiz_count = studentResults.length
      const avg_score = quiz_count > 0
        ? Math.round(studentResults.reduce((acc: number, r: any) => acc + r.score_percentage, 0) / quiz_count)
        : undefined
      const passed_count = studentResults.filter((r: any) => r.score_percentage >= 90).length
      const last_quiz = studentResults[0]?.completed_at ?? undefined
      return { ...s, quiz_count, avg_score, passed_count, last_quiz }
    })

    setStudents(enriched)
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  // ─── Logout ────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ─── Salva scuola ──────────────────────────────────────────────────────────

  async function handleSaveSchool() {
    if (!school) return
    setSavingSchool(true)
    const { error } = await updateSchool(school.id, editSchool as any)
    setSavingSchool(false)
    if (error) {
      setSchoolSaveMsg('❌ Errore durante il salvataggio')
    } else {
      setSchoolSaveMsg('✅ Dati aggiornati')
      loadData()
    }
    setTimeout(() => setSchoolSaveMsg(null), 3000)
  }

  // ─── Statistiche aggregate ────────────────────────────────────────────────

  const totalQuizzes = students.reduce((a, s) => a + (s.quiz_count || 0), 0)
  const avgScore = students.length > 0
    ? Math.round(students.filter(s => s.avg_score !== undefined).reduce((a, s) => a + (s.avg_score || 0), 0) /
        Math.max(1, students.filter(s => s.avg_score !== undefined).length))
    : null
  const activeStudents = students.filter(
    s => s.subscription_type !== 'free' &&
    (!s.subscription_expires_at || new Date(s.subscription_expires_at) > new Date())
  ).length

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                {school?.name || 'Autoscuola'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Portal Scuola Guida</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5" />, label: 'Studenti totali', value: students.length, color: 'blue' },
            { icon: <CheckCircle className="w-5 h-5" />, label: 'Abbonamenti attivi', value: activeStudents, color: 'green' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Quiz completati', value: totalQuizzes, color: 'purple' },
            { icon: <Clock className="w-5 h-5" />, label: 'Score medio', value: avgScore !== null ? `${avgScore}%` : '—', color: 'orange' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center bg-${card.color}-100 dark:bg-${card.color}-900/30 text-${card.color}-600 dark:text-${card.color}-400`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1.5 border border-gray-200 dark:border-gray-700 w-fit">
          {([
            { id: 'students', label: '👥 Studenti' },
            { id: 'settings', label: '⚙️ Impostazioni scuola' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Studenti ──────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">I tuoi studenti</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Studenti che hanno riscattato un codice della tua scuola
              </p>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nessuno studente ancora</p>
                <p className="text-sm mt-1">Distribuisci i codici accesso ai tuoi studenti.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.map(student => (
                  <div key={student.id}>
                    {/* Riga principale */}
                    <button
                      className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center gap-4"
                      onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    >
                      {/* Avatar iniziale */}
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm flex-shrink-0">
                        {(student.full_name || student.email || '?')[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {student.full_name || student.email || `Studente ${student.id.slice(0, 6)}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                      </div>

                      {/* Badge abbonamento */}
                      <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        student.subscription_type === 'free'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {student.subscription_type === 'free' ? 'Free' : 'Premium'}
                      </span>

                      {/* Score medio */}
                      <span className={`hidden sm:block text-sm font-semibold w-12 text-right flex-shrink-0 ${scoreColor(student.avg_score)}`}>
                        {student.avg_score !== undefined ? `${student.avg_score}%` : '—'}
                      </span>

                      {/* Quiz count */}
                      <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400 w-20 text-right flex-shrink-0">
                        {student.quiz_count || 0} quiz
                      </span>

                      {expandedStudent === student.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Dettaglio espanso */}
                    {expandedStudent === student.id && (
                      <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Quiz completati</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{student.quiz_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Score medio</p>
                            <p className={`font-semibold ${scoreColor(student.avg_score)}`}>
                              {student.avg_score !== undefined ? `${student.avg_score}%` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Quiz superati (≥90%)</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{student.passed_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ultimo quiz</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(student.last_quiz)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Abbonamento</p>
                            <p className="font-semibold text-gray-900 dark:text-white capitalize">{student.subscription_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Scadenza</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(student.subscription_expires_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Iscritto il</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(student.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Impostazioni scuola ──────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Dati della tua scuola</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: 'name',    label: 'Nome scuola',         placeholder: 'Autoscuola Rossi', required: true },
                { key: 'city',    label: 'Città',               placeholder: 'Palermo' },
                { key: 'address', label: 'Indirizzo',           placeholder: 'Via Roma 1' },
                { key: 'phone',   label: 'Telefono',            placeholder: '091 123456' },
                { key: 'email',   label: 'Email della scuola',  placeholder: 'info@autoscuola.it' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    value={(editSchool as any)[f.key] || ''}
                    onChange={e => setEditSchool(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}

              {schoolSaveMsg && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{schoolSaveMsg}</p>
              )}

              <button
                onClick={handleSaveSchool}
                disabled={savingSchool}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
              >
                {savingSchool ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
