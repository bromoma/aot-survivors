'use strict';

const MAT = {
  ink: material('#1a1216', { flat: 0, ramp: ['#1a1216'] }),
  white: material('#ece6da', { ramp: ['#9a948c', '#c9c2b6', '#ece6da', '#fbf8f0'] }),
  teeth: material('#e6dcc6', { ramp: ['#8c8270', '#bcb09a', '#e6dcc6', '#f6efe0'] }),
  gum: material('#a8454a', { ramp: ['#4a1418', '#6e2228', '#a8454a', '#c8646a'] }),
  mouth: material('#2a0e12', { ramp: ['#1a080a', '#2a0e12', '#3e161a'] }),
  nape: material('#9e2b2e', { ramp: ['#4a1014', '#7a1c20', '#b8363a', '#e86a5a'], contrast: 1.3 }),
  metal: material('#8d969d', { gloss: 1.1, ramp: ['#3c4248', '#5e666e', '#8d969d', '#b9c2c8', '#e6edf0'] }),
  blade: material('#c8d2d8', { gloss: 1.6, ramp: ['#5a646c', '#97a3ab', '#cdd7dd', '#f4fbff'] }),
  leather: material('#5a3b26', { ramp: makeRamp('#5a3b26', 4) }),
  pants: material('#d6ccb6', { ramp: ['#6e6658', '#9e9482', '#c6bca6', '#e2dac8', '#f2ecdc'] }),
  jacket: material('#8a5834', { ramp: makeRamp('#8a5834', 5, { lo: 0.3, hi: 0.15 }) }),
  boots: material('#3e2c22', { ramp: makeRamp('#3e2c22', 4, { lo: 0.22, hi: 0.18 }) }),
  cloak: material('#3d6a49', { ramp: makeRamp('#3d6a49', 5, { lo: 0.26, hi: 0.16 }) }),
  scarf: material('#a8262e', { ramp: makeRamp('#a8262e', 5, { lo: 0.26, hi: 0.18 }) }),
  lens: material('#c9a24a', { gloss: 1.4, ramp: ['#4a3a1e', '#8a6c34', '#c9a24a', '#f0dc9a'] }),
  emblemB: '#3f6fb5',
  emblemW: '#eef2f6',
  strap: '#3a281c',
  eye: '#1b1418',
  bark: material('#5b4030', { ramp: ['#2a1c16', '#3f2c22', '#5b4030', '#76563f'], noise: 0.25 }),
};

const matCache = new Map();
function matOf(hex, o = {}) {
  const key = hex + JSON.stringify(o);
  let m = matCache.get(key);
  if (!m) {
    m = material(hex, { ramp: makeRamp(hex, o.n || 5, o), ...o });
    matCache.set(key, m);
  }
  return m;
}

const HUMAN = {
  headR: 5.0, headZ: 26.9, chestZ: 18.6, pelvisZ: 14.2, shZ: 20.6, shW: 4.1, hipZ: 13.2, hipW: 1.9,
  up: 4.7, fore: 4.3, thigh: 6.6, shin: 6.4,
};

