'use client'

import { useState, useMemo } from 'react'
import { B2B_AVAILABLE_LICENSES, B2B_MIN_CODES, B2B_CODE_DURATION_DAYS, calculateOrderTotal } from '@/lib/pricing'

interface OrderItem {
  licenseId: string
  quantity: number
}

interface FormData {
  schoolName: string
  city: string
  address: string
  phone: string
  email: string
}

export default function AutoscuolePage() {
  const [form, setForm] = useState<FormData>({
    schoolName: '',
    city: '',
    address: '',
    phone: '',
    email: '',
  })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcola totale in tempo reale
  const total = useMemo(() => calculateOrderTotal(orderItems), [orderItems])
  const totalCodes = useMemo(() => orderItems.reduce((s, i) => s + i.quantity, 0), [orderItems])
  const canSubmit = useMemo(
    () =>
      form.schoolName.trim() !== '' &&
      form.email.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
      totalCodes >= B2B_MIN_CODES,
    [form, totalCodes]
  )

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleQuantityChange(licenseId: string, qty: number) {
    setOrderItems(prev => {
      const existing = prev.find(i => i.licenseId === licenseId)
      if (qty <= 0) return prev.filter(i => i.licenseId !== licenseId)
      if (existing) return prev.map(i => i.licenseId === licenseId ? { ...i, quantity: qty } : i)
      return [...prev, { licenseId, quantity: qty }]
    })
  }

  function getQuantity(licenseId: string): number {
    return orderItems.find(i => i.licenseId === licenseId)?.quantity ?? 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/schools/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, orderItems }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Errore durante il pagamento')
      window.location.href = json.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">PatentiApp per Autoscuole</h1>
        <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
          Offri ai tuoi studenti la migliore preparazione all&apos;esame. Acquista i codici di accesso, li spediamo subito via email.
        </p>
      </section>

      {/* Vantaggi */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Attivazione immediata', desc: 'I codici arrivano via email entro pochi secondi dal pagamento.' },
            { icon: '🎯', title: 'Per ogni tipo di patente', desc: 'AM, A/B, C/D, CQC, Nautica, ADR e altro — tutto in una piattaforma.' },
            { icon: '📊', title: 'Pannello di controllo', desc: 'Monitora i progressi dei tuoi studenti dal cruscotto scuola.' },
          ].map(v => (
            <div key={v.title} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form ordine */}
      <section className="py-8 px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Ordina i tuoi codici</h2>
              <p className="text-indigo-100 mt-1 text-sm">Minimo {B2B_MIN_CODES} codici per ordine · Validità {B2B_CODE_DURATION_DAYS} giorni</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Dati autoscuola */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dati Autoscuola</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Autoscuola <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={form.schoolName}
                      onChange={handleFormChange}
                      placeholder="Autoscuola Rossi"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleFormChange}
                      placeholder="Milano"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="+39 02 1234567"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      placeholder="Via Roma 1"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="info@autoscuola.it"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Selezione licenze */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleziona Patenti e Quantità</h3>
                <div className="space-y-3">
                  {B2B_AVAILABLE_LICENSES.map(license => {
                    const qty = getQuantity(license.id)
                    const subtotal = qty * license.pricePerCode
                    return (
                      <div
                        key={license.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          qty > 0
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{license.label}</p>
                          <p className="text-sm text-gray-500">€{license.pricePerCode.toFixed(2)} / codice</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {qty > 0 && (
                            <span className="text-indigo-600 font-semibold text-sm">
                              €{subtotal.toFixed(2)}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(license.id, qty - 1)}
                              disabled={qty <= 0}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={qty || ''}
                              placeholder="0"
                              onChange={e => handleQuantityChange(license.id, parseInt(e.target.value) || 0)}
                              className="w-14 text-center border border-gray-300 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(license.id, qty + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-200 transition"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalCodes > 0 && totalCodes < B2B_MIN_CODES && (
                  <p className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-2">
                    ⚠️ Minimo {B2B_MIN_CODES} codici per ordine. Aggiungi ancora {B2B_MIN_CODES - totalCodes} codici.
                  </p>
                )}
              </div>

              {/* Riepilogo */}
              {totalCodes > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Riepilogo Ordine</h3>
                  <div className="space-y-2 text-sm">
                    {orderItems.map(item => {
                      const license = B2B_AVAILABLE_LICENSES.find(l => l.id === item.licenseId)
                      if (!license) return null
                      return (
                        <div key={item.licenseId} className="flex justify-between text-gray-600">
                          <span>{license.label} × {item.quantity}</span>
                          <span>€{(license.pricePerCode * item.quantity).toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-indigo-200 mt-4 pt-4 flex justify-between font-bold text-gray-800 text-lg">
                    <span>Totale ({totalCodes} codici)</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">+ IVA 22% se applicabile · I codici arrivano via email</p>
                </div>
              )}

              {/* Errore */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Elaborazione...
                  </span>
                ) : (
                  `Paga €${total.toFixed(2)} →`
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
