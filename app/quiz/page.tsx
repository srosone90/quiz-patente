import Link from 'next/link'
import QuizEngine from '@/components/QuizEngine'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiz Online - Esercitati per l\'Esame',
  description: 'Esercitati con i quiz ufficiali per l\'esame di Ruolo Conducenti Taxi e NCC. Domande aggiornate 2026, modalità esame e ripasso, feedback immediato e spiegazioni dettagliate.',
  keywords: ['quiz taxi online', 'simulazione esame taxi', 'domande esame ncc', 'test conducenti palermo', 'esercitazioni taxi'],
  openGraph: {
    title: 'Quiz Online Taxi/NCC - Preparazione Esame',
    description: 'Esercitati con quiz ufficiali aggiornati. Simulazioni d\'esame realistiche.',
  },
}

interface QuizPageProps {
  searchParams: Promise<{
    plan?: 'free' | 'premium'
    category?: string
    mode?: 'review' | 'normal'
  }>
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams
  const plan = params.plan || 'free'
  const category = params.category
  const mode = params.mode || 'normal'

  return (
    <div className="min-h-screen bg-primary dark:bg-dark-bg">
      {/* Header */}
      <div className="bg-primary/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-secondary/20 dark:border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-secondary hover:text-yellow-400 transition font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Torna alla Dashboard
          </Link>
        </div>
      </div>

      {/* Quiz Content */}
      <QuizEngine 
        plan={plan} 
        category={category} 
        mode={mode}
      />
    </div>
  )
}
