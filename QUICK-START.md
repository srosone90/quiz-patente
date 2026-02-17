# ⚡ QUICK START GUIDE

## 🚀 Avvio Rapido (5 minuti)

### 1. Verifica Server
```bash
# Il server dovrebbe già essere attivo
# Apri browser su:
http://localhost:3000
```

### 2. Testa le Pagine

✅ **Dashboard** (http://localhost:3000)
- Verifica caricamento
- Clicca "Inizia Quiz Demo"
- Clicca "Piani Premium"

✅ **Quiz** (http://localhost:3000/quiz)
- Verifica timer countdown
- Prova a rispondere (vedrai "Database in preparazione" se DB vuoto)
- Aspetta popup mid-quiz (domanda 5)

✅ **Pricing** (http://localhost:3000/pricing)
- Verifica card piani
- Verifica link Stripe (non cliccare in test mode)
- Leggi tabella comparativa

### 3. Popola Database (OBBLIGATORIO)

```bash
# Opzione A - Automatico (RACCOMANDATO)
npm install dotenv
node import-questions.js

# Opzione B - Manuale
# Vai su https://app.supabase.com
# Esegui supabase-setup.sql
# Inserisci domande manualmente
```

### 4. Ricarica Quiz
Dopo aver popolato il DB:
```bash
# Ricarica la pagina quiz
http://localhost:3000/quiz
```

Ora dovresti vedere le domande reali! 🎉

---

## 📁 File Importanti

```
📄 README.md              → Documentazione completa
📄 PROGETTO-COMPLETO.md   → Dettagli tecnici
📄 RIEPILOGO-FINALE.md    → Status e feature
📄 IMPORT-GUIDE.md        → Come importare domande
📄 ROADMAP.md             → Sviluppo futuro
📄 .env.local             → Credenziali (NON committare!)
📄 supabase-setup.sql     → Schema database

📁 app/                   → Pagine e API
📁 components/            → Componenti React
📁 lib/                   → Client Supabase/Stripe
```

---

## 🎯 Checklist Pre-Deploy

Prima di andare in produzione:

- [ ] Database popolato con tutte le domande
- [ ] Testato quiz completo
- [ ] Verificati link Stripe
- [ ] Configurato webhook Stripe in produzione
- [ ] Aggiunto Google Analytics (opzionale)
- [ ] Testato responsive mobile
- [ ] Verificato tempo caricamento
- [ ] Favicon personalizzato
- [ ] Meta tags SEO

---

## 🐛 Problemi Comuni

### "Database in preparazione"
→ Devi popolare il database! Vedi IMPORT-GUIDE.md

### Server non parte
```bash
# Verifica dipendenze
npm install

# Riavvia
npm run dev
```

### Errori TypeScript
```bash
# Rebuilda
rm -rf .next node_modules
npm install
npm run build
```

### Link Stripe non funzionano
→ Verifica in .env.local:
```
NEXT_PUBLIC_STRIPE_LAST_MINUTE_LINK=...
NEXT_PUBLIC_STRIPE_SENZA_PENSIERI_LINK=...
```

---

## 🔧 Comandi Utili

```bash
# Sviluppo
npm run dev              # Start dev server (localhost:3000)

# Build
npm run build            # Compile production build
npm start                # Run production build

# Utility
npm run lint             # Check errors
npm install dotenv       # For import script

# Database
node import-questions.js # Import domande
```

---

## 📞 Link Rapidi

- **Sito Locale**: http://localhost:3000
- **Supabase Dashboard**: https://app.supabase.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 Fatto!

Il tuo sito è pronto! 

**Prossimi passi:**
1. Popola database
2. Testa tutto
3. Deploy su Vercel
4. Inizia a promuovere

**Buona fortuna con il tuo business!** 🚀

---

_Per domande o supporto, consulta i file di documentazione._
