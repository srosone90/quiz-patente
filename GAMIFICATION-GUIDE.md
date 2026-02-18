# 🎮 Gamification & New Features - Guida Completa

## 📋 Sommario Feature Implementate

### ✅ IMPLEMENTATO
1. **Sistema XP e Livelli** - Progresso visivo con barra XP
2. **Achievement/Trofei** - 15 trofei sbloccabili (Bronze, Silver, Gold, Platinum)
3. **Streak Counter** - Tracciamento giorni consecutivi di studio
4. **Leaderboard Settimanale** - Classifica Top 10 studenti per XP
5. **Wake Lock API** - Schermo sempre acceso durante quiz
6. **Integrazione Dashboard** - Nuove sezioni "Progresso" e "Classifica"
7. **Auto-Unlock Achievement** - Controllo automatico dopo ogni quiz completato

### ⏳ NON IMPLEMENTATO (Da fare in futuro)
- Gruppi Studio e Sistema Referral
- Commenti su Domande
- Profili Pubblici Condivisibili
- Report PDF Esportabile
- Previsione Successo Esame (ML)
- Grafici Temporali Avanzati
- Heatmap Categorie
- Notifiche Push PWA
- Countdown Esame
- Sistema Multilingua (i18n)
- Widget iOS/Android (richiede app nativa)
- WhatsApp Notifiche (richiede Business API - costoso)

---

## 🚀 Setup Database

### 1. Esegui lo Schema SQL

**IMPORTANTE**: Prima di usare le nuove feature, devi creare le tabelle nel database Supabase.

```bash
# Nel dashboard Supabase, vai su SQL Editor e incolla il contenuto di:
GAMIFICATION-SCHEMA.sql
```

Oppure via CLI:
```bash
supabase db push
# oppure
psql $DATABASE_URL -f GAMIFICATION-SCHEMA.sql
```

### 2. Verifica Tabelle Create

Assicurati che queste tabelle esistano:
- `user_progress` - XP, livelli, streak
- `achievements` - Trofei disponibili
- `user_achievements` - Trofei sbloccati dagli utenti
- `leaderboard_weekly` - Classifica settimanale (opzionale, cache)
- `activity_log` - Log attività utenti
- Altri: `study_groups`, `question_comments`, `referrals`, `user_profiles`, `exam_settings`

### 3. Trigger Automatico

Lo script crea un trigger che:
- **Dopo ogni quiz completato** → Aggiorna automaticamente `user_progress`
- Calcola XP guadagnati (10 XP per risposta corretta + bonus streak)
- Aggiorna livello usando formula: `level = √(XP / 100)`
- Incrementa streak se l'utente studia consecutivamente
- Log attività in `activity_log`

---

## 🎯 Come Funziona il Sistema XP

### Guadagnare XP
- **10 XP per risposta corretta** in un quiz
- **Bonus Streak**: +2 XP per ogni giorno di streak attivo
- **Achievement Bonus**: Alcuni trofei danno XP extra quando sbloccati

### Calcolo Livello
```
Livello = √(XP Totale / 100)

Esempi:
- 0-99 XP → Livello 1
- 100-399 XP → Livello 2
- 400-899 XP → Livello 3
- 900-1599 XP → Livello 4
- 10000 XP → Livello 10
```

### Streak System
- **Streak** = Giorni consecutivi con almeno 1 quiz completato
- Si azzera se salti un giorno
- Bonus XP aumenta con la streak (motivazione a studiare ogni giorno!)
- Traccia anche **longest_streak** (record personale)

---

## 🏆 Achievement Tier System

### Bronze (🥉) - Entry Level
- **Primo Quiz** - Completa il tuo primo quiz (+50 XP)
- **Studente Dedicato** - 10 quiz completati (+100 XP)
- **Costanza** - 3 giorni consecutivi (+50 XP)

