# Quiz Ruolo Conducenti - Taxi/NCC Palermo ed Enna

Piattaforma completa per la preparazione all'esame Taxi/NCC con sistema freemium e pagamenti Stripe.

## 🚀 Stack Tecnologico

- **Framework**: Next.js 15 con App Router
- **Database**: Supabase
- **Pagamenti**: Stripe
- **Styling**: Tailwind CSS
- **Linguaggio**: TypeScript

## 📦 Installazione

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
npm start
```

Il sito sarà disponibile su [http://localhost:3000](http://localhost:3000)

## ⚙️ Configurazione

### 1. Variabili d'Ambiente

Assicurati che il file `.env.local` contenga tutte le credenziali:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dsxzqwicsggzyeropget.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_LAST_MINUTE_LINK=https://buy.stripe.com/test_...
NEXT_PUBLIC_STRIPE_SENZA_PENSIERI_LINK=https://buy.stripe.com/test_...
```

### 2. Database Supabase

Crea la tabella `questions` eseguendo questo SQL nel Supabase SQL Editor:

```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  category TEXT,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Abilita RLS (Row Level Security)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura pubblica
CREATE POLICY "Lettura pubblica delle domande"
ON questions FOR SELECT
TO public
USING (true);
```

### 3. Importare le Domande

Usa i file TXT forniti per popolare il database. Esempio di inserimento:

```sql
INSERT INTO questions (question, answers, correct_answer, category, explanation)
VALUES (
  'A chi è rivolto il servizio di noleggio con conducente?',
  ARRAY[
    'ad una utenza indifferenziata',
    'all''utenza specifica che si deve rivolgere presso la sede del vettore o mediante mezzi tecnologici',
    'all''utenza specifica che prenota presso le apposite aree pubbliche di stazionamento'
  ],
  'all''utenza specifica che si deve rivolgere presso la sede del vettore o mediante mezzi tecnologici',
  'Legislazione Siciliana',
  'Il servizio NCC è rivolto a utenza specifica, non indifferenziata come il taxi'
);
```

## 🎨 Struttura del Progetto

```
test-quiz/
├── app/
│   ├── api/
│   │   ├── quiz/route.ts              # API per recuperare domande
│   │   ├── exam-results/route.ts      # API per salvare risultati
│   │   └── webhook/stripe/route.ts    # Webhook Stripe
│   ├── dashboard/page.tsx             # Redirect a home
│   ├── pricing/page.tsx               # Pagina piani premium
│   ├── quiz/page.tsx                  # Pagina quiz
│   ├── layout.tsx                     # Layout principale
│   ├── page.tsx                       # Homepage (Dashboard)
│   └── globals.css                    # Stili globali
├── components/
│   ├── Dashboard.tsx                  # Componente dashboard
│   └── QuizEngine.tsx                 # Componente quiz con popup upsell
├── lib/
│   ├── supabase.ts                    # Client Supabase
│   └── stripe.ts                      # Client Stripe
├── public/
│   └── favicon.ico                    # Favicon
├── .env.local                         # Variabili d'ambiente
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 Funzionalità

### Modalità Freemium (Senza Login)
- ✅ 10 domande per quiz
- ✅ 10 minuti di tempo
- ✅ Nessuna autenticazione richiesta
- ✅ Accesso immediato
- ✅ Popup strategici per upsell
- ❌ Nessuna spiegazione errori
- ❌ Storico limitato (dati demo)

### Modalità Premium
- ✅ 20 domande per quiz
- ✅ 30 minuti di tempo
- ✅ Spiegazioni dettagliate
- ✅ Max 2 errori consentiti
- ✅ Statistiche complete
- ✅ Quiz illimitati

### Piani Premium
1. **Last Minute** - €29
   - 30 giorni di accesso
   - Ideale per ripasso rapido

2. **Senza Pensieri** - €59
   - 120 giorni di accesso
   - Piano più completo

## 🎨 Design

- **Colore Primario**: #002147 (blu scuro)
- **Colore Secondario**: #D4AF37 (oro)
- **Font**: Inter, Arial, sans-serif

## 🔐 Sicurezza

- Nessuna autenticazione per freemium
- Le domande sono caricate solo dal database Supabase
- Pagamenti gestiti completamente da Stripe
- Nessun dato sensibile salvato localmente

## 📱 Responsive

Il sito è completamente responsive e ottimizzato per:
- Desktop
- Tablet
- Mobile

## 🚨 Note Importanti

### Database
⚠️ **IMPORTANTE**: Il sito carica le domande SOLO dal database Supabase. Se la tabella `questions` è vuota, il quiz mostrerà un messaggio che invita a tornare più tardi.

Non ci sono domande hardcoded nel codice per garantire che vengano utilizzate solo le domande ufficiali del tuo database.

### Webhook Stripe
Per ricevere eventi di pagamento in locale, usa Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Copia il webhook secret generato in `.env.local`

## 📊 Monitoraggio

- Dashboard Stripe: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- Dashboard Supabase: [https://app.supabase.com](https://app.supabase.com)

## 🐛 Troubleshooting

### Le domande non si caricano
1. Verifica che la tabella `questions` esista in Supabase
2. Verifica che la policy RLS permetta la lettura pubblica
3. Verifica le credenziali in `.env.local`
4. Controlla la console del browser per errori

### I pagamenti non funzionano
1. Verifica le chiavi Stripe in `.env.local`
2. Verifica i link di pagamento in `/pricing`
3. Testa con carte di test Stripe: `4242 4242 4242 4242`

### Errori di build
1. Elimina `.next/` e `node_modules/`
2. Esegui `npm install`
3. Esegui `npm run build`

## 📝 TODO

- [ ] Popolare il database con tutte le domande dai file TXT
- [ ] Configurare il webhook Stripe in produzione
- [ ] Testare il flusso completo di pagamento
- [ ] Implementare sistema di autenticazione per utenti premium (opzionale)

## 📄 Licenza

© 2026 Quiz Ruolo Conducenti. Tutti i diritti riservati.
