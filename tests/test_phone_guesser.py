import io
import unittest
from contextlib import redirect_stderr, redirect_stdout

import phone_guesser as pg


class NormaliseMaskTests(unittest.TestCase):
    def test_wildcard_aliases_become_star(self):
        self.assertEqual(pg.normalise_mask("2218 26?x"), "221826**")
        self.assertEqual(pg.normalise_mask("221826_#"), "221826**")

    def test_strips_plus_country_code_for_plan(self):
        dk = pg.PLANS["dk"]
        self.assertEqual(pg.normalise_mask("+45 2218 26**", dk), "221826**")
        self.assertEqual(pg.normalise_mask("0045221826**", dk), "221826**")

    def test_keeps_digits_without_plan(self):
        self.assertEqual(pg.normalise_mask("+45 2218 26**"), "45221826**")

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            pg.normalise_mask("--")


class ExpandTests(unittest.TestCase):
    def test_count(self):
        self.assertEqual(pg.count_candidates("221826**"), 100)
        self.assertEqual(pg.count_candidates("22182600"), 1)

    def test_expand_two_wildcards(self):
        nums = list(pg.expand("221826**"))
        self.assertEqual(len(nums), 100)
        self.assertEqual(nums[0], "22182600")
        self.assertEqual(nums[-1], "22182699")
        self.assertEqual(len(set(nums)), 100)

    def test_expand_no_wildcards(self):
        self.assertEqual(list(pg.expand("22182600")), ["22182600"])

    def test_expand_non_adjacent(self):
        nums = list(pg.expand("2*18*6"))
        self.assertIn("201806", nums)
        self.assertIn("291896", nums)
        self.assertEqual(len(nums), 100)


class DanishPlanTests(unittest.TestCase):
    def setUp(self):
        self.dk = pg.PLANS["dk"]

    def test_every_prefix_covered(self):
        for p in range(10, 100):
            self.assertIn(f"{p:02d}", self.dk.ranges)

    def test_classification(self):
        self.assertEqual(self.dk.classify("22182600"), "mobile")
        self.assertEqual(self.dk.classify("33123456"), "fixed")
        self.assertEqual(self.dk.classify("70123456"), "special:split-charge")
        self.assertEqual(self.dk.classify("90123456"), "special:premium-rate")
        self.assertEqual(self.dk.classify("13123456"), "spare")
        self.assertEqual(self.dk.classify("37123456"), "m2m")
        self.assertEqual(self.dk.classify("2218260"), "invalid-length")

    def test_only_filter(self):
        rows = list(pg.candidates("**182600", self.dk, only=["mobile"]))
        prefixes = {n[:2] for n, _ in rows}
        self.assertTrue(all(self.dk.ranges[p] == "mobile" for p in prefixes))
        self.assertIn("22", prefixes)
        self.assertNotIn("33", prefixes)

    def test_special_filter_matches_subcategories(self):
        rows = list(pg.candidates("**182600", self.dk, only=["special"]))
        self.assertTrue(all(c.startswith("special:") for _, c in rows))
        self.assertGreater(len(rows), 0)


class CliTests(unittest.TestCase):
    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = pg.main(list(argv))
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue(), err.getvalue()

    def test_plain_output(self):
        code, out, err = self.run_cli("221826**")
        self.assertEqual(code, 0)
        lines = out.strip().splitlines()
        self.assertEqual(len(lines), 100)
        self.assertEqual(lines[0], "22182600")
        self.assertIn("100 candidate(s)", err)

    def test_plan_output_and_csv(self):
        code, out, _ = self.run_cli("221826**", "--plan", "dk", "--format", "csv")
        self.assertEqual(code, 0)
        lines = out.strip().splitlines()
        self.assertEqual(lines[0], "number,category")
        self.assertEqual(lines[1], "22182600,mobile")
        self.assertEqual(len(lines), 101)

    def test_summary(self):
        code, out, _ = self.run_cli("**182600", "--plan", "dk", "--summary")
        self.assertEqual(code, 0)
        self.assertIn("total", out)
        self.assertIn("mobile", out)

    def test_limit_enforced(self):
        code, _, err = self.run_cli("2*******")
        self.assertNotEqual(code, 0)
        self.assertIn("above --limit", err)

    def test_wrong_length_for_plan(self):
        code, _, err = self.run_cli("21826**", "--plan", "dk")
        self.assertNotEqual(code, 0)
        self.assertIn("8 digits", err)

    def test_only_requires_plan(self):
        code, _, err = self.run_cli("221826**", "--only", "mobile")
        self.assertNotEqual(code, 0)
        self.assertIn("--only requires --plan", err)


if __name__ == "__main__":
    unittest.main()
