'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  
  // Non mostrare header su pagine di login/autenticazione
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-dark-bg/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-dark-bg/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Quiz Patente Taxi/NCC Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl text-primary-600 dark:text-primary-400">
              Quiz Taxi/NCC
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
              Patente Conducenti Palermo
            </span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/dashboard" 
            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/quiz" 
            className="px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Inizia Quiz
          </Link>
        </nav>
      </div>
    </header>
  )
}
