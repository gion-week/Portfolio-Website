# Natas Level 0

**Wargame:** OverTheWire — Natas  
**Livello:** 0  
**URL:** `http://natas0.natas.labs.overthewire.org`  
**Credenziali:** `natas0 / natas0`  
**Categoria:** Source code inspection

---

## Obiettivo

Trovare la password per natas1 nascosta nella pagina web del livello 0.

---

## Soluzione

### 1. Accesso alla pagina

Navigando all'URL con le credenziali fornite, il sito mostra:

> "You can find the password for the next level on this page."

La password non è visibile nel testo renderizzato.

### 2. Ispezione del sorgente HTML

Il contenuto può essere nascosto nel codice HTML non renderizzato dal browser.  
Si apre il sorgente della pagina con:

- **Firefox / Chrome:** `Ctrl+U` oppure clic destro → *Visualizza sorgente pagina*
- **Oppure:** Developer Tools → tab *Inspector*

Nel sorgente HTML si trova un commento HTML:

```html
<!--The password for natas1 is [REDACTED] -->
```

I commenti HTML (`<!-- ... -->`) non vengono renderizzati dal browser ma sono presenti nel codice sorgente e visibili a chiunque.

---

## Concetti chiave

**Commenti HTML:**  
Non sono un meccanismo di sicurezza. Non sono cifrati, non sono nascosti — sono semplicemente non renderizzati visivamente. Chiunque acceda al sorgente può leggerli.

**Implicazione pratica:**  
Non inserire mai credenziali, token, o informazioni sensibili in commenti HTML. Valgono le stesse regole del codice lato server: il browser riceve l'HTML completo prima di renderizzarlo.

---

## Metodo alternativo

Via `curl` da terminale, senza aprire il browser:

```bash
curl -u natas0:natas0 http://natas0.natas.labs.overthewire.org | grep -i password
```

Output diretto della riga con il commento contenente la password.