function humanPose(pose, f) {
  const P = {
    pitch: 0, bob: 0, footL: [0, -HUMAN.hipW, 0], footR: [0, HUMAN.hipW, 0],
    handL: [0.4, -HUMAN.shW - 0.6, 11.6], handR: [0.4, HUMAN.shW + 0.6, 11.6],
    cloak: 0.12, blades: false, bladeDir: [1, 0, -0.2], headTilt: 0, legBend: [1, 0, 0],
  };
  if (pose === 'idle') {
    P.bob = [0, 0.25, 0.35, 0.25][f & 3];
    P.cloak = 0.1 + P.bob * 0.1;
  } else if (pose === 'run' || pose === 'panic') {
    const a = (f / 8) * TAU;
    P.footL = [Math.sin(a) * 4.4, -HUMAN.hipW, Math.max(0, Math.cos(a)) * 2.8];
    P.footR = [Math.sin(a + Math.PI) * 4.4, HUMAN.hipW, Math.max(0, Math.cos(a + Math.PI)) * 2.8];
    P.bob = -Math.abs(Math.cos(a)) * 0.7 + 0.35;
    P.pitch = 0.16;
    P.cloak = 0.5;
    if (pose === 'panic') {
      P.handL = [1.2, -HUMAN.shW - 1.2, 25 + Math.sin(a) * 1.2];
      P.handR = [1.2, HUMAN.shW + 1.2, 25 - Math.sin(a) * 1.2];
    } else {
      P.handL = [-Math.sin(a) * 3.4 + 0.8, -HUMAN.shW - 0.5, 13.2 + Math.abs(Math.sin(a)) * 1.4];
      P.handR = [Math.sin(a) * 3.4 + 0.8, HUMAN.shW + 0.5, 13.2 + Math.abs(Math.sin(a)) * 1.4];
    }
  } else if (pose === 'fly') {
    const fl = Math.sin((f / 4) * TAU);
    P.pitch = 1.0;
    P.footL = [-3.2, -HUMAN.hipW - 0.4, 2.6 + fl * 0.4];
    P.footR = [-1.6, HUMAN.hipW + 0.4, 1.4 - fl * 0.4];
    P.handL = [-3.6, -HUMAN.shW - 1.6, 13.6];
    P.handR = [-3.6, HUMAN.shW + 1.6, 13.6];
    P.blades = true;
    P.bladeDir = [-0.75, 0, -0.66];
    P.cloak = 1.35 + fl * 0.12;
    P.headTilt = -0.55;
  } else if (pose === 'slash') {
    P.pitch = 1.25;
    P.footL = [-2.5, -HUMAN.hipW, 2.2];
    P.footR = [-2.5, HUMAN.hipW, 2.2];
    P.handL = [1.8, -HUMAN.shW - 4.4, 19.5];
    P.handR = [1.8, HUMAN.shW + 4.4, 19.5];
    P.blades = true;
    P.bladeDir = [0.35, 0, 0.94];
    P.cloak = 1.5;
    P.headTilt = -0.8;
  } else if (pose === 'ride') {
    P.footL = [2.6, -HUMAN.hipW - 2.6, 5.5];
    P.footR = [2.6, HUMAN.hipW + 2.6, 5.5];
    P.legBend = [1, 0, 0.6];
    P.handL = [4.4, -2.0, 15.5];
    P.handR = [4.4, 2.0, 15.5];
    P.bob = [0, 0.6, 0.9, 0.4, 0, -0.2][f % 6];
    P.cloak = 0.9 + P.bob * 0.15;
    P.pitch = 0.12;
  } else if (pose === 'hurt') {
    P.pitch = -0.35;
    P.handL = [1.5, -HUMAN.shW - 2.4, 23];
    P.handR = [1.5, HUMAN.shW + 2.4, 23];
    P.footL = [1.6, -HUMAN.hipW, 1.6];
    P.cloak = -0.2;
  }
  return P;
}

