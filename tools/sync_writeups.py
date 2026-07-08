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
