# Bandit Level 13 → 14

## Obiettivo

La password per il livello successivo è contenuta nel file `/etc/bandit_pass/bandit14`, leggibile esclusivamente dall'utente `bandit14`. Nella home di `bandit13` è però presente una chiave SSH privata che consente di autenticarsi direttamente come `bandit14` senza conoscere la password.

---

## Informazioni di connessione

| Campo | Valore |
|-------|--------|
| Host | `bandit.labs.overthewire.org` |
| Porta | `2220` |
| Utente | `bandit13` |

```bash
ssh bandit13@bandit.labs.overthewire.org -p 2220
```

---

## Comandi / concetti utili

- `ls` — lista file nella directory corrente
- `cat` — stampa il contenuto di un file
- `ssh -i` — specifica una chiave privata per l'autenticazione SSH
- `scp` — copia file tra host remoti e locali tramite SSH
- `chmod 600` — imposta i permessi di lettura/scrittura solo per il proprietario (necessario per le chiavi SSH)

---

## Soluzione

### Step 1 – Esplorare la home e leggere il file HINT

```bash
bandit13@bandit:~$ ls
HINT  sshkey.private
bandit13@bandit:~$ cat HINT
If you have trouble with this level, note the following:

1) As for all other levels, this level has a website with information:
   https://overthewire.org/wargames/bandit/bandit14.html
2) No, the level is not broken. To verify, see:
   https://status.overthewire.org/
3) The current version of OverTheWire prevents logging in from one
   level to another via localhost. Log out, and see 1)
4) If you get errors, read the error message on your screen.
   We mean it!
```

Sono presenti due file: `sshkey.private` e `HINT`. Il file HINT chiarisce subito un punto rilevante: non è possibile usare la chiave per connettersi a `bandit14` tramite `localhost` dall'interno della sessione corrente. Il collegamento deve avvenire usando l'hostname esterno del server o, come si vedrà, copiando prima la chiave in locale.

### Step 2 – Esaminare la chiave privata

```bash
bandit13@bandit:~$ cat sshkey.private
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxkkOE83W2cOT7IWhFc9aPaaQmQDdgzuXCv+ppZHa++buSkN
...
-----END RSA PRIVATE KEY-----
```

Il file contiene una chiave RSA privata nel formato PEM (testuale, delimitato da header `-----BEGIN/END RSA PRIVATE KEY-----`). Questa chiave è la metà privata di una coppia asimmetrica: la metà pubblica corrispondente è già registrata nel file `~/.ssh/authorized_keys` dell'utente `bandit14` sul server, consentendo l'autenticazione senza password.

![Terminale: ls, cat HINT e inizio di cat sshkey.private](./screenshots/13-ssh-key.png)

### Step 3 – Copiare la chiave in locale con `scp`

Dato che connettersi da `bandit13` a `bandit14` tramite localhost è bloccato, la strada più diretta è copiare la chiave sulla propria macchina e usarla da lì. Il comando si esegue **dalla VM locale**, non dalla sessione SSH su bandit:

```bash
gion-week@UbuntuWare:~$ scp -P 2220 bandit13@bandit.labs.overthewire.org:./sshkey.private /home/gion-week/bandit14_sshkey
bandit13@bandit.labs.overthewire.org's password:
sshkey.private    100%  1679   20.1KB/s   00:00
```

`scp` richiede comunque l'autenticazione come `bandit13` (via password) per accedere al file remoto. Il flag `-P 2220` specifica la porta non standard, analogamente a `ssh -p`. Una volta copiato, il file manager mostra la chiave come `Private RSA Key` da 2048 bit.

![Terminale: scp dalla VM locale e finestra GUI con dettagli della chiave](./screenshots/13-key-transfered.png)

### Step 4 – Primo tentativo: SSH rifiuta la chiave per permessi insufficienti

Il file copiato da `scp` ha ereditato i permessi `0640` (`-rw-r-----`): leggibile dal proprietario e dal gruppo, ma non da altri. Sembra ragionevole, ma SSH applica un controllo più restrittivo: qualsiasi accesso da parte del gruppo è già considerato troppo permissivo. Il tentativo di connessione fallisce con un avviso esplicito:

```bash
gion-week@UbuntuWare:~$ ssh -i bandit14_sshkey bandit14@bandit.labs.overthewire.org -p 2220
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0640 for 'bandit14_sshkey' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "bandit14_sshkey": bad permissions
bandit14@bandit.labs.overthewire.org's password:
```

SSH ignora la chiave e ricade sull'autenticazione via password. Il client non si blocca né lancia un errore fatale: semplicemente tratta la chiave come non utilizzabile e procede con il meccanismo successivo disponibile.

![Terminale: SSH con chiave a permessi 0640, warning e fallback a password](./screenshots/13-key-unprotected.png)

### Step 5 – Correggere i permessi con `chmod 600` e connettersi

Si verifica lo stato attuale dei permessi, si applica `chmod 600` e si controlla che la modifica sia andata a buon fine:

```bash
gion-week@UbuntuWare:~$ ls -l bandit14_sshkey && chmod 600 bandit14_sshkey && ls -l bandit14_sshkey
-rw-r----- 1 gion-week gion-week 1679 Jun  3 12:20 bandit14_sshkey
-rw------- 1 gion-week gion-week 1679 Jun  3 12:20 bandit14_sshkey
```

Il primo `ls -l` mostra `-rw-r-----` (0640); dopo `chmod 600` il secondo mostra `-rw-------`: lettura e scrittura solo per il proprietario, nessun accesso per gruppo e altri. A questo punto SSH accetta la chiave:

```bash
gion-week@UbuntuWare:~$ ssh -i bandit14_sshkey bandit14@bandit.labs.overthewire.org -p 2220
```

![Terminale: ls -l prima e dopo chmod 600, poi ssh con chiave accettata](./screenshots/13-chmod600.png)

### Step 6 – Leggere la password come bandit14

Una volta autenticati come `bandit14`, il file `/etc/bandit_pass/bandit14` è finalmente accessibile:

```bash
bandit14@bandit:~$ cat /etc/bandit_pass/bandit14
[password]
```

![Terminale: cat /etc/bandit_pass/bandit14 con password trovata](./screenshots/13-password.png)

---

## Note e osservazioni

**`scp` e la direzione del trasferimento**

`scp` (Secure Copy Protocol) è uno strumento che trasferisce file tra host attraverso SSH, usando la stessa autenticazione e la stessa cifratura. La sintassi generale per copiare un file da remoto a locale è:

```bash
scp -P <porta> utente@host:percorso/remoto /percorso/locale/destinazione
```

La direzione si legge come in `cp`: il primo argomento è l'origine, il secondo è la destinazione. Nel caso di questo livello, l'origine è il file sul server Bandit e la destinazione è la home della VM locale: il trasferimento avviene quindi dal server verso la VM, iniziato dalla VM stessa (modalità *pull*).

**Sarebbe stato possibile fare il contrario, avviando il trasferimento dal server?**

In linea di principio sì: si potrebbe aprire una sessione SSH su `bandit13` e usare `scp` da lì per *spingere* il file verso la VM locale (modalità *push*). Il comando avrebbe questa forma, eseguita dalla sessione bandit:

```bash
bandit13@bandit:~$ scp -P <porta_ssh_locale> sshkey.private utente_locale@<ip_vm>:/destinazione/
```

Perché questo funzioni, però, la VM locale deve soddisfare tre condizioni:

1. Avere un server SSH attivo (`openssh-server` installato e in esecuzione)
2. Essere raggiungibile dall'esterno — ovvero avere un indirizzo IP pubblico o avere il port forwarding configurato sul router verso la porta SSH
3. Consentire l'autenticazione dell'utente da cui si esegue il comando

In un ambiente domestico tipico, la VM si trova dietro NAT e non è raggiungibile direttamente dall'internet, rendendo questo approccio impraticabile senza configurazione aggiuntiva. Il metodo usato in questo livello (pull dalla VM locale) è quello standard e non richiede che la macchina locale esponga alcun servizio.

**Il contenuto della finestra GUI: cosa significano i campi**