function buildHuman(spec, pose = 'idle', f = 0) {
  const S = new Sculpt();
  const P = humanPose(pose, f);
  const H = HUMAN;
  const skin = matOf(spec.skin || '#e2b08e', { lo: 0.44, hi: 0.12 });
  const hair = matOf(spec.hair || '#3b2b22', { lo: 0.18, hi: 0.16, mid: 0.4, contrast: 0.85, bias: -0.08 });
  const scout = spec.outfit === 'scout';
  const top = scout ? MAT.jacket : matOf(spec.shirt || '#7a5048', { lo: 0.26, hi: 0.16 });
  const legs = scout ? MAT.pants : matOf(spec.pants || '#5a4a3a', { lo: 0.24, hi: 0.16 });
  const boots = scout ? MAT.boots : matOf('#3a2a20', { n: 4, lo: 0.18, hi: 0.16 });
  const z0 = P.bob;
  const pelvis = [0, 0, H.pelvisZ + z0];
  const hipL = [0, -H.hipW, H.hipZ + z0], hipR = [0, H.hipW, H.hipZ + z0];
  for (const [hip, foot] of [[hipL, P.footL], [hipR, P.footR]]) {
    const ankle = v3.add(foot, [0, 0, 1.3]);
    const { mid: knee, tip } = ik2(hip, ankle, H.thigh, H.shin, P.legBend);
    S.cone(hip, knee, 2.0, 1.55, legs);
    if (scout || spec.dress) {
      S.cone(knee, tip, 1.6, 1.2, spec.dress ? skin : boots);
      if (scout) S.sph(knee, 1.62, boots);
    } else S.cone(knee, tip, 1.5, 1.15, legs);
    S.ell(v3.add(tip, [0.9, 0, -0.55]), [2.1, 1.25, 1.0], boots);
  }
  if (spec.dress) S.cone([0, 0, H.pelvisZ + z0 + 1.5], [0, 0, 6.5 + z0], 3.3, 5.0, legs);
  S.ell(pelvis, [2.6, 3.5, 2.5], legs);
  const chest = [0.1, 0, H.chestZ + z0];
  S.ell(chest, [2.8, 3.95, 3.5], top);
  if (scout) {
    S.ell([1.5, 0, 21.6 + z0], [1.4, 1.9, 0.9], MAT.white);
    S.stroke([[2.75, -2.2, 21.2 + z0], [2.9, -1.4, 16.6 + z0], [2.6, -0.4, 13.2 + z0]], MAT.strap);
    S.stroke([[2.75, 2.2, 21.2 + z0], [2.9, 1.4, 16.6 + z0], [2.6, 0.4, 13.2 + z0]], MAT.strap);
    S.stroke([[2.65, -3.2, 15.4 + z0], [2.95, 0, 15.2 + z0], [2.65, 3.2, 15.4 + z0]], MAT.strap);
    for (const s of [-1, 1]) S.stroke([[1.9, s * 1.4, 12.6 + z0], [2.0, s * 2.6, 9.6 + z0]], MAT.strap);
    for (const s of [-1, 1]) S.cone([1.8, s * 4.25, 12.4 + z0], [-3.8, s * 4.35, 12.0 + z0], 1.25, 1.15, MAT.metal);
    S.cone([-3.2, -2.1, 13.0 + z0], [-3.2, 2.1, 13.0 + z0], 1.05, 1.05, MAT.metal);
  }
  if (spec.cloak) {
    S.ell([-0.7, 0, 20.6 + z0], [2.7, 4.75, 1.7], MAT.cloak);
    const m0 = S.mark();
    S.ell([-3.1, 0, 16.4 + z0], [1.15, 4.5, 7.2], MAT.cloak);
    S.ell([-2.9, 0, 22.6 + z0], [1.7, 3.4, 1.9], MAT.cloak);
    S.dot([-4.35, -1.1, 18.6 + z0], MAT.emblemB, 1, 2);
    S.dot([-4.35, -0.2, 19.2 + z0], MAT.emblemB, 1, 1);
    S.dot([-4.35, 0.6, 18.6 + z0], MAT.emblemW, 1, 2);
    S.dot([-4.35, 1.4, 19.2 + z0], MAT.emblemW, 1, 1);
    S.xform(rotY(-P.cloak), [-2.4, 0, 22.4 + z0], m0);
  }
  for (const s of [-1, 1]) {
    const sh = [0, s * H.shW, H.shZ + z0];
    const hand = s < 0 ? P.handL : P.handR;
    const { mid: elbow, tip } = ik2(sh, v3.add(hand, [0, 0, z0 * 0.5]), H.up, H.fore, [-1, s * 0.6, -0.2]);
    S.sph(sh, 1.75, top);
    S.cone(sh, elbow, 1.45, 1.2, top);
    S.cone(elbow, tip, 1.25, 1.0, top);
    S.sph(tip, 1.18, skin);
    if (P.blades) {
      const bd = v3.norm(v3.add(P.bladeDir, [0, s * 0.12, 0]));
      S.cone(v3.add(tip, v3.mul(bd, 0.6)), v3.add(tip, v3.mul(bd, 8.2)), 0.55, 0.42, MAT.blade);
    }
  }
  S.cone([0, 0, 21.2 + z0], [0, 0, 23.4 + z0], 1.35, 1.25, skin);
  if (spec.scarf) {
    S.ell([0.1, 0, 22.2 + z0], [2.9, 3.3, 1.45], MAT.scarf);
    S.cone([-2.4, 0.8, 22.0 + z0], [-3.6, 1.4, 17.8 + z0], 1.1, 0.8, MAT.scarf);
  }
  const hm = S.mark();
  const hc = [0.15, 0, H.headZ + z0];
  S.ell(hc, [4.9, 4.8, 5.05], skin);
  S.ell(v3.add(hc, [1.5, 0, -2.4]), [3.0, 3.45, 2.35], skin);
  for (const s of [-1, 1]) S.dot(v3.add(hc, [4.75, s * 1.85, -0.5]), MAT.eye, 1, 2);
  buildHumanHair(S, spec, hc, hair);
  if (P.headTilt) S.xform(rotY(P.headTilt), [0, 0, 22.4 + z0], hm);
  S.anchor('hand', P.handR);
  if (P.pitch) S.xform(rotY(P.pitch), [0, 0, H.pelvisZ], { p: 0, d: 0, a: 0 });
  return S;
}

