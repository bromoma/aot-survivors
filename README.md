# Attack on Titan: Survivors

A fan-made survivors-style game inspired by *Attack on Titan*: swing through the city on ODM gear cables, gain height and cut titan napes. Three factions with an endless world, 12 heroes with levels and ultimates, 8 shifter bosses, skill evolutions, gear, a gacha with banners, a weekly challenge, a day/night cycle and weather, daily supplies, achievements, a guided first run and local player profiles.

**Play:** https://bromoma.github.io/aot-survivors/

The game is in English, Spanish and Russian (picked from the browser language, can be changed in Settings).

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Fly on cables (they lift you to roofs and trees) |
| Space | Attack the nearest nape (you need enough height) |
| E | Hero ultimate (when the gauge is full) |
| Esc | Pause |
| M | Sound on/off |

On phones: drag anywhere to fly, round buttons for attack and ultimate.

## Run locally

No build step and no dependencies — it is plain JavaScript.

```bash
node dev/serve.js
```

Then open http://localhost:5520/. Opening `index.html` straight from disk also works, but slower (sprite atlases need a server).

Handy debug links (only on localhost, they start muted and skip the login; add `auth=1` to test the login): `?ui=battle`, `?ui=squad`, `?ui=gacha`, `?ui=gear`, `?ui=ult&hero=levi`, `?ui=sky&t=230`, `?ui=boss_female`, `?lang=es`.

## Project layout

| Path | What is there |
|---|---|
| `index.html` | The page; scripts are loaded in order, no bundler |
| `src/game.js` | Main loop, player, titans, rendering of the world |
| `src/ui.js`, `src/ui.css` | All menus and the HUD (HTML on top of the canvas) |
| `src/combat.js` | Skills, evolutions, allies, bosses |
| `src/world.js` | Endless chunked world (roads, towns, forests) |
| `src/gacha.js`, `src/gear.js`, `src/heroes.js`, `src/meta.js` | Summons, gear, hero levels, training, missions, achievements |
| `src/loot.js`, `src/challenge.js`, `src/dex.js`, `src/ult.js`, `src/sky.js` | Elite chests, weekly challenge, Titanpedia, ultimates, day/night and weather |
| `src/profile.js`, `src/login.js`, `src/tutorial.js` | Player profiles (registration, PIN), daily supplies, first-run training |
| `src/audio.js` | Music and sound (files + sounds synthesized in code) |
| `src/i18n.js` | Translations |
| `assets/` | Sprites, atlases, UI, music, sounds |
| `dev/` | Tools: local server, sprite cutting and packing, headless tests and recordings |

## Translations

Every text in the code is written in English and wrapped in `tr()`:

```js
tr('Titans killed: {0}', game.kills)
```

Each English text needs a row in `I18N_ROWS` in `src/i18n.js`: `[English, Spanish, Russian]`. If the same English word needs two different translations, add a `#context` suffix (`'Rare#item'`); it is never shown. Check that nothing is missing with:

```bash
node dev/i18n_check.js es
```

After adding sprites run `node dev/pack.js` to rebuild the atlases.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes reach the live site only after the owner approves the pull request.

Non-commercial fan project. Font, music and sound authors are listed in [CREDITS.md](CREDITS.md).
