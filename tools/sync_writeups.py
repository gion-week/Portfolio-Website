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
