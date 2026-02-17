'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrato:', registration)
        })
        .catch((error) => {
          console.log('Errore registrazione Service Worker:', error)
        })
    }
  }, [])

  return null
}
