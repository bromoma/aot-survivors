'use strict';

const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const img = (src, cls = '') => `<img class="${cls}" src="assets/ui/${src}.png" alt="">`;
  const cv = c => {
    const n = document.createElement('canvas');
    n.width = c.width;
    n.height = c.height;
    n.getContext('2d').drawImage(c, 0, 0);
    return n;
  };

  const snd = (n, o) => { if (typeof SND !== 'undefined') SND.play(n, o); };
  let root, screen = 'hub', hubSel = 0, msgT = 0, revealIdx = 0, revealSummary = false, confirmReset = false;
  const layers = {};
  const hud = {};
  const cache = {};

  const HUB_ITEMS = [
    { id: 'battle', get label() { return tr('В бой'); }, icon: 'play' },
    { id: 'squad', get label() { return tr('Отряд'); }, icon: 'square' },
    { id: 'gear', get label() { return tr('Снаряжение'); }, icon: 'seal_red' },
    { id: 'training', get label() { return tr('Тренировки'); }, icon: 'pearl' },
    { id: 'gacha', get label() { return tr('Призыв'); }, icon: 'coin' },
    { id: 'missions', get label() { return tr('Задания'); }, icon: 'ribbon' },
    { id: 'records', get label() { return tr('Рекорды'); }, icon: 'seal_green' },
    { id: 'settings', get label() { return tr('Настройки'); }, icon: 'gear' },
  ];

  function settings() {
    if (!save.settings) save.settings = { shake: true, hints: true, music: 0.6, sfx: 0.8 };
    return save.settings;
  }

  function statsOf() {
    if (!save.stats) save.stats = { runs: 0, kills: 0, bestLevel: 1, wins: 0, time: 0 };
    return save.stats;
  }

  function upIcon(i) {
    const [c, g] = makeCanvas(14, 14, true);
    const P = (x, y, col) => rect(g, x, y, 1, 1, col);
    if (i === 0) {
      disc(g, 7, 7, 5, 5, '#8a9aa6');
      disc(g, 7, 7, 3, 3, '#3a4650');
      for (let a = 0; a < 6; a++) pline(g, 7, 7, 7 + Math.cos(a) * 5, 7 + Math.sin(a) * 5, 1, '#c8d4dc');
      disc(g, 7, 7, 1, 1, '#ffd36e');
    } else if (i === 1) {
      for (let a = 0; a < 3; a++) { disc(g, 7, 7, 6 - a * 2, 6 - a * 2, a % 2 ? '#a07a4a' : '#e8d8b0'); }
      disc(g, 7, 7, 1, 1, '#5a3a20');
      pline(g, 7, 1, 12, 1, 1, '#c8d4dc');
      pline(g, 12, 1, 12, 4, 1, '#c8d4dc');
    } else if (i === 2) {
      for (let a = 0.6; a < 5.6; a += 0.08) P(Math.round(7 + Math.cos(a) * 5), Math.round(7 + Math.sin(a) * 5), '#2e8c8a');
      for (let a = 0.6; a < 5.6; a += 0.08) P(Math.round(7 + Math.cos(a) * 4), Math.round(7 + Math.sin(a) * 4), '#7ad8d0');
      rect(g, 10, 1, 3, 1, '#2e8c8a'); rect(g, 12, 1, 1, 3, '#2e8c8a'); rect(g, 11, 2, 1, 1, '#2e8c8a');
    } else if (i === 3) {
      g.drawImage(HEART, 2, 3);
      rect(g, 10, 1, 1, 5, '#ffffff'); rect(g, 8, 3, 5, 1, '#ffffff');
    } else if (i === 4) {
      pline(g, 2, 2, 11, 11, 1, '#e6eef2');
      pline(g, 11, 2, 2, 11, 1, '#e6eef2');
      pline(g, 3, 2, 11, 10, 1, '#9aaab4');
      rect(g, 1, 11, 3, 2, '#6b4630'); rect(g, 10, 11, 3, 2, '#6b4630');
    } else if (i === 5) {
      rect(g, 1, 1, 12, 12, '#f2ece0');
      rect(g, 5, 3, 4, 8, '#d23a3a'); rect(g, 3, 5, 8, 4, '#d23a3a');
    } else if (i === 6) {
      disc(g, 5, 8, 3, 3, '#e6eef2'); disc(g, 9, 7, 4, 4, '#f6f9fb'); disc(g, 7, 5, 3, 3, '#ffffff');
      rect(g, 3, 11, 9, 1, '#b8c4ce');
    } else if (i === 7) {
      pline(g, 7, 12, 7, 6, 1, '#8a6a44');
      rect(g, 6, 5, 3, 3, '#e5484d');
      for (let a = 0; a < 8; a++) P(Math.round(7 + Math.cos(a * 0.785) * 4), Math.round(4 + Math.sin(a * 0.785) * 3), a % 2 ? '#fff2a8' : '#ffd36e');
      P(7, 1, '#ffffff');
    } else if (i === 8) {
      rect(g, 2, 6, 8, 4, '#3a3632'); rect(g, 2, 6, 8, 1, '#6a655c'); rect(g, 9, 5, 2, 6, '#2a2622');
      disc(g, 4, 11, 2, 2, '#6b4630'); disc(g, 8, 11, 2, 2, '#6b4630');
      disc(g, 12, 4, 1, 1, '#1e1a18'); P(11, 3, '#8a8478');
    } else if (i === 9) {
      for (let y = 0; y < 8; y++) { rect(g, 6 - y * 0.6, 3 + y, 1 + y * 0.6, 1, '#3f6fb5'); rect(g, 7, 3 + y, 1 + y * 0.6, 1, '#eef2f6'); }
      rect(g, 4, 11, 6, 1, '#2a4f86');
    } else if (i === 11) {
      rect(g, 3, 2, 8, 11, '#8a5a30'); rect(g, 4, 3, 6, 9, '#f2e4c4'); rect(g, 3, 2, 1, 11, '#5a3a20');
      for (let k = 0; k < 4; k++) rect(g, 5, 5 + k * 2, 4, 1, '#8a7a60');
      P(10, 1, '#ffd36e'); P(11, 2, '#ffd36e'); P(12, 1, '#fff2a8');
    } else if (i === 12) {
      for (let k = 0; k < 3; k++) { disc(g, 7, 11 - k * 3, 4, 1.5, '#b07a20'); disc(g, 7, 10 - k * 3, 4, 1.5, '#ffd36e'); }
      P(5, 3, '#fff2a8');
    } else if (i === 13) {
      rect(g, 2, 2, 10, 10, '#f4f0e6'); rect(g, 2, 11, 10, 1, '#b8b0a0'); rect(g, 11, 2, 1, 10, '#c8c0b0');
      for (const [x, y] of [[4, 4], [9, 4], [6, 7], [4, 9], [9, 9]]) rect(g, x, y, 1, 1, '#2a1c12');
    } else if (i === 14) {
      g.drawImage(HEART, 3, 5);
      for (let k = 0; k < 4; k++) { P(2 - k * 0 + k, 4 - k, '#eef2f6'); P(12 - k, 4 - k, '#eef2f6'); }
      rect(g, 0, 6, 3, 1, '#c8d4dc'); rect(g, 11, 6, 3, 1, '#c8d4dc');
    } else if (i === 15) {
      pline(g, 3, 12, 11, 2, 1, '#e6eef2'); pline(g, 4, 12, 12, 2, 1, '#9aaab4');
      rect(g, 2, 11, 3, 2, '#6b4630');
      P(11, 6, '#ffd36e'); P(10, 7, '#ffd36e'); P(12, 7, '#ffd36e'); P(11, 8, '#ffd36e'); P(11, 7, '#fff2a8');
    } else {
      for (let a = 0; a < 6; a++) {
        const x = Math.round(7 + Math.cos(a * 1.047) * 5), y = Math.round(7 + Math.sin(a * 1.047) * 4);
        pline(g, 7, 7, x, y, 1, '#c8d4dc');
        rect(g, x, y - 1, 1, 2, '#6b4630');
      }
      disc(g, 7, 7, 1, 1, '#2e8c8a');
    }
    return outlineCanvas(c, OUTLINE);
  }

  function emblem(id) {
    if (!cache['em' + id]) cache['em' + id] = EMBLEMS[id];
    return cv(cache['em' + id]);
  }

  function face(id) {
    return cv(heroPortrait(id) || portrait(id));
  }

  function body(id) {
    return cv(heroImg(id, 'down', false));
  }

  function rarityClass(r) { return 'r' + r; }

  const STAR = {};
  function starImg(on) {
    if (STAR[on]) return STAR[on];
    const [c, g] = makeCanvas(7, 7, true);
    const rows = ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'];
    rows.forEach((r, y) => { for (let x = 0; x < 7; x++) if (r[x] === '#') rect(g, x, y, 1, 1, on ? (y < 2 ? '#fff2a8' : '#f0b020') : '#b8a890'); });
    STAR[on] = c.toDataURL();
    return STAR[on];
  }
  function starsHTML(n) {
    let h = '';
    for (let i = 0; i < 5; i++) h += '<img src="' + starImg(i < n) + '" alt="">';
    return '<span class="stars">' + h + '</span>';
  }

  function build() {
    root = el('div');
    root.id = 'ui';
    document.body.appendChild(root);
    for (const id of ['menu', 'hud', 'levelup', 'pause', 'result', 'reveal']) {
      const L = el('div', 'layer');
      L.id = id;
      root.appendChild(L);
      layers[id] = L;
    }
    buildMenu();
    buildHud();
  }

  function buildMenu() {
    const M = layers.menu;
    M.innerHTML = `
      <div class="screen" data-s="hub">
        <div class="logo"><div class="title">${tr('АТАКА ТИТАНОВ')}</div><div class="sub">SURVIVORS</div></div>
        <div class="hub-hero k-frame">
          <div class="stage"><img id="hub-hero-img" alt=""></div>
          <div class="name" id="hub-hero-name"></div>
          <div class="center stars" id="hub-hero-stars"></div>
          <div class="ability" id="hub-hero-ab"></div>
        </div>
        <div class="hub-menu" id="hub-menu"></div>
      </div>
      <div class="screen" data-s="battle"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">${tr('Выбери вылазку')}</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="factions" id="factions"></div>
        <div class="threat" id="threat"></div>
        <div class="buttons"><button class="k-btn big" id="go">${img('play')} ${tr('В бой!')}</button></div>
        <div class="center muted" style="margin-top:8px">${tr('WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака по затылку')}</div>
      </div></div></div>
      <div class="screen" data-s="squad"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">${tr('Отряд')}</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="row" style="align-items:flex-start">
          <div class="squad" id="squad"></div>
          <div class="squad-detail k-card" id="squad-detail"></div>
        </div>
      </div></div></div>
      <div class="screen" data-s="gacha"><div class="panel-wrap"><div class="panel k-frame gacha-v2">
        <div class="head"><span class="h2">${tr('Призыв')}</span><div class="g-tabs" id="g-tabs"></div><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="g-stage" id="g-stage"></div>
        <div class="g-row"><div class="g-info" id="g-info"></div><div class="g-btns" id="g-btns"></div></div>
        <div class="g-history k-card hid" id="g-history"></div>
      </div></div></div>
      <div class="screen" data-s="gear"><div class="panel-wrap"><div class="panel k-frame gear-v">
        <div class="head"><span class="h2">${tr('Снаряжение')}</span><span class="gear-coll" id="gear-coll"></span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="row" style="align-items:flex-start">
          <div class="gear-left"><div class="gear-slots" id="gear-slots"></div><div class="gear-tot k-card" id="gear-tot"></div></div>
          <div class="gear-right"><div class="gear-inv" id="gear-inv"></div><div class="gear-info k-card" id="gear-info"></div></div>
        </div>
      </div></div></div>
      <div class="screen" data-s="training"><div class="panel-wrap"><div class="panel k-frame" style="width:min(1000px,94vw)">
        <div class="head"><span class="h2">${tr('Тренировки кадетского корпуса')}</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="muted" style="margin-bottom:8px">${tr('Постоянные улучшения за жетоны — действуют в каждом забеге')}</div>
        <div class="train-grid" id="training"></div>
      </div></div></div>
      <div class="screen" data-s="missions"><div class="panel-wrap"><div class="panel k-frame" style="width:min(820px,94vw)">
        <div class="head"><span class="h2">${tr('Задания')}</span><span class="rank" id="rank"></span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="sec">${tr('Сегодня')}</div>
        <div class="mis-list" id="daily"></div>
        <div class="sec">${tr('Достижения')}</div>
        <div class="mis-list" id="achievements"></div>
      </div></div></div>
      <div class="screen" data-s="records"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">${tr('Рекорды')}</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="list" id="records"></div>
      </div></div></div>
      <div class="screen" data-s="settings"><div class="panel-wrap"><div class="panel k-frame" style="width:min(560px,92vw)">
        <div class="head"><span class="h2">${tr('Настройки')}</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div id="settings"></div>
      </div></div></div>
      <div class="bottom-bar">
        <div class="row" style="gap:10px"><div class="coins k-card"><img src="assets/ui/coin.png" alt=""><span id="tokens"></span></div><div class="coins k-card rank-plate"><img src="assets/ui/ribbon.png" alt=""><span id="rank-foot"></span></div></div>
        <div class="hint" id="menu-hint"></div>
      </div>
      <div class="msg k-tip" id="msg"></div>`;
    const hm = $('#hub-menu', M);
    HUB_ITEMS.forEach((it, i) => {
      const b = el('button', 'k-btn', `${img(it.icon, 'ico')} ${it.label}${it.id === 'missions' ? '<span class="badge" id="mis-badge"></span>' : it.id === 'gacha' ? '<span class="badge" id="gacha-badge"></span>' : it.id === 'gear' ? '<span class="badge" id="gear-badge"></span>' : ''}`);
      b.addEventListener('click', () => go(it.id));
      b.addEventListener('mouseenter', () => { hubSel = i; refreshHubFocus(); });
      hm.appendChild(b);
    });
    M.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => go('hub')));
    $('#go', M).addEventListener('click', () => start());
  }

  function buildHud() {
    const Hd = layers.hud;
    Hd.innerHTML = `
      <div class="tl">
        <div class="plate wood-text"><span id="hud-face"></span><div class="hearts" id="hud-hearts"></div><span id="hud-name"></span></div>
        <div style="position:relative"><div class="gauge k-field" id="hud-gauge"><div class="fill"></div><div class="need"></div></div><div class="gauge-label wood-text">${tr('ВЫСОТА')}</div></div>
      </div>
      <div class="top">
        <div class="plate wood-text timer" id="hud-timer"></div>
        <div class="wood-text kills" id="hud-kills"></div>
        <div class="bossbar k-card" id="hud-boss"><div class="bname" id="hud-boss-name"></div><div class="segs" id="hud-boss-segs"></div></div>
        <div class="combo" id="hud-combo"></div>
      </div>
      <div class="skills" id="hud-skills"></div>
      <div class="banner" id="hud-banner"><div class="bt" id="hud-banner-t"></div><div class="bs" id="hud-banner-s"></div></div>
      <div class="tr">
        <div class="plate wood-text" id="hud-civ"></div>
        <button class="k-icon" id="hud-pause">${img('gear')}</button>
      </div>
      <div class="lvl wood-text" id="hud-lvl"></div>
      <div class="xp k-field"><div class="bar" id="hud-xp"></div></div>
      <div class="tip-line k-tip" id="hud-tip">${IS_TOUCH ? tr('Веди пальцем — полёт на тросах к крышам и деревьям. С высоты — круглая кнопка: атака по затылку') : tr('WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака')}</div>
      ${IS_TOUCH ? '<div class="tzone" id="tzone"></div><div class="tstick" id="tstick"><i></i></div><button class="tatk" id="tatk">⚔</button>' : ''}`;
    Object.assign(hud, {
      face: $('#hud-face', Hd), hearts: $('#hud-hearts', Hd), name: $('#hud-name', Hd), gauge: $('#hud-gauge', Hd),
      fill: $('#hud-gauge .fill', Hd), need: $('#hud-gauge .need', Hd), timer: $('#hud-timer', Hd), kills: $('#hud-kills', Hd),
      combo: $('#hud-combo', Hd), boss: $('#hud-boss', Hd), bossName: $('#hud-boss-name', Hd), bossSegs: $('#hud-boss-segs', Hd), skills: $('#hud-skills', Hd), banner: $('#hud-banner', Hd), bannerT: $('#hud-banner-t', Hd), bannerS: $('#hud-banner-s', Hd), civ: $('#hud-civ', Hd), lvl: $('#hud-lvl', Hd), xp: $('#hud-xp', Hd), tip: $('#hud-tip', Hd),
    });
    $('#hud-pause', Hd).addEventListener('click', () => { if (state === 'play') state = 'paused'; });
    if (IS_TOUCH) {
      const zone = $('#tzone', Hd), stick = $('#tstick', Hd), knob = $('#tstick i', Hd), atk = $('#tatk', Hd);
      let pid = null, ox = 0, oy = 0;
      const R = 56;
      zone.addEventListener('pointerdown', e => {
        if (pid !== null || state !== 'play') return;
        pid = e.pointerId; ox = e.clientX; oy = e.clientY;
        zone.setPointerCapture(pid);
        stick.style.left = ox + 'px'; stick.style.top = oy + 'px';
        stick.classList.add('on');
        knob.style.transform = 'translate(-50%, -50%)';
        TOUCH.on = true; TOUCH.x = 0; TOUCH.y = 0;
        e.preventDefault();
      });
      zone.addEventListener('pointermove', e => {
        if (e.pointerId !== pid) return;
        let dx = e.clientX - ox, dy = e.clientY - oy;
        const l = Math.hypot(dx, dy);
        if (l > R) { ox += dx * (1 - R / l); oy += dy * (1 - R / l); dx = e.clientX - ox; dy = e.clientY - oy; stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; }
        TOUCH.x = dx / R; TOUCH.y = dy / R;
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        e.preventDefault();
      });
      const end = e => { if (e.pointerId !== pid) return; pid = null; TOUCH.on = false; TOUCH.x = TOUCH.y = 0; stick.classList.remove('on'); };
      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
      atk.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); atk.classList.add('hit'); setTimeout(() => atk.classList.remove('hit'), 120); engage(); });
    }
  }

  function go(id) {
    if (id !== screen) snd(id === 'hub' ? 'close' : 'open', { vol: 0.6 });
    screen = id;
    confirmReset = false;
    layers.menu.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.dataset.s === id));
    if (id === 'hub') refreshHub();
    if (id === 'battle') refreshBattle();
    if (id === 'squad') refreshSquad();
    if (id === 'gacha') refreshGacha();
    if (id === 'gear') refreshGear();
    if (id === 'records') refreshRecords();
    if (id === 'training') refreshTraining();
    if (id === 'missions') refreshMissions();
    if (id === 'settings') refreshSettings();
    refreshFooter();
  }

  function refreshFooter() {
    $('#tokens').textContent = save.tokens;
    const rk = rankInfo();
    $('#rank-foot').textContent = rk.name;
    const n = claimableCount();
    const bd = $('#mis-badge');
    if (bd) { bd.textContent = n || ''; bd.style.display = n ? '' : 'none'; }
    const gb = $('#gacha-badge'), gt = (freeAvailable() ? 1 : 0) + tickets() + (gachaState().tickets10 || 0);
    if (gb) { gb.textContent = gt ? (freeAvailable() && gt === 1 ? '!' : gt) : ''; gb.style.display = gt ? '' : 'none'; }
    const nb = $('#gear-badge'), gs = gearSave(), nn = Object.keys(gs.items).filter(k => !(gs.seen || {})[k]).length;
    if (nb) { nb.textContent = nn || ''; nb.style.display = nn ? '' : 'none'; }
    const hints = { gear: tr('Клик по ячейке — фильтр, по предмету — подробнее, Esc — назад'), hub: tr('↑↓ — выбрать, Enter — открыть'), battle: tr('← → — фракция, ↑↓ — угроза, Enter — в бой, Esc — назад'), squad: tr('Стрелки — выбрать, Enter — взять в бой, Esc — назад'), gacha: tr('1 — один призыв, 0 — десять, F — бесплатный, T — билет, Tab — баннер, Esc — назад'), records: tr('Esc — назад'), settings: tr('Esc — назад'), training: tr('Клик — купить уровень, Esc — назад'), missions: tr('Клик — забрать награду, Esc — назад') };
    $('#menu-hint').textContent = hints[screen] || '';
  }

  function refreshHubFocus() {
    [...$('#hub-menu').children].forEach((b, i) => b.classList.toggle('focus', i === hubSel));
  }

  function refreshHub() {
    const hero = charById(save.selected);
    const spr = heroImg(hero.id, 'down', false);
    if (spr) $('#hub-hero-img').src = spr.toDataURL();
    $('#hub-hero-name').textContent = hero.name;
    $('#hub-hero-name').className = 'name ' + rarityClass(hero.rarity);
    $('#hub-hero-stars').innerHTML = `<span class="${rarityClass(hero.rarity)}">${starsHTML(save.chars[hero.id] || 1)}</span>`;
    $('#hub-hero-ab').textContent = hero.ability;
    refreshHubFocus();
  }

  function refreshBattle() {
    const box = $('#factions');
    box.innerHTML = '';
    FACTIONS.forEach((f, i) => {
      const c = el('div', 'faction k-card' + (i === factionSel ? ' sel' : ''));
      c.appendChild(emblem(f.id));
      const b = bestOf(f);
      c.insertAdjacentHTML('beforeend', `<div class="fname">${f.name}</div><div class="diff" style="color:${['#2c7030', '#a8681a', '#b8302a'][i]}">${tr('{0} · жетоны x{1}', f.diff, [1, 1.5, 2][i])}</div><div class="desc">${f.desc}</div><div class="muted">${b ? tr('Рекорд: {0}', fmtTime(b)) : tr('Ещё не пройдено')}</div>`);
      c.addEventListener('click', () => {
        if (i === factionSel) start();
        else { factionSel = i; requestReset(); refreshBattle(); }
      });
      box.appendChild(c);
    });
    const tb = $('#threat');
    const f = FACTIONS[factionSel], max = threatMax(factionSel);
    save.threatSel = save.threatSel || {};
    const cur = clamp(save.threatSel[f.id] || 1, 1, max);
    tb.innerHTML = '<span class="tl">' + tr('Угроза:') + '</span>';
    THREAT_NAMES.forEach((n, k) => {
      const b = el('button', 'k-btn th' + (k + 1 === cur ? ' sel' : '') + (k + 1 > max ? ' off' : ''), n);
      b.title = k + 1 > max ? tr('Открой: выживи 10 минут на угрозе {0}', THREAT_NAMES[k - 1]) : tr('Больше титанов, они быстрее и злее. Жетоны x{0}', (1 + 0.3 * k).toFixed(1));
      b.addEventListener('click', () => setThreat(k + 1));
      tb.appendChild(b);
    });
    tb.insertAdjacentHTML('beforeend', `<span class="muted">${cur > 1 ? tr('титаны злее, жетоны x{0}', (1 + 0.3 * (cur - 1)).toFixed(1)) : tr('выживи 10 минут, чтобы открыть следующую')}</span>`);
  }

  function setThreat(k) {
    const f = FACTIONS[factionSel];
    if (k < 1 || k > threatMax(factionSel)) return;
    save.threatSel = save.threatSel || {};
    save.threatSel[f.id] = k;
    persist();
    requestReset();
    refreshBattle();
  }

  let squadSel = 0;
  function refreshSquad() {
    const box = $('#squad');
    box.innerHTML = '';
    CHARS.forEach((c, i) => {
      const owned = save.chars[c.id];
      const d = el('div', 'hero-card k-card' + (i === squadSel ? ' sel' : '') + (owned ? '' : ' locked') + (save.selected === c.id ? ' chosen' : ''));
      d.appendChild(face(c.id));
      d.insertAdjacentHTML('beforeend', `<div class="hn">${owned ? c.name : '???'}</div><div class="${rarityClass(c.rarity)}">${owned ? starsHTML(owned) : RARITY[c.rarity].name}</div>${owned ? '<div class="hlv">' + tr('Ур. {0}', heroLevel(c.id)) + '</div>' : ''}`);
      d.addEventListener('click', () => { squadSel = i; refreshSquad(); });
      d.addEventListener('dblclick', () => { squadSel = i; pickHero(); });
      box.appendChild(d);
    });
    const c = CHARS[squadSel], owned = save.chars[c.id];
    const det = $('#squad-detail');
    det.innerHTML = '';
    det.appendChild(face(c.id));
    const L = heroLevelOf(heroXp(c.id));
    det.insertAdjacentHTML('beforeend', `<div class="center h2 ${rarityClass(c.rarity)}" style="line-height:1">${owned ? c.name : tr('Не открыт')}</div>
      <div class="center ${rarityClass(c.rarity)}">${RARITY[c.rarity].name} ${owned ? starsHTML(owned) : ''}</div>
      <div class="center muted ab">${owned ? c.ability : tr('Можно получить в «Призыве»')}</div>`);
    if (owned) {
      det.insertAdjacentHTML('beforeend', `<div class="hx"><b>${tr('Ур. {0}', L.level)}</b> / ${HERO_MAX}<div class="xpb"><i style="width:${L.need ? Math.round(L.into / L.need * 100) : 100}%"></i></div><span class="muted">${L.need ? L.into + ' / ' + L.need : tr('Максимум')}</span></div>
        <div class="muted small">${L.level > 1 ? heroBonusText(L.level) : tr('Каждый уровень: +1% к скорости и облёту')}</div>
        <div class="perks">${HERO_PERKS.map(p => `<div class="perk${L.level >= p.at ? ' on' : ''}"><span class="pl">${tr('Ур. {0}', p.at)}</span>${p.text(c.id)}</div>`).join('')}</div>`);
    }
    const btn = el('button', 'k-btn' + (owned && save.selected !== c.id ? '' : ' off'), save.selected === c.id ? tr('Уже в бою') : owned ? tr('Взять в бой') : tr('Закрыт'));
    btn.style.width = '100%';
    btn.addEventListener('click', pickHero);
    det.appendChild(btn);
    if (save.golden && save.golden[c.id]) {
      save.goldOff = save.goldOff || {};
      const on = !save.goldOff[c.id];
      const gb = el('button', 'k-btn gold-btn' + (on ? ' sel' : ''), '✦ ' + (on ? tr('Золотой мундир: вкл') : tr('Золотой мундир: выкл')));
      gb.style.width = '100%';
      gb.addEventListener('click', () => { save.goldOff[c.id] = on; persist(); snd('click', { vol: 0.6 }); refreshSquad(); });
      det.appendChild(gb);
    }
    if (owned && L.level < HERO_MAX) {
      const row = el('div', 'row hbtns');
      const tb = el('button', 'k-btn' + (save.tokens >= TRAIN_COST ? '' : ' off'), `${tr('Тренировать +{0}', TRAIN_XP)} · <img src="assets/ui/coin.png" alt="">${TRAIN_COST}`);
      tb.addEventListener('click', () => { const r = trainHero(c.id); if (!r) { toast(tr('Не хватает жетонов — сыграй забег')); snd('error', { vol: 0.6 }); return; } snd(r > 1 ? 'levelup' : 'confirm', { vol: 0.6 }); if (r > 1) toast(tr('{0}: уровень {1}!', c.name, heroLevel(c.id))); refreshSquad(); refreshFooter(); });
      const mb = el('button', 'k-btn' + ((save.manuals || 0) > 0 ? '' : ' off'), `<img src="assets/ui/scroll.png" alt=""> +${MANUAL_XP} (${save.manuals || 0})`);
      mb.title = tr('Наставление: +{0} опыта герою', MANUAL_XP);
      mb.addEventListener('click', () => { const r = useManual(c.id); if (!r) { toast(tr('Наставления выпадают в «Призыве»')); snd('error', { vol: 0.6 }); return; } snd(r > 1 ? 'levelup' : 'confirm', { vol: 0.6 }); if (r > 1) toast(tr('{0}: уровень {1}!', c.name, heroLevel(c.id))); refreshSquad(); });
      row.appendChild(tb);
      row.appendChild(mb);
      det.appendChild(row);
    }
  }

  function pickHero() {
    const c = CHARS[squadSel];
    if (!save.chars[c.id]) return;
    save.selected = c.id;
    persist();
    toast(tr('{0} идёт в бой', c.name));
    refreshSquad();
  }

  let gBanner = 'event';
  function fmtDur(ms) {
    const h = Math.max(0, Math.floor(ms / 3600000));
    return h >= 24 ? tr('{0} д {1} ч', Math.floor(h / 24), h % 24) : tr('{0} ч', h);
  }

  const TIERC = { 1: '#d8d4cc', 2: '#7cdc7c', 3: '#6fb6ff', 4: '#c58cff', 5: '#ffd36e' };
  function rarName(r) { return r.kind === 'hero' ? RARITY[r.rarity].name : GEAR_RAR[r.rarity].name; }
  function resName(r) { return r.kind === 'hero' ? r.c.name : r.kind === 'gear' ? tr(r.gear.name) : tr('Наставление'); }
  function resIcon(r, big) {
    if (r.kind === 'hero') { const c = big ? cv(heroImg(r.c.id, 'down', false)) : face(r.c.id); if (r.golden) { const v = cv(variant(big ? heroImg(r.c.id, 'down', false) : (heroPortrait(r.c.id) || portrait(r.c.id)), 'gold')); return v; } return c; }
    if (r.kind === 'gear') return cv(gearIcon(r.gear.id));
    const im = document.createElement('img'); im.src = 'assets/ui/scroll.png'; return im;
  }
  function resNote(r) {
    if (r.kind === 'hero') return r.golden ? tr('ЗОЛОТОЙ!') : r.isNew ? tr('Новый!') : r.refund ? '+' + r.refund : '★' + r.stars;
    if (r.kind === 'gear') return r.isNew ? tr('Новое!') : r.maxed ? tr('Макс.') : tr('Ур. {0}', r.lvl);
    return '+' + MANUAL_XP;
  }
  function collStats() {
    return { heroes: Object.keys(save.chars).length, gold: Object.keys(save.golden || {}).length, gear: gearOwned() };
  }

  function refreshGacha() {
    const B = bannerInfo(), g = gachaState();
    const tabs = $('#g-tabs');
    tabs.innerHTML = '';
    for (const [k, label] of [['event', tr('Особый')], ['arsenal', tr('Арсенал')], ['standard', tr('Стандартный')], ['shop', tr('Обмен')]]) {
      const b = el('button', 'k-btn gt' + (k === gBanner ? ' sel' : ''), label);
      b.addEventListener('click', () => { gBanner = k; snd('click', { vol: 0.6 }); refreshGacha(); });
      tabs.appendChild(b);
    }
    const st = $('#g-stage');
    if (gBanner === 'shop') { refreshShop(); return; }
    st.className = 'g-stage ' + (gBanner === 'event' ? 'ev' : gBanner === 'arsenal' ? 'ars' : 'std');
    let sp = '';
    for (let i = 0; i < 18; i++) sp += `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 3}s;animation-duration:${2.4 + (i % 5) * 0.5}s"></i>`;
    st.innerHTML = `<div class="rays"></div><div class="sparks">${sp}</div>`;
    const cs = collStats();
    if (gBanner === 'event') {
      const c = charById(B.five);
      const hero = el('div', 'g-hero');
      hero.appendChild(body(c.id));
      st.appendChild(hero);
      st.insertAdjacentHTML('beforeend', `<div class="g-title">
        <div class="g-kicker">${tr('Особый призыв')}</div>
        <div class="g-name">${tr(B.title)}</div>
        <div class="g-sub r5">${c.name} · ${RARITY[5].name}</div>
        <div class="g-quote">«${tr(QUOTES[c.id] || '')}»</div>
        <div class="g-up">${tr('Шанс ×2: каждый второй легендарный боец — {0}', c.name)}</div>
        <div class="g-fours" id="g-fours"></div>
        <div class="g-timer">${tr('Смена баннера через {0}', fmtDur(B.endsIn))}</div></div>`);
      const fb = $('#g-fours', st);
      for (const id of B.fours) { const ch = charById(id), w = el('div', 'g-four'); w.appendChild(face(id)); w.insertAdjacentHTML('beforeend', `<span class="r4">${ch.name}</span>`); fb.appendChild(w); }
    } else if (gBanner === 'arsenal') {
      const m = gearById(B.gear);
      const big = el('div', 'g-gear');
      big.appendChild(cv(gearIcon(m.id)));
      st.appendChild(big);
      st.insertAdjacentHTML('beforeend', `<div class="g-title">
        <div class="g-kicker">${tr('Арсенал Гарнизона')}</div>
        <div class="g-name">${tr(m.name)}</div>
        <div class="g-sub t5">${tr(SLOT_NAMES[m.slot])} · ${GEAR_RAR[5].name}</div>
        <div class="g-up">${tr('Только снаряжение. Каждое второе легендарное — {0}', tr(m.name))}</div>
        <div class="g-fours" id="g-slots"></div>
        <div class="g-timer">${tr('Смена баннера через {0}', fmtDur(B.endsIn))}</div></div>`);
      const sb = $('#g-slots', st);
      for (const slot of GEAR_SLOTS) { const it = GEAR.find(x => x.slot === slot && x.id !== m.id) || GEAR.find(x => x.slot === slot); const w = el('div', 'g-four'); w.appendChild(cv(gearIcon(it.id))); sb.appendChild(w); }
    } else {
      const row = el('div', 'g-std');
      for (const c of CHARS.filter(x => x.rarity === 5)) { const w = el('div', 'g-four'); w.appendChild(body(c.id)); w.insertAdjacentHTML('beforeend', `<span class="r5">${c.name}</span>`); row.appendChild(w); }
      st.appendChild(row);
      st.insertAdjacentHTML('beforeend', `<div class="g-title std"><div class="g-name">${tr('Стандартный')}</div><div class="g-sub">${tr('Все бойцы и всё снаряжение без повышенных шансов')}</div></div>`);
    }
    st.insertAdjacentHTML('beforeend', `<div class="g-coll"><span>${tr('Бойцы {0}/{1}', cs.heroes, CHARS.length)}</span><span class="gold">${tr('Золотые {0}/{1}', cs.gold, CHARS.length)}</span><span>${tr('Снаряжение {0}/{1}', cs.gear, GEAR_TOTAL)}</span></div>`);
    const p5 = save.pity5 || 0, p4 = save.pity4 || 0, ck = gBanner, chest = g.chest[ck] || 0;
    $('#g-info').innerHTML = `<div class="pity"><span class="t5">${tr('Леген.')}</span><div class="pbar"><i style="width:${Math.round(p5 / PITY5 * 100)}%"></i></div><span>${tr('гарантия через {0}', PITY5 - p5)}</span></div>
      <div class="pity"><span class="t4">${tr('Эпич.')}</span><div class="pbar p4"><i style="width:${Math.round(p4 / PITY4 * 100)}%"></i></div><span>${tr('гарантия через {0}', PITY4 - p4)}</span></div>
      <div class="pity"><img class="chest-ic" src="assets/sprites/ui_chest.png" alt=""><div class="pbar pc"><i style="width:${Math.round(chest * 10)}%"></i></div><span>${tr('Сундук трофеев: {0}/10 призывов ×10', Math.floor(chest))}</span></div>
      ${gBanner === 'event' && g.guar ? '<div class="guar">' + tr('Следующий легендарный боец — точно {0}!', charById(B.five).name) + '</div>' : ''}
      ${gBanner === 'arsenal' && g.guarG ? '<div class="guar">' + tr('Следующее легендарное — точно {0}!', tr(gearById(B.gear).name)) + '</div>' : ''}

      <div class="g-wallet"><a class="lnk" id="g-hist-btn">${tr('Шансы и история')}</a><span><img src="assets/ui/ribbon.png" alt="">${tr('Перья: {0}', feathers())}</span><span><img src="assets/ui/pearl.png" alt="">${tr('Билеты: {0}', tickets())}</span><span><img src="assets/ui/pearl.png" alt="">${tr('Билеты ×10: {0}', g.tickets10 || 0)}</span></div>`;
    $('#g-hist-btn').addEventListener('click', () => { $('#g-history').classList.toggle('hid'); refreshHistory(); });
    const bb = $('#g-btns');
    bb.innerHTML = '';
    const btn = (cls, html, fn, title) => { const b = el('button', 'k-btn big ' + cls, html); if (title) b.title = title; b.addEventListener('click', fn); bb.appendChild(b); };
    if (freeAvailable()) btn('free', `${img('pearl')} ${tr('Бесплатно')}`, () => doPull(1, 'free'), tr('Один бесплатный призыв каждый день'));
    if (tickets() > 0) btn('free', `${img('pearl')} ×1 (${tickets()})`, () => doPull(1, 'ticket'), tr('Билет призыва'));
    if ((g.tickets10 || 0) > 0) btn('free', `${img('pearl')} ×10 (${g.tickets10})`, () => doPull(10, 'ticket'), tr('Билет ×10'));
    btn(save.tokens < PULL_COST ? 'off' : '', `${img('coin')} ×1 — ${PULL_COST}`, () => doPull(1));
    btn(save.tokens < PULL10_COST ? 'off' : '', `${img('coin')} ×10 — ${PULL10_COST}`, () => doPull(10), tr('Десять за цену девяти, минимум один эпический'));
    btn('x100' + (save.tokens < PULL100_COST ? ' off' : ''), `${img('coin')} ×100 — ${PULL100_COST}`, () => doPull(100), tr('Сто призывов разом: в каждой десятке минимум один эпический, сундук трофеев сразу'));
    refreshFooter();
  }

  let gearSlot = null, gearSel = null;
  function refreshGear() {
    const gs = gearSave();
    gs.seen = gs.seen || {};
    for (const k of Object.keys(gs.items)) gs.seen[k] = 1;
    persist();
    refreshFooter();
    $('#gear-coll').textContent = tr('Собрано {0}/{1}', gearOwned(), GEAR_TOTAL);
    const sl = $('#gear-slots');
    sl.innerHTML = '';
    for (const slot of GEAR_SLOTS) {
      const k = gs.eq[slot], d = el('div', 'gslot k-card' + (gearSlot === slot ? ' sel' : ''));
      if (k && gs.items[k]) {
        const { m, r } = parseGear(k);
        d.classList.add('t' + r);
        d.appendChild(cv(gearIcon(m.id)));
        d.insertAdjacentHTML('beforeend', `<div class="gl t${r}">${tr('Ур. {0}', gs.items[k].lvl)}</div>`);
      } else d.insertAdjacentHTML('beforeend', '<div class="gempty">+</div>');
      d.insertAdjacentHTML('beforeend', `<div class="gn">${tr(SLOT_NAMES[slot])}</div>`);
      d.addEventListener('click', () => { gearSlot = gearSlot === slot ? null : slot; gearSel = null; refreshGear(); });
      sl.appendChild(d);
    }
    const t = gearEffects(), lines = Object.entries(t).filter(([e, v]) => v && FX_TEXT[e]).map(([e, v]) => tr(FX_TEXT[e], e === 'hp' || e === 'heal' ? v : Math.round(v * 10) / 10));
    $('#gear-tot').innerHTML = `<div class="sec">${tr('Бонусы снаряжения')}</div>` + (lines.length ? lines.map(x => '<div>' + x + '</div>').join('') : '<div class="muted">' + tr('Пока ничего не надето') + '</div>');
    const inv = $('#gear-inv');
    inv.innerHTML = '';
    const keys = Object.keys(gs.items).filter(k => !gearSlot || parseGear(k).m.slot === gearSlot).sort((a, b) => parseGear(b).r - parseGear(a).r || a.localeCompare(b));
    if (!keys.length) inv.innerHTML = '<div class="muted">' + tr('Снаряжение выпадает в «Призыве» — особенно во вкладке «Арсенал»') + '</div>';
    for (const k of keys) {
      const { m, r } = parseGear(k), it = gs.items[k], eq = gs.eq[m.slot] === k;
      const d = el('div', 'gitem t' + r + (gearSel === k ? ' sel' : '') + (eq ? ' eq' : ''));
      d.appendChild(cv(gearIcon(m.id)));
      d.insertAdjacentHTML('beforeend', `<b class="lv">${it.lvl}</b>${eq ? '<b class="e">✓</b>' : ''}`);
      d.addEventListener('click', () => { gearSel = k; refreshGear(); });
      inv.appendChild(d);
    }
    const info = $('#gear-info');
    if (gearSel && gs.items[gearSel]) {
      const { m, r } = parseGear(gearSel), it = gs.items[gearSel], eq = gs.eq[m.slot] === gearSel;
      info.innerHTML = `<div class="row" style="gap:10px"><div class="gbig t${r}" id="gbig"></div><div><div class="h2 t${r}" style="line-height:1">${tr(m.name)}</div><div class="t${r}">${tr(SLOT_NAMES[m.slot])} · ${GEAR_RAR[r].name} · ${tr('Ур. {0}', it.lvl)}/5</div>
        <div class="small">${gearFxLines(m, r, it.lvl).join('<br>')}</div><div class="muted small">${it.lvl < 5 ? tr('Повторы из призыва повышают уровень') : tr('Максимальный уровень')}</div></div></div>`;
      $('#gbig', info).appendChild(cv(gearIcon(m.id)));
      const b = el('button', 'k-btn' + (eq ? ' off' : ''), eq ? tr('Надето') : tr('Надеть'));
      b.addEventListener('click', () => { if (equipGear(gearSel)) { snd('confirm', { vol: 0.7 }); refreshGear(); } });
      info.appendChild(b);
    } else info.innerHTML = '<div class="muted">' + tr('Выбери предмет, чтобы увидеть бонусы и надеть его') + '</div>';
  }

  let shopPick = null;
  function refreshShop() {
    const st = $('#g-stage');
    st.className = 'g-stage shop';
    st.innerHTML = '<div class="shop-grid" id="shop-grid"></div>';
    const grid = $('#shop-grid', st);
    for (const it of SHOP) {
      const d = el('div', 'shop-it k-card' + (feathers() < it.cost ? ' poor' : '') + (shopPick === it.id ? ' sel' : ''));
      d.innerHTML = `<img src="assets/ui/${it.icon}.png" alt=""><div class="sn">${tr(it.name)}</div><div class="muted small">${tr(it.text)}</div><div class="sc"><img src="assets/ui/ribbon.png" alt="">${it.cost}</div>`;
      d.addEventListener('click', () => {
        if (feathers() < it.cost) { toast(tr('Не хватает перьев — они даются за каждый призыв')); snd('error', { vol: 0.6 }); return; }
        if (it.id === 'pick4' || it.id === 'pick5') { shopPick = shopPick === it.id ? null : it.id; refreshShop(); return; }
        if (buyShop(it.id)) { snd('confirm', { vol: 0.8 }); toast(tr('Куплено: {0}', tr(it.name))); refreshGacha(); }
      });
      grid.appendChild(d);
    }
    if (shopPick) {
      const rar = shopPick === 'pick4' ? 4 : 5;
      const row = el('div', 'shop-pick');
      row.insertAdjacentHTML('beforeend', `<div class="sec">${tr('Выбери героя')}</div>`);
      const fl = el('div', 'row');
      for (const c of CHARS.filter(x => x.rarity === rar)) {
        const h = el('div', 'hero-card k-card');
        h.appendChild(face(c.id));
        h.insertAdjacentHTML('beforeend', `<div class="hn">${c.name}</div><div class="r${rar}">${save.chars[c.id] ? starsHTML(save.chars[c.id]) : tr('Новый!')}</div>`);
        h.addEventListener('click', () => {
          const r = buyShop(shopPick, c.id);
          if (!r) return;
          shopPick = null;
          r.feathers = 0;
          pullRes = [r];
          pullRes.feathers = 0;
          state = 'pull';
          rvDirect();
        });
        fl.appendChild(h);
      }
      row.appendChild(fl);
      st.appendChild(row);
    }
    $('#g-info').innerHTML = `<div class="g-wallet big"><span><img src="assets/ui/ribbon.png" alt="">${tr('Перья: {0}', feathers())}</span><span><img src="assets/ui/pearl.png" alt="">${tr('Билеты: {0}', tickets())}</span></div><div class="muted small">${tr('Перья даются за каждый призыв, за повторы — вдвое больше')}</div>`;
    $('#g-btns').innerHTML = '';
    refreshFooter();
  }

  function refreshHistory() {
    const h = $('#g-history');
    if (h.classList.contains('hid')) return;
    const list = gachaState().history;
    const nm = e => e.k === 'gear' ? tr(parseGear(e.id).m.name) : e.id === 'manual' ? tr('Наставление') : (charById(e.id) || { name: e.id }).name;
    h.innerHTML = '<div class="muted small">' + tr('Шансы: легендарное 1,5% (в среднем 1 из ~37 с гарантией) · эпическое 7% (минимум раз в 10) · редкое 17,5% · необычное 30% · обычное 44%; бойцы — 12%, золотой мундир — 3% от бойцов') + '</div><div class="sec">' + tr('История призывов') + '</div>' + (list.length ? list.map(e => `<span class="hi t${e.r}">${nm(e)}${e.gold ? ' ✦✦' : e.f ? ' ✦' : ''}</span>`).join('') : '<span class="muted">' + tr('Пока пусто') + '</span>');
  }

  function refreshTraining() {
    ensureMeta();
    const box = $('#training');
    box.innerHTML = '';
    for (const t of TRAINING) {
      const l = save.meta[t.id], cost = trainingCost(t);
      const d = el('div', 'train k-card' + (cost === null ? ' sel' : ''));
      d.appendChild(cv(upIcon(t.icon)));
      const pips = Array.from({ length: t.max }, (_, i) => '<i class="' + (i < l ? 'on' : '') + '"></i>').join('');
      d.insertAdjacentHTML('beforeend', `<div class="tn">${t.name}</div><div class="pips">${pips}</div>
        <div class="ud">${cost === null ? t.text(l) : (l ? tr('Ур. {0}: ', l + 1) : '') + t.text(l + 1)}</div>`);
      const b = el('button', 'k-btn' + (cost === null || save.tokens < cost ? ' off' : ''), cost === null ? tr('Максимум') : `<img src="assets/ui/coin.png" alt=""> ${cost}`);
      b.addEventListener('click', () => {
        if (cost === null) return;
        if (save.tokens < cost) { toast(tr('Не хватает жетонов — сыграй забег')); snd('error', { vol: 0.6 }); return; }
        if (buyTraining(t.id)) { snd('levelup', { vol: 0.6 }); toast(tr('{0}: уровень {1}', t.name, save.meta[t.id])); refreshTraining(); refreshFooter(); }
      });
      d.appendChild(b);
      box.appendChild(d);
    }
  }

  function misRow(name, text, value, goal, reward, done, claimed, onClaim) {
    const row = el('div', 'mis k-card' + (done && !claimed ? ' sel' : '') + (claimed ? ' got' : ''));
    const pct = Math.round(Math.min(1, value / goal) * 100);
    row.innerHTML = `<div class="mt"><div class="mn">${name}</div><div class="muted">${text}</div>
      <div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="mv">${goal > 1 ? value + ' / ' + goal : ''}</div>`;
    const b = el('button', 'k-btn' + (done && !claimed ? '' : ' off'), claimed ? tr('Получено') : `<img src="assets/ui/coin.png" alt=""> ${reward}`);
    b.addEventListener('click', () => {
      if (!done || claimed) return;
      const got = onClaim();
      if (got) { snd('chime5', { vol: 0.7, tag: 'chime' }); snd('bong', { vol: 0.5 }); toast(tr('+{0} жетонов', got)); refreshMissions(); refreshFooter(); }
    });
    row.appendChild(b);
    return row;
  }

  function refreshMissions() {
    const rk = rankInfo();
    $('#rank').innerHTML = `${tr('Звание:')} <b>${rk.name}</b>${rk.next ? tr(' · до «{0}»: {1}', rk.next.name, rk.next.at - rk.n) : ''}`;
    const dbox = $('#daily');
    dbox.innerHTML = '';
    for (const t of dailyState()) dbox.appendChild(misRow(tr('Задание дня'), t.text, t.value, t.goal, t.reward, t.done, t.claimed, () => claimDaily(t.i)));
    const abox = $('#achievements');
    abox.innerHTML = '';
    const list = achievementsState().sort((a, b) => ((b.done && !b.claimed) - (a.done && !a.claimed)) || (a.claimed - b.claimed));
    for (const a of list) abox.appendChild(misRow(a.name, a.text, a.value, a.goal, a.reward, a.done, a.claimed, () => claimAchievement(a.id)));
  }

  function refreshRecords() {
    const s = statsOf();
    const rows = FACTIONS.map(f => [f.name, bestOf(f) ? fmtTime(bestOf(f)) : '—']);
    rows.push([tr('Забегов'), s.runs], [tr('Победы'), s.wins], [tr('Титанов убито'), s.kills], [tr('Лучший уровень'), s.bestLevel], [tr('Время в бою'), fmtTime(s.time)], [tr('Призывов'), save.pulls], [tr('Бойцов открыто'), `${Object.keys(save.chars).length} / ${CHARS.length}`]);
    $('#records').innerHTML = rows.map(([k, v]) => `<div>${k}</div><div class="v">${v}</div>`).join('');
  }

  function langRow() {
    return '<div class="langs"><span>' + tr('Язык') + '</span>' + LANGS.map(([k, n]) => '<button class="k-btn lang' + (k === LANG ? ' sel' : '') + '" data-lang="' + k + '">' + n + '</button>').join('') + '</div>';
  }

  function refreshSettings() {
    const st = settings();
    const box = $('#settings');
    const chk = (key, label) => `<div class="check" data-k="${key}"><img src="assets/ui/${st[key] ? 'check_on' : 'check_off'}.png" alt=""><span>${label}</span></div>`;
    box.innerHTML = `
      ${langRow()}
      ${chk('shake', tr('Тряска экрана при ударах'))}
      ${chk('hints', tr('Подсказки в бою'))}
      ${chk('mute', tr('Выключить весь звук (M)'))}
      <div class="vol"><span>${tr('Музыка')}</span><input type="range" min="0" max="100" id="vol-music" value="${Math.round((st.music ?? 0.6) * 100)}"><span id="vol-music-v">${Math.round((st.music ?? 0.6) * 100)}</span></div>
      <div class="vol"><span>${tr('Эффекты')}</span><input type="range" min="0" max="100" id="vol-sfx" value="${Math.round((st.sfx ?? 0.8) * 100)}"><span id="vol-sfx-v">${Math.round((st.sfx ?? 0.8) * 100)}</span></div>
      <div style="margin-top:10px">${tr('Код сохранения — перенос прогресса на другой компьютер:')}</div>
      <textarea class="code-box" id="code" rows="3" spellcheck="false"></textarea>
      <div class="buttons" style="justify-content:flex-start">
        <button class="k-btn" id="code-copy">${tr('Скопировать мой код')}</button>
        <button class="k-btn" id="code-load">${tr('Загрузить код')}</button>
        <button class="k-btn" id="full">${tr('Во весь экран')}</button>
        <button class="k-btn" id="wipe">${confirmReset ? tr('Точно стереть?') : tr('Стереть прогресс')}</button>
      </div>
      <div class="muted" style="margin-top:10px;font-size:16px">${tr('Фан-игра по «Атаке титанов», некоммерческая. Шрифт Pixellari — Zacchary Dempsey-Plante. Музыка — RandomMind, Komiku, Will Carpenter, cynicmusic (CC0). Звуки — Kenney (CC0). Подробно — CREDITS.md.')}</div>`;
    box.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.lang;
      if (k === LANG) return;
      settings().lang = k;
      persist();
      location.reload();
    }));
    box.querySelectorAll('.check').forEach(c => c.addEventListener('click', () => {
      st[c.dataset.k] = !st[c.dataset.k];
      persist();
      applyAudio();
      snd('click');
      refreshSettings();
    }));
    for (const k of ['music', 'sfx']) {
      const r = $('#vol-' + k);
      r.addEventListener('keydown', e => e.stopPropagation());
      r.addEventListener('input', () => {
        st[k] = r.value / 100;
        $('#vol-' + k + '-v').textContent = r.value;
        applyAudio();
      });
      r.addEventListener('change', () => { persist(); if (k === 'sfx') snd('chime3'); });
    }
    const ta = $('#code');
    ta.addEventListener('keydown', e => e.stopPropagation());
    $('#code-copy').addEventListener('click', () => {
      const code = exportCode();
      ta.value = code;
      ta.select();
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => toast(tr('Код скопирован')), () => toast(tr('Выдели код и скопируй вручную')));
    });
    $('#code-load').addEventListener('click', () => {
      if (!ta.value.trim()) { toast(tr('Вставь код в поле')); return; }
      if (importCode(ta.value)) { toast(tr('Сохранение загружено')); factionSel = clamp(save.faction || 0, 0, 2); requestReset(); refreshSettings(); }
      else toast(tr('Код не подходит'));
    });
    $('#full').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    $('#wipe').addEventListener('click', () => {
      if (!confirmReset) { confirmReset = true; refreshSettings(); return; }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      save = loadSave();
      persist();
      confirmReset = false;
      toast(tr('Прогресс стёрт'));
      refreshSettings();
    });
  }

  function applyAudio() {
    if (typeof SND === 'undefined') return;
    const st = settings();
    SND.setVolumes(st.music ?? 0.6, st.sfx ?? 0.8);
    SND.setMuted(!!st.mute);
  }

  function toggleMute() {
    const st = settings();
    st.mute = !st.mute;
    persist();
    applyAudio();
    toast(st.mute ? tr('Звук выключен') : tr('Звук включён'));
    if (screen === 'settings' && state === 'menu') refreshSettings();
  }

  function toast(text) {
    const m = $('#msg');
    m.textContent = text;
    m.classList.add('on');
    msgT = 2.2;
  }

  let rv = null;
  const FX = { parts: [], raf: 0, cv: null, g: null, w: 0, h: 0, last: 0 };
  const RCOL = { 1: ['#f0ece4', '#b4b0a8', '#ffffff'], 2: ['#b8f0b0', '#5ac05a', '#ffffff'], 3: ['#8fd0ff', '#4a8cff', '#ffffff'], 4: ['#e0b0ff', '#a24aff', '#ffffff', '#ff9ad8'], 5: ['#fff2b0', '#ffcf3a', '#ffffff', '#ff9a3a'], g: ['#ff6b6b', '#ffd36e', '#7cfc9a', '#6fb6ff', '#c58cff', '#ffffff'] };
  const isBig = r => r.rarity === 5 || r.golden;

  function doPull(n, mode) {
    if (performance.now() < pullLock) return;
    const res = gachaPull(n, gBanner === 'shop' ? 'event' : gBanner, mode);
    if (!res) { toast(mode === 'ticket' ? tr('Нет билетов') : tr('Не хватает жетонов — сыграй забег')); snd('error', { vol: 0.6 }); return; }
    if (res.length <= 10) {
      const w = r => r.rarity * 10 + (r.golden ? 5 : 0) + (r.kind === 'hero' ? 1 : 0) + Math.random();
      const keep = { feathers: res.feathers, anomaly: res.anomaly, chest: res.chest };
      res.sort((a, b) => w(a) - w(b));
      Object.assign(res, keep);
    }
    pullRes = res;
    state = 'pull';
    refreshFooter();
    rvStart();
  }

  function rvLater(ms, fn) { rv.timers.push(setTimeout(fn, ms)); }
  function rvClear() { if (rv) { for (const t of rv.timers) clearTimeout(t); rv.timers = []; } }
  function rvBg() {
    let st = '';
    for (let i = 0; i < 46; i++) st += `<i style="left:${(i * 37 + 11) % 100}%;top:${(i * 23 + 7) % 62}%;animation-delay:${(i % 7) * 0.3}s"></i>`;
    return `<div class="rv-sky"></div><div class="rv-stars">${st}</div>`;
  }
  function rvNext(t) { const n = $('#rv-next', layers.reveal); if (n) n.textContent = t; }
  function rvDim(a) { const d = $('#rv-dim', layers.reveal); if (d) d.style.opacity = a; }

  function fxInit(L) {
    FX.cv = $('#rv-fx', L);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    FX.w = innerWidth; FX.h = innerHeight;
    FX.cv.width = Math.round(FX.w * dpr); FX.cv.height = Math.round(FX.h * dpr);
    FX.g = FX.cv.getContext('2d');
    FX.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    FX.parts = [];
    FX.last = performance.now();
    if (!FX.raf) FX.raf = requestAnimationFrame(fxLoop);
    if (!FX.iv) FX.iv = setInterval(() => {
      if (state !== 'pull' || !rv) { clearInterval(FX.iv); FX.iv = 0; return; }
      if (performance.now() - FX.last > 120) fxStep();
    }, 60);
  }

  function fxLoop() {
    FX.raf = 0;
    if (state !== 'pull' || !FX.g || !rv) return;
    fxStep();
    FX.raf = requestAnimationFrame(fxLoop);
  }

  function fxStep() {
    if (!FX.g || !rv) return;
    const tn = performance.now(), dt = Math.min(0.05, Math.max(0, (tn - FX.last) / 1000));
    FX.last = tn;
    if (rv.phase === 'aim' && rv.charging) {
      rv.charge = Math.min(1, rv.charge + dt / 0.7);
      const ring = $('#rv-ring', layers.reveal);
      if (ring) ring.style.height = Math.round(rv.charge * 100) + '%';
      if (Math.random() < 0.6) fxBurst(FX.w / 2 + (Math.random() - 0.5) * 30, FX.h * 0.82, 1, ['#ffe9a8', '#ffffff'], 60, 0.5, -60, 2);
      if (rv.charge >= 1) { rv.ignoreClick = true; rvAimDone(); }
    } else if (rv.phase === 'aim' && rv.charge > 0) {
      rv.charge = Math.max(0, rv.charge - dt);
      const ring = $('#rv-ring', layers.reveal);
      if (ring) ring.style.height = Math.round(rv.charge * 100) + '%';
    }
    if (rv.flare) flareStep(dt);
    const g = FX.g;
    g.clearRect(0, 0, FX.w, FX.h);
    g.globalCompositeOperation = 'lighter';
    for (const p of FX.parts) {
      p.vy += p.gr * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      const a = Math.max(0, p.life / p.max);
      g.globalAlpha = p.fade === false ? Math.min(1, a * 4) : a;
      g.fillStyle = p.c;
      const s = p.s * (p.grow ? 1 + (1 - a) * p.grow : 1);
      g.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s), Math.ceil(s));
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    FX.parts = FX.parts.filter(p => p.life > 0 && p.y < FX.h + 40);
    if (FX.parts.length > 2200) FX.parts.splice(0, FX.parts.length - 2200);
  }

  function fxBurst(x, y, n, cols, sp = 420, life = 1.4, gr = 260, size = 3) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = sp * (0.25 + Math.random() * 0.85);
      FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gr, drag: 0.985, life: life * (0.6 + Math.random() * 0.6), max: life, c: cols[i % cols.length], s: size * (0.6 + Math.random() * 0.9) });
    }
  }
  function fxRain(cols, n) {
    for (let i = 0; i < n; i++) FX.parts.push({ x: Math.random() * FX.w, y: -20 - Math.random() * FX.h * 0.9, vx: (Math.random() - 0.5) * 30, vy: 70 + Math.random() * 130, gr: 30, drag: 1, life: 5, max: 5, fade: false, c: cols[i % cols.length], s: 2 + Math.random() * 3 });
  }
  function fxAt(elm, n, cols, sp) { const b = elm.getBoundingClientRect(); fxBurst(b.left + b.width / 2, b.top + b.height / 2, n, cols, sp, 0.9, 140, 3); }

  function flareStep(dt) {
    const f = rv.flare, m = rv.max;
    f.t += dt * f.speed;
    const k = Math.min(1, f.t / f.dur), e = 1 - Math.pow(1 - k, 2.2);
    f.x = FX.w / 2 + Math.sin(k * 6) * 8;
    f.y = FX.h * 0.8 - e * FX.h * 0.56;
    if (!f.s1 && k > 0.34) { f.s1 = true; f.col = m >= 3 ? 3 : m; snd('crack', { vol: 0.5 }); fxBurst(f.x, f.y, 22, RCOL[f.col], 180, 0.6, 100, 2); }
    if (!f.s1b && k > 0.56 && m >= 4) { f.s1b = true; f.col = 4; snd('crack', { vol: 0.7 }); fxBurst(f.x, f.y, 30, RCOL[4], 220, 0.6, 100, 2); }
    if (!f.s2 && k > 0.72 && (m === 5 || rv.tease || rv.golden)) { f.s2 = true; f.speed = 0.3; rvDim(0.7); snd('heartbeat', { vol: 0.9 }); f.flick = true; f.flt = 0; }
    if (f.flick) {
      f.flt += dt;
      if (f.flt > 1.15) {
        f.flick = false; f.speed = 1; rvDim(0);
        if (m === 5 || rv.golden) { f.col = rv.golden ? 'g' : 5; snd('crack', { vol: 0.9 }); fxBurst(f.x, f.y, 80, RCOL[f.col], 320, 0.8, 120, 3); }
        else snd('tick', { vol: 0.5 });
      }
    }
    const col = f.flick ? (rv.golden && f.flt > 0.6 ? 'g' : Math.floor(f.flt * 12) % 2 ? 5 : 4) : f.col;
    const cs = col ? RCOL[col] : ['#ffffff', '#fff6d6'];
    for (let i = 0; i < 3; i++) FX.parts.push({ x: f.x + (Math.random() - 0.5) * 5, y: f.y + 6, vx: (Math.random() - 0.5) * 40, vy: 40 + Math.random() * 60, gr: 140, drag: 0.97, life: 0.7, max: 0.7, c: cs[(i + Math.floor(f.t * 20)) % cs.length], s: 2 + Math.random() * 2 });
    FX.parts.push({ x: f.x, y: f.y + 10, vx: (Math.random() - 0.5) * 16, vy: 10 + Math.random() * 20, gr: -6, drag: 0.98, life: 1.1, max: 1.1, c: 'rgba(120,110,140,0.35)', s: 4, grow: 3 });
    FX.parts.push({ x: f.x, y: f.y, vx: 0, vy: 0, gr: 0, drag: 1, life: 0.04, max: 0.04, c: cs[0], s: 12 });
    FX.parts.push({ x: f.x, y: f.y, vx: 0, vy: 0, gr: 0, drag: 1, life: 0.04, max: 0.04, c: '#ffffff', s: 6 });
    if (k >= 1) { rv.flare = null; rvBurst(f.x, f.y); }
  }

  function rvShell(L) {
    L.innerHTML = `${rvBg()}<canvas class="rv-fx" id="rv-fx"></canvas><div class="rv-dim" id="rv-dim"></div><div class="rv-flash" id="rv-flash"></div><div class="rv-stage" id="rv-stage"></div><div class="next wood-text" id="rv-next"></div>`;
    fxInit(L);
  }

  function rvStart() {
    const L = layers.reveal, max = Math.max(...pullRes.map(r => r.rarity));
    rvClear();
    rv = { phase: 'aim', timers: [], max, golden: pullRes.some(r => r.golden), tease: max === 4 && Math.random() < 0.3, anomaly: !!pullRes.anomaly, charge: 0, charging: false };
    rvShell(L);
    $('#rv-stage', L).insertAdjacentHTML('afterend', `<div class="rv-aim" id="rv-aim"><div class="ring"><i id="rv-ring"></i><b>✦</b></div><div class="wood-text">${tr('Зажми, чтобы выпустить ракету')}</div></div>`);
    rvNext(tr('Esc — пропустить'));
    rvLater(4500, () => rvAimDone());
  }

  function rvDirect() {
    const L = layers.reveal, r = pullRes[0];
    rvClear();
    rv = { phase: 'card', timers: [], max: r.rarity, golden: !!r.golden, charge: 0 };
    rvShell(L);
    rvBurst(FX.w / 2, FX.h * 0.3);
  }

  function rvAimDone() {
    if (!rv || rv.phase !== 'aim') return;
    const a = $('#rv-aim', layers.reveal);
    if (a) a.classList.add('gone');
    rv.charging = false;
    if (rv.anomaly) rvAnomaly(); else rvLaunch();
  }

  function rvLaunch() {
    rv.phase = 'launch';
    rv.flare = { t: 0, dur: 1.5, speed: 1, col: 0 };
    rvNext(tr('Клик — пропустить'));
    snd('flare', { vol: 0.9 });
    snd('rise', { vol: 0.7 });
  }

  function rvAnomaly() {
    rv.phase = 'anomaly';
    const L = layers.reveal, st = $('#rv-stage', L);
    const set = pick(['normal', 'aberrant', 'lanky', 'thrower', 'giant']);
    const size = set === 'giant' ? 280 : 200;
    const img = SPR[`titan_${set}_${size}_up`] || SPR.titan_normal_200_up;
    const nap = NAPE[`${set}_${size}`] || { fx: 0.5, fy: 0.2 };
    const box = el('div', 'rv-titan');
    box.style.left = (25 + Math.random() * 50) + '%';
    box.appendChild(cv(img));
    const tgt = el('button', 'rv-nape', '');
    tgt.style.left = (nap.fx * 100) + '%';
    tgt.style.top = (nap.fy * 100) + '%';
    box.appendChild(tgt);
    st.appendChild(box);
    st.insertAdjacentHTML('beforeend', `<div class="rv-alert">${tr('Аномалия! Титан у стены — бей в затылок!')}</div>`);
    snd('roar', { vol: 0.8 });
    snd('horn', { vol: 0.5 });
    rvNext('');
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      const al = $('.rv-alert', st);
      if (ok) {
        fxAt(tgt, 90, ['#ff4a3a', '#ffffff', '#ffd36e'], 380);
        snd('slash', { vol: 1 });
        snd('cut', { vol: 0.9 });
        anomalyReward();
        box.classList.add('slain');
        if (al) al.textContent = tr('Отбито! +1 билет призыва и 10 перьев');
      } else {
        box.classList.add('away');
        if (al) al.textContent = tr('Титан скрылся…');
      }
      rvLater(1300, () => { box.remove(); if (al) al.remove(); rvLaunch(); });
    };
    tgt.addEventListener('pointerdown', e => { e.stopPropagation(); finish(true); });
    rvLater(2300, () => finish(false));
  }

  function rvBurst(x, y) {
    const m = rv.max, gc = rv.golden ? 'g' : m;
    rv.phase = 'burst';
    fxBurst(x, y, m === 5 ? 280 : m === 4 ? 180 : 120, RCOL[gc], m === 5 ? 600 : 460, 1.7, 230, 3);
    for (let i = 0; i < Math.max(1, (m - 2) * 2); i++) rvLater(260 + i * 170, () => { fxBurst(x + (Math.random() - 0.5) * 300, y + (Math.random() - 0.5) * 180, 44, RCOL[gc], 230, 1, 160, 2); snd('crack', { vol: 0.4 }); });
    if (m === 5 || rv.golden) { fxRain(RCOL[gc], 170); snd('choir', { vol: 0.8 }); }
    else if (m === 4) snd('shimmer', { vol: 0.7 });
    snd('boom', { vol: 0.8, rate: m === 5 ? 0.7 : 1 });
    const fl = $('#rv-flash', layers.reveal);
    if (fl) { fl.className = 'rv-flash m' + Math.max(3, m); void fl.offsetWidth; fl.classList.add('on'); }
    if (m === 5) { layers.reveal.classList.add('shake'); setTimeout(() => layers.reveal.classList.remove('shake'), 450); }
    rvLater(m === 5 ? 1000 : 750, () => (pullRes.length === 1 ? rvShow(0) : pullRes.length <= 10 ? rvDeal() : rvGrid100()));
  }

  function rvStars(r) {
    let s = '';
    for (let k = 0; k < 5; k++) s += `<span class="st${k < r.stars ? ' on' : ''}" style="animation-delay:${0.5 + k * 0.13}s">★</span>`;
    return s;
  }

  function rvBody(r) {
    if (r.kind === 'hero') {
      const quote = `<div class="rv-quote">«${tr(QUOTES[r.c.id] || QUOTES.cadet)}»</div>`;
      return `<div class="rname t${r.rarity}">${r.c.name}</div><div class="rrar t${r.rarity}">${rarName(r)}${r.golden ? ' · <b class="gold">' + tr('Золотой мундир') + '</b>' : ''}</div><div class="rstars">${rvStars(r)}</div>
        <div class="rv-txt">${r.isNew ? r.c.ability : r.refund ? tr('Уже 5★ — возвращено {0} жетонов', r.refund) : tr('Повтор: +1 звезда')}</div>${quote}`;
    }
    if (r.kind === 'gear') {
      return `<div class="rname t${r.rarity}">${tr(r.gear.name)}</div><div class="rrar t${r.rarity}">${tr(SLOT_NAMES[r.gear.slot])} · ${rarName(r)}</div>
        <div class="rv-txt">${gearFxLines(r.gear, r.rarity, r.lvl).join(' · ')}</div><div class="rv-quote">${r.isNew ? tr('Новое в коллекции!') : r.maxed ? tr('Уже максимального уровня') : tr('Повтор: уровень {0}', r.lvl)}</div>`;
    }
    return `<div class="rname t${r.rarity}">${tr('Наставление')}</div><div class="rv-txt">${tr('+{0} опыта любому герою — используй в «Отряде»', MANUAL_XP)}</div>`;
  }

  function rvShow(i, host) {
    const r = pullRes[i] || i, st = host || $('#rv-stage', layers.reveal);
    if (!host) { rv.phase = 'card'; rvNext(tr('Enter или клик — дальше')); }
    if (isBig(r) && r.kind !== 'item') { rvCinema(r, st, false); return; }
    st.innerHTML = `<div class="rv-rays m${Math.max(3, r.rarity)}"></div><div class="rv-card t${r.rarity}" id="rv-card"></div>`;
    const card = $('#rv-card', st);
    const ic = resIcon(r, true);
    ic.classList.add(r.kind === 'gear' ? 'gearbig' : 'herobig');
    if (r.kind === 'hero') ic.classList.add('sil');
    card.appendChild(ic);
    if (r.isNew && r.kind !== 'item') card.insertAdjacentHTML('beforeend', '<div class="stamp">' + (r.kind === 'gear' ? tr('Новое!') : tr('Новый!')) + '</div>');
    if (r.featured) card.insertAdjacentHTML('beforeend', '<div class="feat">' + tr('Шанс ×2') + '</div>');
    card.insertAdjacentHTML('beforeend', rvBody(r) + `<div class="rv-fe">+${r.feathers || 0} ${tr('перьев')}</div>`);
    if (r.kind === 'hero') setTimeout(() => ic.classList.remove('sil'), 420);
    if (r.rarity === 4) { snd('bong', { vol: 0.7 }); snd('chime6', { vol: 0.6, tag: 'chime' }); }
    else snd('chime' + Math.min(5, r.rarity + 1), { vol: 0.6, tag: 'chime' });
  }

  function rvCinema(r, host, overlay) {
    const box = overlay ? el('div', 'cine-over') : host;
    if (!overlay) host.innerHTML = '';
    const gear = r.kind === 'gear';
    const q = gear ? gearFxLines(r.gear, r.rarity, r.lvl).join(' · ') : '«' + tr(QUOTES[r.c.id] || QUOTES.cadet) + '»';
    const kick = gear ? tr('Легендарное снаряжение') : r.golden ? tr('Золотой боец!') : tr('Легендарный боец');
    box.insertAdjacentHTML('beforeend', `<div class="cine${r.golden ? ' golden' : ''}"><div class="cine-black"></div><div class="cine-rays"></div><div class="cine-emblem" id="ce"></div>${gear ? '' : '<div class="cine-cables"><i></i><i></i></div>'}<div class="cine-hero${gear ? ' gear' : ''}" id="chero"></div>
      <div class="cine-text"><div class="cine-kick">${kick}</div><div class="cine-name${resName(r).length > 14 ? ' long' : ''}">${resName(r)}</div>${gear ? `<div class="rrar t5">${tr(SLOT_NAMES[r.gear.slot])}</div>` : `<div class="rstars">${rvStars(r)}</div>`}<div class="cine-quote" id="cq"></div>
      <div class="cine-sub">${gear ? (r.isNew ? '<b>' + tr('Новое в коллекции!') + '</b>' : tr('Повтор: уровень {0}', r.lvl)) : (r.isNew ? '<b>' + tr('Новый!') + '</b> ' + r.c.ability : r.refund ? tr('Уже 5★ — возвращено {0} жетонов', r.refund) : tr('Повтор: +1 звезда'))}${r.golden ? ' · <b class="gold">' + tr('Золотой мундир открыт!') + '</b>' : ''}</div><div class="rv-fe">+${r.feathers || 0} ${tr('перьев')}</div></div></div>`);
    if (overlay) host.appendChild(box);
    if (SPR.ui_emblem) $('#ce', box).appendChild(cv(SPR.ui_emblem)); else $('#ce', box).appendChild(emblem('scouts'));
    const hc = resIcon(r, true);
    $('#chero', box).appendChild(hc);
    snd('horn', { vol: 0.45 });
    rvLater(650, () => { snd('choir', { vol: 0.7 }); if (!gear) snd('rope', { vol: 0.7 }); fxRain(RCOL[r.golden ? 'g' : 5], 120); });
    const qe = $('#cq', box);
    for (let k = 1; k <= q.length; k++) rvLater(1500 + k * 38, () => { qe.textContent = q.slice(0, k); if (k % 3 === 0) snd('tick', { vol: 0.15 }); });
    return box;
  }

  function cardEl(r, i, small) {
    const d = el('div', (small ? 'rv-m' : 'rv-c') + ' t' + r.rarity + (r.golden ? ' golden' : ''));
    d.innerHTML = small ? '' : '<div class="back"></div><div class="front"></div>';
    const fr = small ? d : $('.front', d);
    fr.appendChild(resIcon(r, false));
    if (!small) fr.insertAdjacentHTML('beforeend', `<div class="hn">${resName(r)}</div><div class="t${r.rarity} small">${resNote(r)}</div>`);
    else if (r.isNew && r.kind !== 'item') d.insertAdjacentHTML('beforeend', '<b class="nw">N</b>');
    d.addEventListener('click', e => { if (rv.phase !== 'done' || (!small && !d.classList.contains('open'))) return; e.stopPropagation(); rvDetail(i); });
    return d;
  }

  function rvDeal() {
    rv.phase = 'deal';
    const st = $('#rv-stage', layers.reveal);
    st.innerHTML = '<div class="rv-grid" id="rv-grid"></div>';
    const gr = $('#rv-grid', st);
    rv.cards = pullRes.map((r, i) => { const d = cardEl(r, i, false); gr.appendChild(d); return d; });
    const cx = FX.w / 2, cy = FX.h * 0.25;
    rv.cards.forEach(d => {
      const b = d.getBoundingClientRect();
      d.style.transition = 'none';
      d.style.transform = `translate(${cx - (b.left + b.width / 2)}px, ${cy - (b.top + b.height / 2)}px) scale(0.2) rotate(${(Math.random() - 0.5) * 120}deg)`;
      d.style.opacity = '0';
    });
    void gr.offsetWidth;
    rv.cards.forEach((d, i) => rvLater(i * 70, () => { d.style.transition = 'transform 0.42s cubic-bezier(.2,.9,.3,1.2), opacity 0.2s'; d.style.transform = ''; d.style.opacity = '1'; snd('whoosh', { vol: 0.35 }); }));
    rvNext(tr('Клик — открыть все'));
    rvLater(rv.cards.length * 70 + 450, () => { rv.phase = 'grid'; flipNext(0); });
  }

  function flipNext(i) {
    if (!rv || rv.phase !== 'grid') return;
    if (i >= rv.cards.length) { rvGridDone(); return; }
    const r = pullRes[i], d = rv.cards[i];
    d.classList.add('open');
    if (isBig(r) && r.kind !== 'item') {
      fxAt(d, 80, RCOL[r.golden ? 'g' : 5], 300);
      snd('choir', { vol: 0.6 });
      rv.phase = 'cine-grid';
      rv.resume = () => { rv.phase = 'grid'; flipNext(i + 1); };
      rvLater(500, () => { if (rv.phase === 'cine-grid') { rv.over = rvCinema(r, $('#rv-stage', layers.reveal), true); rvNext(tr('Клик — дальше')); } });
      return;
    }
    if (r.rarity === 4) { fxAt(d, 50, RCOL[4], 240); snd('shimmer', { vol: 0.5 }); }
    else { fxAt(d, 6 + r.rarity * 4, RCOL[r.rarity], 120); snd('tick', { vol: 0.35 + r.rarity * 0.05 }); }
    rvLater(r.rarity === 4 ? 480 : 150 + r.rarity * 20, () => flipNext(i + 1));
  }

  function rvGrid100() {
    rv.phase = 'grid100';
    const st = $('#rv-stage', layers.reveal);
    st.innerHTML = '<div class="rv-g100" id="rv-g100"></div><div class="rv-sum" id="rv-sum"></div>';
    const gr = $('#rv-g100', st);
    const order = pullRes.map((r, i) => i);
    rv.cards = pullRes.map((r, i) => { const d = cardEl(r, i, true); d.classList.add('hid'); gr.appendChild(d); return d; });
    rvNext(tr('Клик — показать всё'));
    let t = 200, cnt = { 5: 0, 4: 0, n: 0 };
    order.forEach(i => {
      const r = pullRes[i];
      t += r.rarity >= 4 ? 260 : 28;
      rvLater(t, () => {
        rv.cards[i].classList.remove('hid');
        if (r.rarity >= 4 || r.golden) { fxAt(rv.cards[i], r.rarity === 5 ? 60 : 30, RCOL[r.golden ? 'g' : r.rarity], 200); snd(r.rarity === 5 ? 'choir' : 'shimmer', { vol: 0.45 }); }
        else if (i % 3 === 0) snd('tick', { vol: 0.25 });
        if (r.rarity >= 4) cnt[r.rarity]++;
        if (r.isNew && r.kind !== 'item') cnt.n++;
        rvSum(cnt);
      });
    });
    rvLater(t + 300, () => rvGridDone());
  }

  function rvSum(cnt) {
    const s = $('#rv-sum', layers.reveal);
    if (s) s.innerHTML = `<span class="t5">${tr('Легендарных: {0}', cnt[5])}</span><span class="t4">${tr('Эпических: {0}', cnt[4])}</span><span class="t2">${tr('Новых: {0}', cnt.n)}</span>`;
  }

  function rvGridDone() {
    rv.phase = 'done';
    if (rv.cards) for (const c of rv.cards) c.classList.remove('hid');
    if (pullRes.length > 10) { const cnt = { 5: 0, 4: 0, n: 0 }; for (const r of pullRes) { if (r.rarity >= 4) cnt[r.rarity]++; if (r.isNew && r.kind !== 'item') cnt.n++; } rvSum(cnt); }
    rvNext(tr('Клик по карточке — подробнее, Enter — готово') + ' · +' + (pullRes.feathers || 0) + ' ' + tr('перьев'));
  }

  function rvDetail(i) {
    const st = $('#rv-stage', layers.reveal);
    rv.phase = 'detail';
    const ov = el('div', 'cine-over detail');
    st.appendChild(ov);
    const r = pullRes[i];
    if (isBig(r) && r.kind !== 'item') rvCinema(r, ov, false);
    else rvShow(i, ov);
    rv.detailEl = ov;
    rvNext(tr('Клик — назад'));
  }

  function rvFlipAll() {
    rvClear();
    for (const c of rv.cards || []) { c.classList.add('open'); c.classList.remove('hid'); c.style.transition = 'none'; c.style.transform = ''; c.style.opacity = '1'; }
    rvGridDone();
  }

  function rvChest() {
    rvClear();
    rv.phase = 'chest';
    rv.chestShown = true;
    const st = $('#rv-stage', layers.reveal), r = pullRes.chest;
    st.innerHTML = `<div class="chest-wrap"><div class="chest-title">${tr('Сундук трофеев!')}</div><div class="chest" id="chest"><img class="c0" src="assets/sprites/ui_chest.png" alt=""><img class="c1" src="assets/sprites/ui_chestopen.png" alt=""></div></div>`;
    rvNext('');
    const ch = $('#chest', st);
    [400, 1000, 1500].forEach((ms, k) => rvLater(ms, () => { ch.classList.remove('wob'); void ch.offsetWidth; ch.classList.add('wob'); snd('thud', { vol: 0.6 + k * 0.15 }); fxAt(ch, 12 + k * 10, RCOL[r.rarity], 160); }));
    rvLater(2100, () => {
      ch.classList.add('open');
      fxAt(ch, 140, RCOL[r.rarity], 420);
      snd(r.rarity === 5 ? 'choir' : 'shimmer', { vol: 0.8 });
      snd('boom', { vol: 0.6, rate: 1.3 });
    });
    rvLater(2700, () => { const cw = $('.chest-wrap', st); if (cw) cw.style.opacity = '0'; const wrap = el('div', 'chest-res'); st.appendChild(wrap); rvShow(r, wrap); rvNext(tr('Enter или клик — готово')); rv.phase = 'chest-done'; });
  }

  let pullLock = 0;
  function rvClose() {
    rvClear();
    pullLock = performance.now() + 900;
    const fe = pullRes.feathers;
    rv = null;
    state = 'menu';
    go('gacha');
    if (fe) toast(tr('+{0} перьев', fe));
  }

  function rvFinish() {
    if (pullRes.chest && !rv.chestShown) { rvChest(); return; }
    rvClose();
  }

  function nextReveal() {
    if (!rv) { state = 'menu'; go('gacha'); return; }
    const ph = rv.phase;
    if (ph === 'aim') { rvAimDone(); return; }
    if (ph === 'anomaly' || ph === 'burst' || ph === 'chest') return;
    if (ph === 'launch') { rv.flare = null; rvClear(); rvDim(0); if (pullRes.length === 1) rvShow(0); else if (pullRes.length <= 10) { rvDeal(); rvFlipAll(); } else { rvGrid100(); rvFlipAll(); } return; }
    if (ph === 'deal' || ph === 'grid' || ph === 'grid100') { rvFlipAll(); return; }
    if (ph === 'cine-grid') { rvClear(); if (rv.over) { rv.over.remove(); rv.over = null; } const res = rv.resume; rv.phase = 'grid'; rvNext(tr('Клик — открыть все')); res(); return; }
    if (ph === 'detail') { rvClear(); if (rv.detailEl) rv.detailEl.remove(); rv.phase = 'done'; rvGridDone(); return; }
    rvFinish();
  }

  function buildLevelUp() {
    const L = layers.levelup;
    L.innerHTML = `<div class="shade"></div><div class="panel-wrap"><div class="col" style="pointer-events:auto">
      <div class="big-title" style="color:#7cfc9a">${tr('Уровень {0}!', game.level - pendingLevels + 1)}</div>
      <div class="cards" id="lv-cards"></div>
      <div class="center wood-text" style="margin-top:10px">${tr('← → и Enter, клик или 1 / 2 / 3')}</div>
      ${game.rerolls > 0 ? '<div class="buttons"><button class="k-btn" id="lv-reroll"><img src="assets/ui/dice.png" alt=""> ' + tr('Перебросить ({0}) — R', game.rerolls) + '</button></div>' : ''}</div></div>`;
    const rr = $('#lv-reroll', L);
    if (rr) rr.addEventListener('click', () => rerollChoices());
    const box = $('#lv-cards', L);
    choices.forEach((c, i) => {
      const d = el('div', 'up-card k-card' + (i === sel ? ' sel' : ''));
      d.insertAdjacentHTML('beforeend', `<div class="num">${i + 1}</div>`);
      d.appendChild(cv(upIcon(c.icon)));
      d.insertAdjacentHTML('beforeend', `<div class="un">${c.name}</div><div class="lvl-tag">${c.kind === 'skill' ? tr('Умение') : tr('Улучшение')} · ${c.isNew ? '<b style="color:var(--good)">' + tr('Новое!') + '</b>' : tr('ур. {0} → {1}', c.lvl, c.lvl + 1)}</div><div class="ud">${c.desc()}</div>`);
      d.addEventListener('mouseenter', () => { sel = i; markLevel(); });
      d.addEventListener('click', () => choose(i));
      box.appendChild(d);
    });
    cache.lvKey = choices.map(c => c.name).join('|') + game.level + pendingLevels + ':' + game.rerolls;
  }

  function markLevel() {
    [...$('#lv-cards').children].forEach((d, i) => d.classList.toggle('sel', i === sel));
    cache.lvSel = sel;
  }

  function buildPause() {
    layers.pause.innerHTML = `<div class="shade"></div><div class="panel-wrap"><div class="panel k-frame" style="text-align:center;min-width:320px">
      <div class="big-title wood-text" style="color:var(--wood-text)">${tr('Пауза')}</div>
      <div class="col"><button class="k-btn big" id="ps-go">${tr('Продолжить')}</button><button class="k-btn big" id="ps-menu">${tr('В меню')}</button></div>
      <div class="muted" style="margin-top:8px">${tr('Esc — продолжить, Q — в меню')}</div></div></div>`;
    $('#ps-go').addEventListener('click', () => { state = 'play'; });
    $('#ps-menu').addEventListener('click', () => toMenu());
  }

  function buildResult(won) {
    const s = statsOf();
    const rows = [[tr('Продержался'), fmtTime(game.time)], [tr('Титанов убито'), game.kills], [tr('Уровень'), game.level]];
    if (faction.civs) rows.push([tr('Горожан погибло'), game.lost]);
    if (faction.threat > 1) rows.push([tr('Угроза'), THREAT_NAMES[faction.threat - 1]]);
    if (game.ticketGain) rows.push([tr('Билеты призыва'), '+' + game.ticketGain]);
    if (game.heroXpGain) rows.push([tr('Опыт героя'), '+' + game.heroXpGain + (game.heroUps ? ' · ' + tr('новый уровень!') : '')]);
    if (game.unlocked) rows.push([tr('Открыта угроза'), THREAT_NAMES[game.unlocked - 1] + '!']);
    rows.push([tr('Рекорд'), fmtTime(bestOf(faction))]);
    layers.result.innerHTML = `<div class="shade"></div><div class="panel-wrap"><div class="panel k-frame result">
      <div class="rt" style="color:${won ? '#2c7030' : '#b8302a'}">${won ? (faction.map === 'field' ? tr('Вылазка удалась!') : tr('Город отбит!')) : tr('Ты пал')}</div>
      <div class="muted">${won ? tr('{0} гордится тобой', faction.name) : tr('{0} · отдай своё сердце…', faction.name)}</div>
      <div class="list">${rows.map(([k, v]) => `<div>${k}</div><div class="v">${v}</div>`).join('')}</div>
      <div class="reward"><img src="assets/ui/coin.png" alt="">+${game.reward}</div>
      ${(game.newDone && game.newDone.length) || game.newDaily > 0 ? '<div class="newdone k-tip">' + tr('Выполнено: ') + [...(game.newDone || []).map(n => '«' + n + '»'), ...(game.newDaily > 0 ? [tr('заданий дня: {0}', game.newDaily)] : [])].join(', ') + tr(' — забери награду в «Заданиях»') + '</div>' : ''}
      <div class="buttons">
        ${won ? '<button class="k-btn big" id="rs-endless">' + tr('Дальше без конца') + '</button>' : ''}
        <button class="k-btn big" id="rs-again">${tr('Ещё раз')}</button>
        <button class="k-btn big" id="rs-menu">${tr('В меню')}</button>
      </div></div></div>`;
    $('#rs-again').addEventListener('click', () => start());
    $('#rs-menu').addEventListener('click', () => toMenu());
    if (won) $('#rs-endless').addEventListener('click', () => { game.endless = true; state = 'play'; });
  }

  let lastState = '';
  function sync(dt) {
    const st = state;
    if (st !== lastState) {
      const prev = lastState;
      lastState = st;
      layers.menu.classList.toggle('on', st === 'menu');
      layers.hud.classList.toggle('on', st === 'play' || st === 'levelup' || st === 'paused' || st === 'over' || st === 'win');
      layers.levelup.classList.toggle('on', st === 'levelup');
      layers.pause.classList.toggle('on', st === 'paused');
      layers.result.classList.toggle('on', st === 'over' || st === 'win');
      layers.reveal.classList.toggle('on', st === 'pull');
      if (st === 'menu') go(prev === 'pull' ? 'gacha' : prev && prev !== 'menu' ? 'hub' : screen);
      music(st);
      if (st === 'paused') buildPause();
      if (st === 'over' || st === 'win') buildResult(st === 'win');
      if (layers.hud.classList.contains('on')) refreshHudStatic();
    }
    if (st === 'levelup') {
      const key = choices.map(c => c.name).join('|') + game.level + pendingLevels + ':' + game.rerolls;
      if (key !== cache.lvKey) buildLevelUp();
      else if (cache.lvSel !== sel) markLevel();
    }
    if (layers.hud.classList.contains('on')) updateHud();
    if (msgT > 0) {
      msgT -= dt;
      if (msgT <= 0) $('#msg').classList.remove('on');
    }
  }

  function refreshHudStatic() {
    const hero = charById(player.char);
    if (cache.hudHero !== hero.id) {
      cache.hudHero = hero.id;
      hud.face.innerHTML = '';
      hud.face.appendChild(face(hero.id));
      hud.name.textContent = hero.name;
      hud.name.className = rarityClass(hero.rarity);
    }
    hud.civ.style.display = faction.civs ? '' : 'none';
    cache.hp = -1;
  }

  const setText = (node, key, text) => { if (cache[key] !== text) { cache[key] = text; node.textContent = text; } };

  function updateHud() {
    if (cache.hp !== player.hp || cache.maxHp !== stats.maxHp) {
      cache.hp = player.hp;
      cache.maxHp = stats.maxHp;
      hud.hearts.innerHTML = '';
      for (let i = 0; i < stats.maxHp; i++) hud.hearts.appendChild(cv(i < player.hp ? HEART : HEART_EMPTY));
    }
    setText(hud.timer, 'timer', game.endless ? fmtTime(game.time) : `${fmtTime(game.time)} / ${fmtTime(WIN_TIME)}`);
    setText(hud.kills, 'kills', tr('Титанов убито: {0}', game.kills));
    setText(hud.combo, 'combo', game.combo > 1 && game.time - game.lastKill < 4 ? tr('КОМБО x{0}', game.combo) : '');
    setText(hud.civ, 'civ', tr('Горожан погибло: {0}', game.lost));
    setText(hud.lvl, 'lvl', tr('Ур. {0}', game.level));
    const xp = Math.round(clamp(game.xp / game.need, 0, 1) * 1000) / 10;
    if (cache.xp !== xp) { cache.xp = xp; hud.xp.style.width = xp + '%'; }
    const z = Math.round(clamp(player.z / MAXZ, 0, 1) * 100);
    if (cache.z !== z) { cache.z = z; hud.fill.style.height = z + '%'; }
    const nt = nearestTitan(stats.engage + 200);
    const need = nt ? Math.round(clamp(reqZ(nt) / MAXZ, 0, 1) * 100) : -1;
    const ok = nt && player.z >= reqZ(nt);
    const nk = need + ':' + ok;
    if (cache.need !== nk) {
      cache.need = nk;
      hud.need.style.display = need < 0 ? 'none' : '';
      hud.need.style.bottom = need + '%';
      hud.need.classList.toggle('ok', !!ok);
    }
    hud.gauge.classList.toggle('low', player.lowT > 0 && Math.floor(player.lowT * 10) % 2 === 1);
    const B = game.boss;
    const bst = B ? (B.boss.kneel > 0 ? ' · ' + tr('на коленях — бей в затылок!') : ` · ${B.boss.def.wp}: ${B.boss.wp.filter(w => w.cut).length}/2`) : '';
    const bk = B ? B.boss.name + B.boss.hp + '/' + B.boss.max + (B.boss.harden > 0 ? 'h' : '') + bst : '';
    if (cache.boss !== bk) {
      cache.boss = bk;
      hud.boss.style.display = B ? '' : 'none';
      if (B) {
        hud.bossName.textContent = B.boss.name + bst;
        hud.bossSegs.innerHTML = Array.from({ length: B.boss.max }, (_, i) => '<i class="' + (i < B.boss.hp ? 'on' : '') + (B.boss.harden > 0 ? ' hard' : '') + '"></i>').join('');
      }
    }
    const sk = Object.entries(stats.skills || {}).filter(([, l]) => l > 0);
    const skKey = sk.map(([k, l]) => k + l).join();
    if (cache.sk !== skKey) {
      cache.sk = skKey;
      hud.skills.innerHTML = '';
      for (const [k, l] of sk) {
        const d = el('div', 'sk plate');
        d.appendChild(cv(upIcon(SKILLS[k].icon)));
        d.insertAdjacentHTML('beforeend', '<span class="wood-text">' + l + '</span>');
        d.title = SKILLS[k].name;
        hud.skills.appendChild(d);
      }
    }
    const bn = game.banner;
    const bnk = bn ? bn.text + bn.sub : '';
    if (cache.bn !== bnk) {
      cache.bn = bnk;
      hud.banner.classList.toggle('on', !!bn);
      hud.banner.classList.toggle('win', !!(bn && bn.win));
      if (bn) { hud.bannerT.textContent = bn.text; hud.bannerS.textContent = bn.sub; }
    }
    const showTip = settings().hints && game.time < 16;
    if (cache.tip !== showTip) { cache.tip = showTip; hud.tip.style.display = showTip ? '' : 'none'; }
  }

  function music(st) {
    if (typeof SND === 'undefined') return;
    if (st === 'menu' || st === 'pull') SND.playList('menu');
    else if (st === 'over' || st === 'win') SND.playList(null);
    else SND.playList(faction.map);
    SND.setDuck(st === 'paused' ? 0.35 : st === 'levelup' ? 0.6 : st === 'pull' ? 0.4 : 1);
  }

  function key(e) {
    const c = e.code;
    if (c === 'KeyM') { toggleMute(); return state === 'menu' || state === 'pull'; }
    if (state === 'pull') {
      if (c === 'Enter' || c === 'Space') nextReveal();
      if (c === 'Escape') rvClose();
      return true;
    }
    if (state !== 'menu') return false;
    if (c === 'Escape' && screen !== 'hub') { go('hub'); return true; }
    if (screen === 'hub') {
      if (c === 'ArrowUp' || c === 'KeyW') { hubSel = (hubSel + HUB_ITEMS.length - 1) % HUB_ITEMS.length; refreshHubFocus(); }
      if (c === 'ArrowDown' || c === 'KeyS') { hubSel = (hubSel + 1) % HUB_ITEMS.length; refreshHubFocus(); }
      if (c === 'Enter' || c === 'Space') go(HUB_ITEMS[hubSel].id);
    } else if (screen === 'battle') {
      if (c === 'ArrowLeft' || c === 'KeyA') { factionSel = (factionSel + 2) % 3; requestReset(); refreshBattle(); }
      if (c === 'ArrowRight' || c === 'KeyD') { factionSel = (factionSel + 1) % 3; requestReset(); refreshBattle(); }
      if (['Digit1', 'Digit2', 'Digit3'].includes(c)) { factionSel = +c.slice(5) - 1; requestReset(); refreshBattle(); }
      if (c === 'ArrowUp' || c === 'KeyW' || c === 'ArrowDown' || c === 'KeyS') { const cur = (save.threatSel && save.threatSel[FACTIONS[factionSel].id]) || 1; setThreat(cur + (c === 'ArrowUp' || c === 'KeyW' ? 1 : -1)); }
      if (c === 'Enter' || c === 'Space') start();
    } else if (screen === 'squad') {
      const n = CHARS.length;
      if (c === 'ArrowLeft' || c === 'KeyA') squadSel = (squadSel + n - 1) % n;
      if (c === 'ArrowRight' || c === 'KeyD') squadSel = (squadSel + 1) % n;
      if (c === 'ArrowUp' || c === 'KeyW') squadSel = (squadSel + n - 5) % n;
      if (c === 'ArrowDown' || c === 'KeyS') squadSel = Math.min(n - 1, squadSel + 5);
      if (c === 'Enter' || c === 'Space') pickHero();
      refreshSquad();
    } else if (screen === 'gacha') {
      if (performance.now() < pullLock) return true;
      if (c === 'Digit1' || c === 'Enter') doPull(1);
      if (c === 'Digit0') doPull(10);
      if (c === 'KeyF' && freeAvailable()) doPull(1, 'free');
      if (c === 'KeyT' && tickets() > 0) doPull(1, 'ticket');
      if (c === 'Tab' || c === 'KeyQ' || c === 'KeyE') { gBanner = gBanner === 'event' ? 'standard' : 'event'; refreshGacha(); }
    }
    return true;
  }

  function init() {
    if (IS_TOUCH) document.documentElement.classList.add('touch');
    build();
    applyAudio();
    root.addEventListener('click', e => { if (e.target.closest('.k-btn:not(.off), .faction, .hero-card, .up-card, .k-icon')) snd('click', { vol: 0.7 }); }, true);
    layers.reveal.addEventListener('click', () => { if (rv && rv.ignoreClick) { rv.ignoreClick = false; return; } nextReveal(); });
    layers.reveal.addEventListener('pointerdown', () => { if (rv && rv.phase === 'aim') rv.charging = true; });
    layers.reveal.addEventListener('pointerup', () => { if (rv) rv.charging = false; });
    go('hub');
    sync(0);
    const P = new URLSearchParams(location.search);
    const devHost = location.protocol === 'file:' || ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if (!devHost) return;
    if (P.get('tokens')) save.tokens = +P.get('tokens');
    if (P.get('meta')) { ensureMeta(); for (const t of TRAINING) save.meta[t.id] = Math.min(t.max, +P.get('meta')); reset(); }
    if (P.get('stats')) { ensureMeta(); Object.assign(save.stats, { kills: 1234, runs: 12, bestLevel: 22, maxCombo: 11 }); save.stats.bosses.female = 1; save.daily.tasks[0].progress = 999; save.claimed = { kills0: true, runs0: true, kills1: true, lvl0: true }; refreshFooter(); }
    if (P.get('all')) for (const c of CHARS) save.chars[c.id] = save.chars[c.id] || 1 + (c.id.length % 3);
    if (P.get('hero')) { save.chars[P.get('hero')] = save.chars[P.get('hero')] || 1; save.selected = P.get('hero'); reset(); go('hub'); }
    const q = P.get('ui');
    if (q) debugScreen(q);
  }

  function debugScreen(q) {
    if (['battle', 'squad', 'gacha', 'records', 'settings', 'training', 'missions'].includes(q)) { go(q); return; }
    if (q === 'pull') { save.tokens += 900; go('gacha'); doPull(10); return; }
    if (q === 'pull100') { save.tokens += PULL100_COST; go('gacha'); doPull(100); const U = new URLSearchParams(location.search); if (U.get('skipaim')) rvAimDone(); return; }
    if (q === 'gear') { for (let i = 0; i < 40; i++) grantGear(pick(GEAR).id, 1 + Math.floor(Math.random() * 5)); go('gear'); return; }
    if (q === 'pull1') { save.tokens += 100; go('gacha'); doPull(1); return; }
    if (q === 'shop') { const g = gachaState(); g.feathers = (g.feathers || 0) + 200; g.tickets = (g.tickets || 0) + 2; gBanner = 'shop'; shopPick = 'pick4'; go('gacha'); return; }
    if (q === 'pull5' || q === 'pull10x' || q === 'anomaly') {
      const U = new URLSearchParams(location.search);
      save.tokens += 900;
      save.pity5 = PITY5 - 1;
      window.FORCE_ANOMALY = q === 'anomaly';
      if (U.get('chest')) { gachaState().chest[gBanner] = 9.5; }
      go('gacha');
      doPull(q === 'pull10x' ? 10 : 1);
      if (U.get('skipaim')) rvAimDone();
      return;
    }
    if (q === 'walk') {
      start();
      for (let i = 0; i < 30; i++) update(1 / 60);
      titans.length = 0; game.spawnT = 99;
      ['normal', 'lanky', 'fat', 'aberrant'].forEach((ty, i) => { spawnTitan({ x: player.x - 420 + i * 280, y: player.y - 200 }); const t = titans[titans.length - 1]; t.art = ty; t.set = titanSet(t); t.face = i % 2 ? Math.PI : Math.PI / 2; t.phase = Math.PI / 2 + 0.1; t.spCd = 99; });
      for (const c of civs.slice(0, 6)) { c.x = player.x + rand(-300, 300); c.y = player.y + rand(60, 220); c.moving = true; c.dir = rand(-1, 1) + (Math.random() < 0.5 ? 0 : Math.PI); c.phase = 0.4; }
      cam.x = player.x - viewW() / 2; cam.y = player.y - viewH() / 2;
      window.FREEZE = true; sync(0); return;
    }
    if (q === 'types') {
      start();
      for (let i = 0; i < 30; i++) update(1 / 60);
      titans.length = 0; game.spawnT = 99;
      const ks = ['normal', 'lanky', 'fat', 'aberrant', 'small', 'crawler', 'thrower', 'giant'].filter(k => KINDS[k].art || kindReady(k));
      ks.forEach((k, i) => { spawnTitan({ x: player.x - 760 + i * 220, y: player.y - 120 + (i % 2) * 140 }, k); const t = titans[titans.length - 1]; t.face = Math.PI / 2; t.spCd = 99; t.speed = 0; });
      cam.x = player.x - viewW() / 2; cam.y = player.y - viewH() / 2 - 80;
      window.FREEZE = true; sync(0); return;
    }
    if (q === 'grab') {
      start();
      for (let i = 0; i < 30; i++) update(1 / 60);
      titans.length = 0; game.spawnT = 99;
      const types = ['normal', 'lanky', 'fat', 'aberrant'];
      types.forEach((ty, i) => { spawnTitan({ x: player.x - 450 + i * 300, y: player.y + 60 }); const t = titans[titans.length - 1]; t.art = ty; t.set = titanSet(t); t.face = i % 2 ? Math.PI : 0; t.state = 'grab'; t.grabT = grabWind(t) * 0.8; t.grabAng = t.face; });
      cam.x = player.x - viewW() / 2; cam.y = player.y - viewH() / 2;
      window.FREEZE = true; sync(0); return;
    }
    if (q === 'kill' || q === 'orbit' || q === 'stomp' || q === 'leap' || q === 'roar') {
      start();
      for (let i = 0; i < 30; i++) update(1 / 60);
      titans.length = 0;
      game.spawnT = 99;
      if (q === 'stomp') {
        spawnTitan({ x: player.x + 160, y: player.y - 40 });
        const t = titans[titans.length - 1];
        Object.assign(t, { H: 400, size: 200, Hp: 200 }); t.set = titanSet(t); t.napeZ = t.H * 0.8;
        player.z = 0;
        startTitanSpecial(t, 'stomp');
        for (let i = 0; i < 50; i++) update(1 / 60);
      } else if (q === 'leap') {
        spawnTitan({ x: player.x + 420, y: player.y - 60 });
        const t = titans[titans.length - 1];
        t.aberrant = true; t.art = 'aberrant'; t.set = titanSet(t);
        startTitanSpecial(t, 'leap');
        for (let i = 0; i < 45; i++) update(1 / 60);
      } else if (q === 'roar') {
        spawnTitan({ x: player.x + 200, y: player.y - 30 });
        spawnTitan({ x: player.x - 260, y: player.y + 60 });
        startTitanSpecial(titans[0], 'roar');
        for (let i = 0; i < 18; i++) update(1 / 60);
      } else {
        spawnTitan({ x: player.x + 220, y: player.y - 20 });
        const t = titans[titans.length - 1];
        t.face = q === 'orbit' ? Math.PI : 0;
        t.speed = 0;
        player.z = 300;
        engage();
        for (let i = 0; i < 600; i++) {
          update(1 / 60);
          if (q === 'orbit' && player.phase === 'orbit' && (game.orbF = (game.orbF || 0) + 1) > 7) break;
          if (q === 'kill' && game.slowT > 0 && game.slowT < 0.22) break;
        }
      }
      cam.x = player.x - viewW() / 2; cam.y = player.y - KZ * player.z * 0.5 - viewH() / 2 - 40;
      window.FREEZE = true;
      sync(0);
      return;
    }
    if (q.startsWith('boss_')) {
      start();
      const def = BOSSES.find(b => b.kind === q.slice(5)) || BOSSES[0];
      for (const k of Object.keys(stats.skills)) stats.skills[k] = 2;
      syncAllies();
      for (let i = 0; i < 60; i++) update(1 / 60);
      spawnBoss(def);
      const B = game.boss;
      B.x = player.x + 260;
      B.y = player.y - 40;
      if (B.boss.def.fixed) placePylons(B);
      B.boss.cd = 0.4;
      player.z = 200;
      for (let i = 0; i < 70; i++) update(1 / 60);
      if (new URLSearchParams(location.search).get('n')) window.FREEZE = true;
      return;
    }
    start();
    for (let i = 0; i < 60 * 8; i++) { update(1 / 60); if (state === 'levelup') choose(0); if (state === 'over') { state = 'play'; player.hp = 3; } }
    if (q === 'levelup') { gainXp(game.need + 1); }
    if (q === 'pause') state = 'paused';
    if (q === 'over') { state = 'over'; finishRun(false); }
    if (q === 'win') { state = 'win'; finishRun(true); }
  }

  return { init, sync, key, go, toast, rvPhase: () => (rv ? rv.phase : null), rvFlare: () => (rv && rv.flare ? rv.flare.t : null) };
})();
