import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Piani e Prezzi - Scegli il Tuo Piano',
  description: 'Scegli il piano perfetto per la tua preparazione all\'esame di Ruolo Conducenti. Piano gratuito con quiz di base o piani premium con accesso illimitato e simulazioni complete.',
  keywords: ['prezzo corso taxi', 'abbonamento quiz taxi', 'piano premium ncc', 'corso taxi online prezzo'],
  openGraph: {
    title: 'Piani e Prezzi Quiz Taxi/NCC Palermo',
    description: 'Piani flessibili per ogni esigenza. Inizia gratis o scegli il premium.',
  },
}

export default function PricingPage() {
  // 🔵 MODALITÀ BETA GRATUITA - Nascondi pricing page
  const isFreeBetaMode = process.env.NEXT_PUBLIC_FREE_BETA_MODE === 'true'
  
  if (isFreeBetaMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Beta Gratuita Attiva!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Durante la fase di test, <strong>tutti i contenuti sono completamente gratuiti</strong> per gli aspiranti conducenti di Palermo.
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            Non sono richiesti pagamenti. Approfitta di questa opportunità per prepararti al meglio! 🚕
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-8 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
          >
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  const plans = [
    {
      name: 'Last Minute',
      price: '€29',
      duration: '30 giorni',
      features: [
        '20 domande per quiz',
        '30 minuti per quiz',
        'Spiegazioni complete',
        'Quiz illimitati',
        'Statistiche dettagliate',
        'Max 2 errori consentiti',
        'Simulazioni realistiche',
        'Aggiornamenti inclusi',
      ],
      highlight: false,
      link: process.env.NEXT_PUBLIC_STRIPE_LAST_MINUTE_LINK || 'https://buy.stripe.com/3cI9AU06s3CneIF6Gl2kw01',
      badge: 'Ideale per ripasso rapido',
    },
    {
      name: 'Senza Pensieri',
      price: '€59',
      duration: '120 giorni',
      features: [
        '20 domande per quiz',
        '30 minuti per quiz',
        'Spiegazioni complete',
        'Quiz illimitati',
        'Statistiche dettagliate',
        'Max 2 errori consentiti',
        'Simulazioni realistiche',
        'Aggiornamenti inclusi',
        '4 MESI di accesso',
        'Supporto prioritario',
      ],
      highlight: true,
      link: process.env.NEXT_PUBLIC_STRIPE_SENZA_PENSIERI_LINK || 'https://buy.stripe.com/4gM4gA1aw3Cn2ZXfcR2kw00',
      badge: 'PIÙ SCELTO',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg py-12 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-accent-500 dark:hover:text-accent-400 transition font-semibold group"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
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

      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-900 dark:text-white mb-6">
            Scegli il Tuo Piano Premium
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300 mb-3 font-semibold">
            Preparati al meglio per l'esame Taxi/NCC
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Nessun rinnovo automatico • Pagamento unico
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Pagamento Sicuro</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Dati Protetti</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Attivazione Immediata</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative transform transition-all hover:scale-105 ${
                plan.highlight ? 'md:-mt-4 md:mb-4' : ''
              }`}
            >
              <div className={`card-hover ${
                plan.highlight ? 'ring-4 ring-accent-500 dark:ring-accent-400 shadow-2xl shadow-accent-200 dark:shadow-accent-900/30' : ''
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-accent-500 via-amber-500 to-accent-600 text-white px-8 py-2 rounded-full text-sm font-bold shadow-xl animate-pulse">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {!plan.highlight && plan.badge && (
                  <div className="mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-700">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8 mt-4">
                  <h2 className="text-4xl font-bold text-primary-900 dark:text-white mb-4">
                    {plan.name}
                  </h2>
                  <div className="mb-4">
                    <span className="text-6xl font-bold text-primary-900 dark:text-accent-400">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">{plan.duration}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-5 rounded-xl font-bold text-lg text-center transition-all transform hover:scale-105 shadow-lg min-h-[60px] flex items-center justify-center ${
                    plan.highlight
                      ? 'btn-cta'
                      : 'btn-primary'
                  }`}
                >
                  Acquista Ora
                </a>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Pagamento sicuro con Stripe • Nessun rinnovo automatico
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="card mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent mb-8 text-center">
            Confronta i Piani
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-dark-border">
                  <th className="text-left py-5 px-6 text-primary-700 dark:text-accent-400 font-bold text-lg">Caratteristica</th>
                  <th className="text-center py-5 px-6 text-gray-700 dark:text-gray-300 font-bold">Free</th>
                  <th className="text-center py-5 px-6 text-primary-700 dark:text-accent-400 font-bold">Last Minute</th>
                  <th className="text-center py-5 px-6 text-accent-700 dark:text-accent-300 font-bold bg-accent-50 dark:bg-accent-900/10">Senza Pensieri</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Domande per quiz</td>
                  <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">10</td>
                  <td className="text-center py-4 px-6 font-bold text-primary-600 dark:text-accent-500">20</td>
                  <td className="text-center py-4 px-6 font-bold bg-accent-50 dark:bg-accent-900/10 text-accent-600 dark:text-accent-400">20</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Tempo quiz</td>
                  <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">10 min</td>
                  <td className="text-center py-4 px-6 font-bold text-primary-600 dark:text-accent-500">30 min</td>
                  <td className="text-center py-4 px-6 font-bold bg-accent-50 dark:bg-accent-900/10 text-accent-600 dark:text-accent-400">30 min</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Spiegazioni errori</td>
                  <td className="text-center py-4 px-6 text-red-500 font-bold text-xl">✗</td>
                  <td className="text-center py-4 px-6 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                  <td className="text-center py-4 px-6 bg-accent-50 dark:bg-accent-900/10 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Quiz illimitati</td>
                  <td className="text-center py-4 px-6 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                  <td className="text-center py-4 px-6 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                  <td className="text-center py-4 px-6 bg-accent-50 dark:bg-accent-900/10 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Durata accesso</td>
                  <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">Sempre</td>
                  <td className="text-center py-4 px-6 font-bold text-primary-600 dark:text-accent-500">30 giorni</td>
                  <td className="text-center py-4 px-6 font-bold bg-accent-50 dark:bg-accent-900/10 text-accent-600 dark:text-accent-400">120 giorni</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Max errori consentiti</td>
                  <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">Illimitati</td>
                  <td className="text-center py-4 px-6 font-bold text-primary-600 dark:text-accent-500">2</td>
                  <td className="text-center py-4 px-6 font-bold bg-accent-50 dark:bg-accent-900/10 text-accent-600 dark:text-accent-400">2</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Supporto prioritario</td>
                  <td className="text-center py-4 px-6 text-red-500 font-bold text-xl">✗</td>
                  <td className="text-center py-4 px-6 text-red-500 font-bold text-xl">✗</td>
                  <td className="text-center py-4 px-6 bg-accent-50 dark:bg-accent-900/10 text-green-600 dark:text-green-400 font-bold text-xl">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-accent-400 dark:to-accent-600 bg-clip-text text-transparent mb-8 text-center">
            Domande Frequenti
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-2xl">❓</span>
                Come funziona l'attivazione?
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                Dopo il pagamento, l'accesso Premium viene attivato immediatamente. Riceverai un'email di conferma con tutte le istruzioni.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                C'è un rinnovo automatico?
              </h3>
              <p className="text-purple-800 dark:text-purple-200">
                No, è un pagamento unico senza rinnovi automatici. Alla scadenza potrai scegliere se rinnovare.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                <span className="text-2xl">⬆️</span>
                Posso cambiare piano dopo l'acquisto?
              </h3>
              <p className="text-green-800 dark:text-green-200">
                Sì, puoi fare l'upgrade da Last Minute a Senza Pensieri pagando solo la differenza. Contattaci per assistenza.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700">
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300 mb-3 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Le domande sono aggiornate?
              </h3>
              <p className="text-orange-800 dark:text-orange-200">
                Sì, il database viene costantemente aggiornato con le normative più recenti per Palermo ed Enna.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="card text-center bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-accent-600 dark:via-accent-700 dark:to-accent-800 text-white border-none shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Pronto per Superare l'Esame?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Unisciti agli aspiranti conducenti che si preparano con noi
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={plans[0].link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary-700 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Inizia Ora
            </a>
            <Link
              href="/"
              className="bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/30"
            >
              Torna alla Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
