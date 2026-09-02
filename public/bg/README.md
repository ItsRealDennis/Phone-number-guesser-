# Baggrunde: bålet under stjernerne

Genereret 2026-09-02 i Higgsfield til scene 2 (`kidnap`) og scene 3 (`fire`).
Alt er tonet til sidens palet (`--night #0A0E1A`, `--ember #FF8A3D`,
`--amber #FFC46B`): mørk himmel, Mælkevejen, ét bål nederst, så teksten kan
stå i den øverste halvdel. Kameraet står stille i alle loops; kun ilden og
gnisterne bevæger sig, og første/sidste frame er ens, så `loop` er sømløs.

| Fil | Størrelse | Brug |
| --- | --- | --- |
| `meadow-16x9.{jpg,webp}` | 1920×1080 | Desktop, scene 2 eller 3. Eng ved kysten, to bænke, bålet nederst til højre |
| `meadow-16x9.{mp4,webm}` | 1280×720 · 5 s · lydløs | Samme motiv som loop |
| `meadow-9x16.{jpg,webp}` | 1080×1920 | Mobil, scene 2 eller 3. Bålring med bænke, bakker i horisonten |
| `meadow-9x16.{mp4,webm}` | 720×1280 · 5 s · lydløs | Samme motiv som loop |
| `meadow-alt-9x16.{jpg,webp}` | 1080×1920 | Alternativ mobil-still med kraftigere Mælkevej og to træstubbe |
| `close-16x9.{jpg,webp}` | 1920×1080 | Nærbillede af brænde og gløder — passer til scene 3 når bålet er tændt |
| `close-16x9.{mp4,webm}` | 1280×720 · 5 s · lydløs | Samme motiv som loop |
| `og.jpg` | 1200×630 | Delebillede (Open Graph / Twitter) |
| `stars-9x16.webp` | 941×1672 | Scene 4. Mælkevej og stjerneskud med plads til teksten |
| `hair-9x16.webp` | 941×1672 | Scene 5. To anonyme personer, bål og røg ved kysten |
| `embers-9x16.webp` | 941×1672 | Scene 6. Gløder og gnister under RSVP'en |

## Sådan bruges de

Stillbillede som baggrund på én scene (læg det bag `#sky`, eller sæt det på
selve scenen med lavere opacity, så canvas-stjernerne stadig tegner ovenpå):

```css
.scene[data-scene="kidnap"]::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: url(/bg/meadow-9x16.webp) center / cover no-repeat;
  opacity: .85;
}
@media (min-aspect-ratio: 1/1) {
  .scene[data-scene="kidnap"]::before { background-image: url(/bg/meadow-16x9.webp); }
}
```

Video-loop i stedet (JPEG som poster, så der er et billede før videoen er
klar, og på enheder der ikke autoplayer):

```html
<video class="bg-video" autoplay muted loop playsinline poster="/bg/meadow-16x9.jpg" aria-hidden="true">
  <source src="/bg/meadow-16x9.webm" type="video/webm">
  <source src="/bg/meadow-16x9.mp4" type="video/mp4">
</video>
```

Skift til `meadow-9x16.*` på smalle skærme med `matchMedia("(max-aspect-ratio: 1/1)")`,
eller brug `<source media="…">`-varianter. Respektér
`prefers-reduced-motion: reduce` ved at vise stillbilledet i stedet.

Delebillede — sæt det absolutte domæne ind når det er kendt:

```html
<meta property="og:title" content="Bålbortførelsen">
<meta property="og:description" content="Du bliver bortført. Til bål.">
<meta property="og:image" content="https://DOMÆNE/bg/og.jpg">
<meta name="twitter:card" content="summary_large_image">
```

## Kilder

Originalerne (2K PNG, 2752×1536 / 1536×2752) ligger i Higgsfield-kontoen;
job-id'er, hvis de skal hentes igen eller laves om:

- `meadow-16x9` — nano_banana_pro `691120a7-8d53-4aa3-9887-17776d58a371`; loop Kling 3.0 `f7d98e9c-a637-46a1-937c-30aaeb0e65c0`
- `meadow-9x16` — nano_banana_pro `5a08460b-cc57-4a97-bdfe-f19f41e7f672`; loop Kling 3.0 `c599bedd-e195-4bf8-ad24-7869e2879627`
- `meadow-alt-9x16` — seedream_v4_5 `cd5b6ea9-4266-488a-831e-66fef566b547`
- `close-16x9` — cinematic_studio_2_5 `d9fcce31-bb6d-4bde-a730-4718285353f8`; loop Kling 3.0 `a42edcb6-45e5-4a99-9ba8-ff56aaa3df52`

`stars-9x16.webp`, `hair-9x16.webp` og `embers-9x16.webp` er genereret
med OpenAI ImageGen til de resterende scener og optimeret som WebP.