### Silver (🥈) - Intermediate
- **Esperto** - 50 quiz completati (+300 XP)
- **Settimana Perfetta** - 7 giorni consecutivi (+150 XP)
- **Precisione** - 80% accuracy su 50+ quiz (+200 XP)
- **Livello 10** - Raggiungi livello 10 (+250 XP)

### Gold (🥇) - Advanced
- **Maestro** - 100 quiz completati (+500 XP)
- **Disciplina di Ferro** - 30 giorni consecutivi (+500 XP)
- **Perfezionista** - 90% accuracy su 100+ quiz (+400 XP)
- **Livello 20** - Raggiungi livello 20 (+500 XP)
- **Maestro Segnali** - 30 quiz segnali con 90% accuracy (+300 XP)
- **Maestro Precedenze** - 30 quiz precedenze con 90% accuracy (+300 XP)

### Platinum (💎) - Elite
- **Leggenda** - 500 quiz completati (+1000 XP)
- **Inarrestabile** - 95% accuracy su 100+ quiz (+800 XP)

---

## 📱 Wake Lock (Schermo Sempre Acceso)

### Come Funziona
- Si attiva **automaticamente** quando inizi un quiz
- Impedisce allo schermo di spegnersi durante il test
- Si disattiva automaticamente quando:
  - Completi il quiz
  - Tempo scaduto
  - Chiudi/minimizzi il browser

### Compatibilità
- ✅ Chrome/Edge Android 84+
- ✅ Safari iOS 16.4+
- ✅ Samsung Internet 14+
- ❌ Firefox (non supportato ancora)

### Cosa Vede l'Utente?
Niente! È trasparente. L'unico effetto è che lo schermo non va in standby.

---

## 👥 Leaderboard

### Funzionamento
- **Top 10 utenti** per XP totale
- Aggiornamento in tempo reale
- Evidenzia la posizione dell'utente corrente
- Mostra: Livello, Quiz Completati, XP Totale

### Privacy
- Gli utenti sono identificati solo da ID anonimo (prime 8 cifre)
- L'utente vede solo "Tu" per la propria posizione
- No nomi/email visibili pubblicamente

### Come Scalare la Classifica
1. Completa più quiz possibile
2. Mantieni la streak attiva (bonus XP)
3. Sblocca achievement per XP extra
4. Studia ogni giorno (XP si accumula nel tempo)

---

## 🎨 UI/UX Novità

### Nuova Sezione "Progresso" nel Dashboard
- **Card Livello** con barra progresso XP
- **4 Statistiche Card**: Streak, Quiz Completati, Precisione, Trofei
- **Griglia Achievement** con lock per trofei non sbloccati
- **Messaggio motivazionale** quando hai streak attivo

### Nuova Sezione "Classifica"
- **Leaderboard animato** con colori tier-based
- **Badge speciali** per Top 3 (oro, argento, bronzo)
- **Evidenziazione propria posizione**
- **Suggerimenti** per migliorare ranking

### Menu Dashboard Aggiornato
Ordine nuovo:
1. 🏠 Panoramica
2. 🏆 Progresso (NUOVO)
3. 👥 Classifica (NUOVO)
4. 🎯 Avvia Quiz
5. 🔄 Ripasso
6. 📊 Statistiche
7. 📝 Storico

---

## 🔧 Configurazione Tecnica

### Dipendenze Aggiunte
Nessuna! Tutte le feature usano:
- React hooks nativi
- API Web standard (Wake Lock)
- Supabase esistente
- Tailwind CSS (già presente)

### File Creati/Modificati

**Nuovi File:**
```
GAMIFICATION-SCHEMA.sql               # Schema database completo
components/GamificationProgress.tsx   # UI progresso XP/achievement
components/Leaderboard.tsx            # Classifica settimanale
hooks/useWakeLock.ts                  # Hook per Screen Wake Lock API
```

**File Modificati:**
```
lib/supabase.ts                       # + funzioni gamification
components/Dashboard.tsx              # + 2 nuove sezioni
components/QuizEngine.tsx             # + wake lock + check achievement
```

