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


def load_existing_descriptions(index_path):
    if not index_path.exists():
        return {}
    data = json.loads(index_path.read_text(encoding="utf-8"))
    return {entry["id"]: entry["description"] for entry in data}


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
        newline="\n",
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
