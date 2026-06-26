# Portfolio — Alberto Casalicchio

## Cos'è questo progetto
Sito portfolio personale statico (HTML/CSS/JS vanilla, nessun framework).
Deployment su Vercel. Funge da curriculum e da raccolta di CTF writeups.

## Struttura
index.html          # entrypoint unico
css/style.css       # tutto lo stile del sito
js/main.js          # logica del sito (animazioni, caricamento writeups)
js/marked.umd.js    # libreria per render Markdown — NON modificare
assets/             # immagini/risorse generali del sito
writeups/
  index.json        # indice dei writeups (aggiornare quando si aggiunge un livello)
  bandit/           # writeup Bandit OverTheWire (level-00.md … level-32.md)
  bandit/screenshots/
  natas/            # writeup Natas OverTheWire (level-00.md … level-10.md)
  natas/screenshots/

## Regole ferme
- Nessuna dipendenza esterna oltre a marked.umd.js già presente
- Nessun framework JS o CSS (no React, no Bootstrap, no Tailwind)
- I file PNG in screenshots/ sono screenshot dei wargame: non toccarli mai
- marked.umd.js non va mai modificato
- Il sito deve restare deployabile su Vercel senza build step

## Convenzioni writeup
- I file .md dei writeup seguono una struttura fissa con sezioni definite
- Prima di modificare un writeup esistente, leggere almeno un file già completato
  per capire il formato in uso

## Interfaccia di navigazione writeups (vincolante)
- L'interfaccia attuale per navigare wargame e livelli è quella definitiva e va
  riusata identica per tutti i wargame e livelli che verranno aggiunti man mano.
- Flusso: pulsante wargame (generato da `renderWargameButtons` in `js/main.js`
  in base alle categorie di `writeups/index.json`) → modal con header centrato
  (categoria + nome wargame) e lista di livelli come card centrate → click su un
  livello che apre il writeup in un secondo modal.
- Aggiungere un nuovo wargame/livello significa SOLO aggiungere le voci in
  `writeups/index.json` (e la descrizione in `WARGAME_INFO` dentro `js/main.js`
  per i nuovi wargame): NON creare layout, modal o stili alternativi.
- Le classi/stili coinvolti (`.wargame-modal`, `.wargame-toolbar`,
  `.wargame-modal-category`, `.wargame-modal-title`, `.wargame-levels`,
  `.level-item*`) sono condivisi da tutti i wargame: modificarli cambia l'aspetto
  ovunque, quindi va fatto solo se si vuole un cambiamento globale.

## Convenzioni di design e accessibilità (da audit Impeccable)
Standard da rispettare in ogni modifica a HTML/CSS. Derivano dall'audit Impeccable
del progetto; applicarli a qualsiasi nuovo componente o sezione.

- **Focus da tastiera**: ogni elemento interattivo (link, button, card cliccabili)
  deve avere un `:focus-visible` percepibile — convenzione del progetto:
  `outline: 2px solid var(--accent); outline-offset: 2px`. (WCAG 2.4.7)
- **Contrasto**: testo normale ≥ 4.5:1, testo grande (≥18px o bold ≥14px) ≥ 3:1,
  rispetto al proprio sfondo. `--text-2` non deve scendere sotto `#848d97` (il
  valore minimo che resta ≥4.5:1 su `--bg-0/1/2`). Non usare colori più scuri per
  testo destinato alla lettura. (WCAG 1.4.3)
- **Touch target**: elementi interattivi ≥ 44×44px di area cliccabile, anche se
  l'icona/testo è più piccolo (usare `min-width/min-height` + flex center). (WCAG 2.5.5)
- **Niente side-stripe**: vietato `border-left`/`border-right` colorato > 1px come
  accento decorativo (tell tipico). Usare bordo pieno 1px + tint di sfondo.
- **Token-first**: usare le variabili CSS in `:root`. Evitare colori hard-coded;
  se serve un colore ricorrente, definirlo come token.
- **Motion**: mantenere il blocco `prefers-reduced-motion`. Animare solo
  `transform`/`opacity`; niente animazioni su proprietà di layout.

## Cosa NON fare
- Non aggiungere package.json, node_modules o build pipeline
- Non toccare vercel.json senza chiedere
- Non rinominare o spostare file senza chiedere