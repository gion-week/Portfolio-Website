# Design — Workflow di pubblicazione writeup (sync-writeups)

Data: 2026-07-08
Repo: `gion-week/portfolio`
Stato: approvato in brainstorming, in attesa di review della spec

## 1. Contesto e problema

Il portfolio è un sito statico (HTML/CSS/JS vanilla) su Vercel. I writeup dei
wargame sono resi a runtime da `js/main.js`, che fetcha `writeups/index.json` e
renderizza i `.md` con `marked`. L'indice `index.json` è oggi mantenuto a mano.

I writeup sono autorati in repo GitHub separate, una per wargame:

- `gion-week/natas-overthewire` — layout **nested**: `level-XX/README.md` +
  `level-XX/screenshots/`. Livelli 00-11 autorati; 12-34 cartelle vuote di
  scaffolding. Ha `_template/README.md` e un file `CLAUDE` con le convenzioni.
- `gion-week/bandit-overthewire` — completo, **fuori scope** per ora.

Il portfolio contiene invece una copia **flat**: `writeups/natas/level-XX.md` +
cartella condivisa `writeups/natas/screenshots/`. Oggi, pubblicare un livello
richiede a mano: copiare il README rinominandolo, spostare gli screenshot nella
cartella condivisa e aggiungere un oggetto in `index.json`. Questo attrito è il
problema da eliminare.

### Fatti verificati che rendono la soluzione semplice

- I riferimenti immagine nei `.md` sono **identici** tra repo sorgente e
  portfolio (es. `./screenshots/10-filtered.png` in entrambi). Funzionano in
  entrambi i layout perché i filename degli screenshot sono prefissati col
  numero di livello (`XX-…`), quindi sono globalmente unici e non collidono
  nella cartella condivisa. `js/main.js` calcola `basePath` dinamicamente dal
  campo `file` di `index.json` (righe ~266 e ~275), quindi il ref relativo
  risolve correttamente sia nested sia flat. **La copia sorgente→portfolio non
  richiede alcuna modifica al contenuto del README.**
- Gli H1 dei `.md` combaciano esattamente con i `title` di `index.json`
  (es. `# Bandit Level 0 → 1` → `Bandit Level 0 → 1`), sia Bandit sia Natas.
  Quindi il `title` è derivabile dall'H1 senza alterare voci esistenti.
- Di tutti i campi di `index.json` (`id`, `title`, `category`, `level`,
  `description`, `file`), l'unico non derivabile da path/H1 è `description`
  (frase editoriale breve, distinta dal paragrafo `## Obiettivo`).

## 2. Obiettivo: workflow finale

Per ogni nuovo livello:

1. Autorare `level-XX/README.md` (+ screenshot) nel repo del wargame,
   includendo una riga di metadata (vedi §4).
2. Nel repo portfolio, lanciare un comando: `python tools/sync_writeups.py`.
3. Lo script copia il livello dal repo sorgente nel portfolio e rigenera
   `index.json`.
4. `git commit` + `git push` sul portfolio.
5. Vercel deploya in automatico; il livello compare sul sito.

Lo script legge il **working copy locale** del repo sorgente (fratello del
portfolio: `../natas-overthewire`), non GitHub. Il push del repo sorgente serve
solo allo storico di quel repo ed è indipendente dalla pubblicazione sul sito.

## 3. Approccio scelto

**Script di sync locale in Python**, eseguito manualmente prima del commit del
portfolio. Alternative scartate:

- GitHub Action: introduce infra CI, commit automatici nel repo, permessi token
  e possibile doppio deploy Vercel. Troppa complessità.
- Git submodule/subtree: richiede migrazione flat→nested dei livelli esistenti,
  aggiunge attrito submodule su Vercel, e `index.json` andrebbe comunque
  generato. Guadagno marginale rispetto allo script.

Lo script è un **tool di authoring locale**, non un build step Vercel: il sito
resta 100% statico, `vercel.json` non cambia, e non si introducono
`package.json`, `node_modules` o build pipeline (coerente col CLAUDE.md del
portfolio).

## 4. Convenzione metadata (fonte unica della description)

In cima a ogni `README.md`, un **commento HTML**:

```
<!-- portfolio-desc: Command injection con filtro su caratteri speciali -->
```

Motivazione della scelta (commento HTML vs front-matter YAML): `marked` non
parsa il front-matter, quindi un blocco `---…---` verrebbe renderizzato come
contenuto visibile sul sito. Un commento HTML è invece invisibile sia nel render
di `marked` sia nell'anteprima GitHub, e viene copiato verbatim nel portfolio
senza doverlo toccare.

Modifiche conseguenti nel repo `natas-overthewire`:

- `_template/README.md`: aggiungere la riga `portfolio-desc` con un placeholder.
- File `CLAUDE`: documentare che ogni nuovo README deve includere la riga.

I livelli natas 00-10, già pubblicati, **non** vanno ritoccati: le loro
description restano preservate dall'`index.json` esistente (vedi §5, fase 2).

## 5. Specifica dello script `tools/sync_writeups.py`

Vive nel repo portfolio. Nessuna dipendenza esterna (solo stdlib:
`json`, `pathlib`, `re`, `shutil`, `sys`).

### Configurazione (in testa allo script)

