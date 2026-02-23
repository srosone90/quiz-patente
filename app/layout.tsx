import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nProvider } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'
import PWARegister from '@/components/PWARegister'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = 'https://driverquizpa.com'
const siteName = 'Quiz Patente Taxi/NCC Palermo'
const siteDescription = 'Preparati all\'esame per la patente di Ruolo Conducenti Taxi e NCC a Palermo ed Enna. Quiz ufficiali aggiornati 2026, simulazioni d\'esame, statistiche dettagliate e sistema di apprendimento progressivo. Supera l\'esame al primo tentativo!'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription,
  keywords: [
    'quiz taxi palermo',
    'quiz ncc palermo', 
    'patente taxi',
    'patente ncc',
    'esame ruolo conducenti',
    'esame taxi palermo',
    'quiz patente taxi online',
    'simulazione esame taxi',
    'ruolo conducenti palermo',
    'quiz conducenti enna',
    'preparazione esame taxi',
    'licenza taxi',
    'abilitazione ncc',
    'corso taxi online',
    'quiz ministeriali taxi',
    'patente KB',
    'esame teorico taxi'
  ],
  authors: [{ name: 'Driver Quiz PA' }],
  creator: 'Driver Quiz PA',
  publisher: 'Driver Quiz PA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' }
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quiz Taxi/NCC PA',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 1200,
        alt: 'Quiz Patente Taxi/NCC Palermo - Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'education',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Quiz Patente Taxi/NCC Palermo',
    description: 'Piattaforma di preparazione per l\'esame di Ruolo Conducenti Taxi e NCC',
    url: 'https://driverquizpa.com',
    logo: 'https://driverquizpa.com/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Palermo',
      addressRegion: 'Sicilia',
      addressCountry: 'IT'
    },
    sameAs: [],
    offers: {
      '@type': 'Offer',
      category: 'Formazione Online',
      availability: 'https://schema.org/OnlineOnly',
      priceCurrency: 'EUR'
    },
    educationalCredentialAwarded: 'Preparazione Esame Ruolo Conducenti',
    serviceType: [
      'Quiz online per patente taxi',
      'Quiz online per patente NCC', 
      'Simulazioni esame teorico',
      'Preparazione esame Ruolo Conducenti'
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'Palermo'
      },
      {
        '@type': 'City', 
        name: 'Enna'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Sicilia'
      }
    ]
  }

  return (
    <html lang="it">
      <head>
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href="https://driverquizpa.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            <PWARegister />
            <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
              <Header />
              <ThemeToggle />
              {children}
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
