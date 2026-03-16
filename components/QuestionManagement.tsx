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
  bulkCreateQuestions,
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

// ─── SQLite loader (cached, browser-only) ────────────────────────────────────

let _sqlJsCache: any = null
let _sqlJsLoading: Promise<any> | null = null
async function loadSqlJs(): Promise<any> {
  if (_sqlJsCache) return _sqlJsCache
  if (_sqlJsLoading) return _sqlJsLoading
  _sqlJsLoading = new Promise<any>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js'
    script.onload = async () => {
      try {
        const SQL = await (window as any).initSqlJs({
          locateFile: () => 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.wasm',
        })
        _sqlJsCache = SQL
        resolve(SQL)
      } catch (e) { reject(e) }
    }
    script.onerror = () => reject(new Error('Impossibile caricare il parser SQLite dal CDN'))
    document.head.appendChild(script)
  })
  return _sqlJsLoading
}

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

  // Import
  const [importOpen, setImportOpen] = useState(false)
  const [importParsed, setImportParsed] = useState<Array<Omit<Question, 'id'>>>([])
  const [importParseErrors, setImportParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [importSqliteInfo, setImportSqliteInfo] = useState<string | null>(null)
  const [importForceLicense, setImportForceLicense] = useState('')

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
      image_url: q.image_url,
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

  // ─── Import ──────────────────────────────────────────────────────────────────

  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur)
    return result
  }

  const VALID_LICENSE_IDS = new Set<string>(LICENSE_TYPES.map(l => l.id))

  function normalizeRow(raw: Record<string, any>): { q: Omit<Question, 'id'>; err: string | null } {
    const str = (v: any) => (v == null ? '' : String(v)).trim()
    const question = str(raw.question)
    if (!question) return { q: {} as any, err: 'Campo "question" mancante' }

    const answers: string[] = Array.isArray(raw.answers)
      ? raw.answers.map((a: any) => str(a)).filter(Boolean)
      : [raw.answer_1, raw.answer_2, raw.answer_3, raw.answer_4].map(str).filter(Boolean)

    let correct_answer = str(raw.correct_answer)

    // ─ Auto-detect Vero/Falso ──────────────────────────────────────────────
    // Scatta se: nessuna risposta multipla trovata E correct_answer è un valore booleano
    if (answers.length < 2 && correct_answer) {
      const BOOL_TRUE  = /^(v|1|true|vero|sì|si|yes|y|t|esatto|giusto|correct)$/i
      const BOOL_FALSE = /^(f|0|false|falso|no|n|sbagliato|errato|wrong)$/i
      if (BOOL_TRUE.test(correct_answer) || BOOL_FALSE.test(correct_answer)) {
        const isTrue = BOOL_TRUE.test(correct_answer)
        answers.splice(0, answers.length, 'Vero', 'Falso')
        correct_answer = isTrue ? 'Vero' : 'Falso'
      }
    }
    // Gestisci anche il caso in cui le risposte siano già ["V","F"] o ["1","0"] ecc.
    if (answers.length === 2) {
      const BOOL_TRUE  = /^(v|1|true|vero|sì|si|yes|y|t|esatto|giusto)$/i
      const BOOL_FALSE = /^(f|0|false|falso|no|n|sbagliato|errato)$/i
      const a0v = BOOL_TRUE.test(answers[0]) || BOOL_FALSE.test(answers[0])
      const a1v = BOOL_TRUE.test(answers[1]) || BOOL_FALSE.test(answers[1])
      if (a0v && a1v) {
        const norm = (v: string) => BOOL_TRUE.test(v) ? 'Vero' : 'Falso'
        answers[0] = norm(answers[0])
        answers[1] = norm(answers[1])
        if (BOOL_TRUE.test(correct_answer) || BOOL_FALSE.test(correct_answer))
          correct_answer = BOOL_TRUE.test(correct_answer) ? 'Vero' : 'Falso'
      }
    }
    // ──────────────────────────────────────────────────────────────────

    if (answers.length < 2) return { q: {} as any, err: `"${question.slice(0, 40)}..." ha meno di 2 risposte` }

    if (!correct_answer) return { q: {} as any, err: `"${question.slice(0, 40)}..." senza risposta corretta` }
    if (!answers.includes(correct_answer)) return { q: {} as any, err: `"${question.slice(0, 40)}..." risposta corretta non presente nelle risposte` }

    const license_type = str(raw.license_type)
    if (license_type && !VALID_LICENSE_IDS.has(license_type))
      return { q: {} as any, err: `"${question.slice(0, 40)}..." license_type "${license_type}" non valido` }

    return {
      q: {
        question,
        answers,
        correct_answer,
        category: str(raw.category) || undefined,
        explanation: str(raw.explanation) || undefined,
        license_type: license_type || 'taxi_ncc',
        image_url: (raw.image_url as string) || undefined,
      },
      err: null,
    }
  }

  // ─── SQLite helpers ─────────────────────────────────────────────────────────

  function uint8ToDataUrl(data: Uint8Array): string {
    const mime = (data[0] === 0xFF && data[1] === 0xD8) ? 'image/jpeg'
      : (data[0] === 0x89 && data[1] === 0x50) ? 'image/png'
      : (data[0] === 0x47 && data[1] === 0x49) ? 'image/gif'
      : 'image/jpeg'
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < data.length; i += chunk)
      binary += String.fromCharCode(...Array.from(data.subarray(i, Math.min(i + chunk, data.length))))
    return `data:${mime};base64,${btoa(binary)}`
  }

  function buildColumnMap(cols: string[]): Record<string, string> {
    const lower = cols.map(c => c.toLowerCase())
    const find = (...cands: string[]) => {
      for (const c of cands) { const i = lower.indexOf(c); if (i !== -1) return cols[i] }
    }
    const m: Record<string, string> = {}
    const set = (k: string, v: string | undefined) => { if (v) m[k] = v }
    set('question',      find('question','domanda','text','testo','question_text','q','description','domanda_testo'))
    set('answer_1',      find('answer_1','answer1','a1','ans1','option_a','risposta_1','risposta1','opzione_a'))
    set('answer_2',      find('answer_2','answer2','a2','ans2','option_b','risposta_2','risposta2','opzione_b'))
    set('answer_3',      find('answer_3','answer3','a3','ans3','option_c','risposta_3','risposta3','opzione_c'))
    set('answer_4',      find('answer_4','answer4','a4','ans4','option_d','risposta_4','risposta4','opzione_d'))
    set('answers',       find('answers','risposte','opzioni'))
    set('correct_answer',find('correct_answer','correct','answer_key','risposta_corretta','risposta_giusta','key','giusta','risposta','answer','ans','valore','vf','bool','isCorrect','is_correct','result'))
    set('category',      find('category','categoria','argomento','topic','subject','materia','sezione'))
    set('explanation',   find('explanation','spiegazione','note','rationale','motivazione','commento','dettaglio'))
    set('license_type',  find('license_type','tipo_patente','patente','license','tipo'))
    set('image',         find('image','image_data','immagine','foto','picture','img','image_blob','photo','thumbnail','immagine_domanda'))
    return m
  }

  function mapSqliteRow(row: Record<string, any>, colMap: Record<string, string>): Record<string, any> {
    const get = (k: string) => colMap[k] !== undefined ? row[colMap[k]] : undefined
    const str = (v: any) => (v == null ? '' : String(v))
    let answersArr: string[] | undefined
    const rawAns = get('answers')
    if (rawAns != null) {
      try { const p = typeof rawAns === 'string' ? JSON.parse(rawAns) : rawAns; if (Array.isArray(p)) answersArr = p.map(String) } catch {}
    }
    let imageUrl: string | undefined
    const imgData = get('image')
    if (imgData instanceof Uint8Array && imgData.length > 0) imageUrl = uint8ToDataUrl(imgData)
    else if (typeof imgData === 'string' && imgData.startsWith('data:')) imageUrl = imgData
    return {
      question:       str(get('question')),
      answer_1:       str(get('answer_1')),
      answer_2:       str(get('answer_2')),
      answer_3:       str(get('answer_3')),
      answer_4:       str(get('answer_4')),
      ...(answersArr ? { answers: answersArr } : {}),
      correct_answer: str(get('correct_answer')),
      category:       str(get('category')),
      explanation:    str(get('explanation')),
      license_type:   str(get('license_type')),
      ...(imageUrl ? { image_url: imageUrl } : {}),
    }
  }

  async function handleSqliteBuffer(buffer: ArrayBuffer) {
    setImportStatus('Caricamento parser SQLite...')
    const SQL = await loadSqlJs()
    setImportStatus('Apertura database...')
    const db = new SQL.Database(new Uint8Array(buffer))
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    const tables: string[] = (tablesRes[0]?.values || []).map((v: any) => String(v[0]))
    if (tables.length === 0) { db.close(); throw new Error('Nessuna tabella trovata nel database') }
    const preferred = ['questions','domande','quiz','question','quizzes','domande_quiz']
    const target = tables.find(t => preferred.includes(t.toLowerCase())) || tables[0]
    const colRes = db.exec(`PRAGMA table_info("${target}")`)
    const colNames: string[] = (colRes[0]?.values || []).map((v: any) => String(v[1]))
    const colMap = buildColumnMap(colNames)
    if (!colMap.question) { db.close(); throw new Error(`Colonna "question" non trovata. Colonne rilevate: ${colNames.join(', ')}`) }
    setImportStatus('Lettura domande...')
    const dataRes = db.exec(`SELECT * FROM "${target}"`)
    db.close()
    if (!dataRes[0]) { setImportSqliteInfo(`Tabella "${target}" vuota`); setImportStatus(null); return }
    const cols = dataRes[0].columns
    const rawRows = dataRes[0].values.map((vals: any[]) => {
      const row: Record<string, any> = {}
      cols.forEach((col: string, i: number) => { row[col] = vals[i] })
      return row
    })
    const hasImages = !!colMap.image
    setImportSqliteInfo(`Tabella "${target}" \u00b7 ${colNames.length} colonne \u00b7 ${rawRows.length} righe${hasImages ? ' \u00b7 \uD83D\uDDBC\uFE0F immagini rilevate' : ''}`)
    setImportStatus(hasImages ? 'Elaborazione immagini...' : null)
    const valid: Array<Omit<Question, 'id'>> = []
    const errors: string[] = []
    rawRows.forEach((row: Record<string, any>, i: number) => {
      const { q, err } = normalizeRow(mapSqliteRow(row, colMap))
      if (err) errors.push(`Riga ${i + 1}: ${err}`)
      else valid.push(q)
    })
    setImportParsed(valid)
    setImportParseErrors(errors)
    setImportResult(null)
    setImportStatus(null)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportParsed([])
    setImportParseErrors([])
    setImportResult(null)
    setImportSqliteInfo(null)
    setImportStatus(null)

    if (/\.(sqlite|sqlite3|db)$/i.test(file.name)) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try { await handleSqliteBuffer(ev.target?.result as ArrayBuffer) }
        catch (err: any) { setImportParseErrors([`Errore SQLite: ${err.message}`]); setImportStatus(null) }
      }
      reader.readAsArrayBuffer(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      let rawRows: Record<string, any>[] = []
      const parseErrors: string[] = []
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text)
          rawRows = Array.isArray(parsed) ? parsed : [parsed]
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split(/\r?\n/).filter(l => l.trim())
          if (lines.length < 2) { setImportParseErrors(['Il CSV deve avere almeno una riga header + una riga dati']); return }
          const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLine(lines[i])
            const row: Record<string, string> = {}
            headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })
            rawRows.push(row)
          }
        } else { setImportParseErrors(['Formato non supportato. Usa .json, .csv o .sqlite']); return }
      } catch (err: any) { setImportParseErrors([`Errore di parsing: ${err.message}`]); return }
      const valid: Array<Omit<Question, 'id'>> = []
      rawRows.forEach((raw, i) => {
        const { q, err } = normalizeRow(raw)
        if (err) parseErrors.push(`Riga ${i + 2}: ${err}`)
        else valid.push(q)
      })
      setImportParsed(valid)
      setImportParseErrors(parseErrors)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (importParsed.length === 0) return
    setImporting(true)
    const rows = importForceLicense
      ? importParsed.map(q => ({ ...q, license_type: importForceLicense }))
      : importParsed
    const { data, error } = await bulkCreateQuestions(rows)
    const inserted = data?.length ?? 0
    const errors = error ? [error.message] : []
    setImportResult({ inserted, errors })
    setImporting(false)
    if (inserted > 0) {
      loadQuestions()
      loadCategories()
    }
  }

  function closeImport() {
    setImportOpen(false)
    setImportParsed([])
    setImportParseErrors([])
    setImportResult(null)
    setImportStatus(null)
    setImportSqliteInfo(null)
    setImportForceLicense('')
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
          <button
            onClick={() => { setImportOpen(true); setImportParsed([]); setImportParseErrors([]); setImportResult(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
          >
            <span>📥</span> Importa
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
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Tipo Patente</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Domanda</th>
                  <th className="px-4 py-3 text-left">Extra</th>
                  <th className="px-4 py-3 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs" title={`ID: ${q.id}`}>{idx + 1}</td>
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
                      <div className="flex items-center gap-1.5">
                        {q.image_url && <span title="Ha immagine">📷</span>}
                        {q.explanation
                          ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Spieg.</span>
                          : (!q.image_url && <span className="text-gray-400 text-xs">—</span>)
                        }
                      </div>
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

      {/* ── Modale: Import ──────────────────────────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📥 Importa Domande</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Supporta .json, .csv e .sqlite (con immagini integrate)</p>
              </div>
              <button onClick={closeImport} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Istruzioni formato */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">📄 JSON</p>
                  <pre className="text-[10px] text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">{`[
  {
    "question": "Testo",
    "answers": ["A","B","C","D"],
    "correct_answer": "A",
    "category": "CdS",
    "explanation": "",
    "license_type": "taxi_ncc"
  }
]`}</pre>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">📊 CSV</p>
                  <pre className="text-[10px] text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">{`question,answer_1,answer_2,
answer_3,answer_4,correct_answer,
category,explanation,license_type
"Testo?","A","B","C","D",
"A","Cat","Spieg","taxi_ncc"`}</pre>
                  <p className="text-[10px] text-gray-400 mt-1">license_type: taxi_ncc, ab, am, cd, cqc, nautica, adr, cap_kb, revisione</p>
                </div>
                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">🗄️ SQLite (.sqlite / .db)</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tabella: <code>questions</code> (o <code>domande</code>, <code>quiz</code>)<br/>
                    Colonne riconosciute automaticamente:<br/>
                    • question / domanda / text<br/>
                    • answer_1..4 / a1..4 / option_a..d<br/>
                    • correct_answer / risposta_corretta<br/>
                    • category / categoria / argomento<br/>
                    • explanation / spiegazione<br/>
                    • license_type / tipo_patente<br/>
                    • <strong>image / immagine / foto (BLOB)</strong><br/>
                    <span className="text-blue-600 dark:text-blue-400">✓ Immagini JPEG/PNG/GIF/WebP integrate come BLOB</span>
                  </p>
                </div>
              </div>

              {/* Forza tipo patente */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Forza tipo patente:</label>
                <select
                  value={importForceLicense}
                  onChange={e => setImportForceLicense(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">— Usa quello del file (default: taxi_ncc) —</option>
                  {LICENSE_TYPES.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>

              {/* File picker */}
              {!importResult && !importStatus && (
                <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition">
                  <span className="text-4xl">📂</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clicca per selezionare un file .json, .csv o .sqlite</span>
                  <input type="file" accept=".json,.csv,.sqlite,.sqlite3,.db" onChange={handleFileSelect} className="hidden" />
                </label>
              )}

              {/* Status SQLite parsing */}
              {importStatus && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">{importStatus}</span>
                </div>
              )}

              {/* Info tabella SQLite */}
              {importSqliteInfo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span>🗄️</span><span>{importSqliteInfo}</span>
                </p>
              )}

              {/* Errori di parsing */}
              {importParseErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg space-y-1">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300">⚠️ {importParseErrors.length} righe non valide (saranno saltate):</p>
                  {importParseErrors.slice(0, 8).map((e, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>
                  ))}
                  {importParseErrors.length > 8 && <p className="text-xs text-red-500">...e altri {importParseErrors.length - 8}</p>}
                </div>
              )}

              {/* Preview */}
              {importParsed.length > 0 && !importResult && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    ✅ {importParsed.length} domande pronte all'importazione
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Img</th>
                          <th className="px-3 py-2 text-left">Patente</th>
                          <th className="px-3 py-2 text-left">Categoria</th>
                          <th className="px-3 py-2 text-left">Domanda</th>
                          <th className="px-3 py-2 text-left">Risp. corretta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {importParsed.slice(0, 5).map((q, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2">
                              {q.image_url
                                ? <img src={q.image_url} alt="" className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-600" />
                                : <span className="text-gray-300 text-xs">—</span>}
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {q.license_type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[100px] truncate">{q.category || '—'}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-xs">
                              <p className="line-clamp-2">{q.question}</p>
                            </td>
                            <td className="px-3 py-2 text-green-700 dark:text-green-300 max-w-[120px] truncate">{q.correct_answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importParsed.length > 5 && (
                      <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
                        ...e altre {importParsed.length - 5} domande
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Risultato import */}
              {importResult && (
                <div className={`p-4 rounded-lg border ${
                  importResult.errors.length === 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                }`}>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {importResult.inserted > 0 ? `✅ ${importResult.inserted} domande importate con successo!` : '❌ Import fallito'}
                  </p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400 mt-1">{e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={closeImport} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                {importResult ? 'Chiudi' : 'Annulla'}
              </button>
              {importParsed.length > 0 && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg transition flex items-center gap-2"
                >
                  {importing ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importazione...</>
                  ) : (
                    <>📥 Importa {importParsed.length} domande</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

              {/* Immagine (read-only, da import SQLite) */}
              {form.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Immagine</label>
                  <img src={form.image_url} alt="Immagine domanda" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-600 object-contain" />
                </div>
              )}
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
