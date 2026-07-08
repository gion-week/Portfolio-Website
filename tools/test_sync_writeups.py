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
