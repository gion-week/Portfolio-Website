/**
 * main.js — Portfolio logic
 * Vanilla JS, nessun framework
 */

/* ── TERMINAL TYPING ANIMATION ─────────────────────────────────────────── */
function initTerminal() {
  const container = document.getElementById('terminal-body');
  if (!container) return;

  const HOST = 'visitor@portfolio';

  // Sequenza: si "naviga" tra file e cartelle per scoprire le informazioni.
  //  - cmd  : comando digitato (cwd = directory mostrata nel prompt)
  //  - out  : riga di output semplice (opz. tone: 'muted' | 'accent')
  //  - dir  : listing di cartella (items colorati come directory)
  const sequence = [
    { type: 'cmd', cwd: '~', text: 'whoami' },
    { type: 'out', text: 'Alberto Casalicchio — IT Junior orientato alla Cybersecurity' },

    { type: 'cmd', cwd: '~', text: 'cat profile.txt' },
    { type: 'out', text: 'Perito informatico · Orbassano (TO), Italia' },

    { type: 'cmd', cwd: '~', text: 'ls skills/' },
    { type: 'dir', items: ['security/', 'networking/', 'programming/', 'systems/', 'tools/'] },

    { type: 'cmd', cwd: '~/skills', text: 'cat certs.txt' },
    { type: 'out', text: 'Google IT Support · Cisco Intro to Cybersecurity · CompTIA Security+ (in studio)' },

    { type: 'cmd', cwd: '~', text: 'ls projects/' },
    { type: 'dir', items: ['bandit-writeups/', 'natas-writeups/', 'port-scanner/', 'win10-lab/'] },

    { type: 'cmd', cwd: '~', text: 'echo $GOAL' },
    { type: 'out', text: 'Crescere come professionista della Cybersecurity', tone: 'accent' },
  ];

  const CHAR_DELAY = 32;   // ms base per carattere digitato
  const CHAR_JITTER = 28;  // variazione casuale per un ritmo più naturale
  const LINE_PAUSE = 380;  // ms tra fine comando e output
  const STEP_PAUSE = 240;  // ms tra una riga e la successiva

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function promptHtml(cwd) {
    return '<span class="term-user">' + HOST + '</span>'
      + '<span class="term-colon">:</span>'
      + '<span class="term-path">' + escapeHtml(cwd) + '</span>'
      + '<span class="term-sign">$</span> ';
  }

  // Aggiunge una riga (output/dir) con fade-in, in fondo al terminale
  function appendLine(html) {
    const line = document.createElement('div');
    line.className = 'terminal-line term-fade';
    line.innerHTML = html;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  // Digita un comando carattere per carattere dopo il prompt
  function typeCommand(cwd, text, callback) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = promptHtml(cwd) + '<span class="terminal-cmd"></span>';
    container.appendChild(line);

    const cmdSpan = line.querySelector('.terminal-cmd');
    let i = 0;
    function nextChar() {
      if (i < text.length) {
        cmdSpan.textContent += text[i++];
        container.scrollTop = container.scrollHeight;
        setTimeout(nextChar, CHAR_DELAY + Math.random() * CHAR_JITTER);
      } else {
        setTimeout(callback, LINE_PAUSE);
      }
    }
    nextChar();
  }

  function addOutput(text, tone, callback) {
    const cls = tone === 'accent' ? 'terminal-output term-accent'
              : tone === 'muted'  ? 'terminal-output term-muted'
              : 'terminal-output';
    appendLine('<span class="' + cls + '">' + escapeHtml(text) + '</span>');
    setTimeout(callback, STEP_PAUSE);
  }

  function addDir(items, callback) {
    const inner = items
      .map(i => '<span class="term-dir">' + escapeHtml(i) + '</span>')
      .join('');
    appendLine('<span class="term-listing">' + inner + '</span>');
    setTimeout(callback, STEP_PAUSE);
  }

  // Riga finale: prompt "pronto" con cursore lampeggiante
  function addFinalPrompt() {
    const line = document.createElement('div');
    line.className = 'terminal-line term-fade';
    line.innerHTML = promptHtml('~') + '<span class="terminal-cursor"></span>';
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  let idx = 0;
  function runNext() {
    if (idx >= sequence.length) { addFinalPrompt(); return; }
    const step = sequence[idx++];
    if (step.type === 'cmd')      typeCommand(step.cwd, step.text, runNext);
    else if (step.type === 'dir') addDir(step.items, runNext);
    else                          addOutput(step.text, step.tone, runNext);
  }

  setTimeout(runNext, 400);
}

/* ── CTF WRITEUPS — WARGAME MODAL ───────────────────────────────────────── */

// Descrizioni e link per ogni wargame.
// Per aggiungere un nuovo wargame: aggiungi una voce qui e le entries in index.json.
const WARGAME_INFO = {
  bandit: {
    label: 'OverTheWire — Bandit',
    url: 'https://overthewire.org/wargames/bandit/',
    desc: 'Bandit è il wargame di partenza di OverTheWire, pensato per chi si avvicina alla sicurezza informatica da zero. Insegna i fondamentali della command line Linux attraverso sfide progressive: gestione di file e permessi, SSH, processi, networking e crittografia di base.'
  },
  natas: {
    label: 'OverTheWire — Natas',
    url: 'https://overthewire.org/wargames/natas/',
    desc: 'Natas insegna i fondamentali della sicurezza web lato server. Ogni livello introduce una categoria di vulnerabilità reale: source code inspection, directory traversal, bypass di autenticazione, SQL injection e code execution.'
  }
};

let allWriteups = [];

async function loadWriteups() {
  try {
    const res = await fetch('writeups/index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allWriteups = await res.json();
    renderWargameButtons();
  } catch (err) {
    const container = document.getElementById('wargame-buttons');
    if (container) container.innerHTML = '<p class="writeup-loading">Impossibile caricare i writeup. Assicurati di aprire il sito da un server HTTP.</p>';
    console.error('Errore caricamento writeups:', err);
  }
}

function renderWargameButtons() {
  const container = document.getElementById('wargame-buttons');
  if (!container) return;

  // Ottieni categorie uniche nell'ordine in cui appaiono in index.json
  const seen = new Set();
  const categories = [];
  allWriteups.forEach(w => {
    if (!seen.has(w.category)) { seen.add(w.category); categories.push(w.category); }
  });

  container.innerHTML = categories.map(cat => {
    const info = WARGAME_INFO[cat];
    const label = info ? info.label.split('—')[1].trim() : cat.charAt(0).toUpperCase() + cat.slice(1);
    return `<button class="btn btn--outline wargame-btn" data-wargame="${escapeAttr(cat)}">${label}</button>`;
  }).join('');

  container.querySelectorAll('.wargame-btn').forEach(btn => {
    btn.addEventListener('click', () => openWargameModal(btn.dataset.wargame));
  });
}

function openWargameModal(category) {
  const modal    = document.getElementById('wargame-modal');
  const catEl    = document.getElementById('wargame-modal-category');
  const titleEl  = document.getElementById('wargame-modal-title');
  const infoEl   = document.getElementById('wargame-modal-info');
  const levelsEl = document.getElementById('wargame-modal-levels');
  if (!modal) return;

  const info   = WARGAME_INFO[category] || { label: category, url: '#', desc: '' };
  const levels = allWriteups.filter(w => w.category === category);
  const [prefix, name] = info.label.includes('—')
    ? info.label.split('—').map(s => s.trim())
    : ['Wargame', info.label];

  catEl.textContent  = prefix;
  titleEl.textContent = name;

  infoEl.innerHTML = `
    <p>${escapeHtml(info.desc)}</p>
    <a href="${escapeAttr(info.url)}" target="_blank" rel="noopener">
      ${escapeHtml(info.url)} ↗
    </a>
  `;

  levelsEl.innerHTML = levels.map(w => `
    <div
      class="level-item"
      tabindex="0"
      role="button"
      aria-label="Apri writeup: ${escapeAttr(w.title)}"
      data-file="${escapeAttr(w.file)}"
      data-title="${escapeAttr(w.title)}"
    >
      <span class="level-item-number">Level ${escapeHtml(String(w.level))}</span>
      <div class="level-item-body">
        <span class="level-item-title">${escapeHtml(w.title)}</span>
        ${w.description ? `<span class="level-item-desc">${escapeHtml(w.description)}</span>` : ''}
      </div>
    </div>
  `).join('');

  // Apertura writeup dal livello
  levelsEl.querySelectorAll('.level-item').forEach(item => {
    const open = () => openWriteup(item.dataset.file, item.dataset.title);
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  // Riavvia l'animazione del panel ad ogni apertura
  const panel = modal.querySelector('.wargame-panel');
  panel.style.animation = 'none';
  panel.offsetHeight; // force reflow
  panel.style.animation = '';

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeWargameModal() {
  const modal = document.getElementById('wargame-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  // Ripristina scroll solo se anche il writeup modal è chiuso
  const writeupModal = document.getElementById('writeup-modal');
  if (!writeupModal || writeupModal.getAttribute('aria-hidden') === 'true') {
    document.body.style.overflow = '';
  }
}

/* ── MODAL WRITEUP ───────────────────────────────────────────────────────── */
async function openWriteup(file, title) {
  const modal     = document.getElementById('writeup-modal');
  const contentEl = document.getElementById('modal-content');
  const titleEl   = document.getElementById('modal-title');
  if (!modal || !contentEl) return;

  titleEl.textContent = title || 'Writeup';
  contentEl.innerHTML = '<p style="color:var(--text-1);font-family:var(--font-mono);font-size:.85rem">Caricamento...</p>';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const md = await res.text();
    const basePath = file.substring(0, file.lastIndexOf('/'));
    const renderer = new marked.Renderer();
    renderer.image = ({ href, title, text }) => {
    let imagePath = href;
    if (
      !href.startsWith('http://') &&
      !href.startsWith('https://') &&
      !href.startsWith('/')
    ) {
        imagePath = `${basePath}/${href.replace(/^\.?\//, '')}`;
        }
    return `
        <img
        src="${imagePath}"
        alt="${text || ''}"
        ${title ? `title="${title}"` : ''}
        loading="lazy"
      >
    `;
  };
  contentEl.innerHTML = marked.parse(md, { renderer });
  } catch (err) {
    contentEl.innerHTML = '<p style="color:var(--red)">Impossibile caricare il writeup.</p>';
    console.error('Errore caricamento markdown:', err);
  }
}

function closeModal() {
  const modal = document.getElementById('writeup-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initModal() {
  // ── Writeup modal ──
  const writeupModal = document.getElementById('writeup-modal');
  const closeBtn     = document.querySelector('#writeup-modal .modal-close');
  const backdrop     = document.querySelector('#writeup-modal .modal-backdrop');
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  // ── Wargame modal ──
  const wargameClose    = document.getElementById('wargame-close');
  const wargameBackdrop = document.querySelector('.wargame-backdrop');
  wargameClose?.addEventListener('click', closeWargameModal);
  wargameBackdrop?.addEventListener('click', closeWargameModal);

  // ESC: chiude prima il writeup modal (se aperto), poi il wargame modal
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (writeupModal?.getAttribute('aria-hidden') === 'false') {
      closeModal();
    } else {
      const wgModal = document.getElementById('wargame-modal');
      if (wgModal?.getAttribute('aria-hidden') === 'false') closeWargameModal();
    }
  });
}

/* ── NAVIGATION — ACTIVE LINK ON SCROLL ─────────────────────────────────── */
function initNav() {
  // Mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    navLinks?.classList.toggle('open', !expanded);
  });

  // Chiudi menu mobile al click su un link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // Highlight link attivo in base alla sezione visibile
  const sections = document.querySelectorAll('.page-section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: `-${60}px 0px -60% 0px`, threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ── UTILITIES ───────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ── INIT ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
  initNav();
  initModal();
  loadWriteups();
});
