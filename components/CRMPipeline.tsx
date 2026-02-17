'use client'

import { useState, useEffect } from 'react'
import {
  getCRMPipelineStats,
  getAllB2BClients,
  updateB2BClient,
  type B2BClient
} from '@/lib/supabase'

export default function CRMPipeline() {
  const [stats, setStats] = useState<any>({})
  const [clients, setClients] = useState<B2BClient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('lead')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: statsData } = await getCRMPipelineStats()
    if (statsData) setStats(statsData)

    const { data: clientsData } = await getAllB2BClients(false)
    if (clientsData) setClients(clientsData as any)
    
    setLoading(false)
  }

  async function moveClient(clientId: string, newStatus: string) {
    await updateB2BClient(clientId, { status: newStatus as any })
    loadData()
  }

  const statusConfig = [
    { key: 'lead', label: 'Lead', color: 'bg-gray-500', icon: '🎯' },
    { key: 'contacted', label: 'Contattato', color: 'bg-blue-500', icon: '📞' },
    { key: 'proposal_sent', label: 'Proposta Inviata', color: 'bg-indigo-500', icon: '📧' },
    { key: 'negotiation', label: 'Trattativa', color: 'bg-purple-500', icon: '💬' },
    { key: 'active', label: 'Attivo', color: 'bg-green-500', icon: '✅' },
  ]

  const getClientsByStatus = (status: string) => {
    return clients.filter(c => c.status === status)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Pipeline CRM
      </h2>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusConfig.map(({ key, label, color, icon }) => (
          <div key={key} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{icon}</span>
              <span className={`w-3 h-3 rounded-full ${color}`}></span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats[key] || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="card overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {statusConfig.map(({ key, label, color }) => {
            const statusClients = getClientsByStatus(key)
            
            return (
              <div key={key} className="flex-shrink-0 w-80">
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${color} text-white font-semibold`}>
                    {label}
                    <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-sm">
                      {statusClients.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {statusClients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 
                               dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 
                               transition-all cursor-move shadow-sm hover:shadow-md"
                      draggable
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {client.business_name}
                      </h4>
                      
                      {client.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          📧 {client.email}
                        </p>
                      )}
                      
                      {client.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          📞 {client.phone}
                        </p>
                      )}

                      {client.potential_students_year && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                          Potenziale: {client.potential_students_year} studenti/anno
                        </p>
                      )}

                      {/* Quick Actions */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <select
                          value={client.status}
                          onChange={(e) => moveClient(client.id, e.target.value)}
                          className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {statusConfig.map(({ key, label }) => (
                            <option key={key} value={key}>
                              Sposta in: {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {statusClients.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm">Nessun cliente</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistiche Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Tasso di Conversione</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.lead > 0 ? Math.round((stats.active / stats.lead) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.active} attivi su {stats.lead} lead
            </div>
          </div>
          
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">In Trattativa</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.negotiation || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Opportunità da chiudere
            </div>
          </div>
          
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Clienti Attivi</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {stats.active || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Generano revenue
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
