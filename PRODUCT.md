# Product

## Register

brand

## Users

**Pubblico primario: recruiter e responsabili HR** che valutano candidature per ruoli
IT/cybersecurity entry-level. Contesto d'uso: screening rapido, spesso da desktop e a
volte da mobile, con poco tempo a disposizione; cercano segnali concreti di competenza e
serietà prima di decidere se contattare il candidato.

**Pubblico secondario: peer e mentori della community security/tech** che possono
approfondire i writeup e i progetti per giudicare il merito tecnico reale.

Job-to-be-done: capire in pochi secondi chi è Alberto Casalicchio e se vale un colloquio,
con la possibilità — per chi vuole andare a fondo — di verificare la sostanza attraverso
progetti reali e writeup di wargame CTF documentati passo-passo.

## Product Purpose

Portfolio personale di Alberto Casalicchio, IT junior orientato alla cybersecurity
(pentesting, wargame CTF, automazione). Esiste per **convertire i visitatori — soprattutto
recruiter — in contatti e colloqui**, dimostrando competenza concreta invece di dichiararla.

La raccolta di writeup (Bandit, Natas OverTheWire e successivi) è la prova verificabile del
metodo: ogni livello è documentato spiegando il ragionamento dietro ogni passo, non solo il
risultato. Il successo si misura in opportunità generate: un recruiter che, dopo la visita,
decide di scrivere.

## Brand Personality

Appassionato ma professionale; tecnicamente credibile senza essere criptico; affidabile e
concreto. Tre parole guida: **competente, concreto, affidabile** — con una passione per la
security che traspare dalla cura dei contenuti, non da effetti teatrali.

Voce: asciutta e diretta, senza gergo gratuito né auto-promozione vuota. Ogni affermazione
è ancorata a una prova. L'estetica "terminale" comunica dimestichezza tecnica autentica, ma
resta sobria: è competenza, non una posa.

## Anti-references

- **Il portfolio-template generico da bootcamp**: card identiche ripetute, hero-metric,
  stock photo, struttura indistinguibile da mille altri portfolio. Se sembra "fatto con un
  template", ha fallito.
- **L'estetica hacker caricaturale**: verde-su-nero stile Matrix, teschi, font "l33t",
  ammiccamenti da film. Il lato tecnico deve leggersi come competenza reale, non come
  costume. (Tensione da presidiare: il motivo "terminale" già presente va tenuto credibile
  e sobrio, mai macchiettistico.)

## Design Principles

1. **Prove, non promesse.** Ogni claim di competenza è ancorato a un artefatto verificabile
   (writeup step-by-step, progetto reale). Mostrare il ragionamento, non elencare aggettivi.
2. **Due livelli di lettura.** Il recruiter coglie il valore in pochi secondi (hero, stato
   dei progetti, sintesi); chi vuole verificare trova la profondità (writeup completi).
   Nessuno dei due livelli sacrifica l'altro.
3. **Tecnico e credibile, mai caricaturale.** Il codice e il terminale come linguaggio di
   competenza autentica, tenuti sobri: niente derive "l33t", niente template anonimo.
4. **Distinguibilità.** Il sito deve avere una voce riconoscibile e non essere sostituibile
   con un portfolio generico. La personalità (passione + rigore) è un asset da esibire, non
   un rischio da smussare.
5. **Accessibile per default.** L'accessibilità è parte della qualità professionale che il
   sito stesso dimostra: praticare ciò che si predica.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**, già seguito in un audit Impeccable e codificato nelle convenzioni di
progetto (CLAUDE.md):

- Focus da tastiera percepibile su ogni elemento interattivo (`outline: 2px solid
  var(--accent); outline-offset: 2px`).
- Contrasto testo normale ≥ 4.5:1, testo grande ≥ 3:1; `--text-2` non sotto `#848d97`.
- Touch target ≥ 44×44px di area cliccabile.
- Blocco `prefers-reduced-motion` mantenuto: animare solo `transform`/`opacity`.

L'accessibilità è un requisito continuo su ogni nuovo componente, non un'aggiunta finale.
