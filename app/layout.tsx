import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nProvider } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'
import PWARegister from '@/components/PWARegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quiz Ruolo Conducenti - Preparazione Esame Taxi/NCC',
  description: 'Preparati all\'esame Taxi/NCC di Palermo ed Enna con quiz aggiornati',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quiz Taxi/NCC',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#002147' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            <PWARegister />
            <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
              <ThemeToggle />
              {children}
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