### Environment Variables
Nessuna nuova variabile richiesta! Usa le stesse di Supabase.

---

## 🐛 Troubleshooting

### Achievement Non Si Sbloccano
1. Verifica che il trigger `after_quiz_result_insert` esista nel DB
2. Controlla che la tabella `quiz_results` abbia nuovi record
3. Apri console browser, cerca errori API

### Leaderboard Vuoto
- Normale se nessuno ha ancora fatto quiz dopo lo schema update
- Fai almeno 1 quiz per comparire
- Controlla che `user_progress` abbia record

### Wake Lock Non Funziona
- Solo su HTTPS (non localhost HTTP)
- Verifica browser supportato (Chrome/Safari iOS 16.4+)
- Console: cerca "Wake Lock API not supported"

### Livello Non Sale
- Formula: `level = √(XP / 100)`
- Serve molto XP per livelli alti (es. livello 10 = 10000 XP)
- Controlla `user_progress.total_xp` nel DB

---

## 📈 Metriche Admin

### Query Utili per Monitoraggio

**Top 10 Utenti per Livello:**
```sql
SELECT user_id, level, total_xp, current_streak, total_quizzes_completed
FROM user_progress
ORDER BY level DESC, total_xp DESC
LIMIT 10;
```

**Achievement Più Popolari:**
```sql
SELECT a.name_it, COUNT(ua.id) as unlock_count
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
GROUP BY a.id, a.name_it
ORDER BY unlock_count DESC;
```

**Utenti con Streak Attivo:**
```sql
SELECT user_id, current_streak, last_activity_date
FROM user_progress
WHERE current_streak > 0
ORDER BY current_streak DESC;
```

**Attività Giornaliera:**
```sql
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
FROM activity_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🚦 Prossimi Step Suggeriti

### Fase 2 (Opzionale - Future Features)

1. **Notifiche Push PWA**
   - Promemoria giornaliero studio
   - Alert achievement sbloccato
   - Countdown esame

2. **Sistema Referral**
   - Codice invito univoco per utente
   - Reward: 1 mese premium gratis per 3 referral

3. **Gruppi Studio**
   - Crea/unisciti a gruppi
   - Chat tra membri
   - Sfide di gruppo

4. **Report PDF**
   - Esporta statistiche personalizzate
   - Grafico temporal progress
   - Lista achievement sbloccati

5. **Multilingua (i18n)**
   - Italiano (default)
   - Inglese
   - Spagnolo
   - File: `locales/it.json`, `locales/en.json`, etc.

---

## ✅ Checklist Deploy

Prima di mettere in produzione:

- [ ] Eseguito `GAMIFICATION-SCHEMA.sql` su Supabase production DB
- [ ] Verificato che trigger `after_quiz_result_insert` funzioni
- [ ] Testato almeno 1 quiz completo → check `user_progress` popolato
- [ ] Verificato achievement si sbloccano automaticamente
- [ ] Testato leaderboard mostra dati corretti
- [ ] Wake Lock testato su device mobile reale (non emulatore!)
- [ ] Dashboard mostra nuove sezioni "Progresso" e "Classifica"
- [ ] UI responsive su mobile/tablet/desktop
- [ ] Dark mode funziona su tutti i nuovi componenti
- [ ] Errors handling (try/catch) presenti nelle funzioni gamification

---

## 🎉 Conclusione

Queste feature trasformano il quiz da semplice strumento di studio a **esperienza gamificata coinvolgente**. Gli utenti sono motivati a:

✅ Studiare ogni giorno (streak bonus)
✅ Completare più quiz possibile (XP e livelli)
✅ Competere in classifica (leaderboard)
✅ Sbloccare tutti i trofei (achievement hunting)
✅ Migliorare accuratezza (achievement based on accuracy)

**Retention stimata:** +30-40% grazie a gamification (dati industry standard)

---

**Domande? Problemi?** Controlla troubleshooting sopra o apri issue su GitHub!
