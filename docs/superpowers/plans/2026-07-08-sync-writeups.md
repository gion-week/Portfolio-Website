# sync-writeups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminare l'editing manuale di `index.json` e la copia a mano dei writeup, con uno script Python locale che sincronizza i livelli dal repo sorgente e rigenera `index.json`.

**Architecture:** Script Python (`tools/sync_writeups.py`, solo stdlib) eseguito manualmente nel repo portfolio prima del commit. Fase 1: copia i `level-XX/` con README dal repo sorgente (`../natas-overthewire`) in `writeups/{category}/` (rinomina + screenshot nella cartella condivisa). Fase 2: rigenera `writeups/index.json` scandendo `writeups/`, con `title` dall'H1 e `description` da un commento `portfolio-desc` nel README (o preservata dall'indice esistente). Non è un build step Vercel: il sito resta statico.

**Tech Stack:** Python 3 (stdlib: `json`, `re`, `shutil`, `pathlib`, `sys`); test con `unittest` (stdlib) + `tempfile`.

## Global Constraints

Copiati dalla spec `docs/superpowers/specs/2026-07-08-sync-writeups-workflow-design.md`. Valgono per ogni task.

- Nessuna dipendenza esterna: solo stdlib Python. Niente `package.json`, `node_modules`, `pip install`, build pipeline.
- Nessuna modifica a `js/main.js`, `css/style.css`, `js/marked.umd.js`, `vercel.json`, `index.html`.
- Non toccare a mano i PNG in `screenshots/` (li copia lo script). Escludere sempre `.gitkeep`.
- Formato di `index.json`: `json.dumps(entries, ensure_ascii=False, indent=2) + "\n"` (verificato: riproduce byte-identico il file attuale). Ordine chiavi per oggetto: `id`, `title`, `category`, `level`, `description`, `file`.
- Ordine categorie: `CATEGORY_ORDER = ["bandit", "natas"]`, poi per `level` come intero.
- `level` è sempre una stringa a due cifre (`"00"`, `"11"`), presa dal nome file/cartella.
- Lo script NON esegue operazioni git. Commit e push sono manuali (dell'utente).
- Eseguire il lavoro su un **branch dedicato**, non su `main`.
- Path risolti rispetto alla root del portfolio (`Path(__file__).resolve().parent.parent`), indipendenti dalla CWD.

**Struttura file finale:**
- `tools/sync_writeups.py` — lo script (creato in Task 1-6, un blocco di funzioni per task).
- `tools/test_sync_writeups.py` — test unittest (creato in Task 1, esteso nei task successivi).

---

### Task 1: Scaffolding + parser (`parse_title`, `parse_desc`)

**Files:**
- Create: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Produces: `parse_title(md_text: str) -> Optional[str]` (testo dell'H1 senza `# `, o `None`); `parse_desc(md_text: str) -> Optional[str]` (contenuto del commento `portfolio-desc`, o `None`). Costanti modulo: `TITLE_RE`, `DESC_RE`, `LEVEL_MD_RE`, `LEVEL_DIR_RE`, `REPO_ROOT`, `WRITEUPS_DIR`, `INDEX_PATH`, `SOURCES`, `CATEGORY_ORDER`.

- [ ] **Step 1: Scrivere il test file con i test falliti per i parser**

Create `tools/test_sync_writeups.py`:

```python
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync_writeups as sw


class TestParsers(unittest.TestCase):
    def test_parse_title_extracts_h1(self):
        md = "# Natas Level 11 → 12\n\n## Obiettivo\n\ntesto"
        self.assertEqual(sw.parse_title(md), "Natas Level 11 → 12")

    def test_parse_title_ignores_h2(self):
        md = "## Non un H1\n\ntesto"
        self.assertIsNone(sw.parse_title(md))

    def test_parse_title_with_comment_above(self):
        md = "<!-- portfolio-desc: x -->\n\n# Il Titolo\n\ntesto"
        self.assertEqual(sw.parse_title(md), "Il Titolo")

    def test_parse_desc_extracts_comment(self):
        md = "<!-- portfolio-desc: Cifrario XOR e known-plaintext -->\n# T\n"
        self.assertEqual(sw.parse_desc(md), "Cifrario XOR e known-plaintext")

    def test_parse_desc_absent_returns_none(self):
        md = "# T\n\ntesto senza commento"
        self.assertIsNone(sw.parse_desc(md))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Eseguire i test per verificare che falliscano**

Run: `python tools/test_sync_writeups.py TestParsers -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'sync_writeups'` (il file dello script non esiste ancora).

- [ ] **Step 3: Creare lo script con header, costanti e i due parser**

Create `tools/sync_writeups.py`:

```python
#!/usr/bin/env python3
"""Sync dei writeup dai repo sorgente nel portfolio e rigenerazione di index.json.

Tool di authoring LOCALE (non un build step Vercel). Nessuna dipendenza esterna.
Uso: python tools/sync_writeups.py
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WRITEUPS_DIR = REPO_ROOT / "writeups"
INDEX_PATH = WRITEUPS_DIR / "index.json"

# category -> repo sorgente (path relativo alla root del portfolio)
SOURCES = [
    {"category": "natas", "repo_path": "../natas-overthewire"},
]
# Ordine delle categorie in index.json
CATEGORY_ORDER = ["bandit", "natas"]

TITLE_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
DESC_RE = re.compile(r"<!--\s*portfolio-desc:\s*(.+?)\s*-->")
LEVEL_MD_RE = re.compile(r"^level-(\d+)\.md$")
LEVEL_DIR_RE = re.compile(r"^level-(\d+)$")


def parse_title(md_text):
    m = TITLE_RE.search(md_text)
    return m.group(1).strip() if m else None


def parse_desc(md_text):
    m = DESC_RE.search(md_text)
    return m.group(1).strip() if m else None
```

- [ ] **Step 4: Eseguire i test per verificare che passino**

Run: `python tools/test_sync_writeups.py TestParsers -v`
Expected: PASS (5 test OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): parser di titolo e portfolio-desc dai README"
```

---

### Task 2: `load_existing_descriptions`

**Files:**
- Modify: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Consumes: costanti modulo di Task 1.
- Produces: `load_existing_descriptions(index_path: Path) -> dict` — mappa `{id: description}` dall'`index.json` esistente; `{}` se il file non esiste.

- [ ] **Step 1: Scrivere il test fallito**

Append to `tools/test_sync_writeups.py` (prima di `if __name__`):

```python
import json
import tempfile


class TestLoadExisting(unittest.TestCase):
    def test_returns_id_to_description_map(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "index.json"
            p.write_text(json.dumps([
                {"id": "natas-00", "description": "Ispezione sorgente HTML."},
                {"id": "bandit-00", "description": "Connessione SSH."},
            ]), encoding="utf-8")
            got = sw.load_existing_descriptions(p)
            self.assertEqual(got, {
                "natas-00": "Ispezione sorgente HTML.",
                "bandit-00": "Connessione SSH.",
            })

    def test_missing_file_returns_empty(self):
        got = sw.load_existing_descriptions(Path("/nope/index.json"))
        self.assertEqual(got, {})
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `python tools/test_sync_writeups.py TestLoadExisting -v`
Expected: FAIL — `AttributeError: module 'sync_writeups' has no attribute 'load_existing_descriptions'`.

- [ ] **Step 3: Implementare la funzione**

Append to `tools/sync_writeups.py` (dopo `parse_desc`):

```python
def load_existing_descriptions(index_path):
    if not index_path.exists():
        return {}
    data = json.loads(index_path.read_text(encoding="utf-8"))
    return {entry["id"]: entry["description"] for entry in data}
```

- [ ] **Step 4: Eseguire il test per verificare che passi**

Run: `python tools/test_sync_writeups.py TestLoadExisting -v`
Expected: PASS (2 test OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): lettura descrizioni esistenti da index.json"
```

---

### Task 3: `build_entry` (assemblaggio voce + precedenza description)

**Files:**
- Modify: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Consumes: `parse_title`, `parse_desc`.
- Produces: `build_entry(category: str, level: str, md_text: str, existing_desc: Optional[str]) -> dict` — voce con chiavi `id, title, category, level, description, file` (ordine di inserimento = ordine chiavi). `description` = commento se presente, altrimenti `existing_desc` (può essere `None`, validato a valle). Solleva `ValueError` se manca l'H1.

- [ ] **Step 1: Scrivere il test fallito**

Append to `tools/test_sync_writeups.py`:

```python
class TestBuildEntry(unittest.TestCase):
    def test_description_from_comment_wins(self):
        md = "<!-- portfolio-desc: Dal commento -->\n# Natas Level 11 → 12\n"
        e = sw.build_entry("natas", "11", md, "vecchia")
        self.assertEqual(e, {
            "id": "natas-11",
            "title": "Natas Level 11 → 12",
            "category": "natas",
            "level": "11",
            "description": "Dal commento",
            "file": "writeups/natas/level-11.md",
        })

    def test_falls_back_to_existing_when_no_comment(self):
        md = "# Bandit Level 0 → 1\n\ntesto"
        e = sw.build_entry("bandit", "00", md, "Connessione SSH.")
        self.assertEqual(e["description"], "Connessione SSH.")

    def test_description_none_when_no_comment_no_existing(self):
        md = "# Natas Level 12 → 13\n"
        e = sw.build_entry("natas", "12", md, None)
        self.assertIsNone(e["description"])

    def test_key_order_matches_index_json(self):
        md = "<!-- portfolio-desc: x -->\n# T\n"
        e = sw.build_entry("natas", "11", md, None)
        self.assertEqual(list(e.keys()),
                         ["id", "title", "category", "level", "description", "file"])

    def test_missing_h1_raises(self):
        with self.assertRaises(ValueError):
            sw.build_entry("natas", "11", "nessun titolo qui", None)
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `python tools/test_sync_writeups.py TestBuildEntry -v`
Expected: FAIL — `AttributeError: module 'sync_writeups' has no attribute 'build_entry'`.

- [ ] **Step 3: Implementare la funzione**

Append to `tools/sync_writeups.py`:

```python
def build_entry(category, level, md_text, existing_desc):
    title = parse_title(md_text)
    if title is None:
        raise ValueError(f"{category}-{level}: H1 '# Titolo' mancante nel README")
    desc = parse_desc(md_text)
    if desc is None:
        desc = existing_desc  # puo restare None -> validato a valle
    return {
        "id": f"{category}-{level}",
        "title": title,
        "category": category,
        "level": level,
        "description": desc,
        "file": f"writeups/{category}/level-{level}.md",
    }
```

- [ ] **Step 4: Eseguire il test per verificare che passi**

Run: `python tools/test_sync_writeups.py TestBuildEntry -v`
Expected: PASS (5 test OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): build_entry con precedenza della description"
```

---

### Task 4: `regenerate_index` (discovery + ordinamento + validazione)

**Files:**
- Modify: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Consumes: `build_entry`, `LEVEL_MD_RE`, `CATEGORY_ORDER`.
- Produces: `MissingDescription(Exception)` con attributo `.ids` (lista di id); `discover_entries(writeups_dir: Path, existing_desc_map: dict) -> list[dict]`; `regenerate_index(writeups_dir: Path, existing_desc_map: dict) -> list[dict]` (ordinata; solleva `MissingDescription` se una voce ha `description is None`).

- [ ] **Step 1: Scrivere il test fallito**

Append to `tools/test_sync_writeups.py`:

```python
def _make_writeups_tree(root, files):
    # files: dict {(category, level): md_text}
    for (cat, lvl), text in files.items():
        d = root / cat
        d.mkdir(parents=True, exist_ok=True)
        (d / f"level-{lvl}.md").write_text(text, encoding="utf-8")


class TestRegenerateIndex(unittest.TestCase):
    def test_orders_by_category_then_level(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            _make_writeups_tree(root, {
                ("natas", "01"): "# Natas Level 1 → 2\n",
                ("bandit", "02"): "# Bandit Level 2 → 3\n",
                ("bandit", "00"): "# Bandit Level 0 → 1\n",
            })
            existing = {
                "natas-01": "d-n1", "bandit-02": "d-b2", "bandit-00": "d-b0",
            }
            entries = sw.regenerate_index(root, existing)
            self.assertEqual([e["id"] for e in entries],
                             ["bandit-00", "bandit-02", "natas-01"])

    def test_new_level_uses_comment_description(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            _make_writeups_tree(root, {
                ("natas", "11"): "<!-- portfolio-desc: XOR -->\n# Natas Level 11 → 12\n",
            })
            entries = sw.regenerate_index(root, {})
            self.assertEqual(entries[0]["description"], "XOR")

    def test_missing_description_raises_with_ids(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            _make_writeups_tree(root, {
                ("natas", "12"): "# Natas Level 12 → 13\n",  # no comment, no existing
            })
            with self.assertRaises(sw.MissingDescription) as ctx:
                sw.regenerate_index(root, {})
            self.assertEqual(ctx.exception.ids, ["natas-12"])
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `python tools/test_sync_writeups.py TestRegenerateIndex -v`
Expected: FAIL — `AttributeError: module 'sync_writeups' has no attribute 'MissingDescription'`.

- [ ] **Step 3: Implementare la funzione**

Append to `tools/sync_writeups.py` (dopo `build_entry`):

```python
class MissingDescription(Exception):
    """Sollevata quando uno o piu livelli NUOVI non hanno una description."""

    def __init__(self, ids):
        self.ids = ids
        super().__init__(f"Description mancante per: {', '.join(ids)}")


def _category_sort_key(entry):
    cat = entry["category"]
    idx = CATEGORY_ORDER.index(cat) if cat in CATEGORY_ORDER else len(CATEGORY_ORDER)
    return (idx, cat, int(entry["level"]))


def discover_entries(writeups_dir, existing_desc_map):
    entries = []
    for cat_dir in sorted(p for p in writeups_dir.iterdir() if p.is_dir()):
        category = cat_dir.name
        for md_path in cat_dir.glob("level-*.md"):
            m = LEVEL_MD_RE.match(md_path.name)
            if not m:
                continue
            level = m.group(1)
            md_text = md_path.read_text(encoding="utf-8")
            existing = existing_desc_map.get(f"{category}-{level}")
            entries.append(build_entry(category, level, md_text, existing))
    return entries


def regenerate_index(writeups_dir, existing_desc_map):
    entries = discover_entries(writeups_dir, existing_desc_map)
    entries.sort(key=_category_sort_key)
    missing = [e["id"] for e in entries if e["description"] is None]
    if missing:
        raise MissingDescription(missing)
    return entries
```

- [ ] **Step 4: Eseguire il test per verificare che passi**

Run: `python tools/test_sync_writeups.py TestRegenerateIndex -v`
Expected: PASS (3 test OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): rigenerazione ordinata di index.json con validazione"
```

---

### Task 5: `sync_source` (Fase 1 — copia dei livelli dal repo sorgente)

**Files:**
- Modify: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Consumes: `LEVEL_DIR_RE`.
- Produces: `sync_source(repo_path: str, category: str, writeups_dir: Path, base_dir: Path) -> list[str]` — copia ogni `level-XX/README.md` → `writeups/{category}/level-XX.md` e gli screenshot (esclusa `.gitkeep`) nella cartella condivisa; salta le cartelle senza README; ritorna la lista di id sincronizzati; solleva `FileNotFoundError` se il repo sorgente non esiste.

- [ ] **Step 1: Scrivere il test fallito**

Append to `tools/test_sync_writeups.py`:

```python
class TestSyncSource(unittest.TestCase):
    def _make_source(self, root):
        # level con README + screenshot
        l11 = root / "level-11"
        (l11 / "screenshots").mkdir(parents=True)
        (l11 / "README.md").write_text("# Natas Level 11 → 12\n", encoding="utf-8")
        (l11 / "screenshots" / "11-a.png").write_bytes(b"\x89PNG")
        (l11 / "screenshots" / ".gitkeep").write_text("", encoding="utf-8")
        # cartella di scaffolding vuota (senza README)
        (root / "level-12" / "screenshots").mkdir(parents=True)
        (root / "level-12" / "screenshots" / ".gitkeep").write_text("", encoding="utf-8")

    def test_copies_readme_and_screenshots_skips_scaffolding(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            src = base / "natas-overthewire"
            src.mkdir()
            self._make_source(src)
            writeups = base / "portfolio" / "writeups"
            writeups.mkdir(parents=True)
            synced = sw.sync_source("../natas-overthewire", "natas",
                                    writeups, base / "portfolio")
            self.assertEqual(synced, ["natas-11"])
            self.assertTrue((writeups / "natas" / "level-11.md").exists())
            self.assertTrue((writeups / "natas" / "screenshots" / "11-a.png").exists())
            # .gitkeep NON copiata
            self.assertFalse((writeups / "natas" / "screenshots" / ".gitkeep").exists())
            # scaffolding senza README NON copiata
            self.assertFalse((writeups / "natas" / "level-12.md").exists())

    def test_missing_repo_raises(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileNotFoundError):
                sw.sync_source("../nope", "natas", Path(d), Path(d))
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `python tools/test_sync_writeups.py TestSyncSource -v`
Expected: FAIL — `AttributeError: module 'sync_writeups' has no attribute 'sync_source'`.

- [ ] **Step 3: Implementare la funzione**

Append to `tools/sync_writeups.py` (dopo `regenerate_index`):

```python
def sync_source(repo_path, category, writeups_dir, base_dir):
    src_root = (base_dir / repo_path).resolve()
    if not src_root.is_dir():
        raise FileNotFoundError(f"Repo sorgente non trovato: {src_root}")
    target_md_dir = writeups_dir / category
    target_ss_dir = target_md_dir / "screenshots"
    target_md_dir.mkdir(parents=True, exist_ok=True)
    target_ss_dir.mkdir(parents=True, exist_ok=True)
    synced = []
    for level_dir in sorted(src_root.glob("level-*")):
        m = LEVEL_DIR_RE.match(level_dir.name)
        if not (level_dir.is_dir() and m):
            continue
        readme = level_dir / "README.md"
        if not readme.exists():
            continue  # cartella di scaffolding vuota
        level = m.group(1)
        shutil.copyfile(readme, target_md_dir / f"level-{level}.md")
        ss_dir = level_dir / "screenshots"
        if ss_dir.is_dir():
            for img in ss_dir.iterdir():
                if img.is_file() and img.name != ".gitkeep":
                    shutil.copyfile(img, target_ss_dir / img.name)
        synced.append(f"{category}-{level}")
    return synced
```

- [ ] **Step 4: Eseguire il test per verificare che passi**

Run: `python tools/test_sync_writeups.py TestSyncSource -v`
Expected: PASS (2 test OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): copia livelli e screenshot dal repo sorgente"
```

---

### Task 6: `run` + `main` (orchestrazione, scrittura index.json, exit code)

**Files:**
- Modify: `tools/sync_writeups.py`
- Test: `tools/test_sync_writeups.py`

**Interfaces:**
- Consumes: `sync_source`, `load_existing_descriptions`, `regenerate_index`, `MissingDescription`, costanti modulo.
- Produces: `run(sources: list, writeups_dir: Path, index_path: Path, base_dir: Path) -> list[dict]` (esegue Fase 1 + Fase 2 e scrive `index_path`); `main(argv=None) -> int` (usa le costanti modulo; ritorna `0` in caso di successo, `1` su `MissingDescription`/`FileNotFoundError`).

- [ ] **Step 1: Scrivere il test fallito**

Append to `tools/test_sync_writeups.py`:

```python
class TestRun(unittest.TestCase):
    def _setup(self, base):
        src = base / "natas-overthewire"
        (src / "level-11" / "screenshots").mkdir(parents=True)
        (src / "level-11" / "README.md").write_text(
            "<!-- portfolio-desc: Cifrario XOR e known-plaintext -->\n"
            "# Natas Level 11 → 12\n", encoding="utf-8")
        (src / "level-11" / "screenshots" / "11-a.png").write_bytes(b"\x89PNG")
        writeups = base / "portfolio" / "writeups"
        (writeups / "natas").mkdir(parents=True)
        # indice preesistente con una voce natas gia pubblicata
        (writeups / "index.json").write_text(json.dumps([
            {"id": "natas-10", "title": "Natas Level 10 → 11", "category": "natas",
             "level": "10", "description": "Command injection con filtro.",
             "file": "writeups/natas/level-10.md"},
        ], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        # il .md natas-10 deve esistere per essere ridiscoperto
        (writeups / "natas" / "level-10.md").write_text(
            "# Natas Level 10 → 11\n", encoding="utf-8")
        return writeups

    def test_run_writes_index_with_exact_format(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            writeups = self._setup(base)
            sources = [{"category": "natas", "repo_path": "../natas-overthewire"}]
            sw.run(sources, writeups, writeups / "index.json", base / "portfolio")
            content = (writeups / "index.json").read_text(encoding="utf-8")
            data = json.loads(content)
            ids = [e["id"] for e in data]
            self.assertEqual(ids, ["natas-10", "natas-11"])
            # natas-10 description preservata
            self.assertEqual(data[0]["description"], "Command injection con filtro.")
            # natas-11 description dal commento
            self.assertEqual(data[1]["description"], "Cifrario XOR e known-plaintext")
            # formato: accenti UTF-8 non-escaped, indent 2, newline finale
            self.assertIn("→", content)
            self.assertTrue(content.endswith("]\n"))
            # idempotenza: secondo run -> stesso contenuto
            sw.run(sources, writeups, writeups / "index.json", base / "portfolio")
            self.assertEqual((writeups / "index.json").read_text(encoding="utf-8"),
                             content)

    def test_run_raises_missing_description_for_new_level(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d)
            src = base / "natas-overthewire"
            (src / "level-12" / "screenshots").mkdir(parents=True)
            (src / "level-12" / "README.md").write_text(
                "# Natas Level 12 → 13\n", encoding="utf-8")  # no comment
            writeups = base / "portfolio" / "writeups"
            (writeups / "natas").mkdir(parents=True)
            (writeups / "index.json").write_text("[]\n", encoding="utf-8")
            sources = [{"category": "natas", "repo_path": "../natas-overthewire"}]
            with self.assertRaises(sw.MissingDescription):
                sw.run(sources, writeups, writeups / "index.json", base / "portfolio")
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `python tools/test_sync_writeups.py TestRun -v`
Expected: FAIL — `AttributeError: module 'sync_writeups' has no attribute 'run'`.

- [ ] **Step 3: Implementare `run` e `main`**

Append to `tools/sync_writeups.py` (dopo `sync_source`):

```python
def run(sources, writeups_dir, index_path, base_dir):
    for source in sources:
        synced = sync_source(source["repo_path"], source["category"],
                             writeups_dir, base_dir)
        print(f"[sync] {source['category']}: {len(synced)} livelli {synced}")
    existing = load_existing_descriptions(index_path)
    entries = regenerate_index(writeups_dir, existing)
    index_path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"[index] {len(entries)} voci -> {index_path}")
    return entries


def main(argv=None):
    try:
        run(SOURCES, WRITEUPS_DIR, INDEX_PATH, REPO_ROOT)
    except MissingDescription as e:
        print(
            "ERRORE: livelli nuovi senza description (manca il commento "
            "'<!-- portfolio-desc: ... -->' e non esiste una voce pregressa):",
            file=sys.stderr,
        )
        for entry_id in e.ids:
            print(f"  - {entry_id}", file=sys.stderr)
        return 1
    except FileNotFoundError as e:
        print(f"ERRORE: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Eseguire tutti i test per verificare che passino**

Run: `python tools/test_sync_writeups.py -v`
Expected: PASS (tutti i test di tutti i task OK).

- [ ] **Step 5: Commit**

```bash
git add tools/sync_writeups.py tools/test_sync_writeups.py
git commit -m "feat(sync): orchestrazione run/main e scrittura index.json"
```

---

### Task 7: Convenzione `portfolio-desc` nel repo natas-overthewire

**Files (repo `C:\Users\alber\Documents\Github\natas-overthewire`):**
- Modify: `_template/README.md`
- Modify: `level-11/README.md`
- Modify: `CLAUDE`

Questo task opera nell'**altro repo** (`natas-overthewire`). I commit vanno fatti lì.

- [ ] **Step 1: Aggiungere la riga placeholder al template**

In `natas-overthewire/_template/README.md`, inserire come **prima riga** del file:

```
<!-- portfolio-desc: FRASE BREVE DI SINTESI DEL LIVELLO (una riga) -->
```

(seguita da una riga vuota, poi il resto del template invariato).

- [ ] **Step 2: Aggiungere la riga reale al level-11**

In `natas-overthewire/level-11/README.md`, inserire come **prima riga** (prima di `# Natas Level 11 → 12`):

```
<!-- portfolio-desc: Cifrario XOR a chiave ripetuta e known-plaintext attack per forgiare il cookie di sessione. -->
```

seguita da una riga vuota. Verificare che l'H1 resti la prima riga non-commento.

- [ ] **Step 3: Documentare la convenzione nel CLAUDE del repo natas**

In `natas-overthewire/CLAUDE`, sotto la sezione "Regole ferme sul formato", aggiungere il bullet:

```
- Ogni README deve avere come prima riga il commento
  `<!-- portfolio-desc: ... -->` con una frase breve di sintesi: è la
  descrizione usata dal sito portfolio. Senza di essa la pubblicazione di un
  livello nuovo fallisce.
```

- [ ] **Step 4: Verificare**

Run:
```bash
cd "C:/Users/alber/Documents/Github/natas-overthewire" && head -1 level-11/README.md && head -1 _template/README.md && grep -c "portfolio-desc" CLAUDE
```
Expected: le prime righe sono i commenti `portfolio-desc`, e `grep -c` ≥ 1.

- [ ] **Step 5: Commit (nel repo natas)**

```bash
cd "C:/Users/alber/Documents/Github/natas-overthewire" && git add _template/README.md level-11/README.md CLAUDE && git commit -m "docs: convenzione portfolio-desc per il sync del portfolio"
```

---

### Task 8: Aggiornare la documentazione del portfolio (`CLAUDE.md`)

**Files:**
- Modify: `CLAUDE.md` (repo portfolio)

- [ ] **Step 1: Aggiornare la sezione "Struttura"**

In `CLAUDE.md`, nella sezione "## Struttura", aggiungere sotto la riga `js/marked.umd.js`:

```
tools/sync_writeups.py  # genera index.json e sincronizza i writeup dai repo sorgente
```

E annotare che `writeups/index.json` è **generato**, non editato a mano.

- [ ] **Step 2: Correggere la regola ora obsoleta sull'aggiunta di livelli**

In `CLAUDE.md`, nella sezione "## Interfaccia di navigazione writeups (vincolante)", sostituire il paragrafo che dice che aggiungere un livello significa "SOLO aggiungere le voci in writeups/index.json" con:

```
- Aggiungere un nuovo livello NON si fa editando `index.json` a mano:
  `index.json` è generato da `tools/sync_writeups.py`, che scandisce
  `writeups/` e ricava `title` dall'H1 e `description` dal commento
  `<!-- portfolio-desc: ... -->` in cima al README. Per un nuovo wargame
  resta necessario aggiungere la voce in `WARGAME_INFO` dentro `js/main.js`
  e una entry in `SOURCES` dentro `tools/sync_writeups.py`.
```

- [ ] **Step 3: Aggiungere una sezione sul workflow di pubblicazione**

In `CLAUDE.md`, aggiungere una nuova sezione:

```
## Pubblicare un livello (workflow sync)
1. Autorare `level-XX/README.md` (+ screenshot) nel repo sorgente del wargame,
   con in cima la riga `<!-- portfolio-desc: frase breve -->`.
2. Nel repo portfolio: `python tools/sync_writeups.py`.
3. `git add` + commit + push. Vercel deploya in automatico.
Lo script è un tool di authoring locale: non è un build step Vercel e non fa git.
```

- [ ] **Step 4: Verificare**

Run: `grep -c "sync_writeups" CLAUDE.md`
Expected: ≥ 2.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: index.json generato e workflow di pubblicazione via sync"
```

---

### Task 9: Run reale e verifica end-to-end (pubblicazione natas-11)

**Files:** nessuna modifica manuale; esegue lo script e verifica il risultato.

**Prerequisito:** Task 7 completato (il `level-11/README.md` sorgente ha la riga `portfolio-desc`).

- [ ] **Step 1: Eseguire il sync**

Run: `python tools/sync_writeups.py`
Expected stdout: `[sync] natas: 12 livelli [...natas-11]` e `[index] N voci -> ...index.json`, dove `N` = numero di `.md` in `writeups/` (33 bandit level-00..32 + 11 natas level-00..10 + natas-11 = 45; leggere il valore effettivo dall'output, non è hardcodato). Exit code 0.

- [ ] **Step 2: Verificare che il diff sia solo additivo**

Run:
```bash
cd "C:/Users/alber/Documents/Github/portfolio" && git status --short && echo "--- diff su livelli esistenti (deve essere vuoto) ---" && git diff --stat writeups/natas/level-00.md writeups/natas/level-10.md writeups/bandit/
```
Expected: `git status` mostra come nuovi `writeups/natas/level-11.md` e `writeups/natas/screenshots/11-*.png`, e come modificato `writeups/index.json`. Il diff su level-00/level-10/bandit è **vuoto** (nessun churn).

- [ ] **Step 3: Verificare la voce natas-11 in index.json**

Run: `git diff writeups/index.json`
Expected: il diff aggiunge **solo** il blocco `natas-11` (id, title `Natas Level 11 → 12`, category `natas`, level `11`, description dal commento, file `writeups/natas/level-11.md`), in coda alle natas. Nessuna riga esistente modificata.

- [ ] **Step 4: Verificare l'idempotenza**

Run: `python tools/sync_writeups.py && git status --short`
Expected: nessun nuovo cambiamento rispetto allo Step 2 (secondo run non produce diff aggiuntivo).

- [ ] **Step 5: Verifica visiva sul sito**

Aprire il sito in locale (es. `python -m http.server` dalla root del portfolio, poi navigare a `http://localhost:8000`) e controllare: pulsante Natas → il livello 11 compare nella lista → aprendolo il writeup si carica con i 5 screenshot visibili.

- [ ] **Step 6: Eseguire l'intera suite di test un'ultima volta**

Run: `python tools/test_sync_writeups.py -v`
Expected: PASS (tutti i test).

- [ ] **Step 7: Commit**

```bash
git add writeups/natas/level-11.md writeups/natas/screenshots/ writeups/index.json
git commit -m "content: pubblica natas-11 via sync_writeups"
```

---

## Note di verifica del piano (self-review)

- **Copertura spec:** §3 approccio → Task 1-6; §4 convenzione metadata → Task 3 (parsing) + Task 7 (adozione); §5 fasi/regole → Task 4-6; §6 file toccati → Task 7-8; §7 primo caso reale → Task 9; §8 criteri di successo → Task 9 Step 2-5.
- **Formato index.json:** verificato che `json.dumps(..., ensure_ascii=False, indent=2) + "\n"` riproduce byte-identico il file attuale (roundtrip IDENTICAL, 10690 char). Perciò il diff su voci esistenti è nullo.
- **Coerenza tipi/nomi:** `run(sources, writeups_dir, index_path, base_dir)`, `sync_source(repo_path, category, writeups_dir, base_dir)`, `build_entry(category, level, md_text, existing_desc)`, `MissingDescription.ids` — usati coerentemente in test e implementazione.
- **Conteggio voci (Task 9 Step 1):** il numero esatto va letto dall'output (numero di `.md` in `writeups/`); non è hardcodato nei test.
