# 🌐 Configurazione Dominio Personalizzato

## Dominio Attivo

**Dominio principale**: [http://driverquizpa.com](http://driverquizpa.com)

Il sito è stato configurato con un dominio personalizzato su Netlify.

## 🔧 Configurazione su Netlify

### 1. Aggiunta Dominio

1. Netlify Dashboard → **Domain Management**
2. Click **Add custom domain**
3. Inserisci: `driverquizpa.com`
4. Verifica DNS configuration

### 2. SSL/HTTPS

Netlify ha automaticamente configurato:
- ✅ Certificato SSL Let's Encrypt
- ✅ HTTPS automatico
- ✅ Redirect da HTTP a HTTPS
- ✅ Redirect da www a non-www (o viceversa)

### 3. DNS Configuration

Se acquistato tramite Netlify DNS:
- ✅ Nameservers configurati automaticamente
- ✅ Record A/CNAME creati automaticamente
- ✅ Propagazione DNS gestita da Netlify

## 🔗 URL del Sito

### Produzione
- **Dominio principale**: http://driverquizpa.com
- **Con HTTPS**: https://driverquizpa.com (auto-redirect)

### Backup Netlify
- **URL Netlify**: Ancora disponibile come fallback
- Redirect automatico al dominio personalizzato

## 🎯 Link Condivisibili

### Profili Pubblici
Formato: `http://driverquizpa.com/profile/[userId]`

Esempio: `http://driverquizpa.com/profile/a6627320-e650-46cd-a928-fc3824a8697b`

### Referral Links
Formato: `http://driverquizpa.com/login?ref=[referralCode]`

Esempio: `http://driverquizpa.com/login?ref=QUIZ123456`

### Pagine Principali
- Homepage: `http://driverquizpa.com`
- Login: `http://driverquizpa.com/login`
- Dashboard: `http://driverquizpa.com/dashboard`
- Pricing: `http://driverquizpa.com/pricing`
- Admin: `http://driverquizpa.com/admin`

## 🔄 Aggiornamenti nel Codice

Il codice usa già `window.location.origin` quindi si adatta automaticamente:

### PublicProfile.tsx
```typescript
const baseUrl = window.location.origin;
setProfileUrl(`${baseUrl}/profile/${user.id}`);
```

### ReferralSystem.tsx
```typescript
const referralUrl = `${window.location.origin}/login?ref=${referralData?.code}`;
```

**Nessuna modifica al codice necessaria** - tutto funziona automaticamente con il nuovo dominio! ✅

## 📊 Monitoraggio

Netlify Analytics traccia automaticamente:
- Visite al dominio personalizzato
- Performance del sito
- Uptime e disponibilità
- Bandwidth usage

## 🆘 Troubleshooting

### Dominio non raggiungibile
1. Verifica DNS propagation: https://dnschecker.org
2. Check Netlify DNS configuration
3. Wait 24-48h per propagazione completa

### Certificato SSL non valido
1. Netlify → Domain settings
2. Click "Renew certificate"
3. Wait pochi minuti per il rinnovo

### Redirect non funzionante
1. Check redirects in `netlify.toml`
2. Verifica Netlify domain settings
3. Clear browser cache
