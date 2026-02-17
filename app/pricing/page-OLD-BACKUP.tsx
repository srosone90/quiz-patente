import Link from 'next/link'

export default function PricingPage() {
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
      link: process.env.NEXT_PUBLIC_STRIPE_LAST_MINUTE_LINK || 'https://buy.stripe.com/test_eVq5kD9xB9eXfco1Kx5wI01',
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
      link: process.env.NEXT_PUBLIC_STRIPE_SENZA_PENSIERI_LINK || 'https://buy.stripe.com/test_4gM3cvfVZ62L4xKcpb5wI02',
      badge: 'PIÙ SCELTO',
    },
  ]

  return (
    <div className="min-h-screen bg-primary py-12 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
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

      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            Scegli il Tuo Piano Premium
          </h1>
          <p className="text-xl text-secondary/80 mb-2">
            Preparati al meglio per l'esame Taxi/NCC
          </p>
          <p className="text-lg text-secondary/60">
            Nessun rinnovo automatico • Pagamento unico
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center space-x-8 mb-12">
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-secondary text-sm">Pagamento Sicuro</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-secondary text-sm">Dati Protetti</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-secondary text-sm">Attivazione Immediata</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-2xl p-8 relative transform transition-all hover:scale-105 ${
                plan.highlight ? 'ring-4 ring-secondary' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-secondary to-yellow-500 text-primary px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              {!plan.highlight && plan.badge && (
                <div className="mb-4">
                  <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-8 mt-4">
                <h2 className="text-3xl font-bold text-primary mb-2">
                  {plan.name}
                </h2>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-primary">{plan.price}</span>
                </div>
                <p className="text-gray-600 font-semibold">{plan.duration}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-4 rounded-xl font-bold text-lg text-center transition-all transform hover:scale-105 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-secondary to-yellow-500 text-primary shadow-xl hover:shadow-2xl'
                    : 'bg-primary text-secondary hover:bg-blue-900'
                }`}
              >
                Acquista Ora
              </a>

              <p className="text-center text-xs text-gray-500 mt-4">
                Pagamento sicuro con Stripe • Nessun rinnovo automatico
              </p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">
            Confronta i Piani
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 text-primary font-bold">Caratteristica</th>
                  <th className="text-center py-4 px-4 text-primary font-bold">Free</th>
                  <th className="text-center py-4 px-4 text-primary font-bold">Last Minute</th>
                  <th className="text-center py-4 px-4 text-secondary font-bold bg-secondary/10">Senza Pensieri</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Domande per quiz</td>
                  <td className="text-center py-4 px-4">10</td>
                  <td className="text-center py-4 px-4 font-semibold">20</td>
                  <td className="text-center py-4 px-4 font-semibold bg-secondary/5">20</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Tempo quiz</td>
                  <td className="text-center py-4 px-4">10 min</td>
                  <td className="text-center py-4 px-4 font-semibold">30 min</td>
                  <td className="text-center py-4 px-4 font-semibold bg-secondary/5">30 min</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Spiegazioni errori</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4 text-green-600 font-bold">✓</td>
                  <td className="text-center py-4 px-4 text-green-600 font-bold bg-secondary/5">✓</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Quiz illimitati</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4 text-green-600 font-bold">✓</td>
                  <td className="text-center py-4 px-4 text-green-600 font-bold bg-secondary/5">✓</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Durata accesso</td>
                  <td className="text-center py-4 px-4">Sempre</td>
                  <td className="text-center py-4 px-4 font-semibold">30 giorni</td>
                  <td className="text-center py-4 px-4 font-semibold bg-secondary/5">120 giorni</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-gray-700">Max errori consentiti</td>
                  <td className="text-center py-4 px-4">Illimitati</td>
                  <td className="text-center py-4 px-4 font-semibold">2</td>
                  <td className="text-center py-4 px-4 font-semibold bg-secondary/5">2</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">Supporto prioritario</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4 text-green-600 font-bold bg-secondary/5">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-secondary mb-6 text-center">
            Domande Frequenti
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-secondary mb-2">
                Come funziona l'attivazione?
              </h3>
              <p className="text-secondary/80">
                Dopo il pagamento, l'accesso Premium viene attivato immediatamente. Riceverai un'email di conferma con tutte le istruzioni.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-secondary mb-2">
                C'è un rinnovo automatico?
              </h3>
              <p className="text-secondary/80">
                No, è un pagamento unico senza rinnovi automatici. Alla scadenza potrai scegliere se rinnovare.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-secondary mb-2">
                Posso cambiare piano dopo l'acquisto?
              </h3>
              <p className="text-secondary/80">
                Sì, puoi fare l'upgrade da Last Minute a Senza Pensieri pagando solo la differenza. Contattaci per assistenza.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-secondary mb-2">
                Le domande sono aggiornate?
              </h3>
              <p className="text-secondary/80">
                Sì, il database viene costantemente aggiornato con le normative più recenti per Palermo ed Enna.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-secondary mb-4">
            Pronto per Superare l'Esame?
          </h2>
          <p className="text-secondary/80 text-lg mb-8">
            Unisciti agli aspiranti conducenti che si preparano con noi
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href={plans[0].link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition transform hover:scale-105"
            >
              Inizia Ora
            </a>
            <Link
              href="/"
              className="bg-white/10 text-secondary px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition"
            >
              Torna alla Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
