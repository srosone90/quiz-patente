# 🏢 GESTIONALE B2B - ISTRUZIONI COMPLETE

## 📋 COSA È STATO IMPLEMENTATO

Il sistema è stato completamente trasformato in un gestionale B2B per la gestione di clienti (scuole guida) e operazioni commerciali.

### ✅ Funzionalità Implementate

#### 1. **Database Schema** (`supabase-b2b-schema.sql`)
- ✅ Tabella `b2b_clients` - Anagrafica completa clienti B2B
- ✅ Tabella `b2b_contacts` - Referenti per ogni cliente
- ✅ Tabella `b2b_contracts` - Gestione contratti
- ✅ Tabella `b2b_appointments` - Calendario appuntamenti
- ✅ Tabella `b2b_invoices` - Sistema fatturazione
- ✅ Tabella `b2b_documents` - Repository documenti
- ✅ Tabella `b2b_tasks` - To-do list
- ✅ Tabella `b2b_notes` - Note cliente
- ✅ Tabella `b2b_transactions` - Movimenti cassa
- ✅ Viste aggregate (pipeline CRM, fatture scadute, contratti in scadenza)
- ✅ RLS (Row Level Security) - Solo admin possono accedere
- ✅ Trigger automatici per `updated_at`

#### 2. **Funzioni Supabase** (`lib/supabase.ts`)
- ✅ 40+ funzioni CRUD per gestione B2B
- ✅ Funzioni statistiche (pipeline, dashboard)
- ✅ Ricerca e filtri avanzati
- ✅ Gestione codici migliorata (elimina, modifica, cerca)

#### 3. **Componenti React**
- ✅ `B2BClients.tsx` - Gestione clienti completa
- ✅ `B2BCalendar.tsx` - Calendario appuntamenti mensile
- ✅ `B2BContracts.tsx` - Gestione contratti
- ✅ `CRMPipeline.tsx` - Pipeline Kanban per vendite
- ✅ `EnhancedCodeManagement.tsx` - Gestione codici avanzata
- ✅ Dashboard Admin aggiornata con 8 tab

---

## 🚀 INSTALLAZIONE

### STEP 1: Crea il Database Supabase

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Apri il tuo progetto
3. Vai su **SQL Editor** (icona nella sidebar)
4. Crea una nuova query
5. Copia TUTTO il contenuto del file `supabase-b2b-schema.sql`
6. Incollalo nell'editor
7. Clicca **RUN** (o premi F5)

**✅ IMPORTANTE**: Lo script crea automaticamente:
- Tutte le tabelle con indici ottimizzati
- RLS policies (solo admin accesso)
- Trigger per aggiornamenti automatici
- Viste aggregate per statistiche

### STEP 2: Verifica l'Installazione

Controlla che siano state create le tabelle:

```sql
-- Nel SQL Editor di Supabase, esegui:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'b2b_%';
```

Dovresti vedere:
- b2b_clients
- b2b_contacts
- b2b_contracts
- b2b_appointments
- b2b_invoices
- b2b_documents
- b2b_tasks
- b2b_notes
- b2b_transactions

### STEP 3: Riavvia il Server

```powershell
npm run dev
```

---

## 🎯 COME USARE IL GESTIONALE

### Accesso Admin

1. Vai su `http://localhost:3000/admin`
2. Il sistema verifica automaticamente se sei admin (campo `is_admin` nel database)

### Dashboard Overview

**📊 Panoramica** - Mostra:
- **Sistema Quiz**: Utenti totali, premium, quiz completati, punteggio medio
- **Gestionale B2B**: Clienti attivi, fatture non pagate, contratti in scadenza, appuntamenti prossimi

---

## 📖 GUIDA FUNZIONALITÀ

### 🏢 CLIENTI B2B

**Cosa puoi fare:**
- ✅ Creare nuovi clienti (scuole guida)
- ✅ Modificare anagrafica completa
- ✅ Archiviare clienti
- ✅ Cercare per nome, email, telefono
- ✅ Filtrare per stato (Lead → Contattato → Proposta → Trattativa → Attivo)

**Campi disponibili:**
- Ragione sociale, P.IVA, Codice Fiscale
- Indirizzo completo (via, città, CAP, provincia)
- Contatti (telefono, mobile, email, PEC, website)
- Stato commerciale (pipeline CRM)
- Termini di pagamento (immediato, 30/60/90 giorni)
- Note commerciali

