# Portfolio IT — Documentazione

Sito portfolio statico in HTML/CSS/JS puro. Nessun framework, nessuna CDN.  
`marked.umd.js` è incluso localmente per il rendering dei writeup Markdown.

---

## Struttura del progetto

```
portfolio/
├── index.html                  # Pagina principale (modifica qui il contenuto)
├── css/
│   └── style.css               # Tutti gli stili (dark theme, variabili CSS)
├── js/
│   ├── main.js                 # Logica: terminal, writeup loader, modal, nav
│   └── marked.umd.js           # Parser Markdown (locale, v18+)
├── writeups/
│   ├── index.json              # Metadati di tutti i writeup (aggiungere qui)
│   ├── bandit/
│       ├── screenshots/
│   │   └── level-xx.md         # Esempio writeup Bandit
│   └── natas/
│       └── level-xx.md         # Esempio writeup Natas
└── README.md
```

---

## Personalizzazione

### 1. Dati personali

In `index.html`, sostituisci tutti i placeholder tra parentesi quadre:

| Placeholder            | Valore da inserire                  |
|------------------------|-------------------------------------|
| `[NOME COGNOME]`       | Il tuo nome completo                |
| `[USERNAME]`           | Il tuo username GitHub / LinkedIn   |
| `[EMAIL@ESEMPIO.IT]`   | La tua email di contatto            |

Aggiorna anche la bio nella sezione `hero-desc` e i link dei progetti.

### 2. Terminal animation

In `js/main.js`, funzione `initTerminal()`, modifica l'array `sequence`:

```js
const sequence = [
  { type: 'cmd',    text: 'whoami' },
  { type: 'output', text: 'Mario Rossi — IT Junior' },  // <- il tuo nome
  // ...
];
```

### 3. Aggiungere un writeup

**Passo 1** — Crea il file Markdown:
```
writeups/bandit/level-XX.md    # oppure natas/, o qualsiasi sottocartella
```

Struttura consigliata per ogni writeup:
```markdown
# Wargame Level XX → XX+1
**Obiettivo:** ...
## Soluzione
### 1. ...
```bash
comando
```
## Concetti chiave
...
```

**Passo 2** — Aggiungi la voce in `writeups/index.json`:
```json
{
  "id": "bandit-16",
  "title": "Bandit Level 16 → 17",
  "category": "bandit",
  "level": "16",
  "description": "Breve descrizione della tecnica usata.",
  "file": "writeups/bandit/level-16.md"
}
```

Il campo `category` determina il filtro nella sezione Writeups (`bandit`, `natas`, o qualsiasi altra stringa — verrà aggiunto automaticamente un pulsante filtro se lo aggiungi anche in `index.html`).

### 4. Aggiungere un progetto

In `index.html`, nella sezione `#projects`, duplica un `<article class="project-card">` e modifica titolo, descrizione, link e tag.

---

## Deploy

### Hosting statico (consigliato)

Il sito è un insieme di file statici: funziona su qualsiasi hosting che serva HTML.

Opzioni comuni:
- **Hostinger, Aruba, SiteGround** — carica i file via FTP/SFTP nella cartella `public_html/`
- **GitHub Pages** — gratis, perfetto per portfolio tecnici
- **Netlify / Vercel** — gratis, deploy automatico da Git

### Nota importante: `fetch()` e CORS

I writeup vengono caricati tramite `fetch()`. Questo richiede un server HTTP:

- ✅ Funziona su qualsiasi hosting (HTTP/HTTPS)
- ❌ **Non funziona** aprendo `index.html` direttamente dal filesystem locale (`file://`)

Per sviluppo locale usa un server minimale:

```bash
# Python 3 (nella cartella del progetto)
python3 -m http.server 8080
# poi apri http://localhost:8080
```

```bash
# oppure con Node.js (se installato)
npx serve .
```

---

## Dipendenze

| File               | Versione | Licenza | Uso                              |
|--------------------|----------|---------|----------------------------------|
| `marked.umd.js`    | v18+     | MIT     | Rendering Markdown nei writeup   |

Nessuna CDN. Nessun framework. Il sito funziona interamente offline una volta servito da un server HTTP.
