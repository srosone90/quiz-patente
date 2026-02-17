# Guida Admin - Gestione Codici Accesso 🎟️

## Per: srosone90@gmail.com (Amministratore)
## Dashboard Admin: http://localhost:3000/admin

---

## 🎯 Panoramica Sistema

Il sistema di codici accesso permette alle scuole guida di acquistare codici da distribuire ai propri studenti per attivare l'accesso premium alla piattaforma.

---

## 🔑 Tipi di Piani Disponibili

### 1. **LAST MINUTE** (Consigliato per esami imminenti)
- **Durata**: 3 mesi
- **Ideale per**: Studenti che devono sostenere l'esame a breve
- **Codice esempio**: `LAST_MINUTE-ABC123XY`

### 2. **SENZA PENSIERI** (Piano completo)
- **Durata**: 12 mesi
- **Ideale per**: Preparazione completa senza fretta
- **Codice esempio**: `SENZA_PENSIERI-DEF456ZW`

---

## 📝 Come Generare Codici

### Passo 1: Accedi alla Dashboard Admin
```
URL: http://localhost:3000/admin (o https://tuodominio.com/admin in produzione)
Login: srosone90@gmail.com
```

### Passo 2: Vai alla Tab "Codici"
Troverai:
- Elenco di tutti i codici generati
- Statistiche utilizzo (usati / totali)
- Form per generare nuovi codici

### Passo 3: Compila il Form
**Campi da compilare**:

1. **Tipo Piano**:
   - Scegli `last_minute` o `senza_pensieri`
   
2. **Numero Massimo Utilizzi**:
   - Inserisci il numero di studenti che potranno usare questo codice
   - Esempi:
     - `1` = codice monouso
     - `30` = per una classe di 30 studenti
     - `100` = per pacchetto scuola guida grande

3. **Data Scadenza***:
   - Fino a quando questo codice può essere riscattato
   - Formato: YYYY-MM-DD (es: 2025-12-31)
   - ⚠️ Nota: Questa è la scadenza del CODICE, non dell'abbonamento studente
   - Una volta riscattato, lo studente ha 3 o 12 mesi in base al piano

### Passo 4: Genera
- Click su "Genera Codice"
- Il sistema creerà un codice univoco come: `LAST_MINUTE-LZ39ZXT3`
- Il codice apparirà nella lista sottostante

---

## 📊 Monitoraggio Codici

### Dashboard Overview (Tab "Overview")
Mostra statistiche globali:
- **Codici Generati**: Totale codici creati
- **Codici Attivi**: Codici con utilizzi disponibili
- **Utenti Premium**: Totale utenti con accesso premium

