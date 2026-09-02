#!/usr/bin/env python3
"""Phone number guesser.

Takes a phone number with missing digits (e.g. ``221826**``) and prints every
number the mask could expand to. Optionally classifies each candidate against
a public numbering plan so you can drop ranges that cannot be a subscriber
number (spare series, premium rate, short codes) or keep only mobiles.

The tool never contacts any carrier or lookup service. It only enumerates and
classifies using published numbering-plan data.

Usage examples::

    python3 phone_guesser.py 221826**
    python3 phone_guesser.py 221826** --plan dk
    python3 phone_guesser.py "+45 2218 26**" --plan dk --only mobile --format csv
"""

from __future__ import annotations

import argparse
import itertools
import json
import re
import sys
from dataclasses import dataclass
from typing import Iterable, Iterator

WILDCARDS = set("*?xX_#")
DEFAULT_LIMIT = 10_000

# ---------------------------------------------------------------------------
# Numbering plans
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Plan:
    """A national numbering plan keyed by the leading two digits."""

    code: str
    name: str
    country_code: str
    length: int
    ranges: dict[str, str]  # two-digit prefix -> category
    source: str

    def classify(self, number: str) -> str:
        if len(number) != self.length:
            return "invalid-length"
        return self.ranges.get(number[:2], "unallocated")


def _fill(table: dict[str, str], lo: int, hi: int, category: str) -> None:
    for prefix in range(lo, hi + 1):
        table[f"{prefix:02d}"] = category


def _build_dk() -> Plan:
    """Denmark: 8-digit closed plan, no trunk prefix, country code +45.

    Categories follow the overall Danish numbering plan as summarised on
    Wikipedia (Telephone numbers in Denmark) and published by the Danish
    authorities (Energistyrelsen / Digitaliseringsstyrelsen). The plan has a
    few block-level exceptions inside the "fixed" series; those are marked
    ``mixed`` where the summary calls them out.
    """
    t: dict[str, str] = {}
    _fill(t, 10, 10, "special:carrier-preselect")
    _fill(t, 11, 12, "special:short-number")
    _fill(t, 13, 15, "spare")
    _fill(t, 16, 16, "special:network-access")
    _fill(t, 17, 17, "spare")
    _fill(t, 18, 18, "special:short-number")
    _fill(t, 19, 19, "spare")
    _fill(t, 20, 31, "mobile")
    _fill(t, 32, 36, "fixed")
    _fill(t, 37, 37, "m2m")
    _fill(t, 38, 39, "fixed")
    _fill(t, 40, 42, "mobile")
    _fill(t, 43, 49, "mixed")
    _fill(t, 50, 53, "mobile")
    _fill(t, 54, 55, "mixed")
    _fill(t, 56, 59, "fixed")
    _fill(t, 60, 61, "mobile")
    _fill(t, 62, 66, "fixed")
    _fill(t, 67, 68, "spare")
    _fill(t, 69, 69, "fixed")
    _fill(t, 70, 70, "special:split-charge")
    _fill(t, 71, 71, "mobile")
    _fill(t, 72, 79, "fixed")
    _fill(t, 80, 80, "special:freephone")
    _fill(t, 81, 81, "mobile")
    _fill(t, 82, 82, "fixed")
    _fill(t, 83, 85, "spare")
    _fill(t, 86, 89, "fixed")
    _fill(t, 90, 90, "special:premium-rate")
    _fill(t, 91, 93, "mobile")
    _fill(t, 94, 95, "spare")
    _fill(t, 96, 99, "fixed")
    return Plan(
        code="dk",
        name="Denmark",
        country_code="45",
        length=8,
        ranges=t,
        source="https://en.wikipedia.org/wiki/Telephone_numbers_in_Denmark; "
        "https://en.digst.dk/telecom/telecom/numbering/",
    )


PLANS: dict[str, Plan] = {"dk": _build_dk()}

# ---------------------------------------------------------------------------
# Mask handling
# ---------------------------------------------------------------------------


