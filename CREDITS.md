# Авторы и источники

- Шрифт **Pixellari** — Zacchary Dempsey-Plante (https://ztdp.ca), «100% Free», с просьбой указывать авторство. В `assets/fonts/Pixellari.ttf` — версия из Tradisea с перерисованной строчной «а».
- Элементы интерфейса (`assets/ui/`), трава, дороги, брусчатка, деревья и реквизит (`assets/tradisea/`) — из игры Tradisea того же автора.
- Персонажи, титаны, дома, руины и стена (`assets/raw/`, `assets/sprites/`) — сгенерированы в ChatGPT и переведены в пиксель-арт скриптами из `dev/`.

## Музыка (вся CC0, взята из Tradisea, источники сверены там в assets/music/CREDITS.md)

| Файл | Трек | Автор | Источник |
|---|---|---|---|
| assets/music/menu_castle_town.ogg | Castle Town | Will Carpenter | https://opengameart.org/content/castle-town |
| assets/music/menu_new_town.ogg | A New Town (RPG Theme) | cynicmusic | https://opengameart.org/content/a-new-town-rpg-theme |
| assets/music/city_exploration.ogg | Medieval: Exploration | RandomMind | https://opengameart.org/content/medieval-exploration |
| assets/music/city_market_day.ogg | Medieval: Market Day (loop) | RandomMind | https://opengameart.org/content/medieval-market-day |
| assets/music/ruins_lament.ogg | Fantasy: Lament for a Warrior's Soul | RandomMind | https://opengameart.org/content/fantasy-lament-for-a-warriors-soul |
| assets/music/ruins_rising_moon.ogg | Fantasy: Rising Moon | RandomMind | https://opengameart.org/content/fantasy-rising-moon |
| assets/music/field_fouler_horizon.ogg | Fouler l'horizon | Komiku | https://opengameart.org/content/fouler-lhorizon |
| assets/music/field_kings_feast.ogg | Medieval: King's Feast | RandomMind | https://opengameart.org/content/medieval-kings-feast |

## Звуки (`assets/sfx/`)

- Кнопки, окна, монетки-колокольчики, ошибки — Kenney (UI Audio, Impact Sounds, RPG Audio; CC0, kenney.nl), из Tradisea.
- Фанфара победы — RandomMind, «Medieval: Victory Theme» (первые 7 с, CC0).
- Рабочие звуки (cut, metal, thump) и падение дерева — сделаны кодом в Tradisea.
- Тросы, газ, взмах клинков, пар, шаги титанов, ракета и прочее — синтезируются прямо в игре (`src/audio.js`).
