# Bålbortførelsen

An interactive invitation, in Danish, to a bonfire with roast beef,
marshmallows and stars. It started as a phone number with two digits missing
and a dare to guess them. Now that the number is found, the page kidnaps her.

Six scenes, one line of text each:

1. **Lås op.** A keypad. She types the last two digits of her own number.
2. **Bortført.** "Du bliver bortført." Press "Hvorhen?" to find out where.
3. **Bålet.** Tap to stack logs, light the fire, hang the roast beef, then
   hold a button to roast a marshmallow. Release at "lige præcis for brændt".
4. **Stjerner.** Tap the sky for shooting stars. Make a wish.
5. **Håret.** Flip the wind. Whichever way the smoke goes, he moves into it.
   There is a hat for her.
6. **Kommer du?** The "Nej" button runs away and eventually becomes a "Ja".

## Run it

```
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `VITE_ENDING` to the last two
digits. Without it, any two digits unlock the page. `VITE_REPLY_TO` is an
optional phone number for a "text him back" button on the last scene.

## Deploy on Vercel

1. Import the GitHub repo in Vercel. It detects Vite and uses `npm run build`
   with `dist` as the output directory. No other settings are needed.
2. Under Environment Variables, add `VITE_ENDING` with the two digits, and
   optionally `VITE_REPLY_TO`.
3. Deploy. The number is baked in at build time and never lives in the repo.

The ending can also be passed in the URL hash, for example `/#00`, which wins
over the environment variable.

## Project layout

- `index.html`, `src/` are the Vite app. `main.js` holds the scene logic,
  `sky.js` the star, ember and spark canvases, `fire.js` the bonfire.
- `public/bg/` contains the responsive Higgsfield bonfire loops, their still
  fallbacks, the generated scene backgrounds, and the social share image.
- `npm run build:single` produces `dist-single/index.html`, a one-file build
  for sharing without a server.
- `cli/phone_guesser.py` is the original command-line tool that expands a
  masked number into candidates and classifies them against the Danish
  numbering plan. `npm run test:cli` runs its tests.
