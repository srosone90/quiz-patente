# 🚗 Logo e Favicon - Istruzioni

## Logo Implementato ✅

Il logo è stato aggiunto con successo in formato SVG:
- `/public/logo.svg` (200x200px) - Logo principale
- `/public/logo-icon.svg` (512x512px) - Icona PWA

## Favicon Ottimale

Per una qualità ottimale del favicon, puoi convertire il logo SVG in formato ICO:

### Opzione 1: Online (Consigliato)
1. Vai su https://convertio.co/it/svg-ico/
2. Carica `/public/logo-icon.svg`
3. Scarica il file `favicon.ico`
4. Sostituisci `/public/favicon.ico` con il nuovo file

### Opzione 2: GIMP (Software gratuito)
1. Scarica GIMP: https://www.gimp.org/
2. Apri `logo-icon.svg` in GIMP
3. Vai su File → Export As
4. Nome file: `favicon.ico`
5. Seleziona formato `.ico`
6. Dimensioni consigliate: 48x48, 32x32, 16x16 (multi-size ICO)

### Opzione 3: ImageMagick (Command line)
```bash
magick convert logo-icon.svg -define icon:auto-resize=16,32,48 favicon.ico
```

## Logo Già Funzionante

Anche senza convertire in ICO, il logo SVG funziona già perfettamente su:
✅ Tutti i browser moderni
✅ Progressive Web App
✅ Open Graph (social media)
✅ Email e condivisioni

Il file `favicon.ico` esistente è solo un fallback per browser vecchi (IE11).

## Dove Appare il Logo

1. **Header** - Tutte le pagine (eccetto login)
2. **Browser Tab** - Favicon
3. **Bookmark** - Icona segnalibri
4. **PWA Home Screen** - Quando installato come app
5. **Social Media** - Anteprime Facebook, WhatsApp, LinkedIn
6. **Google Search** - Nei risultati di ricerca

## Personalizzazione

Se vuoi modificare il logo, edita i file SVG:
- `/public/logo.svg` - Logo con testo
- `/public/logo-icon.svg` - Solo icona circolare

I file SVG sono vettoriali e possono essere modificati con:
- Inkscape (gratuito)
- Adobe Illustrator
- Figma
- VS Code (come testo)
