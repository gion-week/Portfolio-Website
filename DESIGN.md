---
name: Portfolio — Alberto Casalicchio
description: Portfolio dark, register brand, con estetica "terminale dell'operatore" e un unico accento teal-segnale.
colors:
  bg-void: "#0a0f14"
  bg-raised: "#0f161d"
  bg-panel: "#141d26"
  bg-elevated: "#1c2731"
  border: "#243441"
  border-light: "#35495a"
  ink: "#e8f0f5"
  ink-muted: "#93a4b3"
  ink-subtle: "#8090a0"
  signal-teal: "#2dd4bf"
  signal-teal-bright: "#5eead4"
  on-signal: "#061014"
  state-done: "#3fb950"
  state-wip: "#d8a657"
  state-alert: "#f0596b"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace"
    fontSize: "2.1rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
  title:
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.signal-teal}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.signal-teal-bright}"
    textColor: "{colors.on-signal}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-outline-hover:
    textColor: "{colors.signal-teal}"
  card:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  level-item:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px 32px"
  tag:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
---

# Design System: Portfolio — Alberto Casalicchio

## 1. Overview

**Creative North Star: "Il Terminale dell'Operatore"**

Il sistema è la workstation di un professionista della security, non la sua caricatura.
Fondo quasi-nero blu-profondo, superfici piatte e ordinate, un solo colore acceso — un
teal-segnale — che indica ciò che conta: stato, focus, interazione. La monospace marca le
superfici "di sistema" (navigazione, label, terminale, codice), il sans porta la lettura.
La densità è misurata: molto respiro attorno a poche cose dense. Nulla urla; la competenza
si legge dall'ordine, non dagli effetti.

Il tono nasce da `PRODUCT.md`: **prove non promesse**, **tecnico e credibile ma mai
caricaturale**. Ogni scelta visiva serve a far apparire il lavoro affidabile a un recruiter
in pochi secondi e verificabile in profondità a chi apre i writeup.

Il sistema **rifiuta** due derive esplicite: il portfolio-template da bootcamp (card
identiche ripetute, hero-metric, stock photo, struttura anonima) e l'estetica hacker
caricaturale (verde-Matrix, teschi, font l33t, ammiccamenti da film). Il terminale qui è
uno strumento reale, non un costume.

**Key Characteristics:**
- Dark proprio (blu-profondo `#0a0f14`), non il grigio-GitHub di default.
- Un unico accento — Signal Teal `#2dd4bf` — speso con parsimonia.
- Monospace per il "sistema", sans per la lettura.
- Piatto a riposo; la profondità è una risposta all'interazione.
- Accessibilità WCAG 2.1 AA come vincolo permanente, non come rifinitura.

## 2. Colors

Near-black blu-grigi come tela, un solo teal come segnale, tre colori di stato riservati
allo stato.

### Primary
- **Signal Teal** (`#2dd4bf`): l'unico colore acceso del sistema. Link, focus-ring, bordi
  in hover, cursore del terminale, label tecniche, numeri di livello, indicatori "attivo".
  Si usa dove serve un segnale, mai come riempimento.
- **Signal Teal Bright** (`#5eead4`): solo per lo stato hover del bottone primario.
- **On Signal** (`#061014`): testo sopra il teal pieno (il bianco fallirebbe, 1.86:1).

### Secondary
Colori di **stato**, mai decorativi:
- **State Done** (`#3fb950`): completato (badge, tag, dot del terminale). È un verde di
  stato, non un verde-Matrix.
- **State WIP** (`#d8a657`): in corso.
- **State Alert** (`#f0596b`): errori/avvisi.

### Neutral
- **Ink** (`#e8f0f5`): testo primario e titoli.
- **Ink Muted** (`#93a4b3`): testo secondario, descrizioni (≥5.9:1 su ogni bg).
- **Ink Subtle** (`#8090a0`): metadata, filename, footer — la soglia di leggibilità.
- **Backgrounds** (`bg-void #0a0f14` → `bg-raised #0f161d` → `bg-panel #141d26` →
  `bg-elevated #1c2731`): stratificazione tonale della profondità, dal fondo alle card ai
  container in hover.
