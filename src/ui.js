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
        <div class="head"><span class="h2">${tr('Призыв разведчиков')}</span><div class="g-tabs" id="g-tabs"></div><button class="k-icon" data-back>${img('close')}</button></div>
        <div class="g-stage" id="g-stage"></div>
        <div class="g-row"><div class="g-info" id="g-info"></div><div class="g-btns" id="g-btns"></div></div>
        <div class="g-history k-card hid" id="g-history"></div>
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
      const b = el('button', 'k-btn', `${img(it.icon, 'ico')} ${it.label}${it.id === 'missions' ? '<span class="badge" id="mis-badge"></span>' : ''}`);
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
      <div class="tip-line k-tip" id="hud-tip">${tr('WASD — летишь на тросах вверх, на крыши и деревья. С высоты — Пробел: атака')}</div>`;
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
    const hints = { hub: tr('↑↓ — выбрать, Enter — открыть'), battle: tr('← → — фракция, ↑↓ — угроза, Enter — в бой, Esc — назад'), squad: tr('Стрелки — выбрать, Enter — взять в бой, Esc — назад'), gacha: tr('1 — один призыв, 0 — десять, F — бесплатный, Tab — баннер, Esc — назад'), records: tr('Esc — назад'), settings: tr('Esc — назад'), training: tr('Клик — купить уровень, Esc — назад'), missions: tr('Клик — забрать награду, Esc — назад') };
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

  function refreshGacha() {
    const B = bannerInfo(), ev = gBanner === 'event', g = gachaState();
    const tabs = $('#g-tabs');
    tabs.innerHTML = '';
    for (const [k, label] of [['event', tr('Особый призыв')], ['standard', tr('Стандартный')]]) {
      const b = el('button', 'k-btn gt' + (k === gBanner ? ' sel' : ''), label);
      b.addEventListener('click', () => { gBanner = k; snd('click', { vol: 0.6 }); refreshGacha(); });
      tabs.appendChild(b);
    }
    const st = $('#g-stage');
    st.className = 'g-stage ' + (ev ? 'ev' : 'std');
    let sp = '';
    for (let i = 0; i < 18; i++) sp += `<i style="left:${(i * 53) % 100}%;animation-delay:${(i * 0.37) % 3}s;animation-duration:${2.4 + (i % 5) * 0.5}s"></i>`;
    st.innerHTML = `<div class="rays"></div><div class="sparks">${sp}</div>`;
    if (ev) {
      const c = charById(B.five);
      const hero = el('div', 'g-hero');
      hero.appendChild(body(c.id));
      st.appendChild(hero);
      st.insertAdjacentHTML('beforeend', `<div class="g-title">
        <div class="g-kicker">${tr('Особый призыв')}</div>
        <div class="g-name">${tr(B.title)}</div>
        <div class="g-sub r5">${c.name} · ${RARITY[5].name}</div>
        <div class="g-up">${tr('Шанс ×2: каждый второй легендарный — {0}', c.name)}</div>
        <div class="g-fours" id="g-fours"></div>
        <div class="g-timer">${tr('Смена баннера через {0}', fmtDur(B.endsIn))}</div></div>`);
      const fb = $('#g-fours', st);
      for (const id of B.fours) {
        const ch = charById(id), w = el('div', 'g-four');
        w.appendChild(face(id));
        w.insertAdjacentHTML('beforeend', `<span class="r4">${ch.name}</span>`);
        fb.appendChild(w);
      }
    } else {
      const row = el('div', 'g-std');
      for (const c of CHARS.filter(x => x.rarity === 5)) { const w = el('div', 'g-four'); w.appendChild(body(c.id)); w.insertAdjacentHTML('beforeend', `<span class="r5">${c.name}</span>`); row.appendChild(w); }
      st.appendChild(row);
      st.insertAdjacentHTML('beforeend', `<div class="g-title std"><div class="g-name">${tr('Стандартный')}</div><div class="g-sub">${tr('Все бойцы без повышенных шансов')}</div></div>`);
    }
    const p5 = save.pity5 || 0, p4 = save.pity4 || 0;
    $('#g-info').innerHTML = `<div class="pity"><span class="r5">5★</span><div class="pbar"><i style="width:${Math.round(p5 / PITY5 * 100)}%"></i></div><span>${tr('гарантия через {0}', PITY5 - p5)}</span></div>
      <div class="pity"><span class="r4">4★</span><div class="pbar p4"><i style="width:${Math.round(p4 / PITY4 * 100)}%"></i></div><span>${tr('гарантия через {0}', PITY4 - p4)}</span></div>
      ${ev && g.guar ? '<div class="guar">' + tr('Следующий легендарный — точно {0}!', charById(B.five).name) + '</div>' : ''}
      <div class="muted small">${tr('Шансы: 5★ 3% · 4★ 18% · 3★ 79% (бойцы и наставления)')} · <a class="lnk" id="g-hist-btn">${tr('История')}</a></div>`;
    $('#g-hist-btn').addEventListener('click', () => { $('#g-history').classList.toggle('hid'); refreshHistory(); });
    const bb = $('#g-btns');
    bb.innerHTML = '';
    if (freeAvailable()) {
      const fb = el('button', 'k-btn big free', `${img('pearl')} ${tr('Бесплатно')}`);
      fb.title = tr('Один бесплатный призыв каждый день');
      fb.addEventListener('click', () => doPull(1, true));
      bb.appendChild(fb);
    }
    const b1 = el('button', 'k-btn big' + (save.tokens < PULL_COST ? ' off' : ''), `${img('coin')} ×1 — ${PULL_COST}`);
    b1.addEventListener('click', () => doPull(1));
    const b10 = el('button', 'k-btn big' + (save.tokens < PULL10_COST ? ' off' : ''), `${img('coin')} ×10 — ${PULL10_COST}`);
    b10.title = tr('Десять за цену девяти, минимум один эпический');
    b10.addEventListener('click', () => doPull(10));
    bb.appendChild(b1);
    bb.appendChild(b10);
    refreshFooter();
  }

  function refreshHistory() {
    const h = $('#g-history');
    if (h.classList.contains('hid')) return;
    const list = gachaState().history;
    h.innerHTML = '<div class="sec">' + tr('История призывов') + '</div>' + (list.length ? list.map(e => `<span class="hi r${e.r}">${e.id === 'manual' ? tr('Наставление') : charById(e.id).name}${e.f ? ' ✦' : ''}</span>`).join('') : '<span class="muted">' + tr('Пока пусто') + '</span>');
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
  function doPull(n, free) {
    const res = gachaPull(n, gBanner, free);
    if (!res) { toast(tr('Не хватает жетонов — сыграй забег')); snd('error', { vol: 0.6 }); return; }
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
    return `<div class="rv-sky"></div><div class="rv-stars">${st}</div><div class="rv-wall"></div>`;
  }

  function rvStart() {
    const L = layers.reveal, max = Math.max(...pullRes.map(r => r.rarity));
    rvClear();
    rv = { phase: 'launch', timers: [], max };
    L.innerHTML = `${rvBg()}<div class="rv-rocket m${max}"><i class="trail"></i><b></b></div><div class="rv-burst m${max}"></div><div class="rv-flash m${max}"></div><div class="next wood-text">${tr('Клик — пропустить')}</div>`;
    snd('flare', { vol: 0.9 });
    rvLater(950, () => { const r = $('.rv-rocket', L); if (r) r.classList.add('lit'); if (max === 5) snd('bong', { vol: 0.9 }); else if (max === 4) snd('chime5', { vol: 0.7, tag: 'chime' }); });
    rvLater(1450, () => { const b = $('.rv-burst', L), f = $('.rv-flash', L); if (b) b.classList.add('on'); if (f) f.classList.add('on'); snd('boom', { vol: 0.8, rate: max === 5 ? 0.7 : 1 }); });
    rvLater(1800, () => (pullRes.length === 1 ? rvCard(0) : rvGrid()));
  }

  function rvCard(i, fromGrid) {
    rvClear();
    rv.phase = 'card';
    rv.fromGrid = !!fromGrid;
    const r = pullRes[i], L = layers.reveal;
    L.innerHTML = `${rvBg()}<div class="rv-rays m${r.rarity}"></div><div class="rv-card r${r.rarity}" id="rv-card"></div><div class="next wood-text">${fromGrid ? tr('Клик — назад') : tr('Enter или клик — дальше')}</div>`;
    const card = $('#rv-card', L);
    if (r.item) {
      card.insertAdjacentHTML('beforeend', `<img class="rv-item" src="assets/ui/scroll.png" alt=""><div class="rname r3">${tr('Наставление')}</div><div class="rv-txt">${tr('+{0} опыта любому герою — используй в «Отряде»', MANUAL_XP)}</div>`);
      snd('chime3', { vol: 0.6, tag: 'chime' });
      return;
    }
    card.appendChild(body(r.c.id));
    let stars = '';
    for (let k = 0; k < 5; k++) stars += `<span class="st${k < r.stars ? ' on' : ''}" style="animation-delay:${0.25 + k * 0.12}s">★</span>`;
    card.insertAdjacentHTML('beforeend', `${r.isNew ? '<div class="stamp">' + tr('Новый!') + '</div>' : ''}${r.featured ? '<div class="feat">' + tr('Шанс ×2') + '</div>' : ''}
      <div class="rname r${r.rarity}">${r.c.name}</div><div class="rrar r${r.rarity}">${RARITY[r.rarity].name}</div><div class="rstars">${stars}</div>
      <div class="rv-txt">${r.isNew ? r.c.ability : r.refund ? tr('Уже 5★ — возвращено {0} жетонов', r.refund) : tr('Повтор: +1 звезда')}</div>`);
    if (r.rarity >= 5) snd('victory', { vol: 0.8 });
    else if (r.rarity === 4) { snd('bong', { vol: 0.7 }); snd('chime6', { vol: 0.6, tag: 'chime' }); }
    else snd('chime3', { vol: 0.6, tag: 'chime' });
  }

  function rvGrid(instant) {
    rvClear();
    rv.phase = 'grid';
    const L = layers.reveal;
    L.innerHTML = `${rvBg()}<div class="rv-grid" id="rv-grid"></div><div class="next wood-text" id="rv-next">${tr('Клик — открыть все')}</div>`;
    const gr = $('#rv-grid', L);
    rv.cards = pullRes.map((r, i) => {
      const d = el('div', 'rv-c r' + r.rarity + (instant ? ' open' : ''));
      d.innerHTML = '<div class="back"></div><div class="front"></div>';
      const fr = $('.front', d);
      if (r.item) fr.insertAdjacentHTML('beforeend', `<img src="assets/ui/scroll.png" alt=""><div class="hn">${tr('Наставление')}</div>`);
      else { fr.appendChild(face(r.c.id)); fr.insertAdjacentHTML('beforeend', `<div class="hn">${r.c.name}</div><div class="r${r.rarity} small">${r.isNew ? tr('Новый!') : r.refund ? '+' + r.refund : starsHTML(r.stars)}</div>`); }
      d.addEventListener('click', e => { if (!d.classList.contains('open')) return; e.stopPropagation(); rvCard(i, true); });
      gr.appendChild(d);
      return d;
    });
    if (instant) { rv.phase = 'done'; $('#rv-next', L).textContent = tr('Клик по карточке — подробнее, Enter — готово'); return; }
    let t = 250;
    pullRes.forEach((r, i) => {
      t += r.rarity >= 4 ? 520 : 170;
      rvLater(t, () => {
        rv.cards[i].classList.add('open');
        if (r.rarity === 5) { snd('victory', { vol: 0.7 }); L.classList.add('shake'); setTimeout(() => L.classList.remove('shake'), 400); }
        else if (r.rarity === 4) snd('bong', { vol: 0.6 });
        else snd('tick', { vol: 0.5 });
      });
    });
    rvLater(t + 200, () => { rv.phase = 'done'; const n = $('#rv-next', L); if (n) n.textContent = tr('Клик по карточке — подробнее, Enter — готово'); });
  }

  function rvFlipAll() {
    rvClear();
    for (const c of rv.cards || []) c.classList.add('open');
    rv.phase = 'done';
    const n = $('#rv-next', layers.reveal);
    if (n) n.textContent = tr('Клик по карточке — подробнее, Enter — готово');
  }

  function nextReveal() {
    if (!rv) { state = 'menu'; go('gacha'); return; }
    if (rv.phase === 'launch') { rvClear(); if (pullRes.length === 1) rvCard(0); else rvGrid(true); return; }
    if (rv.phase === 'grid') { rvFlipAll(); return; }
    if (rv.phase === 'card' && rv.fromGrid) { rvGrid(true); return; }
    rvClear();
    rv = null;
    state = 'menu';
    go('gacha');
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
      if (c === 'Escape') { rvClear(); rv = null; state = 'menu'; go('gacha'); }
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
      if (c === 'Digit1' || c === 'Enter') doPull(1);
      if (c === 'Digit0') doPull(10);
      if (c === 'KeyF' && freeAvailable()) doPull(1, true);
      if (c === 'Tab' || c === 'KeyQ' || c === 'KeyE') { gBanner = gBanner === 'event' ? 'standard' : 'event'; refreshGacha(); }
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
    if (q === 'pull') { save.tokens += 900; go('gacha'); doPull(10); return; }
    if (q === 'pull1') { save.tokens += 100; go('gacha'); doPull(1); return; }
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

  return { init, sync, key, go, toast };
})();
