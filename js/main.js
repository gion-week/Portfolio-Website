/**
 * main.js — Portfolio logic
 * Vanilla JS, nessun framework
 */

/* ── TERMINAL TYPING ANIMATION ─────────────────────────────────────────── */
function initTerminal() {
  const container = document.getElementById('terminal-body');
  if (!container) return;

  // Sequenza da mostrare: ogni oggetto è { type: 'cmd'|'output', text }
  const sequence = [
    { type: 'cmd',    text: 'whoami' },
    { type: 'output', text: 'Alberto Casalicchio — IT Junior & Security Enthusiast' },
    { type: 'cmd',    text: 'cat location.txt' },
    { type: 'output', text: 'Italia 🇮🇹' },
    { type: 'cmd',    text: 'ls ./projects/' },
    { type: 'output', text: 'bandit-writeups/   natas-writeups/   port-scanner/' },
    { type: 'cmd',    text: 'echo $GOAL' },
    { type: 'output', text: 'Cybersecurity Professional' },
  ];

  const CHAR_DELAY = 40;   // ms per carattere (comando)
  const LINE_PAUSE = 500;  // ms tra comando e output
  const STEP_PAUSE = 300;  // ms tra una riga e l'altra

  // Crea e aggiunge una riga nel terminale
  function addLine(html) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = html;
    // Inserisce prima del cursore
    const cursor = container.querySelector('.terminal-cursor');
    if (cursor) {
      container.insertBefore(line, cursor);
    } else {
      container.appendChild(line);
    }
  }

  // Aggiunge il cursore fisso alla fine
  const cursorEl = document.createElement('span');
  cursorEl.className = 'terminal-cursor';
  container.appendChild(cursorEl);

  // Scrive un comando carattere per carattere
  function typeCommand(text, callback) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = '<span class="terminal-prompt">$ </span><span class="terminal-cmd"></span>';
    const cursor = container.querySelector('.terminal-cursor');
    container.insertBefore(line, cursor);

    const cmdSpan = line.querySelector('.terminal-cmd');
    let i = 0;
    function nextChar() {
      if (i < text.length) {
        cmdSpan.textContent += text[i++];
        setTimeout(nextChar, CHAR_DELAY);
      } else {
        setTimeout(callback, LINE_PAUSE);
      }
    }
    nextChar();
  }

  // Aggiunge una riga di output
  function addOutput(text, callback) {
    addLine('<span class="terminal-output">' + escapeHtml(text) + '</span>');
    setTimeout(callback, STEP_PAUSE);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Esegue la sequenza in ordine
  let idx = 0;
  function runNext() {
    if (idx >= sequence.length) return; // animazione completata, cursore rimane
    const step = sequence[idx++];
    if (step.type === 'cmd') {
      typeCommand(step.text, runNext);
    } else {
      addOutput(step.text, runNext);
    }
  }

  // Ritardo iniziale prima di partire
  setTimeout(runNext, 400);
}

/* ── CTF WRITEUPS — LOADER E FILTRI ─────────────────────────────────────── */
let allWriteups = [];

async function loadWriteups() {
  const listEl = document.getElementById('writeup-list');
  if (!listEl) return;

  try {
    const res = await fetch('writeups/index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allWriteups = await res.json();
    renderWriteups('all');
  } catch (err) {
    listEl.innerHTML = '<p class="writeup-loading">Impossibile caricare i writeup. Assicurati di aprire il sito da un server HTTP.</p>';
    console.error('Errore caricamento writeups:', err);
  }
}

function renderWriteups(filter) {
  const listEl = document.getElementById('writeup-list');
  if (!listEl) return;

  const filtered = filter === 'all'
    ? allWriteups
    : allWriteups.filter(w => w.category === filter);

  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="writeup-loading">Nessun writeup in questa categoria.</p>';
    return;
  }

  listEl.innerHTML = filtered.map(w => `
    <div
      class="writeup-card"
      tabindex="0"
      role="button"
      aria-label="Apri writeup: ${escapeAttr(w.title)}"
      data-file="${escapeAttr(w.file)}"
      data-title="${escapeAttr(w.title)}"
    >
      <span class="writeup-card-category">${escapeHtml(w.category)} — Level ${escapeHtml(String(w.level))}</span>
      <span class="writeup-card-title">${escapeHtml(w.title)}</span>
      ${w.description ? `<span class="writeup-card-desc">${escapeHtml(w.description)}</span>` : ''}
    </div>
  `).join('');

  // Gestori click e keyboard su ogni card
  listEl.querySelectorAll('.writeup-card').forEach(card => {
    const open = () => openWriteup(card.dataset.file, card.dataset.title);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      renderWriteups(btn.dataset.filter);
    });
  });
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
  const modal    = document.getElementById('writeup-modal');
  const closeBtn = document.querySelector('.modal-close');
  const backdrop = document.querySelector('.modal-backdrop');
  if (!modal) return;

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  // Chiudi con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
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
  initFilters();
  initModal();
  loadWriteups();
});
