# Bandit Level 16 → 17

## Obiettivo

Le credenziali per il livello successivo si ottengono inviando la password corrente (`bandit16`) a una porta nel range `31000–32000` su `localhost`. Le porte in ascolto sono più di una: alcune usano SSL/TLS, altre no; alcune rispondono con un echo di ciò che ricevono, un'unica restituisce le credenziali per il livello successivo.

---

## Informazioni di connessione

| Campo | Valore |
|-------|--------|
| Host | `bandit.labs.overthewire.org` |
| Porta | `2220` |
| Utente | `bandit16` |

```bash
ssh bandit16@bandit.labs.overthewire.org -p 2220
```

---

## Comandi / concetti utili

- `nmap -p<range>` — scansiona un range di porte specificato
- `nmap -sV` — tenta di identificare il servizio e la versione in ascolto su ogni porta aperta
- `ncat --ssl` — connessione TCP con SSL/TLS
- `nano` — editor di testo interattivo da terminale
- `head -n` — stampa le prime N righe di un file

---

## Soluzione

### Step 1 – Scansionare il range di porte con `nmap`

L'obiettivo non indica una porta specifica ma un range: il primo passo è trovare quali porte nel range `31000–32000` sono effettivamente in ascolto. Si preferisce delimitare il range piuttosto che scansionare tutto il filesystem con `-p-`, sia per velocità che per tenere la ricerca nel contesto dell'obiettivo:

```bash
bandit16@bandit:~$ nmap -p31000-32000 localhost
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-06-04 15:17 UTC
Nmap scan report for localhost (127.0.0.1)
Host is up (0.000011s latency).
Not shown: 996 closed tcp ports (conn-refused)
PORT      STATE SERVICE
31046/tcp open  unknown
31518/tcp open  unknown
31691/tcp open  unknown
31790/tcp open  unknown
31960/tcp open  unknown

Nmap done: 1 IP address (1 up) scanned in 0.06 seconds
```

Su 1000 porte scansionate, 5 risultano aperte, tutte classificate come `unknown`. La scansione base non è sufficiente per distinguerle: serve un secondo passaggio con rilevamento dei servizi.

![Terminale: nmap -p31000-32000 con 5 porte aperte](./screenshots/16-port-scan-range.png)

### Step 2 – Identificare i servizi con `nmap -sV`

Il flag `-sV` attiva il **service version detection**: nmap tenta di identificare il protocollo e il software in ascolto su ogni porta inviando probe specifici e analizzando le risposte. Si passano direttamente le 5 porte trovate al passo precedente:

```bash
bandit16@bandit:~$ nmap -sV -p31046,31518,31691,31790,31960 localhost
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-06-04 15:23 UTC
Nmap scan report for localhost (127.0.0.1)
Host is up (0.000088s latency).

PORT      STATE SERVICE  VERSION
31046/tcp open  echo
31518/tcp open  ssl/echo
31691/tcp open  echo
31790/tcp open  ssl/unknown
31960/tcp open  echo

1 service unrecognized despite returning data. ...
SF-Port31790-TCP:... "Wrong!\x20Please\x20enter\x20the\x20correct\x20current\x20password\.\n"
```

Il quadro è ora chiaro:

- Le porte `31046`, `31691`, `31960` eseguono un semplice **echo**: rimandano indietro esattamente ciò che ricevono, senza SSL.
- La porta `31518` è **ssl/echo**: stesso comportamento ma su canale cifrato.
- La porta `31790` è **ssl/unknown**: usa SSL ma il servizio non è riconoscibile. Il fingerprint che nmap allega contiene la stringa `"Wrong! Please enter the correct current password."`, confermando che si tratta di un servizio interattivo che accetta input e valida la password. È la porta cercata.

![Terminale: nmap -sV con servizi identificati e fingerprint di 31790](./screenshots/16-single-port-scan.png)

### Step 3 – Inviare la password alla porta 31790 e ottenere la chiave RSA

Il servizio su `31790` usa SSL, quindi si usa `ncat --ssl` come nel livello precedente. La pipe con `echo` evita la sessione interattiva:

```bash
bandit16@bandit:~$ echo "kS[...]" | ncat --ssl localhost 31790
Correct!
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAvmOkuifmMg6HL2YPIOjon6iWfbp7c3jx34YkYWqUH57SUdyJ
imZzeyGC0gtZPGujUSxiJSWI/oTqexh+cAMTSMlOJf7+BrJObArnxd9Y7YT2bRPQ
...
-----END RSA PRIVATE KEY-----
```

Il server non restituisce una password testuale come nei livelli precedenti ma una **chiave privata RSA** che si potrà usare come credenziale per accedere a `bandit17`, analogamente a quanto avvenuto nel livello 13.

![Terminale: ncat --ssl localhost 31790, Correct! e chiave RSA](./screenshots/16-key-found.png)

### Step 4 – Salvare la chiave in locale e impostare i permessi

La chiave va copiata sulla VM locale. Non potendo usare `scp` direttamente (il server non restituisce un file ma output a schermo), si copia il testo manualmente: si apre `nano` sulla VM locale, si incolla il contenuto della chiave, si salva il file. Si verifica che il contenuto sia corretto e si impostano i permessi:

```bash
gion-week@UbuntuWare:~$ nano bandit17_key
gion-week@UbuntuWare:~$ head -n 3 bandit17_key
----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAvmOkuifmMg6HL2YPIOjon6iWfbp7c3jx34YkYWqUH57SUdyJ
imZzeyGC0gtZPGujUSxiJSWI/oTqexh+cAMTSMlOJf7+BrJObArnxd9Y7YT2bRPQ
gion-week@UbuntuWare:~$ chmod 600 bandit17_key && ls -l | grep bandit17_key
-rw------- 1 gion-week gion-week 1674 Jun  4 18:26 bandit17_key
```

![Terminale: nano, head -n 3 e chmod 600 con permessi verificati](./screenshots/16-key-copied.png)

---

## Note e osservazioni

**`nmap -sV` e il service fingerprinting**

La scansione base di nmap si limita a stabilire se una porta accetta connessioni TCP (stato `open`, `closed`, o `filtered`). Il flag `-sV` aggiunge un secondo livello di analisi: nmap invia una serie di probe (stringhe di testo, richieste HTTP, handshake SSL, e altri pattern) e confronta le risposte con un database interno di oltre 11.000 firme di servizi noti. Se il comportamento corrisponde a una firma conosciuta, classifica il servizio con nome e versione (`ssl/echo`, `echo`, ecc.); se non corrisponde a nulla, lo marca come `unknown` e allega il raw fingerprint all'output.

In questo livello il fingerprint di `31790` contiene già la stringa che il server invia quando riceve input non valido (`"Wrong! Please enter the correct current password."`): nmap ha aperto una connessione SSL, inviato dei probe, e il server ha risposto con questo messaggio, abbastanza per capire che è il servizio cercato ancora prima di connettersi manualmente.

Il costo di `-sV` rispetto a una scansione base è il tempo: in questo caso 157 secondi contro 0.06 secondi, perché ogni porta richiede una sequenza di tentativi attivi.

**Metodo alternativo: catturare la chiave direttamente dalla VM locale**

Il passaggio manuale con `nano` (copiare il testo dal terminale e incollarlo) è funzionale ma soggetto a errori dato che un carattere mancante o una riga tagliata rendono la chiave inutilizzabile. Un approccio più robusto è eseguire il comando sul server remoto direttamente dalla VM locale tramite `ssh` con esecuzione di comando in linea, reindirizzando l'output direttamente in un file locale:

```bash
gion-week@UbuntuWare:~$ ssh bandit16@bandit.labs.overthewire.org -p 2220 \
  "echo '[password bandit16]' | ncat --ssl localhost 31790" > bandit17_key
```

Questa sintassi esegue il comando tra virgolette sul server remoto e redirige lo `stdout` della sessione SSH (che include l'output del comando, ovvero la chiave RSA) direttamente nel file `bandit17_key` sulla macchina locale, senza aprire una sessione interattiva né copiare manualmente nulla. Dopo l'esecuzione è sufficiente applicare `chmod 600` come di consueto. Il vantaggio è l'assenza di errori umani nel copia-incolla, il limite è che l'output include anche eventuali messaggi di benvenuto del server SSH che andrebbero rimossi, se presenti, prima dell'intestazione `-----BEGIN RSA PRIVATE KEY-----`.