Quando il file manager apre `bandit14_sshkey`, lo riconosce come chiave crittografica e ne mostra i metadati senza esporne il contenuto. I campi visibili hanno questo significato:

- **Private RSA Key** — identifica il tipo di chiave: RSA (Rivest–Shamir–Adleman), uno degli algoritmi asimmetrici più diffusi. RSA genera coppie di chiavi in cui la chiave pubblica cifra o verifica, e la chiave privata decifra o firma.
- **Strength: 2048 bits** — la lunghezza del modulo RSA in bit. Determina la robustezza della chiave: 2048 bit è stata a lungo lo standard raccomandato; dal 2022 NIST raccomanda almeno 3072 per nuove generazioni, ma 2048 è ancora considerato accettabile per la maggior parte degli usi.
- **Algorithm: RSA** — l'algoritmo sottostante; in questa finestra è ridondante rispetto al tipo già indicato.
- **Size: 2048** — la stessa informazione di "Strength", espressa numericamente senza unità.
- **Fingerprints** — gli hash crittografici della chiave pubblica, usati per identificarla in modo compatto senza doverla confrontare byte per byte. Sono riportati in due varianti:
  - **SHA1** — un digest a 160 bit della chiave pubblica. SHA1 è considerato deprecato per usi crittografici (vulnerabile a collisioni) ma viene ancora mostrato per compatibilità con strumenti e sistemi più vecchi.
  - **SHA256** — un digest a 256 bit, parte della famiglia SHA-2. È il formato oggi raccomandato per verificare l'identità di una chiave: quando SSH mostra il fingerprint di un host al primo collegamento, usa SHA256 (prefissato da `SHA256:`).

I fingerprint non derivano dalla chiave privata in sé ma dalla chiave pubblica corrispondente, che è matematicamente derivata da quella privata. Due chiavi diverse producono fingerprint diversi; lo stesso fingerprint su macchine diverse identifica la stessa chiave pubblica.

**Metodo alternativo: usare la chiave direttamente senza copiarla in locale**

Nonostante il HINT avverta che OverTheWire blocca le connessioni tra livelli via `localhost`, il blocco si applica specificamente all'indirizzo di loopback. È invece possibile usare la chiave direttamente dalla sessione `bandit13` specificando l'hostname esterno del server:

```bash
bandit13@bandit:~$ ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p 2220
```

Questo elimina il passaggio `scp` e il problema dei permessi sulla macchina locale, ma richiede di fare una connessione SSH dal server verso se stesso tramite indirizzo pubblico, approccio funzionalmente equivalente ma meno comune in scenari reali.

**Perché `chmod 600` è obbligatorio e cosa significa `0640`**

SSH implementa un controllo esplicito sui permessi delle chiavi private prima di usarle e il comportamento osservato in questo livello mostra esattamente come funziona. Il file copiato con `scp` aveva permessi `0640`:

```
Permissions 0640 for 'bandit14_sshkey' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "bandit14_sshkey": bad permissions
```

Il valore `0640` è la rappresentazione ottale dei permessi Unix. Ogni cifra copre una tripletta di bit (read/write/execute) per una delle tre categorie di accesso: proprietario, gruppo, altri. `0640` si legge così:

| Categoria | Valore ottale | Permessi |
|-----------|:---:|----------|
| Proprietario | 6 | `rw-` — lettura e scrittura |
| Gruppo | 4 | `r--` — sola lettura |
| Altri | 0 | `---` — nessun accesso |

Il gruppo ha accesso in lettura: questo è sufficiente perché SSH consideri il file compromissibile. La logica è che qualsiasi altro utente appartenente allo stesso gruppo potrebbe leggere la chiave privata, quindi SSH non può garantire che sia rimasta riservata.

`chmod 600` imposta la tripletta a `rw-------`: il gruppo e gli altri scendono a zero. SSH considera accettabile solo questo stato (o uno più restrittivo, come `400` — sola lettura per il proprietario). Quando SSH rileva che la chiave è troppo permissiva non restituisce un errore fatale ma la scarta silenziosamente e ricade sull'autenticazione via password, comportamento che si vede chiaramente nello screenshot, dove il prompt `bandit14@...'s password:` compare pur avendo specificato `-i`.