### Lista Codici (Tab "Codici")
Per ogni codice vedi:
- **Codice**: Il codice da dare agli studenti
- **Piano**: last_minute o senza_pensieri
- **Utilizzi**: X/Y (quanti studenti l'hanno usato sul totale)
- **Scadenza Riscatto**: Quando scade il codice
- **Stato**: Attivo / Esaurito / Scaduto

**Codice è valido quando**:
- ✅ `used_count < max_uses` (ci sono ancora slot disponibili)
- ✅ `expires_at > NOW()` (non è scaduto)

---

## 🎓 Flusso Studente (Per Informazione)

### 1. Studente Riceve Codice
La scuola guida fornisce il codice allo studente:
```
"Ecco il tuo codice accesso premium: LAST_MINUTE-ABC123XY"
```

### 2. Studente Accede al Sito
- Va su https://tuosito.com
- Si registra / fa login

### 3. Studente Riscatta Codice
- Dalla Dashboard, click su "Attiva Codice" (card viola)
- Oppure va direttamente a `/redeem`
- Inserisce il codice: `LAST_MINUTE-ABC123XY`
- Click "Riscatta Codice"

### 4. Sistema Valida
Il backend controlla:
- ✅ Codice esiste?
- ✅ Codice non scaduto?
- ✅ Ci sono utilizzi disponibili?
- ✅ Utente non ha già premium attivo?

### 5. Attivazione Premium
Se tutto OK:
- `subscription_type` → aggiornato al piano del codice
- `subscription_expires_at` → impostato a 3 o 12 mesi da oggi
- `used_count` del codice → incrementato
- Record in `code_redemptions` → creato per tracking

### 6. Studente Vede Premium Attivo
Dashboard mostra:
- Badge: "✅ PREMIUM ATTIVO"
- Dettagli: 20 domande, 30 minuti, spiegazioni
- Data scadenza: Visibile (es: 19/03/2026)

---

## 💼 Scenari d'Uso

### Scenario 1: Scuola Guida Piccola
**Richiesta**: Attivazione premium per 15 studenti

**Azione**:
1. Genera 1 codice con:
   - Piano: `last_minute` (o `senza_pensieri`)
   - Max Utilizzi: `15`
   - Scadenza: 6 mesi da oggi (es: 2025-09-01)
2. Invia lo stesso codice a tutti i 15 studenti
3. Ogni studente lo riscatta → `used_count` va da 0 → 1 → 2 ... → 15
4. Quando arriva a 15, il codice è esaurito

**Vantaggio**: Un solo codice da gestire

### Scenario 2: Scuola Guida Grande (Codici Individuali)
**Richiesta**: Codici separati per tracciare ogni studente

**Azione**:
1. Genera 50 codici diversi, ognuno con:
   - Piano: `last_minute`
   - Max Utilizzi: `1` (monouso)
   - Scadenza: 1 anno (2026-03-01)
2. Crea uno spreadsheet (Excel) con:
   ```
   Studente           | Codice
   Marco Rossi        | LAST_MINUTE-ABC001
   Laura Bianchi      | LAST_MINUTE-ABC002
   ...
   ```
3. Ogni studente riceve il suo codice personale
4. Puoi tracciare esattamente chi ha riscattato cosa

**Vantaggio**: Tracciamento individuale preciso

### Scenario 3: Promo Stagionale
**Richiesta**: Promo estiva con sconto

**Azione**:
1. Genera 1 codice promozionale:
   - Piano: `senza_pensieri` (12 mesi)
   - Max Utilizzi: `500` (tanti per promo pubblica)
   - Scadenza: 2025-08-31
2. Pubblica il codice: "ESTATE2025-PROMO"
3. Studenti lo usano fino a esaurimento o scadenza

**Vantaggio**: Marketing e promozioni facili

---

## 🔍 Log e Tracking

### Tab "Users" (Dashboard Admin)
Mostra tutti gli utenti registrati con:
- Email
- Nome
- Subscription Type (free / last_minute / senza_pensieri)
- Data Scadenza
- Data Registrazione

**Utile per**:
- Vedere quanti premium attivi
- Verificare scadenze imminenti
- Supporto clienti (controllare stato abbonamento)

### Database `code_redemptions`
Ogni riscatto viene tracciato:
```sql
user_id | code_id | redeemed_at
--------|---------|------------
uuid-1  | uuid-a  | 2024-03-15 10:30:00
uuid-2  | uuid-a  | 2024-03-15 11:45:00
...
```

**Query utili** (da Supabase SQL Editor):

**Vedere chi ha usato un codice specifico**:
```sql
SELECT 
  u.email,
  u.full_name,
  cr.redeemed_at
FROM code_redemptions cr
JOIN auth.users u ON u.id = cr.user_id
WHERE cr.code_id = (
  SELECT id FROM access_codes WHERE code = 'LAST_MINUTE-ABC123'
)
ORDER BY cr.redeemed_at DESC;
```

**Codici più usati**:
```sql
SELECT 
  code,
  plan_type,
  used_count,
  max_uses,
  ROUND((used_count::float / max_uses) * 100, 1) as usage_percent
FROM access_codes
WHERE used_count > 0
ORDER BY used_count DESC
LIMIT 10;
```

---

## ⚠️ Gestione Problemi

### Problema: "Codice non valido"
**Possibili cause**:
1. Codice digitato male (verifica maiuscole/minuscole)
2. Codice scaduto (controllo `expires_at`)
3. Codice esaurito (`used_count >= max_uses`)

**Soluzione**:
- Vai in Dashboard Admin → Tab Codici
- Cerca il codice specifico
- Verifica stato e scadenza
- Se necessario, genera nuovo codice

### Problema: "Hai già un abbonamento attivo"
**Causa**: L'utente ha già `subscription_type != 'free'`

**Soluzione**:
- Utente deve attendere la scadenza naturale
- Oppure (eccezionale): Admin può modificare manualmente in Supabase

### Problema: Timer quiz non funziona
**Causa**: Utente ha iniziato quiz prima degli aggiornamenti

**Soluzione**:
- Refresh pagina
- Iniziare nuovo quiz
- Il timer ora funziona correttamente

---

## 🎁 Suggerimenti Marketing

### Per Scuole Guida
**Pacchetto Base**:
- 30 codici `last_minute` (3 mesi) → €X
- Include: monitoring dashboard per la scuola

**Pacchetto Premium**:
- 50 codici `senza_pensieri` (12 mesi) → €Y
- Include: statistiche classe, tracking progressi

### Per Studenti Individuali
**Pagina Pricing** (`/pricing`):
- Piano Last Minute: €A - 3 mesi
- Piano Senza Pensieri: €B - 12 mesi
- (Opzionale) Integrazione Stripe per pagamento diretto

---

## 📞 Supporto

### Per Problemi Tecnici
1. Controlla logs in browser console (F12)
2. Verifica Supabase status
3. Controlla RLS policies

### Per Richieste Commerciali
- Email: srosone90@gmail.com
- Genera codici su richiesta scuole guida

---

## 🚀 Prossime Features (Roadmap)

### Breve Termine
- [ ] Notifica email automatica pre-scadenza abbonamento
- [ ] Export CSV lista utenti premium
- [ ] Dashboard scuola guida (view only per partners)

### Medio Termine
- [ ] Pagamento Stripe integrato
- [ ] API per generazione automatica codici
- [ ] White-label per scuole guida partners

### Lungo Termine
- [ ] App Mobile (iOS/Android)
- [ ] Certificati PDF automatici
- [ ] Gamification e leaderboard

---

## ✅ Checklist Admin Giornaliera

**Ogni Giorno**:
- [ ] Check nuovi utenti registrati (Tab Users)
- [ ] Verifica codici in scadenza (prossimi 7 giorni)
- [ ] Rispondi richieste supporto email

**Ogni Settimana**:
- [ ] Analizza statistiche utilizzo codici
- [ ] Identifica codici mai usati (spreco)
- [ ] Report a scuole guida partners

**Ogni Mese**:
- [ ] Review abbonamenti in scadenza
- [ ] Forecast generazione nuovi codici
- [ ] Ottimizzazione prezzi piani

---

## 📧 Template Email per Scuole Guida

```
Oggetto: Codici Accesso Premium - [Nome Scuola Guida]

Gentile [Nome Responsabile],

Allego i codici accesso premium per i vostri studenti:

Piano: LAST MINUTE (3 mesi)
Codice: LAST_MINUTE-ABC123XY
Utilizzi: 0/30
Valido fino al: 31/12/2025

ISTRUZIONI PER GLI STUDENTI:
1. Registrati su https://tuosito.com
2. Vai su "Attiva Codice" dalla dashboard
3. Inserisci: LAST_MINUTE-ABC123XY
4. Inizia subito le simulazioni!

COSA INCLUDE:
✅ 20 domande per quiz (come l'esame reale)
✅ 30 minuti di tempo
✅ Spiegazioni dettagliate per ogni risposta
✅ Ripasso errori intelligente
✅ Filtro per categoria
✅ Statistiche avanzate

Per supporto tecnico: supporto@tuosito.com

Cordiali saluti,
[Il tuo nome]
```

---

**🎯 Fine Guida Admin**

Questa guida verrà aggiornata con nuove funzionalità man mano che vengono implementate.