```python
SOURCES = [
    {"category": "natas", "repo_path": "../natas-overthewire"},
]
CATEGORY_ORDER = ["bandit", "natas"]
```

`repo_path` è relativo alla **root del portfolio**. Tutti i path (sorgenti e
`writeups/`) sono risolti rispetto alla root del portfolio (la cartella padre di
`tools/`, ricavata da `Path(__file__).resolve().parent.parent`),
indipendentemente dalla CWD da cui si lancia lo script. Bandit non è tra le
sorgenti (già presente nel portfolio, non viene sincronizzato). Aggiungere in
futuro `bandit-overthewire` significa solo aggiungere una voce a `SOURCES`.

### Fase 1 — Sync contenuti

Per ogni sorgente in `SOURCES`, per ogni cartella `level-XX/` del repo sorgente
che contiene un `README.md`:

- copia `level-XX/README.md` → `writeups/{category}/level-XX.md` (sovrascrive);
- copia ogni file in `level-XX/screenshots/` (escluso `.gitkeep`) →
  `writeups/{category}/screenshots/` (sovrascrive).

Le cartelle di scaffolding senza `README.md` (natas 12-34) vengono saltate.
Nessuna modifica al contenuto dei file copiati.

### Fase 2 — Rigenerazione di `index.json`

Scandisce tutti i `writeups/{category}/level-*.md` presenti nel portfolio
(quindi include Bandit, che così resta nel manifest). Per ogni file costruisce
una voce:

- `id` = `{category}-{XX}` (es. `natas-11`)
- `category` = nome della sottocartella sotto `writeups/`
- `level` = `XX` (stringa a due cifre, dal filename `level-XX.md`)
- `file` = `writeups/{category}/level-XX.md`
- `title` = testo dell'H1 (prima riga `^#\s+(.+)$`), senza `# `
- `description`, con questa precedenza:
  1. contenuto del commento `<!--\s*portfolio-desc:\s*(.+?)\s*-->` nel `.md`, se presente;
  2. altrimenti, valore preso per `id` dall'`index.json` esistente (preserva Bandit e natas 00-10);
  3. altrimenti: **errore bloccante** (vedi Error handling).

Ordinamento delle voci: per indice di `CATEGORY_ORDER`, poi per `level` come
intero. Riproduce l'ordine attuale (bandit 00-32, poi natas 00-…).

Scrittura: `json.dump(entries, f, ensure_ascii=False, indent=2)` + newline
finale. Ordine delle chiavi in ogni oggetto: `id`, `title`, `category`,
`level`, `description`, `file` (identico al file attuale).

### Error handling

- Se una voce **nuova** (id non presente nell'`index.json` esistente) non ha né
  commento `portfolio-desc` né description pregressa, lo script stampa un errore
  che elenca gli id problematici ed esce con codice ≠ 0 **senza scrivere**
  `index.json` (fail-safe: non si pubblica una voce senza descrizione).
- Se un `repo_path` configurato non esiste, errore chiaro ed exit ≠ 0.

### Proprietà

- **Idempotente**: rilanciarlo senza nuovi livelli riproduce lo stesso
  `index.json` e ricopia file identici.
- **Non distruttivo**: non cancella né rinomina nulla; solo copia e sovrascrive
  i file gestiti e riscrive `index.json`.
- **Nessuna operazione git**: commit e push restano manuali (controllo
  dell'utente sui commit del portfolio).

## 6. File toccati

Repo portfolio:

- `tools/sync_writeups.py` (nuovo).
- `CLAUDE.md`: documentare che `index.json` è **generato**, non editato a mano;
  come si lancia il sync; la convenzione `portfolio-desc`. Aggiornare la sezione
  "Struttura" se serve.

Repo natas-overthewire:

- `_template/README.md`: riga `portfolio-desc` con placeholder.
- `CLAUDE`: documentare la convenzione.
- `level-11/README.md`: aggiungere la riga `portfolio-desc` (primo caso reale).

## 7. Primo caso reale: natas-11

Validazione end-to-end: aggiungere `portfolio-desc` al README di `level-11` nel
repo natas, lanciare il sync, verificare che `writeups/natas/level-11.md` e i 5
screenshot (già presenti nel repo sorgente) compaiano nel portfolio e che
`index.json` contenga la voce `natas-11` in coda alle natas.

## 8. Criteri di successo

- Eseguito sullo stato attuale del repo (senza aggiungere livelli nuovi oltre a
  natas-11), `git diff` su `writeups/natas/level-00…10.md`, sui relativi
  screenshot e sulle voci Bandit/natas 00-10 di `index.json` è **vuoto**
  (nessun churn su contenuti e voci esistenti).
- Dopo il sync di natas-11: la voce `natas-11` è presente in `index.json`, il
  livello è navigabile sul sito e i suoi screenshot si vedono.
- Rilanciare lo script una seconda volta non produce alcun diff (idempotenza).

## 9. Non-goals (YAGNI)

- Niente GitHub Action, niente submodule/subtree.
- Niente sync di Bandit (già completo); resta solo preservato in `index.json`.
- Niente gestione di cancellazioni o rinomine di livelli.
- Niente commit/push automatici.
- Niente modifiche a `js/main.js`, `css/style.css` o `vercel.json`.
