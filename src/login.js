'use strict';

// Daily supplies: one reward per calendar day, a 7-day cycle. Missing a day does not reset the cycle.
const LOGIN_DAYS = [
  { kind: 'tokens', n: 150 },
  { kind: 'ticket', n: 1 },
  { kind: 'manual', n: 2 },
  { kind: 'tokens', n: 300 },
  { kind: 'feathers', n: 40 },
  { kind: 'gear', n: 4 },
  { kind: 'ticket10', n: 1 },
];

function loginState() {
  if (!save.login) save.login = { n: 0, last: '' };
  return save.login;
}
function loginClaimable() { return loginState().last !== todayKey(); }
function loginDay() { return loginState().n % LOGIN_DAYS.length; }

function loginLabel(d) {
  if (d.kind === 'tokens') return tr('{0} tokens', d.n);
  if (d.kind === 'ticket') return tr('Summon ticket');
  if (d.kind === 'manual') return tr('{0} manuals', d.n);
  if (d.kind === 'feathers') return tr('+{0} feathers', d.n);
  if (d.kind === 'gear') return tr('Epic gear');
  return tr('×10 ticket');
}

function loginIcon(d) {
  return { tokens: 'coin', ticket: 'pearl', manual: 'scroll', feathers: 'ribbon', gear: 'gear', ticket10: 'pearl' }[d.kind];
}

function loginClaim() {
  if (!loginClaimable()) return null;
  const L = loginState(), d = LOGIN_DAYS[L.n % LOGIN_DAYS.length], g = gachaState();
  let gear = null;
  if (d.kind === 'tokens') save.tokens += d.n;
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