function buildHumanHair(S0, spec, hc, hair) {
  const look = spec.look || 'short';
  const K = 1.085;
  const at = (x, y, z) => v3.add(hc, [x * K, y * K, z * K]);
  const S = {
    ell: (c, r, m, R) => S0.ell(c, r.map(v => v * K), m, R),
    sph: (c, r, m) => S0.sph(c, r * K, m),
    cone: (a, b, ra, rb, m) => S0.cone(a, b, ra * K, rb * K, m),
    stroke: (p, c) => S0.stroke(p, c),
  };
  if (look === 'buzz') {
    S.ell(at(-0.4, 0, 0.9), [4.75, 4.7, 4.1], hair);
    return;
  }
  if (look === 'undercut') {
    S.ell(at(-0.5, 0, 1.0), [4.7, 4.6, 4.0], matOf(shade(spec.hair, 1.25), { lo: 0.2, hi: 0.2 }));
    S.ell(at(-0.2, 0, 2.2), [4.85, 4.75, 3.0], hair);
    for (const s of [-1, 1]) S.ell(at(3.4, s * 1.7, 1.9), [1.6, 1.8, 1.7], hair);
    return;
  }
  S.ell(at(-0.9, 0, 1.5), [4.95, 4.95, 4.1], hair);
  if (look !== 'goggles') S.ell(at(3.25, 0, 2.4), [1.6, 3.9, 1.35], hair);
  if (look === 'short') for (const s of [-1, 1]) S.ell(at(1.2, s * 4.1, -0.6), [1.4, 0.8, 1.8], hair);
  if (look === 'long') S.ell(at(-2.6, 0, -2.6), [2.4, 4.2, 3.8], hair);
  if (look === 'bob' || look === 'scarf') for (const s of [-1, 1]) S.ell(at(0.3, s * 3.95, -1.2), [3.0, 1.45, 3.1], hair);
  if (look === 'ponytail') {
    S.cone(at(-4.2, 0, 1.4), at(-5.6, 0, -3.4), 1.5, 0.8, hair);
    S.sph(at(-4.4, 0, 1.6), 1.4, hair);
  }
  if (look === 'goggles') {
    S.ell(at(2.6, 0, 2.6), [2.4, 4.3, 1.6], hair);
    S.sph(at(-3.4, 0, 3.4), 1.9, hair);
    for (const s of [-1, 1]) S.sph(at(3.95, s * 1.8, 1.4), 1.45, MAT.lens);
    S.stroke([at(3.2, -3.9, 1.2), at(0, -4.9, 1.6), at(-3.6, -3.4, 1.8)], '#3a2a1e');
    S.stroke([at(3.2, 3.9, 1.2), at(0, 4.9, 1.6), at(-3.6, 3.4, 1.8)], '#3a2a1e');
  }
}

const BODIES = {
  normal: { leg: 0.43, head: 0.12, tw: 0.3, arm: 0.34, k: 1 },
  lanky: { leg: 0.5, head: 0.1, tw: 0.22, arm: 0.42, k: 0.72 },
  fat: { leg: 0.36, head: 0.118, tw: 0.4, arm: 0.3, k: 1.35, belly: true },
  bighead: { leg: 0.36, head: 0.165, tw: 0.28, arm: 0.3, k: 0.95 },
  aberrant: { leg: 0.47, head: 0.13, tw: 0.24, arm: 0.46, k: 0.82 },
};

function bodyOf(type) {
  const b = BODIES[type], neck = 0.04;
  const th = 1 - b.leg - neck - b.head * 2;
  return { ...b, th, neck, nape: b.leg + th + neck * 0.5, headC: b.leg + th + neck + b.head, shoulder: b.leg + th - 0.03 };
}

function titanMats(t) {
  if (!t.mats) {
    t.mats = {
      skin: material(t.skin, { ramp: makeRamp(t.skin, 6, { lo: 0.46, hi: 0.06, shift: 0.7, mid: 0.55 }), dither: 1, contrast: 1.3, bias: -0.05 }),
      dark: material(t.skin, { ramp: makeRamp(mixHex(t.skin, '#b0505a', 0.22), 6, { lo: 0.46, hi: 0.06, shift: 0.7 }), dither: 1, contrast: 1.25, bias: -0.06 }),
      hair: material(t.hair, { ramp: makeRamp(t.hair, 5, { lo: 0.2, hi: 0.22 }), dither: 0.6, noise: 0.35, contrast: 1.2 }),
      iris: material(t.iris, { ramp: makeRamp(t.iris, 4) }),
    };
  }
  return t.mats;
}

