'use strict';

const SND = (() => {
  const FILES = {
    click: ['click'], open: ['open'], close: ['close'], confirm: ['confirm'], error: ['error'], bong: ['bong'], victory: ['victory'],
    cut: ['cut_01', 'cut_02', 'cut_03'], metal: ['metal_01', 'metal_02', 'metal_03'], thump: ['thump_01', 'thump_02', 'thump_03'],
    cast: ['cast_01', 'cast_02'], fall: ['fall'], maul: ['maul'],
  };
  for (let i = 0; i < 8; i++) FILES['chime' + i] = ['chime_' + i];
  const PLAYLISTS = {
    menu: ['menu_castle_town', 'menu_new_town'],
    city: ['city_exploration', 'city_market_day'],
    ruins: ['ruins_lament', 'ruins_rising_moon'],
    field: ['field_fouler_horizon', 'field_kings_feast'],
  };
  const LIMIT = { roar: 0.8, boom: 0.06, snap: 0.08, crystal: 0.3, horn: 1, rumble: 0.5, steamburst: 1, flashbang: 0.3, gas: 0.22, rope: 0.12, step: 0.09, swing: 0.2, hiss: 0.25, cut: 0.05, chime: 0.05, click: 0.03, flare: 0.3, chomp: 0.4, tick: 0.25 };

  let ac = null, master, sfxBus, comp, noiseBuf = null, unlocked = false, muted = false;
  const buffers = {};
  const lastAt = {};
  let musicVol = 0.6, sfxVol = 0.8, duck = 1;
  const deck = [new Audio(), new Audio()];
  let cur = 0, curList = null, curIdx = 0, wantList = null, fade = 0;
  const base = () => (typeof window !== 'undefined' && window.ASSET_BASE) || '';

  deck.forEach(a => {
    a.preload = 'auto';
    a.addEventListener('ended', () => { if (a === deck[cur] && curList) nextTrack(); });
  });

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    sfxBus = ac.createGain();
    sfxBus.connect(comp);
    comp.connect(master);
    master.connect(ac.destination);
    applyVolumes();
    const len = ac.sampleRate;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    for (const [k, list] of Object.entries(FILES)) {
      buffers[k] = [];
      list.forEach((f, i) => {
        fetch(base() + 'assets/sfx/' + f + '.ogg').then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(buf => { buffers[k][i] = buf; }).catch(() => {});
      });
    }
  }

  function unlock() {
    if (unlocked) return;
    init();
    if (!ac) return;
    unlocked = true;
    if (ac.state === 'suspended') ac.resume();
    if (wantList) playList(wantList, true);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true }));

  function applyVolumes() {
    if (master) master.gain.value = muted ? 0 : 1;
    if (sfxBus) sfxBus.gain.value = sfxVol;
    for (const a of deck) if (a.dataset.fading !== '1') a.volume = clamp(muted ? 0 : musicVol * duck * 0.55, 0, 1);
  }

  function setVolumes(m, s) {
    musicVol = clamp(m, 0, 1);
    sfxVol = clamp(s, 0, 1);
    applyVolumes();
  }

  function setMuted(v) {
    muted = v;
    applyVolumes();
  }

  function setDuck(v) {
    if (Math.abs(duck - v) < 0.01) return;
    duck = v;
    applyVolumes();
  }

  function ready(name) {
    const now = ac ? ac.currentTime : 0;
    const lim = LIMIT[name] || 0.02;
    if (lastAt[name] !== undefined && now - lastAt[name] < lim) return false;
    lastAt[name] = now;
    return true;
  }

  function spatial(o) {
    let g = 1, pan = 0;
    if (o && o.x !== undefined && typeof player !== 'undefined' && player) {
      const dx = o.x - player.x, dy = o.y - player.y, d = Math.hypot(dx, dy);
      g = clamp(1 - d / (o.range || 1500), 0, 1);
      g = g * g;
      pan = clamp(dx / 900, -0.8, 0.8);
    }
    return { g, pan };
  }

  function outNode(vol, o) {
    const { g, pan } = spatial(o);
    if (g <= 0.01) return null;
    const gain = ac.createGain();
    gain.gain.value = vol * g;
    if (ac.createStereoPanner && pan) {
      const p = ac.createStereoPanner();
      p.pan.value = pan;
      gain.connect(p);
      p.connect(sfxBus);
    } else gain.connect(sfxBus);
    return gain;
  }

  function sample(key, vol = 1, o = {}) {
    const list = buffers[key];
    if (!list || !list.length) return;
    const buf = list[Math.floor(Math.random() * list.length)];
    if (!buf) return;
    const out = outNode(vol, o);
    if (!out) return;
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = (o.rate || 1) * (1 + (Math.random() - 0.5) * (o.vary ?? 0.08));
    s.connect(out);
    s.start(ac.currentTime + (o.delay || 0));
  }

  function noise(out, t0, dur, type, f0, f1, q, vol, attack = 0.005) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t0, Math.random() * 0.5);
    s.stop(t0 + dur + 0.05);
  }

  function tone(out, t0, dur, type, f0, f1, vol, attack = 0.005) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const SYNTH = {
    rope(out, t) {
      noise(out, t, 0.16, 'bandpass', 900, 4200, 2.5, 0.5);
      tone(out, t + 0.1, 0.05, 'square', 2600, 1800, 0.06);
    },
    gas(out, t) {
      noise(out, t, 0.22, 'highpass', 3500, 5500, 0.7, 0.16, 0.02);
    },
    slash(out, t) {
      noise(out, t, 0.2, 'bandpass', 5200, 900, 1.6, 0.9, 0.01);
      noise(out, t + 0.03, 0.12, 'highpass', 6000, 3000, 0.8, 0.3);
    },
    spin(out, t) {
      for (let i = 0; i < 3; i++) noise(out, t + i * 0.07, 0.16, 'bandpass', 4500, 1200, 1.4, 0.55, 0.01);
    },
    hiss(out, t) {
      noise(out, t, 1.6, 'highpass', 2500, 1800, 0.6, 0.22, 0.08);
    },
    thud(out, t) {
      tone(out, t, 0.55, 'sine', 90, 34, 0.9, 0.004);
      noise(out, t, 0.3, 'lowpass', 400, 80, 0.8, 0.5, 0.004);
    },
    step(out, t) {
      tone(out, t, 0.22, 'sine', 70, 40, 0.7, 0.003);
      noise(out, t, 0.12, 'lowpass', 300, 90, 0.7, 0.35, 0.003);
    },
    swing(out, t) {
      noise(out, t, 0.35, 'bandpass', 300, 1200, 1.2, 0.5, 0.06);
    },
    hurt(out, t) {
      tone(out, t, 0.25, 'square', 220, 70, 0.22);
      noise(out, t, 0.18, 'lowpass', 1800, 200, 0.7, 0.45);
    },
    chomp(out, t) {
      noise(out, t, 0.14, 'lowpass', 700, 150, 1, 0.45);
      noise(out, t + 0.16, 0.12, 'lowpass', 600, 150, 1, 0.3);
    },
    flare(out, t) {
      tone(out, t, 0.7, 'sine', 600, 2400, 0.16, 0.05);
      noise(out, t, 0.7, 'bandpass', 1500, 5000, 3, 0.12, 0.05);
      noise(out, t + 0.72, 0.25, 'lowpass', 2500, 300, 0.8, 0.5);
    },
    levelup(out, t) {
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(out, t + i * 0.08, 0.22, 'triangle', f, f, 0.3);
        tone(out, t + i * 0.08, 0.18, 'square', f * 2, f * 2, 0.04);
      });
    },
    tick(out, t) {
      tone(out, t, 0.06, 'square', 880, 660, 0.08);
    },
    defeat(out, t) {
      [392, 330, 262, 196].forEach((f, i) => tone(out, t + i * 0.28, 0.5, 'triangle', f, f * 0.98, 0.28, 0.02));
      tone(out, t, 1.6, 'sine', 98, 60, 0.3, 0.05);
    },
    horn(out, t) {
      tone(out, t, 1.5, 'sawtooth', 110, 104, 0.12, 0.2);
      tone(out, t, 1.5, 'sawtooth', 165, 156, 0.08, 0.25);
      tone(out, t, 1.6, 'sine', 55, 52, 0.4, 0.2);
      noise(out, t, 1.2, 'lowpass', 300, 120, 0.7, 0.2, 0.2);
    },
    boom(out, t) {
      tone(out, t, 0.5, 'sine', 130, 38, 0.9, 0.003);
      noise(out, t, 0.45, 'lowpass', 1200, 90, 0.8, 0.7, 0.003);
    },
    crystal(out, t) {
      [1760, 2350, 3140, 2640].forEach((f, i) => tone(out, t + i * 0.05, 0.4, 'triangle', f, f * 1.01, 0.12));
    },
    snap(out, t) {
      noise(out, t, 0.08, 'highpass', 3000, 2000, 0.7, 0.5, 0.002);
      tone(out, t, 0.12, 'square', 320, 110, 0.12, 0.002);
    },
    flashbang(out, t) {
      tone(out, t, 0.35, 'sine', 2600, 1800, 0.12, 0.005);
      noise(out, t, 0.5, 'bandpass', 3500, 1200, 1.2, 0.5, 0.004);
    },
    steamburst(out, t) {
      noise(out, t, 2.2, 'highpass', 1400, 700, 0.6, 0.7, 0.08);
      tone(out, t, 0.8, 'sine', 70, 40, 0.5, 0.02);
    },
    roar(out, t) {
      tone(out, t, 1.1, 'sawtooth', 160, 70, 0.16, 0.06);
      tone(out, t, 1.1, 'sawtooth', 118, 52, 0.12, 0.06);
      noise(out, t, 1.0, 'bandpass', 600, 220, 1.1, 0.5, 0.08);
    },
    rumble(out, t) {
      noise(out, t, 1.0, 'lowpass', 220, 90, 0.8, 0.8, 0.05);
      tone(out, t, 1.0, 'sine', 50, 40, 0.5, 0.05);
    },
    reveal(out, t) {
      noise(out, t, 0.8, 'bandpass', 800, 6000, 2, 0.25, 0.05);
      tone(out, t, 0.75, 'sine', 400, 1800, 0.12, 0.05);
    },
  };

  function play(name, o = {}) {
    if (!ac || !unlocked || muted) return;
    if (!ready(o.tag || name)) return;
    const vol = o.vol ?? 1;
    if (SYNTH[name]) {
      const out = outNode(vol, o);
      if (!out) return;
      SYNTH[name](out, ac.currentTime + (o.delay || 0));
      return;
    }
    sample(name, vol, o);
  }

  function nextTrack() {
    if (!curList) return;
    curIdx = (curIdx + 1) % curList.length;
    startTrack(PLAYLISTS[wantList][curIdx]);
  }

  function startTrack(name) {
    const old = deck[cur];
    cur = 1 - cur;
    const a = deck[cur];
    a.src = base() + 'assets/music/' + name + '.ogg';
    a.currentTime = 0;
    a.dataset.fading = '1';
    a.volume = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    fadeTo(a, old);
  }

  function fadeTo(a, old) {
    const t0 = performance.now(), from = old.volume;
    old.dataset.fading = '1';
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 1200);
      const target = clamp(muted ? 0 : musicVol * duck * 0.55, 0, 1);
      a.volume = target * k;
      old.volume = from * (1 - k);
      if (k < 1) requestAnimationFrame(step);
      else {
        old.pause();
        old.dataset.fading = '0';
        a.dataset.fading = '0';
        applyVolumes();
      }
    };
    requestAnimationFrame(step);
    setTimeout(() => { if (a.dataset.fading === '1') { old.pause(); old.dataset.fading = '0'; a.dataset.fading = '0'; applyVolumes(); } }, 1600);
  }

  function playList(key, force) {
    if (!force && key === wantList) return;
    wantList = key;
    if (!unlocked) return;
    if (!key) {
      curList = null;
      const a = deck[cur];
      fadeTo(new Audio(), a);
      return;
    }
    curList = PLAYLISTS[key];
    curIdx = Math.floor(Math.random() * curList.length);
    startTrack(curList[curIdx]);
  }

  const debug = () => ({ ac: ac && ac.state, unlocked, muted, musicVol, sfxVol, duck, wantList, loaded: Object.values(buffers).reduce((n, v) => n + v.filter(Boolean).length, 0), decks: deck.map(a => ({ src: a.src.split('/').pop(), t: +a.currentTime.toFixed(1), paused: a.paused, vol: +a.volume.toFixed(2), err: a.error && a.error.code })) });
  return { play, playList, setVolumes, setMuted, setDuck, get muted() { return muted; }, unlock, PLAYLISTS, debug };
})();
