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

## Cosa NON fare
- Non aggiungere package.json, node_modules o build pipeline
- Non toccare vercel.json senza chiedere
- Non rinominare o spostare file senza chiedere