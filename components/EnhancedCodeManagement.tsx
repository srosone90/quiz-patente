'use client'

import { useState, useEffect } from 'react'
import {
  getAllAccessCodes,
  deleteAccessCode,
  updateAccessCode,
  searchAccessCodes,
  deactivateAccessCode,
  generateAccessCode,
  type AccessCode
} from '@/lib/supabase'

export default function EnhancedCodeManagement() {
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null)
  const [selectedCodes, setSelectedCodes] = useState<number[]>([])
  const [generating, setGenerating] = useState(false)

  // Filtri
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired'>('all')

  const [formData, setFormData] = useState<Partial<AccessCode>>({
    school_name: '',
    plan_type: 'last_minute',
    duration_days: 30,
    max_uses: 1,
    is_active: true
  })

  // Form per generazione nuovo codice
  const [generateForm, setGenerateForm] = useState({
    school_name: '',
    plan_type: 'last_minute' as 'last_minute' | 'senza_pensieri',
    duration_days: 30,
    max_uses: 1,
    expires_at: ''
  })

  useEffect(() => {
    loadCodes()
  }, [])

  async function loadCodes() {
    setLoading(true)
    const { data, error } = await getAllAccessCodes()
    if (data) setCodes(data as any)
    setLoading(false)
  }

  async function applyFilters() {
    setLoading(true)
    const { data } = await searchAccessCodes({
      schoolName: searchTerm || undefined,
      planType: filterPlan || undefined,
      status: filterStatus === 'all' ? undefined : filterStatus
    })
    if (data) setCodes(data as any)
    setLoading(false)
  }

  useEffect(() => {
    if (searchTerm || filterPlan || filterStatus !== 'all') {
      const debounce = setTimeout(() => {
        applyFilters()
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      loadCodes()
    }
  }, [searchTerm, filterPlan, filterStatus])

  function openModal(code?: AccessCode) {
    if (code) {
      setEditingCode(code)
      setFormData(code)
    } else {
      setEditingCode(null)
      setFormData({
        school_name: '',
        plan_type: 'last_minute',
        duration_days: 30,
        max_uses: 1,
        is_active: true
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingCode) {
      await updateAccessCode(editingCode.id, formData)
    }
    
    setShowModal(false)
    loadCodes()
  }

  async function handleDelete(codeId: number) {
    if (confirm('Sei sicuro di voler eliminare questo codice? Questa azione è irreversibile.')) {
      await deleteAccessCode(codeId)
      loadCodes()
    }
  }

  async function handleGenerateCode(e: React.FormEvent) {
    e.preventDefault()
    
    if (!generateForm.school_name.trim()) {
      alert('Inserisci il nome della scuola guida')
      return
    }

    setGenerating(true)
    try {
      const newCode = await generateAccessCode(
        generateForm.school_name,
        generateForm.plan_type,
        generateForm.duration_days,
        generateForm.max_uses,
        generateForm.expires_at || undefined
      )
      
      alert(`✅ Codice generato con successo!\n\nCodice: ${newCode}\n\nInvia questo codice alla scuola guida.`)
      
      // Reset form
      setGenerateForm({
        school_name: '',
        plan_type: 'last_minute',
        duration_days: 30,
        max_uses: 1,
        expires_at: ''
      })
      
      setShowGenerateModal(false)
      loadCodes()
    } catch (error: any) {
      console.error('Errore generazione codice:', error)
      alert(`❌ Errore nella generazione del codice:\n\n${error.message || error}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedCodes.length === 0) return
    
    if (confirm(`Sei sicuro di voler eliminare ${selectedCodes.length} codici?`)) {
      for (const codeId of selectedCodes) {
        await deleteAccessCode(codeId)
      }
      setSelectedCodes([])
      loadCodes()
    }
  }

  async function handleBulkDeactivate() {
    if (selectedCodes.length === 0) return
    
    for (const codeId of selectedCodes) {
      await deactivateAccessCode(codeId)
    }
    setSelectedCodes([])
    loadCodes()
  }

  function toggleSelectCode(codeId: number) {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    )
  }

  function toggleSelectAll() {
    if (selectedCodes.length === codes.length) {
      setSelectedCodes([])
    } else {
      setSelectedCodes(codes.map(c => c.id))
    }
  }

  const getCodeStatus = (code: AccessCode) => {
    if (!code.is_active) return { label: 'Disattivo', color: 'bg-gray-100 text-gray-800' }
    if (code.used_count >= code.max_uses) return { label: 'Esaurito', color: 'bg-yellow-100 text-yellow-800' }
    if (code.expires_at && new Date(code.expires_at) < new Date()) return { label: 'Scaduto', color: 'bg-red-100 text-red-800' }
    return { label: 'Attivo', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestione Codici Accesso
        </h2>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Genera Nuovo Codice
        </button>
      </div>

      {/* Filtri */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cerca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome scuola o codice..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Piano
            </label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Tutti i piani</option>
              <option value="last_minute">Last Minute</option>
              <option value="senza_pensieri">Senza Pensieri</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stato
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tutti</option>
              <option value="active">Solo attivi</option>
              <option value="used">Esauriti</option>
              <option value="expired">Scaduti</option>
            </select>
          </div>
        </div>

        {selectedCodes.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {selectedCodes.length} codici selezionati
            </span>
            <button
              onClick={handleBulkDeactivate}
              className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
            >
              Disattiva Selezionati
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Elimina Selezionati
            </button>
          </div>
        )}
      </div>

      {/* Tabella Codici */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nessun codice trovato</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterPlan('')
                setFilterStatus('all')
              }}
              className="text-indigo-600 hover:text-indigo-700 mt-2"
            >
              Rimuovi filtri
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCodes.length === codes.length && codes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Codice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Scuola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Piano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Utilizzi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {codes.map((code) => {
                  const status = getCodeStatus(code)
                  return (
                    <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(code.id)}
                          onChange={() => toggleSelectCode(code.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                          {code.code}
                        </div>
                        {code.expires_at && (
                          <div className="text-xs text-gray-500">
                            Scade: {new Date(code.expires_at).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {code.school_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {code.plan_type === 'last_minute' ? 'Last Minute' : 'Senza Pensieri'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {code.used_count} / {code.max_uses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(code)}
                          className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-3"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Modifica */}
      {showModal && editingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Modifica Codice
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Scuola
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durata (giorni)
                </label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Utilizzi Massimi
                </label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Scadenza
                </label>
                <input
                  type="date"
                  value={formData.expires_at?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  Codice attivo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annulla
                </button>
                <button type="submit" className="btn-primary">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Genera Nuovo Codice */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Genera Nuovo Codice Accesso
            </h3>
            
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Scuola Guida <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={generateForm.school_name}
                  onChange={(e) => setGenerateForm({ ...generateForm, school_name: e.target.value })}
                  placeholder="Es: Autoscuola Roma Centro"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo Piano <span className="text-red-500">*</span>
                </label>
                <select
                  value={generateForm.plan_type}
                  onChange={(e) => setGenerateForm({ ...generateForm, plan_type: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="last_minute">Last Minute (30 giorni)</option>
                  <option value="senza_pensieri">Senza Pensieri (1 anno)</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durata (giorni) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={generateForm.duration_days}
                    onChange={(e) => setGenerateForm({ ...generateForm, duration_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Giorni di validità dall'attivazione</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Utilizzi Massimi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={generateForm.max_uses}
                    onChange={(e) => setGenerateForm({ ...generateForm, max_uses: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Quante volte può essere usato</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Scadenza Codice (opzionale)
                </label>
                <input
                  type="date"
                  value={generateForm.expires_at}
                  onChange={(e) => setGenerateForm({ ...generateForm, expires_at: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Lascia vuoto per nessuna scadenza</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Riepilogo:</strong> Verrà generato un codice {generateForm.plan_type === 'last_minute' ? 'Last Minute' : 'Senza Pensieri'} 
                  per "{generateForm.school_name || '...'}", valido {generateForm.duration_days} giorni dall'attivazione, 
                  utilizzabile {generateForm.max_uses} {generateForm.max_uses === 1 ? 'volta' : 'volte'}.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
                <button 
                  type="submit" 
                  disabled={generating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                           font-medium disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generazione...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Genera Codice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
