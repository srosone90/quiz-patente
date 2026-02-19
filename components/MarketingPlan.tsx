'use client'

import { useState } from 'react'

interface Task {
  id: string
  text: string
  completed: boolean
}

interface Phase {
  id: number
  name: string
  period: string
  target: string
  budget: string
  tasks: Task[]
}

export default function MarketingPlan() {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: 1,
      name: 'Soft Launch',
      period: 'Settimana 1-2',
      target: '20 utenti beta',
      budget: '€0',
      tasks: [
        { id: '1-1', text: 'Creare 5-10 screenshot app (dashboard, quiz, statistiche, classifica, profilo)', completed: false },
        { id: '1-2', text: 'Post su Facebook personale con invito beta tester', completed: false },
        { id: '1-3', text: 'Post su Instagram Stories con link', completed: false },
        { id: '1-4', text: 'Messaggi WhatsApp a 10 amici fidati', completed: false },
        { id: '1-5', text: 'Chiedere feedback onesto via sondaggio Google Forms', completed: false },
        { id: '1-6', text: 'Monitorare Analytics ogni giorno (utenti, quiz completati, bug)', completed: false },
      ]
    },
    {
      id: 2,
      name: 'Community Launch',
      period: 'Settimana 3-4',
      target: '50-80 utenti',
      budget: '€0',
      tasks: [
        { id: '2-1', text: 'Post nei gruppi Facebook "Palermo" "Lavorare a Palermo" "NCC Palermo"', completed: false },
        { id: '2-2', text: 'Commentare in discussioni esistenti su taxi/NCC con link app', completed: false },
        { id: '2-3', text: 'Creare post con testimonianza utente soddisfatto (screenshot + quote)', completed: false },
        { id: '2-4', text: 'Chiedere ai primi utenti di condividere con amici interessati', completed: false },
        { id: '2-5', text: 'Aggiornare profilo LinkedIn con progetto + articolo su app', completed: false },
        { id: '2-6', text: 'Monitorare commenti e rispondere entro 2 ore', completed: false },
      ]
    },
    {
      id: 3,
      name: 'B2B Outreach',
      period: 'Settimana 5-6',
      target: '2-3 scuole guida',
      budget: '€30 (biglietti visita)',
      tasks: [
        { id: '3-1', text: 'Lista 10 scuole guida a Palermo (Google Maps + recensioni)', completed: false },
        { id: '3-2', text: 'Stampare 50 biglietti da visita con logo + QR code app', completed: false },
        { id: '3-3', text: 'Visita fisica a 3 scuole (mattina 9-11) con presentazione 5 minuti', completed: false },
        { id: '3-4', text: 'Email follow-up con PDF proposta + codici prova gratuiti (5 codici = €145 valore)', completed: false },
        { id: '3-5', text: 'Chiamata telefonica follow-up dopo 3 giorni', completed: false },
        { id: '3-6', text: 'Offrire 1 mese prova gratuita per tutti studenti scuola', completed: false },
      ]
    },
    {
      id: 4,
      name: 'Paid Advertising (Opzionale)',
      period: 'Settimana 7-8',
      target: '100+ utenti totali',
      budget: '€50-100',
      tasks: [
        { id: '4-1', text: 'Creare campagna Facebook Ads con targeting: Palermo, età 25-45, interessi taxi/autista/lavoro', completed: false },
        { id: '4-2', text: 'Budget test: €5/giorno per 10 giorni = €50', completed: false },
        { id: '4-3', text: 'A/B test: 2 creativi (screenshot app vs. testimonianza utente)', completed: false },
        { id: '4-4', text: 'Remarketing pixel su sito per utenti che visitano ma non si registrano', completed: false },
        { id: '4-5', text: 'Post sponsorizzato Instagram (€30) con carousel screenshots', completed: false },
        { id: '4-6', text: 'Analizzare CPA (costo per acquisizione) - target: < €2/utente', completed: false },
      ]
    },
  ])

  const [activePhase, setActivePhase] = useState(1)
  const [showTemplates, setShowTemplates] = useState(false)

  const toggleTask = (phaseId: number, taskId: string) => {
    setPhases(phases.map(phase => 
      phase.id === phaseId 
        ? {
            ...phase,
            tasks: phase.tasks.map(task => 
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          }
        : phase
    ))
  }

  const getPhaseProgress = (phase: Phase) => {
    const completed = phase.tasks.filter(t => t.completed).length
    return Math.round((completed / phase.tasks.length) * 100)
  }

  const templates = {
    facebook: `🚕 BETA GRATUITA - App Quiz Patente Taxi Palermo! 🚕

Ehi, ho creato un'app per prepararsi all'esame taxi/NCC a Palermo!

✅ Quiz con domande aggiornate
✅ Statistiche dettagliate
✅ Modalità revisione errori
✅ Classifica tra utenti
✅ 100% GRATIS durante la beta

Cerco beta tester per migliorarla prima del lancio! 
👉 driverquizpa.com

Fammi sapere cosa ne pensi! 💬`,

    whatsapp: `Ehi! Ho fatto un'app per l'esame Taxi di Palermo. È gratis durante la beta - la provi?

driverquizpa.com

Mi farebbe piacere un tuo feedback! 🚕`,

    email: `Oggetto: Proposta Partnership - App Driver Quiz Palermo

Gentile [Nome Scuola Guida],

Mi chiamo [Tuo Nome] e ho sviluppato Driver Quiz Palermo, un'app per preparare gli studenti all'esame taxi/NCC.

🎯 VANTAGGI PER LA VOSTRA SCUOLA:
- Strumento digitale moderno per studenti
- Statistiche dettagliate progressi per istruttori
- Sistema codici accesso bulk (es. 10 codici = €250)
- Gamificazione con classifica motivante
- Aggiornamento continuo domande

🎁 OFFERTA LANCIO:
- Prova GRATUITA 1 mese per tutti i vostri studenti
- 5 codici premium omaggio (valore €145)
- Supporto tecnico dedicato
- Co-marketing sui nostri canali

📱 Demo: driverquizpa.com

Disponibile per incontro questa settimana?

Cordiali saluti,
[Tuo Nome]
[Telefono]`
  }

  const kpis = [
    { name: 'Utenti Registrati', target: '100+', unit: 'utenti' },
    { name: 'Quiz Completati', target: '500+', unit: 'quiz' },
    { name: 'Tasso Passaggio', target: '70%+', unit: '%' },
    { name: 'Scuole Guida Interessate', target: '2-3', unit: 'scuole' },
    { name: 'Costo Acquisizione (se ads)', target: '< €2', unit: '€/utente' },
    { name: 'Tasso Attivazione', target: '60%+', unit: '%' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-2">🚀 Piano Marketing Beta - 60 Giorni</h2>
        <p className="text-green-50">
          Strategia completa per raggiungere 100+ beta tester con budget minimo (€30-130)
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">📅 Timeline delle Fasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {phases.map((phase) => {
            const progress = getPhaseProgress(phase)
            return (
              <div
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  activePhase === phase.id
                    ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}
              >
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Fase {phase.id}
                </div>
                <div className="font-bold text-gray-900 dark:text-white mb-1">
                  {phase.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {phase.period}
                </div>
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                  Target: {phase.target}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  Budget: {phase.budget}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {progress}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Checklist Fase Attiva */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        {phases
          .filter((phase) => phase.id === activePhase)
          .map((phase) => (
            <div key={phase.id}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ✅ Checklist: {phase.name}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {phase.tasks.filter(t => t.completed).length} / {phase.tasks.length} completati
                </div>
              </div>
              <div className="space-y-3">
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(phase.id, task.id)}
                    className={`flex items-start p-3 rounded-lg cursor-pointer transition-all ${
                      task.completed
                        ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className="mr-3 mt-0.5">
                      {task.completed ? (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded" />
                      )}
                    </div>
                    <div className={`flex-1 ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Templates */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📝 Template Pronti all'Uso</h3>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            {showTemplates ? 'Nascondi' : 'Mostra Template'}
          </button>
        </div>
        {showTemplates && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">📱 Post Facebook/Instagram</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(templates.facebook)}
                  className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Copia
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {templates.facebook}
              </pre>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">💬 Messaggio WhatsApp</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(templates.whatsapp)}
                  className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Copia
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {templates.whatsapp}
              </pre>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">✉️ Email per Scuole Guida</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(templates.email)}
                  className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Copia
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {templates.email}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* KPI */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">📊 KPI da Monitorare</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kpi.name}</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {kpi.target}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{kpi.unit}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dove monitorare:</strong> Usa la tab "Analytics Avanzata" nella dashboard admin per vedere i dati in tempo reale (utenti, quiz, tassi di successo)
            </div>
          </div>
        </div>
      </div>

      {/* Azioni Immediate */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-3">⚡ AZIONI IMMEDIATE (Oggi)</h3>
        <ol className="space-y-2 list-decimal list-inside text-white/90">
          <li>Crea 5-10 screenshot dell'app (usa browser in modalità cellulare o installa PWA)</li>
          <li>Copia il post Facebook dal template e pubblicalo sul tuo profilo personale</li>
          <li>Invia messaggio WhatsApp a 5 amici fidati chiedendo di provare l'app</li>
          <li>Vai su Google Analytics per verificare che il tracking sia attivo (Realtime report)</li>
          <li>Prepara Google Forms per feedback beta (5 domande: cosa ti piace, cosa migliorare, bug, facilità uso, voto 1-10)</li>
        </ol>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          <strong>💡 Suggerimento:</strong> Inizia con la Fase 1 (Soft Launch) e aspetta di avere almeno 10 utenti attivi prima di passare alla Fase 2.
        </p>
        <p>
          <strong>📱 Contatto:</strong> Rispondi sempre entro 2 ore a commenti e messaggi per massimizzare conversioni e creare fiducia.
        </p>
      </div>
    </div>
  )
}
