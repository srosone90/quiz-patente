'use client'

import { useState, useEffect } from 'react'
import {
  getAllB2BClients,
  getContractsByClientId,
  createB2BContract,
  updateB2BContract,
  type B2BContract,
  type B2BClient
} from '@/lib/supabase'

export default function B2BContracts() {
  const [contracts, setContracts] = useState<any[]>([])
  const [clients, setClients] = useState<B2BClient[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState<any | null>(null)

  const [formData, setFormData] = useState<Partial<B2BContract>>({
    client_id: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    status: 'active',
    contract_type: 'standard',
    price_per_student: 0,
    included_students: 0
  })

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadContracts(selectedClient)
    }
  }, [selectedClient])

  async function loadClients() {
    const { data } = await getAllB2BClients(false)
    if (data) {
      setClients(data.filter((c: any) => c.status === 'active') as any)
      if (data.length > 0 && !selectedClient) {
        setSelectedClient((data[0] as any).id)
      }
    }
    setLoading(false)
  }

  async function loadContracts(clientId: string) {
    setLoading(true)
    const { data } = await getContractsByClientId(clientId)
    if (data) setContracts(data)
    setLoading(false)
  }

  function openModal(contract?: any) {
    if (contract) {
      setEditingContract(contract)
      setFormData(contract)
    } else {
      setEditingContract(null)
      const nextNumber = `CTR-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`
      setFormData({
        client_id: selectedClient,
        contract_number: nextNumber,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        contract_type: 'standard',
        price_per_student: 59,
        included_students: 0
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingContract) {
      await updateB2BContract(editingContract.id, formData)
    } else {
      await createB2BContract(formData)
    }
    
    setShowModal(false)
    loadContracts(selectedClient)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    renewal: 'bg-amber-100 text-amber-800'
  }

  const statusLabels: Record<string, string> = {
    active: 'Attivo',
    expired: 'Scaduto',
    cancelled: 'Annullato',
    renewal: 'In Rinnovo'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestione Contratti
        </h2>
        <button onClick={() => openModal()} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Contratto
        </button>
      </div>

      <div className="card">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Seleziona Cliente
        </label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.business_name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Nessun contratto trovato</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 
                         dark:hover:border-indigo-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.contract_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                        {statusLabels[contract.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Inizio:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(contract.start_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Scadenza:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(contract.end_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Studenti:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {contract.included_students || 'Illimitati'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Prezzo/studente:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          €{contract.price_per_student}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(contract)}
                    className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingContract ? 'Modifica Contratto' : 'Nuovo Contratto'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numero Contratto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo Contratto
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="custom">Personalizzato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Inizio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Fine *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prezzo per Studente (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_student}
                    onChange={(e) => setFormData({ ...formData, price_per_student: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Studenti Inclusi
                  </label>
                  <input
                    type="number"
                    value={formData.included_students}
                    onChange={(e) => setFormData({ ...formData, included_students: parseInt(e.target.value) })}
                    placeholder="0 = Illimitati"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {editingContract && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stato
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="active">Attivo</option>
                      <option value="expired">Scaduto</option>
                      <option value="cancelled">Annullato</option>
                      <option value="renewal">In Rinnovo</option>
                    </select>
                  </div>
                )}
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
                  {editingContract ? 'Salva' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
