# 🚀 SCRIPT DI IMPORTAZIONE DOMANDE

## Panoramica

Lo script `import-questions.js` automatizza l'importazione delle domande dai file TXT al database Supabase.

## Prerequisiti

1. File TXT nella root del progetto:
   - `Punto C) del Regolamento-2024-04-16.txt`
   - `Punti A) e B) del Regolamento-2024-04-16 (1).txt`
   - `Punto F) del Regolamento-2024-05-08.txt`
   - `Punti D) e E) del Regolamento-2024-04-16.txt`

2. Database Supabase configurato con tabella `questions`

3. Credenziali in `.env.local`

## Installazione

```bash
# Installa dotenv per leggere .env.local
npm install dotenv
```

## Utilizzo

```bash
# Assicurati che i file TXT siano nella cartella corretta
# Poi esegui:
node import-questions.js
```

## Formato File TXT Atteso

```
1) DOMANDA?
A [ ] Risposta A
B [*] Risposta B (corretta - asterisco)
C [ ] Risposta C

2) ALTRA DOMANDA?
A [*] Risposta corretta
B [ ] Risposta sbagliata
```

## Mappatura Categorie

- `Punto C` → Toponomastica Palermo
- `Punti A) e B)` → Toponomastica Sicilia
- `Punto F)` → Legislazione Siciliana
- `Punti D) e E)` → Codice della Strada / Normativa Nazionale

## Output Atteso

```
🚀 Inizio importazione domande...

📖 Parsing file: ./Punto C) del Regolamento-2024-04-16.txt
✅ Trovate 40 domande

📖 Parsing file: ./Punti A) e B) del Regolamento-2024-04-16 (1).txt
✅ Trovate 39 domande

📊 Totale domande da importare: 280

💾 Inserimento di 280 domande nel database...
✅ Inseriti 50/280
✅ Inseriti 100/280
...
✅ Inseriti 280/280

✅ IMPORTAZIONE COMPLETATA!
✅ Domande inserite: 280
❌ Errori: 0
```

## Troubleshooting

### File non trovato
→ Sposta i file TXT nella root del progetto

### Errore Supabase connection
→ Verifica credenziali in `.env.local`

### Parsing errors
→ Verifica che il formato TXT sia corretto (vedi sopra)

## Note

- Lo script inserisce in batch di 50 domande per performance
- Salta automaticamente commenti e linee vuote
- Gestisce correttamente gli apostrofi nelle risposte
