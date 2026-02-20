# 🔐 Configurazione OAuth (Google, Facebook)

Il sito ora supporta il login con Google e Facebook! Per attivarlo, segui questi passaggi:

---

## ✅ Cosa è già fatto (codice)

- ✅ Pulsanti OAuth nel form di login/registrazione
- ✅ Funzione `signInWithOAuth()` in `lib/supabase.ts`
- ✅ Login automatico dopo registrazione
- ✅ Redirect automatico a dashboard

---

## 🔧 Configurazione su Supabase (5 minuti)

### 1. Vai su Supabase Dashboard

1. Apri https://supabase.com/dashboard
2. Seleziona il progetto **dsxzqwicsggzyeropget**
3. Menu laterale → **Authentication** → **Providers**

---

## 🔵 Google OAuth

### Passaggio 1: Crea credenziali Google

1. Vai su https://console.cloud.google.com/
2. Crea un nuovo progetto o seleziona uno esistente
3. Menu → **API e servizi** → **Credenziali**
4. Click **Crea credenziali** → **ID client OAuth 2.0**

### Passaggio 2: Configura schermata consenso

1. Click **Configura schermata consenso**
2. Seleziona **Esterni** (se non hai workspace Google)
3. Compila:
   - **Nome app**: DriverQuiz PA
   - **Email supporto**: tuaemail@example.com
   - **Dominio app**: driverquizpa.com
4. Salva

### Passaggio 3: Crea ID Client OAuth

1. Torna su **Credenziali** → **Crea credenziali** → **ID client OAuth 2.0**
2. Tipo applicazione: **Applicazione web**
3. Nome: **DriverQuiz PA Web**
4. **URI di reindirizzamento autorizzati** → Aggiungi:
   ```
   https://dsxzqwicsggzyeropget.supabase.co/auth/v1/callback
   ```
5. Click **Crea**
6. **Copia** il **Client ID** e il **Client Secret**

### Passaggio 4: Attiva Google su Supabase

1. Supabase → **Authentication** → **Providers** → **Google**
2. Attiva **Google Enabled**
3. Incolla:
   - **Client ID**: quello copiato da Google
   - **Client Secret**: quello copiato da Google
4. Click **Save**

---

## 🔵 Facebook OAuth

### Passaggio 1: Crea app Facebook

1. Vai su https://developers.facebook.com/
2. Menu **Le mie app** → **Crea app**
3. Scegli **Consumatore** → **Avanti**
4. Compila:
   - **Nome app**: DriverQuiz PA
   - **Email contatto**: tuaemail@example.com
5. Click **Crea app**

### Passaggio 2: Aggiungi prodotto "Login Facebook"

1. Dashboard app → **Aggiungi un prodotto**
2. Cerca **Login Facebook** → Click **Configura**

### Passaggio 3: Configura OAuth Settings

1. Sidebar → **Login Facebook** → **Impostazioni**
2. **URI di reindirizzamento OAuth validi** → Aggiungi:
   ```
   https://dsxzqwicsggzyeropget.supabase.co/auth/v1/callback
   ```
3. Salva modifiche

### Passaggio 4: Ottieni credenziali app

1. Sidebar → **Impostazioni** → **Di base**
2. **Copia**:
   - **ID app**
   - **Chiave segreta app** (click "Mostra")

### Passaggio 5: Attiva Facebook su Supabase

1. Supabase → **Authentication** → **Providers** → **Facebook**
2. Attiva **Facebook Enabled**
3. Incolla:
   - **Client ID**: l'**ID app** di Facebook
   - **Client Secret**: la **Chiave segreta** di Facebook
4. Click **Save**

---

## ✅ Verifica che funzioni

1. Vai su **https://driverquizpa.com/login**
2. Prova a cliccare **Google** o **Facebook**
3. Dovresti vedere la schermata di consenso OAuth
4. Dopo l'autorizzazione, verrai reindirizzato alla dashboard

---

## 🔒 Note di sicurezza

- ✅ Le chiavi segrete non sono mai nel codice frontend
- ✅ OAuth gestito interamente da Supabase (sicuro)
- ✅ Redirect URL verificato da Supabase
- ✅ Supporto automatico per creazione profilo utente

---

## ❗ Risoluzione problemi

### "Redirect URI non autorizzato"
- Verifica che l'URL di callback sia esattamente:
  ```
  https://dsxzqwicsggzyeropget.supabase.co/auth/v1/callback
  ```
- Controlla negli OAuth settings di Google/Facebook

### "App in modalità sviluppo" (Facebook)
- Per rendere pubblica l'app:
  - Dashboard Facebook → **Impostazioni** → **Di base**
  - Sopra scorri → Toggle **In produzione**
  - Completa eventuale revisione app

### Pulsanti OAuth non funzionano
- Apri console browser (F12)
- Controlla errori in rosso
- Verifica che Supabase Providers siano attivati

---

## 🎯 Risultato finale

Dopo la configurazione, gli utenti potranno:
- ✅ Registrarsi con **email + password** (login automatico)
- ✅ Registrarsi con **Google** (1 click)
- ✅ Registrarsi con **Facebook** (1 click)
- ✅ Tutti reindirizzati automaticamente alla dashboard

Il profilo utente viene creato automaticamente con i dati da OAuth (nome, email, avatar).
