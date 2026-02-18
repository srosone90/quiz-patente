'use client'

import { useState, useEffect } from 'react'
import {
  getAllB2BClients,
  createB2BClient,
  updateB2BClient,
  archiveB2BClient,
  generateAccessCode,
  type B2BClient
} from '@/lib/supabase'

export default function B2BClients() {
  const [clients, setClients] = useState<B2BClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<B2BClient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [generatingCode, setGeneratingCode] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<B2BClient>>({
    business_name: '',
    vat_number: '',
    email: '',
    phone: '',
    status: 'lead',
    payment_terms: '30_days',
    billing_frequency: 'immediate',
    archived: false
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    const { data, error } = await getAllB2BClients(false)
    if (data) setClients(data as any)
    setLoading(false)
  }

  function openModal(client?: B2BClient) {
    if (client) {
      setEditingClient(client)
      setFormData(client)
    } else {
      setEditingClient(null)
      setFormData({
        business_name: '',
        vat_number: '',
        email: '',
        phone: '',
        status: 'lead',
        payment_terms: '30_days',
        billing_frequency: 'immediate',
        archived: false
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingClient) {
      await updateB2BClient(editingClient.id, formData)
    } else {
      await createB2BClient(formData)
    }
    
    setShowModal(false)
    loadClients()
  }

  async function handleArchive(clientId: string) {
    if (confirm('Sei sicuro di voler archiviare questo cliente?')) {
      await archiveB2BClient(clientId)
      loadClients()
    }
  }

  async function handleGenerateCode(planType: 'last_minute' | 'senza_pensieri', quantity: number = 1) {
    if (!editingClient?.business_name) {
      alert('Salva prima il cliente per generare codici')
      return
    }

    const duration = planType === 'last_minute' ? 30 : 365

    setGeneratingCode(true)
    try {
      const codes: string[] = []
      for (let i = 0; i < quantity; i++) {
        const code = await generateAccessCode(
          editingClient.business_name,
          planType,
          duration,
          1 // un uso per codice di default
        )
        codes.push(code)
      }

      const codesText = codes.join('\n')
      
      // Copia negli appunti
      const textarea = document.createElement('textarea')
      textarea.value = codesText
      document.body.appendChild(textarea)
      textarea.select()
      
      try {
        document.execCommand('copy')
        alert(`✅ ${quantity} ${quantity === 1 ? 'codice generato' : 'codici generati'} con successo!\n\n${codesText}\n\n✓ Codici copiati negli appunti!`)
      } catch (err) {
        alert(`✅ ${quantity} ${quantity === 1 ? 'codice generato' : 'codici generati'} con successo!\n\n${codesText}`)
      }
      
      document.body.removeChild(textarea)
    } catch (error: any) {
      console.error('Errore generazione codice:', error)
      alert(`❌ Errore nella generazione:\n\n${error.message || error}`)
    } finally {
      setGeneratingCode(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.phone?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    lead: 'bg-gray-100 text-gray-800',
    contacted: 'bg-blue-100 text-blue-800',
    proposal_sent: 'bg-indigo-100 text-indigo-800',
    negotiation: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    lost: 'bg-red-100 text-red-800'
  }

  const statusLabels: Record<string, string> = {
    lead: 'Lead',
    contacted: 'Contattato',
    proposal_sent: 'Proposta Inviata',
    negotiation: 'Trattativa',
    active: 'Attivo',
    inactive: 'Inattivo',
    lost: 'Perso'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clienti B2B
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestisci le scuole guida e i clienti aziendali
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Cliente
        </button>
      </div>

      {/* Filtri */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cerca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, email, telefono..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stato
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="lead">Lead</option>
              <option value="contacted">Contattato</option>
              <option value="proposal_sent">Proposta Inviata</option>
              <option value="negotiation">Trattativa</option>
              <option value="active">Attivo</option>
              <option value="inactive">Inattivo</option>
              <option value="lost">Perso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabella Clienti */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Caricamento...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Nessun cliente trovato</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-indigo-600 hover:text-indigo-700 mt-2"
              >
                Cancella filtri
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ragione Sociale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contatti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P.IVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {client.business_name}
                      </div>
                      {client.city && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.city} {client.province && `(${client.province})`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[client.status]}`}>
                        {statusLabels[client.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {client.vat_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(client)}
                        className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-4"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleArchive(client.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      >
                        Archivia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crea/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dati Anagrafici */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dati Anagrafici
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ragione Sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={formData.vat_number}
                      onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      value={formData.tax_code}
                      onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={formData.legal_address}
                      onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Città
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CAP
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contatti */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contatti
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cellulare
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PEC
                    </label>
                    <input
                      type="email"
                      value={formData.pec}
                      onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dati Commerciali */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dati Commerciali
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stato
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="lead">Lead</option>
                      <option value="contacted">Contattato</option>
                      <option value="proposal_sent">Proposta Inviata</option>
                      <option value="negotiation">Trattativa</option>
                      <option value="active">Attivo</option>
                      <option value="inactive">Inattivo</option>
                      <option value="lost">Perso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Termini di Pagamento
                    </label>
                    <select
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="immediate">Immediato</option>
                      <option value="30_days">30 giorni</option>
                      <option value="60_days">60 giorni</option>
                      <option value="90_days">90 giorni</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Note Commerciali
                    </label>
                    <textarea
                      value={formData.commercial_notes}
                      onChange={(e) => setFormData({ ...formData, commercial_notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Generazione Codici Accesso */}
              {editingClient && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎟️</span>
                    Genera Codici Accesso
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Genera uno o più codici di accesso per questo cliente
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateCode('last_minute', 1)}
                        disabled={generatingCode}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        1 Codice Last Minute (30gg)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode('last_minute', 5)}
                        disabled={generatingCode}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
                      >
                        Pack 5 Codici Last Minute
                      </button>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateCode('senza_pensieri', 1)}
                        disabled={generatingCode}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        1 Codice Senza Pensieri (1 anno)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode('senza_pensieri', 5)}
                        disabled={generatingCode}
                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
                      >
                        Pack 5 Codici Senza Pensieri
                      </button>
                    </div>
                  </div>

                  {generatingCode && (
                    <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      Generazione codici in corso...
                    </div>
                  )}
                </div>
              )}

              {/* Azioni */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingClient ? 'Salva Modifiche' : 'Crea Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