function titanPose(t, pose, k) {
  const G = t.g, Hp = t.Hp;
  const ab = t.type === 'aberrant';
  const P = {
    lean: ab ? 0.32 : 0.04, bob: 0, footL: [0, -1, 0], footR: [0, 1, 0], handL: null, handR: null,
    headPitch: ab ? -0.25 : 0, headRoll: ab ? 0.22 : 0, fall: 0, mouthOpen: 0,
  };
  const hipW = G.tw * Hp * 0.27;
  P.footL = [0, -hipW * 1.1, 0];
  P.footR = [0, hipW * 1.1, 0];
  const shZ = G.shoulder * Hp, armL = G.arm * Hp, shW = G.tw * Hp * 0.5;
  const rest = s => [Hp * 0.03 + (ab ? Hp * 0.1 : 0), s * (shW + Hp * 0.03), Math.max(Hp * 0.05, shZ - armL * 0.93)];
  P.handL = rest(-1);
  P.handR = rest(1);
  if (pose === 'walk') {
    const a = k * TAU, stride = Hp * (ab ? 0.16 : 0.11), lift = Hp * 0.045;
    P.footL = [Math.sin(a) * stride, -hipW * 1.1, Math.max(0, Math.cos(a)) * lift];
    P.footR = [Math.sin(a + Math.PI) * stride, hipW * 1.1, Math.max(0, Math.cos(a + Math.PI)) * lift];
    P.bob = (Math.abs(Math.cos(a)) - 0.5) * Hp * 0.018;
    const sw = Hp * (ab ? 0.12 : 0.07);
    P.handL = v3.add(P.handL, [-Math.sin(a) * sw, 0, Math.abs(Math.sin(a)) * Hp * 0.02]);
    P.handR = v3.add(P.handR, [Math.sin(a) * sw, 0, Math.abs(Math.sin(a)) * Hp * 0.02]);
    P.headRoll += Math.sin(a) * 0.05;
  } else if (pose === 'grab') {
    const r = k < 0.35 ? -0.15 * (k / 0.35) : ((k - 0.35) / 0.65) ** 2;
    const reach = Hp * 0.45 + 15;
    P.lean = lerp(0.04, 0.5, clamp(k * 1.3, 0, 1));
    P.handR = [reach * r + Hp * 0.05, shW * 0.4, Hp * (0.5 + (k < 0.35 ? k * 0.4 : 0.14 - (k - 0.35) * 0.55))];
    P.mouthOpen = k;
  } else if (pose === 'eat') {
    const e = clamp(k, 0, 1);
    P.handR = v3.lerp([Hp * 0.32, shW * 0.3, Hp * 0.06], [Hp * G.head * 1.2, 0, Hp * (G.headC - G.head * 0.45)], smooth(e));
    P.lean = lerp(0.35, -0.05, e);
    P.headPitch = lerp(0.2, -0.25, e);
    P.mouthOpen = 1;
  } else if (pose === 'stun') {
    P.headRoll = 0.4;
    P.headPitch = 0.3;
    P.lean = 0.12;
  } else if (pose === 'fall') {
    P.fall = Math.pow(clamp(k, 0, 1), 1.6) * Math.PI * 0.49;
    P.handL = [Hp * 0.12, -(shW + Hp * 0.08), shZ - armL * 0.6];
    P.handR = [Hp * 0.16, shW + Hp * 0.08, shZ - armL * 0.55];
    P.headPitch = 0.2;
    P.mouthOpen = 0.6;
  }
  return P;
}

