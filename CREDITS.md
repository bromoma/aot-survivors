# Credits

- Font **Pixellari** — Zacchary Dempsey-Plante (https://ztdp.ca), "100% Free", attribution requested. `assets/fonts/Pixellari.ttf` is a version with a redrawn lowercase Cyrillic "а".
- UI frames, buttons and icons in the Survey Corps style (`assets/ui/`: frame, card, button, tab, field, tip, plate, close, check, `i_*.png` and the currency icons) — generated in ChatGPT (`assets/raw/aot_ui_kit.png`, `assets/raw/aot_ui_icons.png`) and cut into pixel art with `dev/cut_kit.py`.
- Ground tiles (`assets/ground/`: grass, dirt road, cobblestones) — drawn procedurally by `dev/gen_ground.py`.
- Trees, bushes, flowers and town props (`assets/props/`) and the dice, rank and seal icons — generated in ChatGPT (`assets/raw/aot_nature.png`, `assets/raw/aot_props.png`) and cut with `dev/cut_kit.py` and `dev/fit_sprites.py`.
- Characters, titans, houses, ruins and the Wall (`assets/raw/`, `assets/sprites/`) — generated in ChatGPT and turned into pixel art with the scripts in `dev/`.

## Music (all CC0, taken from Tradisea; sources checked there in assets/music/CREDITS.md)

| File | Track | Author | Source |
|---|---|---|---|
| assets/music/menu_castle_town.ogg | Castle Town | Will Carpenter | https://opengameart.org/content/castle-town |
| assets/music/menu_new_town.ogg | A New Town (RPG Theme) | cynicmusic | https://opengameart.org/content/a-new-town-rpg-theme |
| assets/music/city_exploration.ogg | Medieval: Exploration | RandomMind | https://opengameart.org/content/medieval-exploration |
| assets/music/city_market_day.ogg | Medieval: Market Day (loop) | RandomMind | https://opengameart.org/content/medieval-market-day |
| assets/music/ruins_lament.ogg | Fantasy: Lament for a Warrior's Soul | RandomMind | https://opengameart.org/content/fantasy-lament-for-a-warriors-soul |
| assets/music/ruins_rising_moon.ogg | Fantasy: Rising Moon | RandomMind | https://opengameart.org/content/fantasy-rising-moon |
| assets/music/field_fouler_horizon.ogg | Fouler l'horizon | Komiku | https://opengameart.org/content/fouler-lhorizon |
| assets/music/field_kings_feast.ogg | Medieval: King's Feast | RandomMind | https://opengameart.org/content/medieval-kings-feast |

## Sounds (`assets/sfx/`)

- Buttons, windows, coin chimes, errors — Kenney (UI Audio, Impact Sounds, RPG Audio; CC0, kenney.nl), via Tradisea.
- Victory fanfare — RandomMind, "Medieval: Victory Theme" (first 7 s, CC0).
- Work sounds (cut, metal, thump) and the falling tree — made in code in Tradisea.
- Cables, gas, blade swings, steam, titan steps, flares and more — synthesized in the game itself (`src/audio.js`).
