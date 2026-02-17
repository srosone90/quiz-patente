'use client'

import { useState, useEffect } from 'react'
import {
  getAllB2BAppointments,
  getAllB2BClients,
  createB2BAppointment,
  updateB2BAppointment,
  deleteB2BAppointment,
  type B2BAppointment,
  type B2BClient
} from '@/lib/supabase'

export default function B2BCalendar() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<B2BClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [formData, setFormData] = useState<Partial<B2BAppointment>>({
    client_id: '',
    title: '',
    appointment_type: 'meeting',
    appointment_date: '',
    duration_minutes: 60,
    location_type: 'videocall',
    status: 'scheduled'
  })

  useEffect(() => {
    loadData()
  }, [currentDate])

  async function loadData() {
    setLoading(true)
    
    // Carica appuntamenti del mese
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const { data: apptData } = await getAllB2BAppointments(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    )
    if (apptData) setAppointments(apptData)

    // Carica clienti per il form
    const { data: clientData } = await getAllB2BClients(false)
    if (clientData) setClients(clientData as any)
    
    setLoading(false)
  }

  function openModal(appointment?: any) {
    if (appointment) {
      setEditingAppointment(appointment)
      setFormData({
        client_id: appointment.client_id,
        title: appointment.title,
        appointment_type: appointment.appointment_type,
        appointment_date: appointment.appointment_date,
        duration_minutes: appointment.duration_minutes,
        location: appointment.location,
        location_type: appointment.location_type,
        participants: appointment.participants,
        objective: appointment.objective,
        pre_notes: appointment.pre_notes,
        status: appointment.status
      })
    } else {
      setEditingAppointment(null)
      setFormData({
        client_id: '',
        title: '',
        appointment_type: 'meeting',
        appointment_date: '',
        duration_minutes: 60,
        location_type: 'videocall',
        status: 'scheduled'
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingAppointment) {
      await updateB2BAppointment(editingAppointment.id, formData)
    } else {
      await createB2BAppointment(formData)
    }
    
    setShowModal(false)
    loadData()
  }

  async function handleDelete(appointmentId: string) {
    if (confirm('Sei sicuro di voler eliminare questo appuntamento?')) {
      await deleteB2BAppointment(appointmentId)
      loadData()
    }
  }

  // Calendario helper functions
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Giorni del mese precedente
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Giorni del mese corrente
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  function getAppointmentsForDay(date: Date | null) {
    if (!date) return []
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const typeLabels: Record<string, string> = {
    call: 'Telefonata',
    meeting: 'Riunione',
    presentation: 'Presentazione',
    followup: 'Follow-up',
    contract_signing: 'Firma Contratto',
    renewal: 'Rinnovo',
    support: 'Supporto',
    review: 'Revisione'
  }

  const typeColors: Record<string, string> = {
    call: 'bg-blue-500',
    meeting: 'bg-indigo-500',
    presentation: 'bg-purple-500',
    followup: 'bg-green-500',
    contract_signing: 'bg-amber-500',
    renewal: 'bg-orange-500',
    support: 'bg-red-500',
    review: 'bg-gray-500'
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendario Appuntamenti
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestisci gli appuntamenti con i clienti
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Appuntamento
        </button>
      </div>

      {/* Controlli Calendario */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-100 dark:bg-indigo-900 
                       text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 
                       dark:hover:bg-indigo-800"
            >
              Oggi
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div>
            {/* Intestazioni giorni */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-semibold 
                           text-gray-700 dark:text-gray-300"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Griglia giorni */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day)
                const isToday = day && 
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={index}
                    className={`bg-white dark:bg-gray-900 min-h-[120px] p-2 
                              ${!day ? 'bg-gray-50 dark:bg-gray-800' : ''}
                              ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-2 
                                      ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => openModal(apt)}
                              className={`w-full text-left px-2 py-1 rounded text-xs text-white 
                                        ${typeColors[apt.appointment_type]} hover:opacity-80 transition-opacity`}
                            >
                              <div className="font-medium truncate">
                                {new Date(apt.appointment_date).toLocaleTimeString('it-IT', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="truncate opacity-90">
                                {apt.b2b_clients?.business_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="card">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(typeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${typeColors[key]}`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Crea/Modifica */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAppointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Seleziona cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modalità
                  </label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="videocall">Videochiamata</option>
                    <option value="phone">Telefono</option>
                    <option value="client_office">Sede Cliente</option>
                    <option value="our_office">Nostra Sede</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data e Ora *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durata (minuti)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.location_type && ['client_office', 'our_office'].includes(formData.location_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obiettivo
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note di preparazione
                </label>
                <textarea
                  value={formData.pre_notes}
                  onChange={(e) => setFormData({ ...formData, pre_notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {editingAppointment && (
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
                    <option value="scheduled">Pianificato</option>
                    <option value="completed">Completato</option>
                    <option value="cancelled">Annullato</option>
                    <option value="no_show">Non presentato</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  {editingAppointment && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingAppointment.id)}
                      className="px-6 py-2 border border-red-300 dark:border-red-600 rounded-lg
                               text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      Elimina
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
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
                    {editingAppointment ? 'Salva' : 'Crea'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
