'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Question,
  LICENSE_TYPES,
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getCategories,
} from '@/lib/supabase'

// ─── Costanti ────────────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<Question, 'id'> = {
  question: '',
  answers: ['', '', '', ''],
  correct_answer: '',
  category: '',
  explanation: '',
  license_type: 'taxi_ncc',
}

// ─── Tipi locali ─────────────────────────────────────────────────────────────

type FormData = Omit<Question, 'id'>

// ─── Componente principale ────────────────────────────────────────────────────

export default function QuestionManagement() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filtri lista
  const [filterLicense, setFilterLicense] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // Modale
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // ─── Carica dati ───────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getAllQuestions(
      filterLicense || undefined,
      filterCategory || undefined,
    )
    if (error) setError('Errore nel caricamento delle domande')
    else setQuestions(data || [])
    setLoading(false)
  }, [filterLicense, filterCategory])

  const loadCategories = useCallback(async () => {
    const { data } = await getCategories(filterLicense || undefined)
    setCategories(data || [])
  }, [filterLicense])

  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { loadCategories() }, [loadCategories])

  // Quando cambia tipologia filtro, resetta categoria
  useEffect(() => { setFilterCategory('') }, [filterLicense])

  // ─── Flash messages ─────────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }
  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(null), 4000)
  }

  // ─── Modale helpers ─────────────────────────────────────────────────────────

  function openNew() {
    setForm({ ...EMPTY_FORM, license_type: filterLicense || 'taxi_ncc', category: filterCategory || '' })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(q: Question) {
    setForm({
      question: q.question,
      answers: q.answers.length >= 4 ? [...q.answers] : [...q.answers, ...Array(4 - q.answers.length).fill('')],
      correct_answer: q.correct_answer,
      category: q.category || '',
      explanation: q.explanation || '',
      license_type: q.license_type || 'taxi_ncc',
    })
    setEditingId(q.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  // ─── Validazione ────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.question.trim()) return 'La domanda non può essere vuota'
    const filledAnswers = form.answers.filter(a => a.trim())
    if (filledAnswers.length < 2) return 'Inserisci almeno 2 risposte'
    if (!form.correct_answer.trim()) return 'Seleziona la risposta corretta'
    if (!form.answers.includes(form.correct_answer)) return 'La risposta corretta deve essere una delle risposte elencate'
    if (!form.license_type) return 'Seleziona il tipo di patente'
    return null
  }

  // ─── Salva ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    const validationError = validate()
    if (validationError) { showError(validationError); return }

    setSaving(true)
    const payload: Omit<Question, 'id'> = {
      ...form,
      answers: form.answers.filter(a => a.trim()),
      category: form.category?.trim() || undefined,
      explanation: form.explanation?.trim() || undefined,
    }

    if (editingId !== null) {
      const { error } = await updateQuestion(editingId, payload)
      if (error) { showError('Errore durante il salvataggio: ' + error.message); setSaving(false); return }
      showSuccess('Domanda aggiornata')
    } else {
      const { error } = await createQuestion(payload)
      if (error) { showError('Errore durante la creazione: ' + error.message); setSaving(false); return }
      showSuccess('Domanda creata')
    }

    setSaving(false)
    closeModal()
    loadQuestions()
    loadCategories()
  }

  // ─── Elimina ────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    const { error } = await deleteQuestion(id)
    if (error) { showError('Errore durante l\'eliminazione: ' + error.message); return }
    showSuccess('Domanda eliminata')
    setConfirmDeleteId(null)
    loadQuestions()
  }

  // ─── Ricerca client-side ────────────────────────────────────────────────────

  const filtered = filterSearch.trim()
    ? questions.filter(q =>
        q.question.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (q.category || '').toLowerCase().includes(filterSearch.toLowerCase())
      )
    : questions

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Flash messages */}
      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200 text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Header + Filtri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestione Domande</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} domande{filterLicense || filterCategory || filterSearch ? ' (filtrate)' : ''} · {questions.length} totali</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            <span className="text-lg leading-none">+</span> Nuova Domanda
          </button>
        </div>

        {/* Filtri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterLicense}
            onChange={e => setFilterLicense(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Tutti i tipi patente</option>
            {LICENSE_TYPES.map(lt => (
              <option key={lt.id} value={lt.id}>{lt.label}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Tutte le categorie</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cerca per testo..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Tabella domande */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Nessuna domanda trovata.{' '}
            <button onClick={openNew} className="text-blue-600 hover:underline">Crea la prima</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Tipo Patente</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Domanda</th>
                  <th className="px-4 py-3 text-left">Spiegazione</th>
                  <th className="px-4 py-3 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{q.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                        {LICENSE_TYPES.find(l => l.id === q.license_type)?.label ?? q.license_type ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[140px] truncate">{q.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-sm">
                      <p className="line-clamp-2">{q.question}</p>
                    </td>
                    <td className="px-4 py-3">
                      {q.explanation
                        ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Presente</span>
                        : <span className="text-gray-400 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(q)}
                          className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(q.id)}
                          className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modale: Crea / Modifica ─────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
            {/* Header modale */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId !== null ? 'Modifica Domanda' : 'Nuova Domanda'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>

            {/* Body modale */}
            <div className="px-6 py-5 space-y-5">

              {/* Tipo patente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo Patente <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.license_type || ''}
                  onChange={e => setForm(f => ({ ...f, license_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {LICENSE_TYPES.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <input
                  type="text"
                  value={form.category || ''}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="es. Codice della Strada, Toponomastica Palermo..."
                  list="categories-datalist"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <datalist id="categories-datalist">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              {/* Testo domanda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domanda <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="Testo della domanda..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              {/* Risposte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risposte <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-2">(seleziona quella corretta con il cerchio)</span>
                </label>
                <div className="space-y-2">
                  {form.answers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {/* Radio per segnare la risposta corretta */}
                      <button
                        type="button"
                        onClick={() => { if (ans.trim()) setForm(f => ({ ...f, correct_answer: ans })) }}
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition ${
                          form.correct_answer && form.correct_answer === ans
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                        }`}
                        title="Segna come risposta corretta"
                      />
                      <input
                        type="text"
                        value={ans}
                        onChange={e => {
                          const newAnswers = [...form.answers]
                          const oldAns = newAnswers[i]
                          newAnswers[i] = e.target.value
                          // se stava segnando questa come corretta, aggiorna
                          const newCorrect = form.correct_answer === oldAns ? e.target.value : form.correct_answer
                          setForm(f => ({ ...f, answers: newAnswers, correct_answer: newCorrect }))
                        }}
                        placeholder={`Risposta ${i + 1}${i < 2 ? ' (obbligatoria)' : ''}`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  ))}
                </div>
                {form.correct_answer && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ Risposta corretta: <strong>{form.correct_answer}</strong>
                  </p>
                )}
              </div>

              {/* Spiegazione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spiegazione
                  <span className="font-normal text-gray-400 ml-2">(mostrata dopo la risposta)</span>
                </label>
                <textarea
                  rows={4}
                  value={form.explanation || ''}
                  onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                  placeholder="Spiega perché la risposta è corretta, dettagli normativi, suggerimenti..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
            </div>

            {/* Footer modale */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition"
              >
                {saving ? 'Salvataggio...' : editingId !== null ? 'Aggiorna' : 'Crea Domanda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale: Conferma eliminazione ────────────────────────────────────── */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Conferma eliminazione</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sei sicuro di voler eliminare la domanda <strong>#{confirmDeleteId}</strong>? L'operazione non è reversibile.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
