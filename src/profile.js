'use strict';

// Local player profiles: each one has its own save in localStorage. No server involved.
const PROF_KEY = 'aot-profiles';
const LEGACY_SAVE = 'aot-td-save';
const PROF = (() => {
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PROF_KEY) || 'null'); } catch (e) {}
  if (!p || !Array.isArray(p.list)) p = { list: [], cur: null };
  return p;
})();

function profPersist() { try { localStorage.setItem(PROF_KEY, JSON.stringify(PROF)); } catch (e) {} }
function profById(id) { return PROF.list.find(p => p.id === id) || null; }
function profCur() { return profById(PROF.cur); }
function profSaveKey(id = PROF.cur) {
  const p = profById(id);
  return !p || p.legacy ? LEGACY_SAVE : LEGACY_SAVE + ':' + p.id;
}

function profHash(id, pin) {
  let h = 2166136261;
  const s = id + ':' + pin + ':aot';
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36);
}

function profPinOk(p, pin) { return !p.pin || p.pin === profHash(p.id, pin); }

function profNameTaken(name, except) {
  const n = name.trim().toLowerCase();
  return PROF.list.some(p => p.id !== except && p.name.toLowerCase() === n);
}

function profCreate(name, avatar, pin) {
  const legacy = !PROF.list.some(p => p.legacy);
  const id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const p = { id, name: name.trim(), avatar, pin: '', created: Date.now(), legacy };
  if (pin) p.pin = profHash(id, pin);
  PROF.list.push(p);
  PROF.cur = id;
  profPersist();
  profUnlock(id);
  return p;
}

function profEdit(p, name, avatar, pin, clearPin) {
  p.name = name.trim();
  p.avatar = avatar;
  if (clearPin) p.pin = '';
  if (pin) p.pin = profHash(p.id, pin);
  profPersist();
}

function profDelete(id) {
  const p = profById(id);
  if (!p) return;
  try { localStorage.removeItem(profSaveKey(id)); } catch (e) {}
  PROF.list = PROF.list.filter(q => q.id !== id);
  if (PROF.cur === id) PROF.cur = null;
  profPersist();
}

function profUnlock(id) { try { sessionStorage.setItem('aot-auth', id); } catch (e) {} }
function profUnlocked(id) { try { return sessionStorage.getItem('aot-auth') === id; } catch (e) { return false; } }

function profLogout() {
  PROF.cur = null;
  profPersist();
  try { sessionStorage.removeItem('aot-auth'); } catch (e) {}
}

function profSummary(p) {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(profSaveKey(p.id)) || 'null'); } catch (e) {}
  const st = (s && s.stats) || {};
  return { kills: st.kills || 0, runs: st.runs || 0, heroes: s && s.chars ? Object.keys(s.chars).length : 1, marks: s ? s.marks ?? s.tokens ?? 0 : 300 };
}

// What the player has to do before playing: 'enlist' (no profiles yet), 'who' (pick a profile) or 'pin'.
function profGate() {
  if (!PROF.list.length) return 'enlist';
  const p = profCur();
  if (!p) return 'who';
  if (p.pin && !profUnlocked(p.id)) return 'pin';
  return null;
}