**Come usare:**
1. Vai su tab **🏢 Clienti B2B**
2. Clicca **Nuovo Cliente**
3. Compila i campi (solo Ragione Sociale è obbligatoria)
4. Salva

### 📅 CALENDARIO APPUNTAMENTI

**Cosa puoi fare:**
- ✅ Visualizzare calendario mensile
- ✅ Creare appuntamenti con clienti
- ✅ Modificare/eliminare appuntamenti
- ✅ Vedere dettagli (tipo, durata, luogo)
- ✅ Navigare mesi (← oggi →)

**Tipi di appuntamento:**
- 📞 Telefonata
- 🤝 Riunione
- 📊 Presentazione
- 🔄 Follow-up
- ✍️ Firma Contratto
- 🔄 Rinnovo
- 🆘 Supporto
- 📋 Revisione

**Come usare:**
1. Vai su tab **📅 Calendario**
2. Clicca **Nuovo Appuntamento**
3. Scegli cliente, data/ora, tipo
4. Aggiungi note di preparazione
5. Gli appuntamenti appaiono nel calendario (colori diversi per tipo)

### 📝 CONTRATTI

**Cosa puoi fare:**
- ✅ Creare contratti per cliente
- ✅ Definire durata e condizioni economiche
- ✅ Tracciare stato (Attivo, Scaduto, In Rinnovo)
- ✅ Vedere contratti in scadenza

**Campi contratto:**
- Numero contratto (es: CTR-2026-001)
- Data inizio/fine
- Tipo (Standard, Premium, Personalizzato)
- Prezzo per studente
- Numero studenti inclusi (0 = illimitati)
- Stato

**Come usare:**
1. Vai su tab **📝 Contratti**
2. Seleziona un cliente dal menu
3. Clicca **Nuovo Contratto**
4. Compila i dati
5. Il sistema ti avvisa se il contratto sta per scadere

### 🎯 PIPELINE CRM

**Cosa puoi fare:**
- ✅ Visualizzare pipeline vendite stile Kanban
- ✅ Spostare clienti tra stati
- ✅ Vedere statistiche conversione
- ✅ Tracciare opportunità

**Stati pipeline:**
1. 🎯 **Lead** - Nuovo contatto
2. 📞 **Contattato** - Prima chiamata effettuata
3. 📧 **Proposta Inviata** - Offerta commerciale inviata
4. 💬 **Trattativa** - In negoziazione
5. ✅ **Attivo** - Cliente acquisito

**Come usare:**
1. Vai su tab **🎯 Pipeline CRM**
2. Vedi colonne con clienti raggruppati per stato
3. Usa il menu a tendina per spostare un cliente
4. Vedi statistiche: tasso conversione, opportunità, clienti attivi

### 🎟️ CODICI ACCESSO (MIGLIORATO)

**Cosa puoi fare (NUOVO!):**
- ✅ **ELIMINARE** codici (prima non era possibile!)
- ✅ **MODIFICARE** codici esistenti
- ✅ **CERCARE** per scuola/codice
- ✅ **FILTRARE** per piano/stato (attivi, esauriti, scaduti)
- ✅ **SELEZIONE MULTIPLA** + eliminazione/disattivazione massiva
- ✅ Aggiungere note ai codici
- ✅ Impostare data di scadenza

**Come usare:**
1. Vai su tab **🎟️ Codici Accesso**
2. Usa barra di ricerca per trovare codici
3. Filtra per piano (Last Minute / Senza Pensieri)
4. Filtra per stato (Tutti / Attivi / Esauriti / Scaduti)
5. **Azioni singole:**
   - Clicca **Modifica** → cambia dati
   - Clicca **Elimina** → conferma eliminazione
6. **Azioni multiple:**
   - Seleziona checkbox
   - Clicca **Disattiva Selezionati** o **Elimina Selezionati**

---

## 📊 STATISTICHE E REPORTISTICA

### Dashboard B2B Overview

**Metriche disponibili:**
- 🏢 Clienti Attivi
- 💰 Fatture Non Pagate (urgent!)
- 📝 Contratti in Scadenza (prossimi 90 giorni)
- 📅 Appuntamenti Prossimi

### Pipeline Stats

- **Tasso di Conversione**: % di lead che diventano clienti attivi
- **In Trattativa**: Opportunità da chiudere
- **Clienti Attivi**: Che generano revenue

---

## 🔍 CASI D'USO PRATICI

