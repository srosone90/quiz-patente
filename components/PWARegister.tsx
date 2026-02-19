'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Registra Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker registrato:', registration.scope)
            
            // Controlla aggiornamenti ogni 30 minuti
            setInterval(() => {
              registration.update()
            }, 30 * 60 * 1000)
          })
          .catch((error) => {
            console.log('❌ Errore registrazione Service Worker:', error)
          })
      })
    }

    // Gestisce l'evento beforeinstallprompt per l'installazione PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 beforeinstallprompt evento ricevuto')
      // Previene il prompt automatico di Chrome
      e.preventDefault()
      // Salva l'evento per usarlo più tardi
      setDeferredPrompt(e)
      
      // Controlla se già dismissato di recente
      const dismissedTime = localStorage.getItem('pwaInstallDismissed')
      if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) {
          console.log('📱 Prompt già dismissato di recente')
          return
        }
      }
      
      // Mostra il nostro banner di installazione personalizzato
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verifica se l'app è già installata
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App già installata (standalone mode)')
      setShowInstallPrompt(false)
    }
    
    // iOS Safari verifica
    if ((window.navigator as any).standalone === true) {
      console.log('✅ App già installata (iOS standalone)')
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('❌ Nessun prompt disponibile')
      return
    }

    try {
      // Mostra il prompt di installazione
      deferredPrompt.prompt()

      // Aspetta la scelta dell'utente
      const { outcome } = await deferredPrompt.userChoice
      console.log(`📱 Risposta utente al prompt: ${outcome}`)

      if (outcome === 'accepted') {
        console.log('✅ Utente ha accettato installazione')
      } else {
        console.log('❌ Utente ha rifiutato installazione')
    console.log('📱 Prompt dismissato dall\'utente')
    setShowInstallPrompt(false)
    // Salva in localStorage per non mostrarlo più per 7 giorni
      // Reset del prompt
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('❌ Errore durante installazione:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Salva in localStorage per non mostrarlo più per un po'
    localStorage.setItem('pwaInstallDismissed', Date.now().toString())
  }

  // Non mostrare il banner se è stato chiuso nelle ultime 7 giorni
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwaInstallDismissed')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  if (!showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-30 animate-slide-up">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white rounded-2xl shadow-2xl p-4 border border-primary-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Installa l'App</h3>
            <p className="text-sm text-primary-100 mb-3">
              Installa Quiz Taxi/NCC sul tuo dispositivo per un accesso rapido e offline!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-primary-600 rounded-lg font-semibold text-sm hover:bg-primary-50 transition-all"
              >
                Installa Ora
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-primary-800 bg-opacity-50 text-white rounded-lg text-sm hover:bg-opacity-70 transition-all"
              >
                Più tardi
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-primary-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
