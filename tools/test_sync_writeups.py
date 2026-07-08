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


if __name__ == "__main__":
    unittest.main()