### Scenario 1: Nuovo Lead da Fiera
1. **🏢 Clienti B2B** → Nuovo Cliente
2. Compila: Nome scuola, contatti, Stato = "Lead", Fonte = "Fiera"
3. Potenziale studenti/anno: stima (es: 50)
4. **📅 Calendario** → Nuovo Appuntamento
5. Tipo = "Follow-up", data = domani
6. **🎯 Pipeline CRM** → Vedi il lead apparire nella colonna "Lead"

### Scenario 2: Chiusura Contratto
1. **🎯 Pipeline CRM** → Trova cliente in "Trattativa"
2. Sposta in "Attivo" (menu a tendina)
3. **📝 Contratti** → Seleziona cliente → Nuovo Contratto
4. Compila: durata 1 anno, prezzo €59/studente
5. **📅 Calendario** → Aggiungi promemoria rinnovo tra 11 mesi

### Scenario 3: Gestione Codici per Scuola
1. Cliente attivo vuole acquistare 50 licenze
2. **🎟️ Codici Accesso** → Tab originale (quello per generare)
3. Genera 50 codici: Nome scuola, Piano, Max 1 uso ciascuno
4. **🎟️ Codici Accesso** (nuovo) → Filtra per nome scuola
5. Vedi tutti i 50 codici, puoi modificare/eliminare

### Scenario 4: Alert Contratti in Scadenza
1. **📊 Panoramica** → Vedi "3 Contratti in Scadenza"
2. **📝 Contratti** → Vai sul tab
3. Sistema mostra contratti che scadono < 90 giorni
4. **📅 Calendario** → Crea appuntamento tipo "Rinnovo"
5. **🎯 Pipeline CRM** → Sposta cliente in "Rinnovo"

---

## 🛠️ TROUBLESHOOTING

### Problema: "Non vedo i tab B2B"
**Soluzione**: 
- Verifica di essere admin: `is_admin = true` nella tabella `user_profiles`
- Ricarica la pagina (CTRL+F5)

### Problema: "Errore caricamento clienti"
**Soluzione**:
- Verifica che il database sia stato creato correttamente
- Apri console browser (F12) e cerca errori
- Controlla che le RLS policies siano attive

### Problema: "Non posso creare appuntamenti"
**Soluzione**:
- Devi avere almeno 1 cliente B2B creato
- Verifica che la tabella `b2b_clients` abbia dati

### Problema: "Codici non si eliminano"
**Soluzione**:
- Usa il nuovo componente `EnhancedCodeManagement`
- Non il vecchio tab "Genera Codice"

---

## 📈 PROSSIMI SVILUPPI

Funzionalità che possono essere aggiunte:

### Fase 2 (Fatturazione)
- [ ] Componente fatture completo
- [ ] Creazione fatture da contratti
- [ ] Alert pagamenti scaduti
- [ ] Export PDF fatture

### Fase 3 (Analytics)
- [ ] Dashboard analytics per cliente
- [ ] Report performance scuole
- [ ] Grafici revenue mensile
- [ ] Previsioni vendite

### Fase 4 (Automazioni)
- [ ] Email automatiche contratti in scadenza
- [ ] Promemoria appuntamenti
- [ ] Report settimanale automatico
- [ ] Export massivo documenti

---

## 🎉 RIEPILOGO

**COSA HAI ORA:**
- ✅ Sistema completo gestione clienti B2B
- ✅ Calendario appuntamenti mensile
- ✅ Gestione contratti e scadenze
- ✅ Pipeline CRM Kanban
- ✅ Gestione codici avanzata (elimina/modifica/cerca)
- ✅ Dashboard statistiche B2B
- ✅ Database strutturato e ottimizzato

**PASSI FATTI:**
1. ✅ Schema database SQL (9 tabelle, 4 viste)
2. ✅ 40+ funzioni Supabase TypeScript
3. ✅ 5 componenti React completi
4. ✅ Dashboard admin con 8 tab
5. ✅ Sistema completamente funzionante

**COME PROCEDERE:**
1. Esegui SQL su Supabase
2. Riavvia server (`npm run dev`)
3. Vai su `/admin`
4. Inizia a creare clienti!

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla la console browser (F12)
2. Verifica che il database sia creato
3. Controlla che sei admin (`is_admin = true`)
4. Riavvia il server

---

**🚀 Buon lavoro con il tuo gestionale B2B!**
