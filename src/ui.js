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
    { id: 'battle', label: 'В бой', icon: 'play' },
    { id: 'squad', label: 'Отряд', icon: 'square' },
    { id: 'training', label: 'Тренировки', icon: 'pearl' },
    { id: 'gacha', label: 'Призыв', icon: 'coin' },
    { id: 'missions', label: 'Задания', icon: 'ribbon' },
    { id: 'records', label: 'Рекорды', icon: 'seal_green' },
    { id: 'settings', label: 'Настройки', icon: 'gear' },
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
        <div class="logo"><div class="title">АТАКА ТИТАНОВ</div><div class="sub">SURVIVORS</div></div>
        <div class="hub-hero k-frame">
          <div class="stage"><img id="hub-hero-img" alt=""></div>
          <div class="name" id="hub-hero-name"></div>
          <div class="center stars" id="hub-hero-stars"></div>
          <div class="ability" id="hub-hero-ab"></div>
        </div>
        <div class="hub-menu" id="hub-menu"></div>
      </div>
      <div class="screen" data-s="battle"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">Выбери вылазку</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="factions" id="factions"></div>
        <div class="buttons"><button class="k-btn big" id="go">${img('play')} В бой!</button></div>
        <div class="center muted" style="margin-top:8px">WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака по затылку</div>
      </div></div></div>
      <div class="screen" data-s="squad"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">Отряд</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="row" style="align-items:flex-start">
          <div class="squad" id="squad"></div>
          <div class="squad-detail k-card" id="squad-detail"></div>
        </div>
      </div></div></div>
      <div class="screen" data-s="gacha"><div class="panel-wrap"><div class="panel k-frame gacha-banner">
        <div class="head"><span class="h2">Призыв разведчиков</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="faces" id="gacha-faces"></div>
        <div>Сигнальная ракета покажет, кто откликнулся на зов</div>
        <div class="muted" style="margin:6px 0"><span class="r5">Легендарный 4%</span> · <span class="r4">Эпический 21%</span> · <span class="r3">Редкий 75%</span></div>
        <div id="gacha-pity" style="color:#7a3aa8"></div>
        <div class="muted">Повтор даёт звезду (+3% к скорости), сверх пяти звёзд — жетоны</div>
        <div class="buttons">
          <button class="k-btn big" id="pull1">${img('coin')} 1 — 100</button>
          <button class="k-btn big" id="pull10">${img('coin')} 10 — 900</button>
        </div>
      </div></div></div>
      <div class="screen" data-s="training"><div class="panel-wrap"><div class="panel k-frame" style="width:min(1000px,94vw)">
        <div class="head"><span class="h2">Тренировки кадетского корпуса</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="muted" style="margin-bottom:8px">Постоянные улучшения за жетоны — действуют в каждом забеге</div>
        <div class="train-grid" id="training"></div>
      </div></div></div>
      <div class="screen" data-s="missions"><div class="panel-wrap"><div class="panel k-frame" style="width:min(820px,94vw)">
        <div class="head"><span class="h2">Задания</span><span class="rank" id="rank"></span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="sec">Сегодня</div>
        <div class="mis-list" id="daily"></div>
        <div class="sec">Достижения</div>
        <div class="mis-list" id="achievements"></div>
      </div></div></div>
      <div class="screen" data-s="records"><div class="panel-wrap"><div class="panel k-frame">
        <div class="head"><span class="h2">Рекорды</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="list" id="records"></div>
      </div></div></div>
      <div class="screen" data-s="settings"><div class="panel-wrap"><div class="panel k-frame" style="width:min(560px,92vw)">
        <div class="head"><span class="h2">Настройки</span><button class="k-icon" data-back>${img('close')}</button></div>
        <div id="settings"></div>
      </div></div></div>
      <div class="bottom-bar">
        <div class="row" style="gap:10px"><div class="coins k-card"><img src="assets/ui/coin.png" alt=""><span id="tokens"></span></div><div class="coins k-card rank-plate"><img src="assets/ui/ribbon.png" alt=""><span id="rank-foot"></span></div></div>
        <div class="hint" id="menu-hint"></div>
      </div>
      <div class="msg k-tip" id="msg"></div>`;
    const hm = $('#hub-menu', M);
    HUB_ITEMS.forEach((it, i) => {
      const b = el('button', 'k-btn', `${img(it.icon, 'ico')} ${it.label}${it.id === 'missions' ? '<span class="badge" id="mis-badge"></span>' : ''}`);
      b.addEventListener('click', () => go(it.id));
      b.addEventListener('mouseenter', () => { hubSel = i; refreshHubFocus(); });
      hm.appendChild(b);
    });
    M.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => go('hub')));
    $('#go', M).addEventListener('click', () => start());
    $('#pull1', M).addEventListener('click', () => doPull(1));
    $('#pull10', M).addEventListener('click', () => doPull(10));
    const gf = $('#gacha-faces', M);
    gf.appendChild(face('mikasa'));
    gf.appendChild(face('levi'));
    gf.appendChild(face('hange'));
  }

  function buildHud() {
    const Hd = layers.hud;
    Hd.innerHTML = `
      <div class="tl">
        <div class="plate wood-text"><span id="hud-face"></span><div class="hearts" id="hud-hearts"></div><span id="hud-name"></span></div>
        <div style="position:relative"><div class="gauge k-field" id="hud-gauge"><div class="fill"></div><div class="need"></div></div><div class="gauge-label wood-text">ВЫСОТА</div></div>
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
      <div class="tip-line k-tip" id="hud-tip">WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака</div>`;
    Object.assign(hud, {
      face: $('#hud-face', Hd), hearts: $('#hud-hearts', Hd), name: $('#hud-name', Hd), gauge: $('#hud-gauge', Hd),
      fill: $('#hud-gauge .fill', Hd), need: $('#hud-gauge .need', Hd), timer: $('#hud-timer', Hd), kills: $('#hud-kills', Hd),
      combo: $('#hud-combo', Hd), boss: $('#hud-boss', Hd), bossName: $('#hud-boss-name', Hd), bossSegs: $('#hud-boss-segs', Hd), skills: $('#hud-skills', Hd), banner: $('#hud-banner', Hd), bannerT: $('#hud-banner-t', Hd), bannerS: $('#hud-banner-s', Hd), civ: $('#hud-civ', Hd), lvl: $('#hud-lvl', Hd), xp: $('#hud-xp', Hd), tip: $('#hud-tip', Hd),
    });
    $('#hud-pause', Hd).addEventListener('click', () => { if (state === 'play') state = 'paused'; });
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
    const hints = { hub: '↑↓ — выбрать, Enter — открыть', battle: '← → — фракция, Enter — в бой, Esc — назад', squad: 'Стрелки — выбрать, Enter — взять в бой, Esc — назад', gacha: '1 — один призыв, 0 — десять, Esc — назад', records: 'Esc — назад', settings: 'Esc — назад', training: 'Клик — купить уровень, Esc — назад', missions: 'Клик — забрать награду, Esc — назад' };
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
      c.insertAdjacentHTML('beforeend', `<div class="fname">${f.name}</div><div class="diff" style="color:${['#2c7030', '#a8681a', '#b8302a'][i]}">${f.diff} · жетоны x${[1, 1.5, 2][i]}</div><div class="desc">${f.desc}</div><div class="muted">${b ? 'Рекорд: ' + fmtTime(b) : 'Ещё не пройдено'}</div>`);
      c.addEventListener('click', () => {
        if (i === factionSel) start();
        else { factionSel = i; requestReset(); refreshBattle(); }
      });
      box.appendChild(c);
    });
  }

  let squadSel = 0;
  function refreshSquad() {
    const box = $('#squad');
    box.innerHTML = '';
    CHARS.forEach((c, i) => {
      const owned = save.chars[c.id];
      const d = el('div', 'hero-card k-card' + (i === squadSel ? ' sel' : '') + (owned ? '' : ' locked') + (save.selected === c.id ? ' chosen' : ''));
      d.appendChild(face(c.id));
      d.insertAdjacentHTML('beforeend', `<div class="hn">${owned ? c.name : '???'}</div><div class="${rarityClass(c.rarity)}">${owned ? starsHTML(owned) : RARITY[c.rarity].name}</div>`);
      d.addEventListener('click', () => { squadSel = i; pickHero(); refreshSquad(); });
      box.appendChild(d);
    });
    const c = CHARS[squadSel], owned = save.chars[c.id];
    const det = $('#squad-detail');
    det.innerHTML = '';
    det.appendChild(face(c.id));
    det.insertAdjacentHTML('beforeend', `<div class="center h2 ${rarityClass(c.rarity)}" style="line-height:1">${owned ? c.name : 'Не открыт'}</div>
      <div class="center ${rarityClass(c.rarity)}">${RARITY[c.rarity].name}</div>
      <div class="center muted" style="margin:6px 0;min-height:60px">${owned ? c.ability : 'Можно получить в «Призыве»'}</div>`);
    const btn = el('button', 'k-btn' + (owned && save.selected !== c.id ? '' : ' off'), save.selected === c.id ? 'Уже в бою' : owned ? 'Взять в бой' : 'Закрыт');
    btn.style.width = '100%';
    btn.addEventListener('click', pickHero);
    det.appendChild(btn);
  }

  function pickHero() {
    const c = CHARS[squadSel];
    if (!save.chars[c.id]) return;
    save.selected = c.id;
    persist();
    toast(`${c.name} идёт в бой`);
    refreshSquad();
  }

  function refreshGacha() {
    $('#gacha-pity').textContent = `Эпический гарантирован через ${Math.max(1, 10 - save.pity4)}, легендарный — через ${Math.max(1, 40 - save.pity5)}`;
    $('#pull1').classList.toggle('off', save.tokens < 100);
    $('#pull10').classList.toggle('off', save.tokens < 900);
    refreshFooter();
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
        <div class="ud">${cost === null ? t.text(l) : (l ? 'Ур. ' + (l + 1) + ': ' : '') + t.text(l + 1)}</div>`);
      const b = el('button', 'k-btn' + (cost === null || save.tokens < cost ? ' off' : ''), cost === null ? 'Максимум' : `<img src="assets/ui/coin.png" alt=""> ${cost}`);
      b.addEventListener('click', () => {
        if (cost === null) return;
        if (save.tokens < cost) { toast('Не хватает жетонов — сыграй забег'); snd('error', { vol: 0.6 }); return; }
        if (buyTraining(t.id)) { snd('levelup', { vol: 0.6 }); toast(t.name + ': уровень ' + save.meta[t.id]); refreshTraining(); refreshFooter(); }
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
    const b = el('button', 'k-btn' + (done && !claimed ? '' : ' off'), claimed ? 'Получено' : `<img src="assets/ui/coin.png" alt=""> ${reward}`);
    b.addEventListener('click', () => {
      if (!done || claimed) return;
      const got = onClaim();
      if (got) { snd('chime5', { vol: 0.7, tag: 'chime' }); snd('bong', { vol: 0.5 }); toast('+' + got + ' жетонов'); refreshMissions(); refreshFooter(); }
    });
    row.appendChild(b);
    return row;
  }

  function refreshMissions() {
    const rk = rankInfo();
    $('#rank').innerHTML = `Звание: <b>${rk.name}</b>${rk.next ? ' · до «' + rk.next.name + '»: ' + (rk.next.at - rk.n) : ''}`;
    const dbox = $('#daily');
    dbox.innerHTML = '';
    for (const t of dailyState()) dbox.appendChild(misRow('Задание дня', t.text, t.value, t.goal, t.reward, t.done, t.claimed, () => claimDaily(t.i)));
    const abox = $('#achievements');
    abox.innerHTML = '';
    const list = achievementsState().sort((a, b) => ((b.done && !b.claimed) - (a.done && !a.claimed)) || (a.claimed - b.claimed));
    for (const a of list) abox.appendChild(misRow(a.name, a.text, a.value, a.goal, a.reward, a.done, a.claimed, () => claimAchievement(a.id)));
  }

  function refreshRecords() {
    const s = statsOf();
    const rows = FACTIONS.map(f => [f.name, bestOf(f) ? fmtTime(bestOf(f)) : '—']);
    rows.push(['Забегов', s.runs], ['Победы', s.wins], ['Титанов убито', s.kills], ['Лучший уровень', s.bestLevel], ['Время в бою', fmtTime(s.time)], ['Призывов', save.pulls], ['Бойцов открыто', `${Object.keys(save.chars).length} / ${CHARS.length}`]);
    $('#records').innerHTML = rows.map(([k, v]) => `<div>${k}</div><div class="v">${v}</div>`).join('');
  }

  function refreshSettings() {
    const st = settings();
    const box = $('#settings');
    const chk = (key, label) => `<div class="check" data-k="${key}"><img src="assets/ui/${st[key] ? 'check_on' : 'check_off'}.png" alt=""><span>${label}</span></div>`;
    box.innerHTML = `
      ${chk('shake', 'Тряска экрана при ударах')}
      ${chk('hints', 'Подсказки в бою')}
      ${chk('mute', 'Выключить весь звук (M)')}
      <div class="vol"><span>Музыка</span><input type="range" min="0" max="100" id="vol-music" value="${Math.round((st.music ?? 0.6) * 100)}"><span id="vol-music-v">${Math.round((st.music ?? 0.6) * 100)}</span></div>
      <div class="vol"><span>Эффекты</span><input type="range" min="0" max="100" id="vol-sfx" value="${Math.round((st.sfx ?? 0.8) * 100)}"><span id="vol-sfx-v">${Math.round((st.sfx ?? 0.8) * 100)}</span></div>
      <div style="margin-top:10px">Код сохранения — перенос прогресса на другой компьютер:</div>
      <textarea class="code-box" id="code" rows="3" spellcheck="false"></textarea>
      <div class="buttons" style="justify-content:flex-start">
        <button class="k-btn" id="code-copy">Скопировать мой код</button>
        <button class="k-btn" id="code-load">Загрузить код</button>
        <button class="k-btn" id="full">Во весь экран</button>
        <button class="k-btn" id="wipe">${confirmReset ? 'Точно стереть?' : 'Стереть прогресс'}</button>
      </div>
      <div class="muted" style="margin-top:10px;font-size:16px">Фан-игра по «Атаке титанов», некоммерческая. Шрифт Pixellari — Zacchary Dempsey-Plante. Музыка — RandomMind, Komiku, Will Carpenter, cynicmusic (CC0). Звуки — Kenney (CC0). Подробно — CREDITS.md.</div>`;
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
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => toast('Код скопирован'), () => toast('Выдели код и скопируй вручную'));
    });
    $('#code-load').addEventListener('click', () => {
      if (!ta.value.trim()) { toast('Вставь код в поле'); return; }
      if (importCode(ta.value)) { toast('Сохранение загружено'); factionSel = clamp(save.faction || 0, 0, 2); requestReset(); refreshSettings(); }
      else toast('Код не подходит');
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
      toast('Прогресс стёрт');
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
    toast(st.mute ? 'Звук выключен' : 'Звук включён');
    if (screen === 'settings' && state === 'menu') refreshSettings();
  }

  function toast(text) {
    const m = $('#msg');
    m.textContent = text;
    m.classList.add('on');
    msgT = 2.2;
  }

  function doPull(n) {
    if (save.tokens < (n === 10 ? 900 : 100)) { toast('Не хватает жетонов — сыграй забег'); snd('error', { vol: 0.6 }); return; }
    pull(n);
    revealIdx = 0;
    revealSummary = false;
    showReveal();
  }

  function showReveal() {
    const L = layers.reveal;
    if (revealSummary || revealIdx >= pullRes.length) {
      revealSummary = true;
      L.innerHTML = `<div class="summary k-frame"><div class="big-title wood-text" style="color:var(--gold)">Итоги призыва</div><div class="grid" id="rv-grid"></div></div><div class="next wood-text">Enter или клик — дальше</div>`;
      const gr = $('#rv-grid', L);
      for (const r of pullRes) {
        const d = el('div', 'hero-card k-card' + (r.c.rarity >= 4 ? ' sel' : ''));
        d.appendChild(face(r.c.id));
        d.insertAdjacentHTML('beforeend', `<div class="hn">${r.c.name}</div><div class="${r.isNew ? '' : rarityClass(r.c.rarity)}" style="${r.isNew ? 'color:var(--good)' : ''}">${r.isNew ? 'Новый!' : r.refund ? '+' + r.refund : starsHTML(r.stars)}</div>`);
        gr.appendChild(d);
      }
      return;
    }
    const r = pullRes[revealIdx], rar = RARITY[r.c.rarity];
    snd('reveal', { vol: 0.7 });
    setTimeout(() => {
      if (r.c.rarity >= 5) snd('victory', { vol: 0.8 });
      else if (r.c.rarity === 4) { snd('bong', { vol: 0.8 }); snd('chime6', { vol: 0.6, tag: 'chime' }); }
      else snd('chime3', { vol: 0.6, tag: 'chime' });
    }, 780);
    L.innerHTML = `<div class="flare" style="background:linear-gradient(${rar.flare}, transparent)"></div><div class="flash" style="background:${rar.flare}"></div>
      <div class="card-pop k-frame hid" id="rv-card"></div><div class="next wood-text">${revealIdx + 1} / ${pullRes.length} · Enter или клик — дальше</div>`;
    const card = $('#rv-card', L);
    setTimeout(() => card.classList.remove('hid'), 800);
    card.appendChild(body(r.c.id));
    card.insertAdjacentHTML('beforeend', `<div class="rname ${rarityClass(r.c.rarity)}" style="text-shadow:2px 2px 0 #3a1e0c">${r.c.name}</div>
      <div class="${rarityClass(r.c.rarity)}" style="text-shadow:1px 1px 0 #3a1e0c">${rar.name} ${starsHTML(r.stars)}</div>
      <div style="margin-top:6px">${r.isNew ? '<span style="color:var(--good)">Новый боец!</span> ' + r.c.ability : r.refund ? `Уже 5★ — возвращено ${r.refund} жетонов` : 'Повтор: +1 звезда'}</div>`);
  }

  function nextReveal() {
    if (revealSummary) { state = 'menu'; go('gacha'); return; }
    revealIdx++;
    if (revealIdx >= pullRes.length && pullRes.length === 1) { state = 'menu'; go('gacha'); return; }
    showReveal();
  }

  function buildLevelUp() {
    const L = layers.levelup;
    L.innerHTML = `<div class="shade"></div><div class="panel-wrap"><div class="col" style="pointer-events:auto">
      <div class="big-title" style="color:#7cfc9a">Уровень ${game.level - pendingLevels + 1}!</div>
      <div class="cards" id="lv-cards"></div>
      <div class="center wood-text" style="margin-top:10px">← → и Enter, клик или 1 / 2 / 3</div>
      ${game.rerolls > 0 ? '<div class="buttons"><button class="k-btn" id="lv-reroll"><img src="assets/ui/dice.png" alt=""> Перебросить (' + game.rerolls + ') — R</button></div>' : ''}</div></div>`;
    const rr = $('#lv-reroll', L);
    if (rr) rr.addEventListener('click', () => rerollChoices());
    const box = $('#lv-cards', L);
    choices.forEach((c, i) => {
      const d = el('div', 'up-card k-card' + (i === sel ? ' sel' : ''));
      d.insertAdjacentHTML('beforeend', `<div class="num">${i + 1}</div>`);
      d.appendChild(cv(upIcon(c.icon)));
      d.insertAdjacentHTML('beforeend', `<div class="un">${c.name}</div><div class="lvl-tag">${c.kind === 'skill' ? 'Умение' : 'Улучшение'} · ${c.isNew ? '<b style="color:var(--good)">Новое!</b>' : 'ур. ' + c.lvl + ' → ' + (c.lvl + 1)}</div><div class="ud">${c.desc()}</div>`);
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
      <div class="big-title wood-text" style="color:var(--wood-text)">Пауза</div>
      <div class="col"><button class="k-btn big" id="ps-go">Продолжить</button><button class="k-btn big" id="ps-menu">В меню</button></div>
      <div class="muted" style="margin-top:8px">Esc — продолжить, Q — в меню</div></div></div>`;
    $('#ps-go').addEventListener('click', () => { state = 'play'; });
    $('#ps-menu').addEventListener('click', () => toMenu());
  }

  function buildResult(won) {
    const s = statsOf();
    const rows = [['Продержался', fmtTime(game.time)], ['Титанов убито', game.kills], ['Уровень', game.level]];
    if (faction.civs) rows.push(['Горожан погибло', game.lost]);
    rows.push(['Рекорд', fmtTime(bestOf(faction))]);
    layers.result.innerHTML = `<div class="shade"></div><div class="panel-wrap"><div class="panel k-frame result">
      <div class="rt" style="color:${won ? '#2c7030' : '#b8302a'}">${won ? (faction.map === 'field' ? 'Вылазка удалась!' : 'Город отбит!') : 'Ты пал'}</div>
      <div class="muted">${won ? faction.name + ' гордится тобой' : faction.name + ' · отдай своё сердце…'}</div>
      <div class="list">${rows.map(([k, v]) => `<div>${k}</div><div class="v">${v}</div>`).join('')}</div>
      <div class="reward"><img src="assets/ui/coin.png" alt="">+${game.reward}</div>
      ${(game.newDone && game.newDone.length) || game.newDaily > 0 ? '<div class="newdone k-tip">Выполнено: ' + [...(game.newDone || []).map(n => '«' + n + '»'), ...(game.newDaily > 0 ? ['заданий дня: ' + game.newDaily] : [])].join(', ') + ' — забери награду в «Заданиях»</div>' : ''}
      <div class="buttons">
        ${won ? '<button class="k-btn big" id="rs-endless">Дальше без конца</button>' : ''}
        <button class="k-btn big" id="rs-again">Ещё раз</button>
        <button class="k-btn big" id="rs-menu">В меню</button>
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
    setText(hud.kills, 'kills', `Титанов убито: ${game.kills}`);
    setText(hud.combo, 'combo', game.combo > 1 && game.time - game.lastKill < 4 ? `КОМБО x${game.combo}` : '');
    setText(hud.civ, 'civ', `Горожан погибло: ${game.lost}`);
    setText(hud.lvl, 'lvl', `Ур. ${game.level}`);
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
    const bk = B ? B.boss.name + B.boss.hp + '/' + B.boss.max + (B.boss.harden > 0 ? 'h' : '') : '';
    if (cache.boss !== bk) {
      cache.boss = bk;
      hud.boss.style.display = B ? '' : 'none';
      if (B) {
        hud.bossName.textContent = B.boss.name + (B.boss.harden > 0 ? ' · затылок затвердел' : '');
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
      if (c === 'Escape') { revealSummary = true; nextReveal(); }
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
      if (c === 'Digit1' || c === 'Enter') doPull(1);
      if (c === 'Digit0') doPull(10);
    }
    return true;
  }

  function init() {
    build();
    applyAudio();
    root.addEventListener('click', e => { if (e.target.closest('.k-btn:not(.off), .faction, .hero-card, .up-card, .k-icon')) snd('click', { vol: 0.7 }); }, true);
    layers.reveal.addEventListener('click', nextReveal);
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
    if (q === 'pull') { save.tokens += 900; doPull(10); revealIdx = 3; showReveal(); return; }
    if (q === 'walk') {
      start();
      for (let i = 0; i < 30; i++) update(1 / 60);
      titans.length = 0; game.spawnT = 99;
      ['normal', 'lanky', 'fat', 'aberrant'].forEach((ty, i) => { spawnTitan({ x: player.x - 420 + i * 280, y: player.y - 200 }); const t = titans[titans.length - 1]; t.art = ty; t.set = titanSet(t); t.face = i % 2 ? Math.PI : Math.PI / 2; t.phase = Math.PI / 2 + 0.1; t.spCd = 99; });
      for (const c of civs.slice(0, 6)) { c.x = player.x + rand(-300, 300); c.y = player.y + rand(60, 220); c.moving = true; c.dir = rand(-1, 1) + (Math.random() < 0.5 ? 0 : Math.PI); c.phase = 0.4; }
      cam.x = player.x - viewW() / 2; cam.y = player.y - viewH() / 2;
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
      B.boss.cd = 0.4;
      player.z = 200;
      for (let i = 0; i < 70; i++) update(1 / 60);
      return;
    }
    start();
    for (let i = 0; i < 60 * 8; i++) { update(1 / 60); if (state === 'levelup') choose(0); if (state === 'over') { state = 'play'; player.hp = 3; } }
    if (q === 'levelup') { gainXp(game.need + 1); }
    if (q === 'pause') state = 'paused';
    if (q === 'over') { state = 'over'; finishRun(false); }
    if (q === 'win') { state = 'win'; finishRun(true); }
  }

  return { init, sync, key, go, toast };
})();
