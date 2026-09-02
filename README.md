# Phone number guesser

A static web page and a Python CLI. Both expand a phone number with missing digits into every candidate it could be,
and optionally classifies each candidate against a public numbering plan.

```
python3 phone_guesser.py 221826**
python3 phone_guesser.py 221826** --plan dk
python3 phone_guesser.py "+45 2218 26**" --plan dk --only mobile --format csv
python3 phone_guesser.py "**182600" --plan dk --summary
```

Unknown digits can be written as `*`, `?`, `x`, `_` or `#`. Spaces, dashes and
a leading `+45` / `0045` are ignored when a plan is selected.

## Website

`index.html` is the surprise that came after the guessing game: an invitation,
in Danish, to a bonfire with roast beef, marshmallows and stars, framed as an
official kidnapping notice. The "Nej" button runs away and eventually turns
into a "Ja". The case number shows the phone prefix with the last two digits
masked; open the page with the ending in the URL hash, for example
`index.html#00`, to fill it in. No build step, no dependencies, works locally
or on GitHub Pages.

## What it does and does not do

- Enumerates candidates locally. No network access, no lookups.
- With `--plan dk`, labels each candidate by its Danish number series:
  `mobile`, `fixed`, `mixed`, `m2m`, `special:<kind>`, `spare`. This lets you
  drop candidates that cannot be a subscriber number (premium rate, freephone,
  short codes, spare series) or keep only mobiles.
- Refuses masks that expand to more than 10,000 candidates unless `--all` is
  given.
- It cannot tell you which candidate belongs to a specific person. That would
  require probing carrier or messaging services, which this tool does not do.

## Numbering plan data

The Danish table follows the overall Danish numbering plan as summarised on
[Wikipedia](https://en.wikipedia.org/wiki/Telephone_numbers_in_Denmark) and
published by the [Danish authorities](https://en.digst.dk/telecom/telecom/numbering/).
Some fixed series contain block-level mobile exceptions; those two-digit
prefixes are marked `mixed`. Add another country by building a `Plan` in
`phone_guesser.py` and registering it in `PLANS`.

## Tests

```
python3 -m unittest discover -s tests -v
```