def normalise_mask(raw: str, plan: Plan | None = None) -> str:
    """Strip formatting and an optional country-code prefix from ``raw``.

    Keeps digits and wildcard characters. If ``plan`` is given and the mask
    starts with ``+<cc>`` or ``00<cc>``, that prefix is removed.
    """
    s = raw.strip()
    had_plus = s.startswith("+")
    s = "".join(ch for ch in s if ch.isdigit() or ch in WILDCARDS)
    if not s:
        raise ValueError("mask contains no digits or wildcards")
    if plan is not None:
        cc = plan.country_code
        if had_plus and s.startswith(cc) and len(s) - len(cc) == plan.length:
            s = s[len(cc):]
        elif s.startswith("00" + cc) and len(s) - len(cc) - 2 == plan.length:
            s = s[len(cc) + 2:]
    return "".join("*" if ch in WILDCARDS else ch for ch in s)


def count_candidates(mask: str) -> int:
    return 10 ** mask.count("*")


def expand(mask: str) -> Iterator[str]:
    """Yield every number the mask can expand to, in ascending order."""
    slots = [i for i, ch in enumerate(mask) if ch == "*"]
    if not slots:
        yield mask
        return
    chars = list(mask)
    for combo in itertools.product("0123456789", repeat=len(slots)):
        for i, d in zip(slots, combo):
            chars[i] = d
        yield "".join(chars)


def candidates(
    mask: str,
    plan: Plan | None = None,
    only: Iterable[str] | None = None,
) -> Iterator[tuple[str, str]]:
    """Yield ``(number, category)`` pairs.

    ``category`` is ``"unknown"`` when no plan is supplied. ``only`` filters to
    the given categories (matched on the part before any ``:``).
    """
    wanted = {o.lower() for o in only} if only else None
    for number in expand(mask):
        category = plan.classify(number) if plan else "unknown"
        if wanted is not None and category.split(":")[0] not in wanted:
            continue
        yield number, category


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _format_rows(rows: list[tuple[str, str]], fmt: str, plan: Plan | None) -> str:
    if fmt == "json":
        return json.dumps(
            [{"number": n, "category": c} for n, c in rows], indent=2
        )
    if fmt == "csv":
        lines = ["number,category"]
        lines += [f"{n},{c}" for n, c in rows]
        return "\n".join(lines)
    if plan is None:
        return "\n".join(n for n, _ in rows)
    width = max((len(n) for n, _ in rows), default=0)
    return "\n".join(f"{n:<{width}}  {c}" for n, c in rows)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="phone_guesser",
        description="Expand a phone number mask into every possible candidate.",
    )
    parser.add_argument(
        "mask",
        help="number with unknown digits as * ? x _ or # (e.g. 221826**)",
    )
    parser.add_argument(
        "--plan",
        choices=sorted(PLANS),
        help="classify candidates against this numbering plan",
    )
    parser.add_argument(
        "--only",
        action="append",
        metavar="CATEGORY",
        help="keep only these categories (repeatable): mobile, fixed, mixed, "
        "m2m, special, spare, unallocated. Requires --plan.",
    )
    parser.add_argument(
        "--format",
        choices=["plain", "csv", "json"],
        default="plain",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"refuse to expand more than this many candidates "
        f"(default {DEFAULT_LIMIT}); use --all to override",
    )
    parser.add_argument("--all", action="store_true", help="ignore --limit")
    parser.add_argument(
        "--summary", action="store_true", help="print counts per category only"
    )
    args = parser.parse_args(argv)

    plan = PLANS[args.plan] if args.plan else None
    if args.only and plan is None:
        parser.error("--only requires --plan")

    try:
        mask = normalise_mask(args.mask, plan)
    except ValueError as exc:
        parser.error(str(exc))

    if plan is not None and len(mask) != plan.length:
        parser.error(
            f"{plan.name} numbers are {plan.length} digits; "
            f"mask '{mask}' has {len(mask)}"
        )
    if not re.fullmatch(r"[0-9*]+", mask):
        parser.error(f"mask '{mask}' contains unsupported characters")

    total = count_candidates(mask)
    if total > args.limit and not args.all:
        parser.error(
            f"mask expands to {total:,} candidates, above --limit {args.limit:,}; "
            "narrow the mask or pass --all"
        )

    rows = list(candidates(mask, plan, args.only))

    if args.summary:
        counts: dict[str, int] = {}
        for _, c in rows:
            counts[c] = counts.get(c, 0) + 1
        for c in sorted(counts):
            print(f"{counts[c]:>8}  {c}")
        print(f"{len(rows):>8}  total")
        return 0

    print(_format_rows(rows, args.format, plan))
    if args.format == "plain":
        print(f"# {len(rows)} candidate(s) for mask {mask}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
