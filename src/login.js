'use strict';

// Daily supplies: one reward per calendar day, a 7-day cycle. Missing a day does not reset the cycle.
const LOGIN_DAYS = [
  { kind: 'marks', n: 300 },
  { kind: 'wings', n: 100 },
  { kind: 'manual', n: 2 },
  { kind: 'crystals', n: 10 },
  { kind: 'feathers', n: 40 },
  { kind: 'gear', n: 4 },
  { kind: 'wings', n: 300 },
];

function loginState() {
  if (!save.login) save.login = { n: 0, last: '' };
  return save.login;
}
function loginClaimable() { return loginState().last !== todayKey(); }
function loginDay() { return loginState().n % LOGIN_DAYS.length; }

function loginLabel(d) {
  if (d.kind === 'marks') return tr('{0} marks', d.n);
  if (d.kind === 'wings') return tr('{0} wings', d.n);
  if (d.kind === 'crystals') return tr('{0} crystals', d.n);
  if (d.kind === 'ticket') return tr('Summon ticket');
  if (d.kind === 'manual') return tr('{0} manuals', d.n);
  if (d.kind === 'feathers') return tr('+{0} feathers', d.n);
  if (d.kind === 'gear') return tr('Epic gear');
  return tr('×10 ticket');
}

function loginIcon(d) {
  return { marks: 'coin', wings: 'wings', crystals: 'crystal', ticket: 'ticket', manual: 'manual', feathers: 'feather', gear: 'i_gear', ticket10: 'ticket' }[d.kind];
}

function loginClaim() {
  if (!loginClaimable()) return null;
  const L = loginState(), d = LOGIN_DAYS[L.n % LOGIN_DAYS.length], g = gachaState();
  let gear = null;
  if (d.kind === 'marks') save.marks += d.n;
  else if (d.kind === 'wings') addWings(d.n);
  else if (d.kind === 'crystals') addCrystals(d.n);
  else if (d.kind === 'ticket') g.tickets = (g.tickets || 0) + d.n;
  else if (d.kind === 'manual') save.manuals = (save.manuals || 0) + d.n;
  else if (d.kind === 'feathers') addFeathers(d.n);
  else if (d.kind === 'gear') { gear = pick(GEAR); grantGear(gear.id, d.n); }
  else if (d.kind === 'ticket10') g.tickets10 = (g.tickets10 || 0) + d.n;
  L.n++;
  L.last = todayKey();
  if (save.stats) save.stats.loginDays = (save.stats.loginDays || 0) + 1;
  persist();
  return { d, gear };
}