function buildTitan(t, pose = 'walk', k = 0) {
  const S = new Sculpt();
  const G = t.g, Hp = t.Hp, M = titanMats(t), P = titanPose(t, pose, k);
  const K = G.k;
  const skin = M.skin, dark = M.dark;
  const z0 = P.bob;
  const legL = G.leg * Hp;
  const hipW = G.tw * Hp * 0.27;
  const thigh = legL * 0.53, shin = legL * 0.53;
  const crease = shade(t.skin, 0.6);
  for (const [s, foot] of [[-1, P.footL], [1, P.footR]]) {
    const hip = [0, s * hipW, legL + z0];
    const ankle = v3.add(foot, [0, 0, Hp * 0.035]);
    const { mid: knee, tip } = ik2(hip, ankle, thigh, shin, [1, 0, 0]);
    S.cone(hip, knee, Hp * 0.066 * K, Hp * 0.047 * K, skin);
    S.sph(v3.add(knee, [Hp * 0.016, 0, Hp * 0.004]), Hp * 0.04 * K, dark);
    S.cone(knee, tip, Hp * 0.046 * K, Hp * 0.03 * K, skin);
    const calf = v3.lerp(knee, tip, 0.3);
    S.ell(v3.add(calf, [-Hp * 0.014 * K, 0, 0]), [Hp * 0.04 * K, Hp * 0.042 * K, Hp * 0.07], skin);
    const fc = v3.add(tip, [Hp * 0.035, 0, -Hp * 0.018]);
    S.ell(fc, [Hp * 0.07, Hp * 0.034 * Math.sqrt(K), Hp * 0.022], dark);
    for (let i = -1; i <= 1; i++) S.stroke([v3.add(fc, [Hp * 0.05, i * Hp * 0.011, Hp * 0.012]), v3.add(fc, [Hp * 0.071, i * Hp * 0.011, -Hp * 0.004])], crease, 0.6);
  }
  const th = G.th * Hp, tw = G.tw * Hp;
  const pelZ = legL + th * 0.18 + z0, chestZ = legL + th * 0.66 + z0;
  const body = S.mark();
  S.ell([0, 0, pelZ], [tw * 0.3, tw * 0.44, th * 0.32], skin);
  for (const s of [-1, 1]) S.ell([-tw * 0.17, s * tw * 0.17, legL + th * 0.06 + z0], [tw * 0.17, tw * 0.19, th * 0.2], skin);
  S.ell([0, 0, chestZ], [tw * 0.33, tw * 0.52, th * 0.42], skin);
  if (G.belly) S.ell([tw * 0.14, 0, legL + th * 0.32 + z0], [tw * 0.42, tw * 0.5, th * 0.42], skin);
  else {
    S.ell([tw * 0.14, 0, legL + th * 0.36 + z0], [tw * 0.2, tw * 0.28, th * 0.26], skin);
    S.dot([tw * 0.34, 0, legL + th * 0.3 + z0], shade(t.skin, 0.62));
  }
  for (const s of [-1, 1]) S.ell([tw * 0.22, s * tw * 0.21, chestZ + th * 0.1], [tw * 0.15, tw * 0.22, th * 0.15], skin);
  for (const s of [-1, 1]) S.stroke([[tw * 0.26, s * tw * 0.06, chestZ + th * 0.36], [tw * 0.24, s * tw * 0.26, chestZ + th * 0.4], [tw * 0.12, s * tw * 0.44, chestZ + th * 0.42]], crease, 0.6);
  if (!G.belly) {
    for (let i = 0; i < 2; i++) S.stroke([[tw * 0.32, -tw * 0.14, chestZ - th * (0.2 + i * 0.12)], [tw * 0.34, 0, chestZ - th * (0.21 + i * 0.12)], [tw * 0.32, tw * 0.14, chestZ - th * (0.2 + i * 0.12)]], crease, 0.6);
  }
  for (const s of [-1, 1]) S.ell([-tw * 0.22, s * tw * 0.2, chestZ + th * 0.14], [tw * 0.14, tw * 0.2, th * 0.2], skin);
  S.stroke([[-tw * 0.335, 0, chestZ + th * 0.3], [-tw * 0.335, 0, chestZ - th * 0.25], [-tw * 0.3, 0, pelZ]], shade(t.skin, 0.7), 0.7);
  if (t.type === 'lanky' || t.type === 'aberrant' || t.old) {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const z = chestZ - th * (0.02 + i * 0.1);
      S.stroke([[tw * 0.2, s * tw * 0.2, z], [tw * 0.08, s * tw * 0.47, z - th * 0.04]], shade(t.skin, 0.72), 0.7);
    }
  }
  const shZ = G.shoulder * Hp + z0, shW = tw * 0.5;
  const armL = G.arm * Hp, up = armL * 0.53, fore = armL * 0.53;
  const arms = S.mark();
  for (const s of [-1, 1]) {
    const sh = [0, s * shW, shZ];
    const hand = s < 0 ? P.handL : P.handR;
    const { mid: elbow, tip } = ik2(sh, hand, up, fore, [-1, s * 0.5, 0]);
    S.sph(sh, Hp * 0.058 * K, skin);
    S.cone(sh, elbow, Hp * 0.05 * K, Hp * 0.038 * K, skin);
    S.sph(elbow, Hp * 0.034 * K, dark);
    const fm = v3.lerp(elbow, tip, 0.3);
    S.cone(elbow, tip, Hp * 0.04 * K, Hp * 0.028 * K, skin);
    S.sph(fm, Hp * 0.043 * K, skin);
    const hd = v3.norm(v3.sub(tip, elbow));
    const side = v3.norm(v3.cross(hd, [0, 0, 1]));
    const palm = v3.add(tip, v3.mul(hd, Hp * 0.028));
    S.ell(palm, [Hp * 0.04, Hp * 0.034, Hp * 0.042], dark, mmul(rotZ(Math.atan2(hd[1], hd[0])), rotY(Math.asin(clamp(-hd[2], -1, 1)))));
    for (let i = 0; i < 4; i++) {
      const o = v3.add(palm, v3.mul(side, (i - 1.5) * Hp * 0.014 * s));
      S.cone(v3.add(o, v3.mul(hd, Hp * 0.02)), v3.add(o, v3.add(v3.mul(hd, Hp * (0.065 - Math.abs(i - 1.5) * 0.006)), [0, 0, -Hp * 0.006])), Hp * 0.0085, Hp * 0.0065, dark);
    }
    S.cone(v3.add(palm, v3.mul(side, -s * Hp * 0.03)), v3.add(palm, v3.add(v3.mul(side, -s * Hp * 0.045), v3.mul(hd, Hp * 0.035))), Hp * 0.01, Hp * 0.008, dark);
    if (s > 0) S.anchor('hand', v3.add(tip, v3.mul(hd, Hp * 0.05)));
  }
  const neckR = Hp * 0.054 * Math.sqrt(K);
  const headC = G.headC * Hp + z0, hr = G.head * Hp;
  S.cone([0, 0, shZ - Hp * 0.02], [hr * 0.08, 0, headC - hr * 0.6], neckR, neckR * 0.9, skin);
  S.ell([-neckR * 0.78, 0, G.nape * Hp + z0], [neckR * 0.4, neckR * 0.72, neckR * 0.62], MAT.nape);
  S.anchor('nape', [-neckR * 1.1, 0, G.nape * Hp + z0]);
  const head = S.mark();
  buildTitanHead(S, t, [hr * 0.08, 0, headC], hr, P);
  const hm = S.mark();
  if (P.headPitch || P.headRoll) S.xform(mmul(rotY(P.headPitch), rotX(P.headRoll)), [0, 0, headC - hr], head, hm);
  if (P.lean) S.xform(rotY(P.lean), [0, 0, legL + z0], body);
  if (P.fall) S.xform(rotY(P.fall), [0, 0, 0]);
  return S;
}

