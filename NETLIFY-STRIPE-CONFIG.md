# 🔐 Configurazione Stripe Live su Netlify

## Variabili d'ambiente da configurare

Vai su **Netlify Dashboard → Site Settings → Environment Variables** e aggiungi:

### 1. Stripe Live Keys

**Nome variabile:** `STRIPE_SECRET_KEY`  
**Valore:** La tua chiave segreta (inizia con `sk_live_...`)  
🔒 Questa chiave è in [STRIPE-KEYS-PRIVATE.txt](STRIPE-KEYS-PRIVATE.txt) (non committato su git)

**Nome variabile:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
**Valore:** La tua chiave pubblica (inizia con `pk_live_...`)  
🔒 Questa chiave è in [STRIPE-KEYS-PRIVATE.txt](STRIPE-KEYS-PRIVATE.txt)

### 2. Link di Pagamento Live

**Nome variabile:** `NEXT_PUBLIC_STRIPE_LAST_MINUTE_LINK`  
**Valore:** `https://buy.stripe.com/3cI9AU06s3CneIF6Gl2kw01`

**Nome variabile:** `NEXT_PUBLIC_STRIPE_SENZA_PENSIERI_LINK`  
**Valore:** `https://buy.stripe.com/4gM4gA1aw3Cn2ZXfcR2kw00`

### 3. Webhook Secret (opzionale)

Se hai configurato webhook Stripe:

**Nome variabile:** `STRIPE_WEBHOOK_SECRET`  
**Valore:** Il tuo webhook secret da Stripe Dashboard (inizia con `whsec_...`)

## 📝 Note Importanti

1. **NON committare** mai le chiavi segrete nel repository
2. Le chiavi `NEXT_PUBLIC_*` sono visibili nel browser (solo pubblicabili)
3. Le chiavi `STRIPE_SECRET_KEY` restano sul server (mai esposte)
4. Dopo aver aggiunto le variabili, fai **redeploy** del sito su Netlify
5. I link di pagamento sono già aggiornati nel codice come fallback

## 🔄 Come fare redeploy

1. Netlify Dashboard → Deploys
2. Click "Trigger deploy" → "Deploy site"
3. Oppure fai un nuovo push su GitHub (auto-deploy)

## ✅ Verifica

Dopo il deploy:
1. Vai su `/pricing`
2. Clicca "Acquista" su un piano
3. Verifica che si apra il checkout Stripe **live** (non test)
4. URL inizierà con `https://buy.stripe.com/` (senza `test_`)

## 🚨 Sicurezza

- Le chiavi live REALI sono nel file [STRIPE-KEYS-PRIVATE.txt](STRIPE-KEYS-PRIVATE.txt) (git-ignored)
- Questo file contiene solo istruzioni - nessuna chiave sensibile committata
- Considera di rigenerare le chiavi se sono state esposte pubblicamente
