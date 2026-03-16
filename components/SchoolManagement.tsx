'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllSchools,
  createSchool,
  updateSchool,
  getAllUsers,
  getSchoolLicenses,
  setSchoolLicenses,
  School,
  LICENSE_TYPES,
} from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { Building2, Plus, Pencil, Users, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Tipi locali ──────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  email: string
  full_name: string
  role?: string
  school_id?: number
}

type SchoolForm = Pick<School, 'name' | 'city' | 'address' | 'phone' | 'email'>

const EMPTY_FORM: SchoolForm = { name: '', city: '', address: '', phone: '', email: '' }

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Modale scuola
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SchoolForm>({ ...EMPTY_FORM })

  // Scuola espansa (per vedere/gestire i suoi utenti)
  const [expandedSchool, setExpandedSchool] = useState<number | null>(null)

  // Licenze per ogni scuola espansa: schoolId → array of license_type strings
  const [schoolLicensesMap, setSchoolLicensesMap] = useState<Record<number, string[]>>({})
  const [savingLicenses, setSavingLicenses] = useState(false)

  // ─── Carica licenze quando si espande una scuola ──────────────────────────

  async function expandSchool(schoolId: number | null) {
    setExpandedSchool(schoolId)
    if (schoolId !== null && !(schoolId in schoolLicensesMap)) {
      const { data } = await getSchoolLicenses(schoolId)
      setSchoolLicensesMap(prev => ({ ...prev, [schoolId]: data }))
    }
  }

  async function toggleLicense(schoolId: number, licenseTypeId: string, checked: boolean) {
    const current = schoolLicensesMap[schoolId] || []
    const updated = checked
      ? [...current, licenseTypeId]
      : current.filter(l => l !== licenseTypeId)
    setSchoolLicensesMap(prev => ({ ...prev, [schoolId]: updated }))
    setSavingLicenses(true)
    const { error } = await setSchoolLicenses(schoolId, updated)
    setSavingLicenses(false)
    if (error) flash('err', 'Errore salvataggio licenze: ' + error.message)
  }

  // ─── Carica ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: u }] = await Promise.all([getAllSchools(), getAllUsers()])
    setSchools((s as School[]) || [])
    setUsers((u as UserRow[] | null) || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Flash ────────────────────────────────────────────────────────────────

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  // ─── Modale ────────────────────────────────────────────────────────────────

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(s: School) {
    setForm({ name: s.name, city: s.city || '', address: s.address || '', phone: s.phone || '', email: s.email || '' })
    setEditingId(s.id)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { flash('err', 'Il nome della scuola è obbligatorio'); return }
    setSaving(true)
    if (editingId !== null) {
      const { error } = await updateSchool(editingId, form)
      if (error) { flash('err', 'Errore: ' + (error.message ?? error)); setSaving(false); return }
      flash('ok', 'Scuola aggiornata')
    } else {
      const { error } = await createSchool(form)
      if (error) { flash('err', 'Errore: ' + (error.message ?? error)); setSaving(false); return }
      flash('ok', 'Scuola creata')
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  // ─── Assegna / rimuovi school_admin ───────────────────────────────────────

  async function setUserSchoolAdmin(userId: string, schoolId: number | null, makeAdmin: boolean) {
    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        role: makeAdmin ? 'school_admin' : 'user',
        school_id: schoolId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    setSaving(false)
    if (error) { flash('err', 'Errore: ' + error.message); return }
    flash('ok', makeAdmin ? 'Utente impostato come admin scuola' : 'Ruolo rimosso')
    load()
  }

  // ─── Assegna school_id a utente normale (studente) ───────────────────────

  async function assignStudentToSchool(userId: string, schoolId: number | null) {
    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({ school_id: schoolId, updated_at: new Date().toISOString() })
      .eq('id', userId)
    setSaving(false)
    if (error) { flash('err', 'Errore: ' + error.message); return }
    flash('ok', 'Scuola aggiornata')
    load()
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const schoolAdmins = (schoolId: number) =>
    users.filter(u => u.school_id === schoolId && u.role === 'school_admin')

  const schoolStudents = (schoolId: number) =>
    users.filter(u => u.school_id === schoolId && u.role !== 'school_admin' && u.role !== 'admin')

  const unassignedUsers = users.filter(u => !u.school_id && u.role !== 'admin')

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Flash */}
      {msg && (
        <div className={`p-3 rounded-lg text-sm border ${
          msg.type === 'ok'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
        }`}>
          {msg.type === 'ok' ? '✅' : '❌'} {msg.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestione Scuole Guida</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{schools.length} scuole registrate</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Nuova Scuola
        </button>
      </div>

      {/* Lista scuole */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Caricamento...</div>
      ) : schools.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400">Nessuna scuola. <button onClick={openNew} className="text-blue-600 hover:underline">Creane una</button></p>
        </div>
      ) : (
        <div className="space-y-3">
          {schools.map(school => {
            const admins = schoolAdmins(school.id)
            const students = schoolStudents(school.id)
            const isExpanded = expandedSchool === school.id

            return (
              <div key={school.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Riga scuola */}
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{school.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {[school.city, school.phone, school.email].filter(Boolean).join(' · ') || 'Nessun dettaglio'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:flex">
                    <Users className="w-4 h-4" />
                    <span>{students.length} studenti</span>
                    <span>·</span>
                    <span>{admins.length} admin</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(school)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => expandSchool(isExpanded ? null : school.id)}
                      className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Gestisci utenti"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Pannello espanso: gestione utenti */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-5 bg-gray-50 dark:bg-gray-750">

                    {/* Admin scuola */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Admin scuola ({admins.length})
                      </p>
                      {admins.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nessun admin assegnato</p>
                      ) : (
                        <div className="space-y-1">
                          {admins.map(u => (
                            <div key={u.id} className="flex items-center justify-between text-sm gap-2 py-1">
                              <span className="text-gray-800 dark:text-gray-200 truncate">
                                {u.full_name || u.email}
                                <span className="text-gray-400 ml-1 text-xs">{u.full_name ? `(${u.email})` : ''}</span>
                              </span>
                              <button
                                onClick={() => setUserSchoolAdmin(u.id, null, false)}
                                className="text-xs text-red-600 hover:underline flex-shrink-0"
                              >
                                Rimuovi ruolo
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assegna nuovo admin da utenti non assegnati */}
                      {unassignedUsers.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            defaultValue=""
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            onChange={e => {
                              if (e.target.value) {
                                setUserSchoolAdmin(e.target.value, school.id, true)
                                e.target.value = ''
                              }
                            }}
                          >
                            <option value="">+ Assegna admin scuola...</option>
                            {unassignedUsers.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.full_name || u.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Tipi patente abilitati */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Tipi patente abilitati {savingLicenses && <span className="text-blue-500 normal-case">(salvataggio...)</span>}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LICENSE_TYPES.map(lt => {
                          const enabled = (schoolLicensesMap[school.id] || []).includes(lt.id)
                          return (
                            <label
                              key={lt.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition select-none ${
                                enabled
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={e => toggleLicense(school.id, lt.id, e.target.checked)}
                                className="accent-blue-600"
                              />
                              {lt.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Studenti */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Studenti ({students.length})
                      </p>
                      {students.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nessuno studente assegnato manualmente</p>
                      ) : (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {students.map(u => (
                            <div key={u.id} className="flex items-center justify-between text-sm gap-2 py-1">
                              <span className="text-gray-800 dark:text-gray-200 truncate">
                                {u.full_name || u.email}
                              </span>
                              <button
                                onClick={() => assignStudentToSchool(u.id, null)}
                                className="text-xs text-red-600 hover:underline flex-shrink-0"
                              >
                                Rimuovi
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modale crea/modifica ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingId !== null ? 'Modifica Scuola' : 'Nuova Scuola'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {([
                { key: 'name',    label: 'Nome scuola',   required: true,  placeholder: 'Autoscuola Rossi' },
                { key: 'city',    label: 'Città',         required: false, placeholder: 'Palermo' },
                { key: 'address', label: 'Indirizzo',     required: false, placeholder: 'Via Roma 1' },
                { key: 'phone',   label: 'Telefono',      required: false, placeholder: '091 123456' },
                { key: 'email',   label: 'Email',         required: false, placeholder: 'info@autoscuola.it' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    value={form[f.key] || ''}
                    onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition"
              >
                {saving ? 'Salvataggio...' : editingId !== null ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