function buildTitanHead(S, t, hc, hr, P) {
  const M = titanMats(t), skin = M.skin, hair = M.hair;
  const at = (x, y, z) => v3.add(hc, [x * hr, y * hr, z * hr]);
  S.ell(hc, [hr * 0.92, hr * 0.86, hr * 1.02], skin);
  S.ell(at(0.24, 0, -0.42), [hr * 0.74, hr * 0.7, hr * 0.56], skin);
  S.ell(at(0.6, 0, 0.26), [hr * 0.3, hr * 0.66, hr * 0.17], skin);
  for (const s of [-1, 1]) S.ell(at(0.02, s * 0.86, 0.02), [hr * 0.16, hr * 0.09, hr * 0.26], skin);
  S.ell(at(0.94, 0, -0.08), [hr * 0.17, hr * 0.12, hr * 0.24], skin);
  S.anchor('mouth', at(0.9, 0, -0.5));
  const ink = MAT.ink;
  for (const s of [-1, 1]) {
    const e = at(0.74, s * 0.36, 0.06);
    if (t.eyes === 'dot') {
      S.sph(at(0.82, s * 0.34, 0.06), hr * 0.07, ink);
    } else if (t.eyes === 'big') {
      S.sph(e, hr * 0.235, MAT.white);
      S.sph(at(0.9, s * 0.35, 0.05), hr * 0.12, M.iris);
      S.dot(at(0.99, s * 0.35, 0.05), '#0e0a0c', 1, 1);
    } else {
      S.sph(e, hr * 0.21, MAT.white);
      S.dot(at(0.94, s * 0.35, 0.05), '#0e0a0c', 1, 1);
      if (t.eyes === 'sleepy') S.ell(at(0.78, s * 0.36, 0.16), [hr * 0.17, hr * 0.22, hr * 0.12], skin);
    }
    if (t.angry) S.ell(at(0.7, s * 0.3, 0.3), [hr * 0.16, hr * 0.26, hr * 0.08], skin, rotX(s * 0.45));
    if (t.blush) S.dot(at(0.8, s * 0.5, -0.24), '#d8756a', 2, 1);
  }
  const open = Math.max(P.mouthOpen, t.mouth === 'open' ? 0.7 : 0);
  if (t.mouth === 'lipless') {
    S.ell(at(0.66, 0, -0.5), [hr * 0.3, hr * 0.62, hr * 0.24 + open * hr * 0.1], MAT.gum);
    S.ell(at(0.82, 0, -0.42), [hr * 0.14, hr * 0.56, hr * 0.07], MAT.teeth);
    S.ell(at(0.8, 0, -0.6 - open * 0.08), [hr * 0.14, hr * 0.54, hr * 0.07], MAT.teeth);
    S.stroke([at(0.95, -0.42, -0.51), at(0.97, 0, -0.52 - open * 0.04), at(0.95, 0.42, -0.51)], '#1a080a', 0.6);
  } else if (open > 0.05) {
    S.ell(at(0.8, 0, -0.52), [hr * 0.18, hr * 0.38, hr * (0.08 + open * 0.16)], MAT.mouth);
    S.ell(at(0.86, 0, -0.44), [hr * 0.1, hr * 0.32, hr * 0.06], MAT.teeth);
  } else if (t.mouth === 'grin') {
    S.ell(at(0.74, 0, -0.46), [hr * 0.24, hr * 0.64, hr * 0.17], MAT.teeth);
    S.stroke([at(0.96, -0.54, -0.4), at(0.98, 0, -0.47), at(0.96, 0.54, -0.4)], '#3a1214', 0.5);
    for (let i = -3; i <= 3; i++) S.stroke([at(0.97, i * 0.14, -0.36), at(0.97, i * 0.14, -0.56)], '#a89c86', 0.5);
  } else {
    S.stroke([at(0.92, -0.32, -0.5), at(0.95, 0, -0.52), at(0.93, 0.34, t.mouth === 'smirk' ? -0.42 : -0.5)], '#3a1214', 0.6);
  }
  if (t.beard) S.ell(at(0.36, 0, -0.66), [hr * 0.62, hr * 0.66, hr * 0.42], hair);
  if (t.old) for (let i = 0; i < 2; i++) S.stroke([at(0.82, -0.3, 0.46 + i * 0.12), at(0.84, 0.3, 0.46 + i * 0.12)], shade(t.skin, 0.72), 0.7);
  const st = t.style;
  if (st >= 1) S.ell(at(-0.25, 0, 0.42), [hr * 0.96, hr * 0.94, hr * 0.8], hair);
  if (st === 1 || st === 4) S.ell(at(0.6, 0, 0.7), [hr * 0.3, hr * 0.78, hr * 0.24], hair);
  if (st === 2) {
    S.ell(at(-0.42, 0, -0.5), [hr * 0.62, hr * 0.92, hr * 0.9], hair);
    for (const s of [-1, 1]) S.ell(at(0.2, s * 0.84, -0.36), [hr * 0.44, hr * 0.2, hr * 0.74], hair);
  }
  if (st === 3) S.sph(at(-0.55, 0, 0.95), hr * 0.38, hair);
  if (st === 4) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    S.sph(at(-0.1 + Math.cos(a) * 0.55, Math.sin(a) * 0.62, 0.95), hr * 0.24, hair);
  }
}

