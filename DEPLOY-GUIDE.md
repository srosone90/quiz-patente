# 🚀 GUIDA DEPLOY SEMPLICE

## COSA HO PREPARATO
✅ File configurazione Netlify (netlify.toml)
✅ .gitignore già presente e corretto
✅ Progetto pronto per il deploy

---

## 📋 3 STEP PER ANDARE ONLINE

### STEP 1 - Carica su GitHub (Copia/Incolla questi comandi)

Apri il terminale PowerShell nella cartella del progetto e copia/incolla:

```powershell
# Inizializza Git
git init

# Aggiungi tutti i file
git add .

# Crea primo commit
git commit -m "Ready for deploy"
```

**Poi vai su GitHub**:
1. Vai su https://github.com/new
2. Nome repository: `quiz-patente` (o come vuoi)
3. Lascia tutto vuoto, clicca "Create repository"
4. Copia i comandi che GitHub ti mostra (simili a questi):

```powershell
git remote add origin https://github.com/TUO-USERNAME/quiz-patente.git
git branch -M main
git push -u origin main
```

5. Incolla nel terminale e premi Invio

---

### STEP 2 - Deploy su Netlify (3 click)

1. Vai su https://app.netlify.com/signup
2. Clicca "Import from Git"
3. Scegli GitHub → Autorizza → Seleziona repository `quiz-patente`
4. Netlify rileverà automaticamente Next.js
5. Clicca "Deploy site"

**ATTENDI 2-3 minuti** → Sito online!

---

### STEP 3 - Aggiungi Variabili Ambiente (IMPORTANTE)

Nel pannello Netlify appena deployato:

1. Vai su **Site settings** → **Environment variables**
2. Clicca **Add a variable**
3. Aggiungi queste 2 variabili:

**Variabile 1**:
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://dsxzqwicsggzyeropget.supabase.co
```

**Variabile 2**:
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Vai su Supabase → Settings → API → copia "anon public"]
```

4. Clicca **Save**
5. Netlify farà automaticamente **redeploy** (2 minuti)

---

## ✅ FATTO!

Il tuo sito sarà online su: `https://NOME-CASUALE.netlify.app`

### Come accedere da altri dispositivi:

**Esempio URL**: `https://quiz-patente-123.netlify.app`

- **Da smartphone**: Apri browser → `https://quiz-patente-123.netlify.app/admin`
- **Da tablet**: Stesso URL → Login → Dashboard completa
- **Da altro PC**: Stesso URL → Tutto funziona

---

## 🔧 CONFIGURAZIONE EXTRA (Opzionale)

### Cambia nome sito Netlify:
1. Site settings → Site details → Change site name
2. Scegli nome: es. `quiz-patente-demo`
3. Nuovo URL: `https://quiz-patente-demo.netlify.app`

### Aggiungi Dominio Custom:
1. Site settings → Domain management
2. Add custom domain → Inserisci tuo dominio
3. Segui istruzioni DNS (24-48h propagazione)

---

## ⚠️ IMPORTANTE - Dopo Deploy

### Configura URL su Supabase:
1. Vai su Supabase Dashboard
2. Authentication → URL Configuration
3. **Site URL**: Cambia in `https://TUO-SITO.netlify.app`
4. **Redirect URLs**: Aggiungi `https://TUO-SITO.netlify.app/**`
5. Save

Questo permette login e registrazione dal sito live!

---

## 🆘 PROBLEMI COMUNI

**"Build failed"**:
- Verifica variabili ambiente aggiunte correttamente
- Controlla log build in Netlify per errori

**"Login non funziona"**:
- Verifica URL redirect su Supabase
- Controlla che SUPABASE_ANON_KEY sia corretta

**"Sito bianco/errore"**:
- Apri console browser (F12)
- Verifica errori JavaScript
- Controlla variabili ambiente su Netlify

---

## 📞 SUPPORTO

Se qualcosa non funziona, dimmi quale step ti blocca!
