import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync_writeups as sw

import json
import tempfile


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


if __name__ == "__main__":
    unittest.main()