- **Border** (`#243441`) / **Border Light** (`#35495a`): divisori e contorni; il border
  light segnala interattività (bottoni outline).

### Named Rules
**The One-Signal Rule.** Il teal è segnale, non superficie. Se copre più di una frazione
minima di una schermata, non è più un segnale: è rumore. Parsimonia deliberata.

**The Signal-Not-Costume Rule.** Il verde è uno stato (`#3fb950`), mai un verde-Matrix; il
teal è diagnostico, non neon. Il colore comunica competenza, non appartenenza a un genere.

## 3. Typography

**Body Font:** system sans (`-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui`).
**System/Label Font:** monospace (`ui-monospace, 'Cascadia Code', 'Fira Code', Menlo,
Consolas`).

**Character:** una famiglia per leggere, una per "segnalare sistema". Il sans regge la
prosa (bio, descrizioni, writeup); la monospace marca tutto ciò che è tecnico e strutturale
— navigazione, label, titoli di sezione, terminale, codice — dando credibilità senza costume.

### Hierarchy
- **Display** (sans, 700, `clamp(2rem, 1.4rem + 2.4vw, 2.6rem)`, lh 1.15, ls -0.02em):
  nome nell'hero. Unico uso del sans in grande, con `text-wrap: balance`.
- **Headline** (mono, 700, 2.1rem, lh 1.1): titolo del wargame nella modal dei writeup.
- **Title** (mono, 700, 1.5rem, ls -0.01em): heading di sezione (`About`, `Skills`…).
- **Body** (sans, 400, 1rem, lh 1.65): testo di lettura. Colonne ≤ ~65–75ch (max-width
  440–680px sui blocchi di testo).
- **Label** (mono, 600, ~0.7–0.8rem, ls 0.04–0.28em, spesso uppercase): nav-link, tag,
  categoria del wargame, titoli delle skill-card, numeri di livello.

### Named Rules
**The Mono-for-System Rule.** La monospace marca le superfici di sistema (nav, terminale,
label, codice, metadata), non la prosa. Il corpo del testo resta sans per leggibilità: mono
come voce tecnica, non come intera pagina.

## 4. Elevation

Piatto per default. La profondità non è ambientale ma una **risposta all'interazione**: le
superfici sono piatte a riposo e si sollevano solo in hover/focus, con un'ombra **tinta del
segnale** (accent-glow), mai un drop-shadow grigio. Due superfici fanno eccezione
deliberata e portano profondità reale a riposo — sono i due componenti "firma": la
**terminal window** dell'hero e le **modali**.

### Shadow Vocabulary
- **Hover-lift** (`box-shadow: 0 10px 30px -16px var(--accent-glow)`): card, skill-card,
  level-item, contact-item in hover (abbinato a `translateY(-2px)`).
- **Button-glow** (`0 6px 20px -6px var(--accent-glow)` / `0 4px 18px -8px …`): stato hover
  dei bottoni.
- **Terminal** (`0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,212,191,0.08)`): la finestra
  terminale dell'hero — profonda, con un anello teal impercettibile.
- **Modal** (`0 32px 80px rgba(0,0,0,0.6)`): wargame-panel e modal-panel dei writeup.

### Named Rules
**The Flat-Until-Touched Rule.** Le superfici sono piatte a riposo. L'ombra compare come
risposta a hover/focus ed è tinta di teal, mai grigia. Le uniche superfici profonde a
riposo (terminale, modali) sono scelte, non default.

## 5. Components

Carattere: **sobri e reattivi**. Bordo netto 1px, reazione all'accento in hover (bordo +
glow + lift di 2px), nessuna decorazione superflua.

### Buttons
- **Shape:** angoli appena arrotondati (`4px`, radius-sm); font monospace.
- **Primary:** fondo Signal Teal, testo On Signal (`8px 16px`), peso 600.
- **Outline:** trasparente, testo Ink, bordo Border Light.
- **Hover / Focus:** primary → teal bright + button-glow; outline → bordo e testo teal,
  tint di sfondo (`accent-dim`) + glow. Focus-ring 2px teal, offset 2px.

