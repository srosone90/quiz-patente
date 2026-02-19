'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { redeemAccessCode } from '@/lib/supabase'
import Link from 'next/link'

export default function RedeemPage() {
  // 🔵 MODALITÀ BETA GRATUITA - Nascondi redeem page
  const isFreeBetaMode = process.env.NEXT_PUBLIC_FREE_BETA_MODE === 'true'
  
  if (isFreeBetaMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Beta Gratuita Attiva!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Durante la fase di test, <strong>non è necessario riscattare codici</strong>. Tutti i contenuti sono già disponibili gratuitamente!
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            Accedi alla dashboard e inizia subito a prepararti per l'esame. 🚖
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-8 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
          >
            Vai alla Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Inserisci un codice valido' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      console.log('🔍 Riscatto codice:', code.trim().toUpperCase())
      
      const { data, error } = await redeemAccessCode(code.trim().toUpperCase())

      console.log('📦 Risposta Supabase:', { data, error })

      if (error) {
        console.error('❌ Errore Supabase:', error)
        setMessage({ 
          type: 'error', 
          text: error.message || 'Codice non valido o già utilizzato' 
        })
        return
      }

      // Il backend ritorna un JSON con success/message
      const result = data as any
      
      console.log('✅ Risultato riscatto:', result)
      
      if (result?.success) {
        setMessage({ 
          type: 'success', 
          text: `🎉 ${result.message || 'Codice attivato con successo!'}\n\nPiano: ${result.plan_type}\nScadenza: ${new Date(result.expires_at).toLocaleDateString('it-IT')}\n\n✅ Redirect automatico alla dashboard...` 
        })
        setCode('')
        
        console.log('🔄 SUCCESS! Piano:', result.plan_type, 'Scadenza:', result.expires_at)
        console.log('🔄 Redirect a /dashboard con full page reload...')
        
        // Redirect con full page reload per forzare ricaricamento profilo
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        console.warn('⚠️ Riscatto fallito:', result)
        setMessage({ 
          type: 'error', 
          text: result?.message || 'Errore durante l\'attivazione del codice' 
        })
      }
    } catch (error: any) {
      console.error('💥 Eccezione riscatto codice:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Errore durante l\'attivazione del codice' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary dark:bg-dark-bg py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-navy dark:text-gold mb-2">
            🎟️ Attiva Codice Accesso
          </h1>
          <p className="text-navy/70 dark:text-white/70">
            Inserisci il codice che hai ricevuto dalla tua scuola guida
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 border border-gray-200 dark:border-dark-border">
          <form onSubmit={handleRedeem} className="space-y-6">
            {/* Codice Input */}
            <div>
              <label 
                htmlFor="code" 
                className="block text-sm font-medium text-navy dark:text-gold mb-2"
              >
                Codice di Accesso
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Es: TAXI-ABC123"
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg 
                         bg-white dark:bg-dark-bg text-navy dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-gold
                         text-center text-lg font-mono tracking-wider"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-navy/60 dark:text-white/60">
                💡 Il codice è maiuscolo e può contenere lettere, numeri e trattini
              </p>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.text}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-secondary dark:bg-gold text-white dark:text-navy 
                       py-3 rounded-lg font-semibold text-lg
                       hover:bg-secondary/90 dark:hover:bg-gold/90
                       disabled:bg-gray-300 dark:disabled:bg-gray-700 
                       disabled:cursor-not-allowed
                       transition-all duration-200
                       shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-navy"></span>
                  Verifica in corso...
                </span>
              ) : (
                '✅ Attiva Codice'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200 dark:border-dark-border"></div>

          {/* Info Box */}
          <div className="space-y-3 text-sm text-navy/70 dark:text-white/70">
            <p className="font-semibold text-navy dark:text-gold">
              ℹ️ Come funziona:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Ricevi il codice dalla tua scuola guida</li>
              <li>Inseriscilo nel campo qui sopra</li>
              <li>Il tuo account verrà immediatamente aggiornato</li>
              <li>Potrai accedere a tutte le funzioni premium</li>
            </ul>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-secondary dark:text-gold hover:underline text-sm"
            >
              ← Torna alla Dashboard
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-navy/60 dark:text-white/60">
          <p>Non hai un codice? Contatta la tua scuola guida di riferimento</p>
        </div>
      </div>
    </div>
  )
}
