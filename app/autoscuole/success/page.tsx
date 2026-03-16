'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AutoscuolaSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [dots, setDots] = useState('.')

  // Animazione puntini caricamento
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(t)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-green-100">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento completato!</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-6">
          Stiamo preparando il tuo account e i codici di accesso{dots}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 text-left">
          <h2 className="font-semibold text-green-800 mb-2">Cosa succede ora?</h2>
          <ol className="text-green-700 text-sm space-y-1 list-decimal list-inside">
            <li>Creiamo il tuo account autoscuola</li>
            <li>Generiamo tutti i codici di accesso</li>
            <li>Ti inviamo tutto via email entro pochi secondi</li>
          </ol>
        </div>
        <p className="text-sm text-gray-400 mb-8">
          Controlla la casella di posta (anche spam). Riceverai le credenziali di accesso e i tuoi codici.
        </p>
        <Link
          href="/login"
          className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition"
        >
          Accedi al Pannello Scuola
        </Link>
        {sessionId && (
          <p className="text-xs text-gray-300 mt-4">ID ordine: {sessionId}</p>
        )}
      </div>
    </main>
  )
}