### Cards / Containers
- **Corner Style:** `8px` (radius-md); i pannelli grandi e le modali `12px` (radius-lg).
- **Background:** skill-card su `bg-raised`, project-card e level-item su `bg-panel`.
- **Border:** 1px pieno `border`; nessuna side-stripe.
- **Shadow Strategy:** piatto a riposo → hover-lift (vedi Elevation).
- **Hover:** bordo teal + `translateY(-2px)` + accent-glow.
- **Internal Padding:** `24px` (card), `24px 32px` (level-item).

### Tags / Badges
- **Style:** monospace minuscolo; tag su `bg-elevated` con bordo `border` (radius-sm);
  badge di stato a pillola (radius-pill) con tint rgba del colore di stato + bordo coordinato.
- **State:** varianti `done` (verde), `wip`/`learning` (giallo) — solo stato, mai colore
  decorativo.

### Navigation
- **Style:** link monospace `0.82rem`, tracked; colore Ink Muted → Ink con **bordo inferiore
  teal** in hover/active. Sticky header con `backdrop-filter: blur(12px)` su fondo semitrasp.
- **Mobile:** hamburger a 3 barre (anima in X); menu a colonna; ogni voce ≥44px di target.

### Level Item (signature)
Card centrata della lista livelli: pillola-numero monospace (teal su `accent-dim`), titolo
Ink, descrizione Ink Muted. Hover come le card. È l'unità della navigazione writeup: identica
per tutti i wargame (vedi vincolo in CLAUDE.md).

### Terminal Window (signature)
Finestra dell'hero: titlebar con tre dot (rosso/giallo/verde), filename monospace, corpo
monospace popolato via JS, cursore teal lampeggiante con glow. Comunica "ambiente reale"
senza macchietta.

### Named Rules
**The 1px-Border Rule.** I container usano un bordo pieno da 1px (più, se serve, un tint di
sfondo). Le side-stripe colorate `border-left`/`border-right` > 1px sono vietate.

**The 44px-Target Rule.** Ogni elemento interattivo ha ≥44×44px di area cliccabile, anche
quando l'icona è più piccola (`min-width/height` + flex center).

## 6. Do's and Don'ts

### Do:
- **Do** usare Signal Teal `#2dd4bf` come **unico** accento, con parsimonia, su ciò che è
  segnale (link, focus, hover, stato, label tecniche).
- **Do** contornare i container con un bordo pieno 1px (+ eventuale tint di sfondo).
- **Do** usare la monospace per le superfici di sistema (nav, label, terminale, codice) e il
  sans per la lettura.
- **Do** tenere il testo di lettura sopra la soglia di contrasto: normale ≥4.5:1, `Ink
  Subtle` non sotto `#848d97`; testo grande ≥3:1.
- **Do** garantire target ≥44×44px e un `:focus-visible` teal (outline 2px, offset 2px) su
  ogni elemento interattivo.
- **Do** far comparire l'ombra come risposta a hover/focus, tinta di teal (accent-glow).
- **Do** mantenere il blocco `prefers-reduced-motion` e animare solo `transform`/`opacity`.

### Don't:
- **Don't** ricadere nel **portfolio-template da bootcamp**: card identiche ripetute,
  hero-metric, stock photo, struttura indistinguibile da mille altri portfolio.
- **Don't** scivolare nell'**estetica hacker caricaturale**: verde-Matrix, teschi, font
  l33t, ammiccamenti da film. Il terminale è competenza reale, non costume.
- **Don't** usare `border-left`/`border-right` colorato > 1px come accento decorativo.
- **Don't** usare testo in gradiente (`background-clip: text`) o glassmorphism decorativo.
- **Don't** animare proprietà di layout; niente parallax/effetti che distraggono dal contenuto.
- **Don't** scurire il testo di lettura "per eleganza" sotto la soglia di contrasto.
- **Don't** spargere il teal come riempimento: se metà schermata è teal, non è più un segnale.
