# Credits

- Font **Pixellari** — Zacchary Dempsey-Plante (https://ztdp.ca), "100% Free", attribution requested. `assets/fonts/Pixellari.ttf` is a version with a redrawn lowercase Cyrillic "а".
- UI frames, buttons and icons in the Survey Corps style (`assets/ui/`: frame, card, button, tab, field, tip, plate, close, check, `i_*.png` and the currency icons) — generated in ChatGPT (`assets/raw/aot_ui_kit.png`, `assets/raw/aot_ui_icons.png`) and cut into pixel art with `dev/cut_kit.py`.
- Ground tiles (`assets/ground/`: grass, dirt road, cobblestones) — drawn procedurally by `dev/gen_ground.py`.
- Trees, bushes, flowers and town props (`assets/props/`) and the dice, rank and seal icons — generated in ChatGPT (`assets/raw/aot_nature.png`, `assets/raw/aot_props.png`) and cut with `dev/cut_kit.py` and `dev/fit_sprites.py`.
- Characters, titans, houses, ruins and the Wall (`assets/raw/`, `assets/sprites/`) — generated in ChatGPT and turned into pixel art with the scripts in `dev/`.

## Music (`assets/music/`)

All five tracks are composed for this game and rendered with the project's own synthesizer: `python3 dev/music.py` (instruments and mixing in `dev/synth.py`). No samples, loops or transcriptions of other music.

| File | Where it plays |
|---|---|
| menu_main.ogg | Menus and summons |
| city_square.ogg | Military Police (city) |
| ruins_ashes.ogg | Garrison (Shiganshina ruins) |
| field_gate.ogg | Survey Corps (fields) |
| boss_shifter.ogg | While a shifter boss is on the field |

## Sounds (`assets/sfx/`)

- Every sound file (clicks, chimes, blade cuts, metal, impacts, falls, casts, the victory fanfare) is synthesized by `python3 dev/sfx.py`.
- Cables, gas, blade swings, steam, titan steps, flares and more are synthesized live in the game (`src/audio.js`).