function buildTree(seed, h) {
  const r = makeRng(seed);
  const S = new Sculpt();
  const leaf = matOf(r.pick(['#3d5a3c', '#425e3a', '#3a5640', '#4a5f3a']), { lo: 0.26, hi: 0.18, dither: 0.8, noise: 0.55, nscale: 2, contrast: 1.15 });
  leaf.edge = false;
  const crownZ = h * 0.62, cr = h * 0.27;
  S.cone([0, 0, 0], [r.range(-1, 1), r.range(-1, 1), crownZ], h * 0.05 + 1.2, h * 0.03 + 0.8, MAT.bark);
  for (let i = 0; i < 2; i++) {
    const a = r.range(0, TAU);
    S.cone([0, 0, crownZ * 0.7], [Math.cos(a) * cr * 0.6, Math.sin(a) * cr * 0.6, crownZ + cr * 0.2], h * 0.022 + 0.6, 0.6, MAT.bark);
  }
  S.ell([0, 0, crownZ + cr * 0.15], [cr * 0.95, cr * 0.95, cr * 0.72], leaf);
  const n = 7 + Math.floor(h / 14);
  for (let i = 0; i < n; i++) {
    const a = r.range(0, TAU), d = r.range(0.35, 0.8) * cr, z = crownZ + r.range(-0.15, 0.55) * cr;
    S.sph([Math.cos(a) * d, Math.sin(a) * d, z], cr * r.range(0.32, 0.5), leaf);
  }
  return S;
}

const HORSE_COATS = ['#6e4a30', '#3e2c22', '#8a6a4a', '#5a5450'];
function buildRider(spec, coat, f) {
  const S = new Sculpt();
  const hide = matOf(coat, { lo: 0.32, hi: 0.14 });
  const dark = matOf(shade(coat, 0.55), { n: 4, lo: 0.16, hi: 0.12 });
  const a = (f / 6) * TAU;
  const bob = Math.sin(a * 2) * 0.8;
  const tilt = Math.sin(a) * 0.06;
  const body = S.mark();
  S.ell([0, 0, 15 + bob], [11, 4.6, 5.4], hide);
  S.ell([7, 0, 15.6 + bob], [5, 4.4, 5.2], hide);
  S.ell([-7.5, 0, 15.6 + bob], [5, 4.8, 5.2], hide);
  S.cone([9, 0, 17.5 + bob], [14, 0, 25 + bob], 3.4, 2.2, hide);
  S.ell([16.4, 0, 24.4 + bob], [4.6, 1.9, 2.2], hide, rotY(0.55));
  S.ell([19.4, 0, 22.2 + bob], [1.6, 1.7, 1.6], dark);
  for (const s of [-1, 1]) S.cone([14.6, s * 1.1, 26.6 + bob], [14.2, s * 1.2, 28.6 + bob], 0.7, 0.3, hide);
  S.stroke([[9.5, 0, 21.5 + bob], [14, 0, 27 + bob]], shade(coat, 0.4), 0.5);
  S.cone([-12, 0, 17 + bob], [-15.5, 0, 9 + bob], 1.6, 0.9, dark);
  S.ell([1, 0, 20 + bob], [4.5, 4.8, 1.2], matOf('#5a3b26', { n: 4 }));
  const legs = [[7, -2.6, 0], [7, 2.6, 0.5], [-7, -2.6, 0.25], [-7, 2.6, 0.75]];
  for (const [x, y, ph] of legs) {
    const la = a + ph * TAU;
    const hip = [x, y, 13 + bob];
    const foot = [x + Math.sin(la) * 5.5, y, Math.max(0, Math.cos(la)) * 3.2];
    const { mid, tip } = ik2(hip, v3.add(foot, [0, 0, 1]), 7.2, 7.2, x > 0 ? [-1, 0, 0] : [1, 0, 0]);
    S.cone(hip, mid, 1.9, 1.3, hide);
    S.cone(mid, tip, 1.2, 0.95, hide);
    S.ell(v3.add(tip, [0.3, 0, -0.4]), [1.3, 1.1, 0.9], dark);
  }
  S.xform(rotY(tilt), [0, 0, 14], body);
  const rider = buildHuman(spec, 'ride', f);
  rider.shift([-0.5, 0, 8.5 + bob]);
  S.prims.push(...rider.prims);
  S.dots.push(...rider.dots);
  return S;
}
