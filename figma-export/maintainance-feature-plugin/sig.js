/* ============================================================================
   maintainance-feature-plugin/sig.js — ลายเซ็นจอ (18 พ.ย. 2569 · ผู้ใช้ขอ "อัปเดตเฉพาะจอที่เปลี่ยน ไม่ต้องสร้างใหม่ทั้งหมด")
   ----------------------------------------------------------------------------
   ใช้ 2 ที่ (ไฟล์เดียวกัน):
     · build.js  (node)  — ตัดซอร์สทุกไฟล์เป็นก้อนตามการประกาศชั้นนอกสุด (function / const / let / class ที่ขึ้นต้นคอลัมน์ 0)
                           หาว่าก้อนไหนอ้างชื่อไหน แล้วคิด hash ของ "ก้อนนั้น + ทุกก้อนที่มันพึ่งต่อกันไป" ⇒ MF_DEPHASH ฝังใน code.js
     · ปลั๊กอิน (Figma) — ลายเซ็นของจอ = hash( ซอร์สฟังก์ชันจอ + MF_DEPHASH ของทุกชื่อที่ฟังก์ชันจออ้าง + ข้อมูลเคส/ป้าย )
   ไม่นับคอมเมนต์และช่องว่าง ⇒ แก้คอมเมนต์ไม่ทำให้จอ "เปลี่ยน"
   ไม่ผูกกับโครง screens.js — อ่านแค่ซอร์ส ⇒ ย้ายฐาน core/screens แล้วยังใช้ได้ (build ใหม่ = hash ใหม่)
   ============================================================================ */
const SIG_SALT = 'mf-sig-1';   // เปลี่ยนค่านี้ = ทุกจอนับว่า "เปลี่ยน" (ใช้เมื่อแก้ขั้นตอนสร้างจอแบบที่ตัวหาการพึ่งพาจับไม่ได้)

/* hash 64 บิต (FNV-1a 2 ชุด) เป็นเลขฐาน 16 ยาว 16 ตัว — ไม่ใช่การเข้ารหัส ใช้เทียบว่าเหมือนเดิมไหม */
function sigHash(s) {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  s = String(s);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a ^= c; a = Math.imul(a, 0x01000193) >>> 0;
    b ^= c; b = Math.imul(b, 0x5bd1e995) >>> 0; b ^= b >>> 15;
  }
  return ('0000000' + (a >>> 0).toString(16)).slice(-8) + ('0000000' + (b >>> 0).toString(16)).slice(-8);
}

/* ตัดคอมเมนต์ + บีบช่องว่าง · เก็บชื่อตัวแปรที่อยู่นอกข้อความ (รวมใน ${…} ของ template) — ตัวตัดคำแบบย่อ แยก regex จาก / หารด้วยตัวอักษรก่อนหน้า */
function sigScan(src) {
  src = String(src);
  const ids = new Set(); let out = '', i = 0, last = '';   // last = ตัวอักษรที่มีความหมายตัวล่าสุด (ไว้เดาว่า / คือ regex ไหม)
  const n = src.length, idStart = /[A-Za-z_$]/, idChar = /[\w$]/;
  const KW = /^(return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|await|yield)$/;
  let lastWord = '';
  const stack = [];   // ความลึกของ ${ } ใน template
  function template() {   // อยู่หลัง ` แล้ว · คืนเมื่อเจอ ` ปิด
    out += '`';
    while (i < n) {
      const c = src[i];
      if (c === '\\') { out += src.substr(i, 2); i += 2; continue; }
      if (c === '`') { out += '`'; i++; return; }
      if (c === '$' && src[i + 1] === '{') { out += '${'; i += 2; stack.push(0); code(true); out += '}'; continue; }
      out += c; i++;
    }
  }
  function code(inTpl) {
    let depth = 0;
    while (i < n) {
      const c = src[i], d = src[i + 1];
      if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; if (!/\s$/.test(out)) out += ' '; continue; }
      if (c === '"' || c === "'") { const q = c; let j = i + 1; while (j < n && src[j] !== q && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; last = q; lastWord = ''; continue; }
      if (c === '`') { i++; template(); last = '`'; lastWord = ''; continue; }
      if (c === '/') {
        const re = !last || /[(,=:[!&|?{};+\-*%<>~^]/.test(last) || KW.test(lastWord);
        if (re) { let j = i + 1, cls = false; while (j < n && src[j] !== '\n') { const x = src[j]; if (x === '\\') { j += 2; continue; } if (x === '[') cls = true; else if (x === ']') cls = false; else if (x === '/' && !cls) break; j++; } j++; while (j < n && /[a-z]/.test(src[j])) j++; out += src.slice(i, j); i = j; last = '/'; lastWord = ''; continue; }
      }
      if (idStart.test(c)) {
        let j = i + 1; while (j < n && idChar.test(src[j])) j++;
        const w = src.slice(i, j), prev = out.replace(/\s+$/, '').slice(-1);
        if (prev !== '.' || out.replace(/\s+$/, '').slice(-3) === '...') ids.add(w);   // a.b ⇒ นับแค่ a (b เป็นชื่อ property)
        out += w; i = j; last = 'a'; lastWord = w; continue;
      }
      if (/\s/.test(c)) { if (!/\s$/.test(out)) out += ' '; i++; continue; }
      if (inTpl) { if (c === '{') depth++; else if (c === '}') { if (!depth) { i++; stack.pop(); return; } depth--; } }
      out += c; i++; last = c; lastWord = '';
    }
  }
  code(false);
  return { code: out.trim(), ids };
}

/* ก้อนการประกาศชั้นนอกสุด: บรรทัดที่ขึ้นต้นคอลัมน์ 0 ด้วย function / async function / const / let / var / class
   ก้อน = ตั้งแต่บรรทัดนั้นถึงก่อนการประกาศถัดไป (คำสั่งอื่นที่คอลัมน์ 0 เช่น for … / figma.ui.onmessage = ติดไปกับก้อนก่อนหน้า) */
const SIG_DECL = /^(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+(.+))/;
function sigChunks(src) {
  const lines = String(src).split('\n'), chunks = []; let cur = null;
  for (const l of lines) {
    const m = l.match(SIG_DECL);
    if (m) {
      let names = [];
      if (m[1] || m[2]) names = [m[1] || m[2]];
      else { const head = m[3].replace(/(['"`]).*?\1/g, '""'); names = [...head.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)].map(x => x[1]); if (!names.length) { const one = head.match(/^([A-Za-z_$][\w$]*)/); if (one) names = [one[1]]; } }
      if (names.length) { cur = { names, text: l }; chunks.push(cur); continue; }
    }
    if (cur) cur.text += '\n' + l;
  }
  return chunks;
}

/* build.js: scopes = { '*': [ซอร์สส่วนกลาง…], '<id>': ซอร์สของ features/<id>.js } ⇒ { '*': { ชื่อ: hash }, '<id>': { ชื่อ: hash } }
   ชื่อในไฟล์ Feature หาในไฟล์นั้นก่อน (ทุกไฟล์มี TOASTS / SCREENS / HAPPY ของตัวเอง) แล้วค่อยหาส่วนกลาง */
function sigDepHash(scopes) {
  const nodes = new Map();   // key → { own, deps:Set<key> }
  const table = {};          // scope → { ชื่อ → key }
  for (const [sc, srcs] of Object.entries(scopes)) {
    table[sc] = {};
    for (const src of [].concat(srcs)) for (const ch of sigChunks(src)) {
      const s = sigScan(ch.text), key = sc + ':' + ch.names[0] + ':' + nodes.size;
      nodes.set(key, { own: sigHash(s.code), ids: s.ids, scope: sc });
      for (const nm of ch.names) table[sc][nm] = table[sc][nm] ? table[sc][nm].concat(key) : [key];   // ชื่อซ้ำ (ประกาศทับ) ⇒ พึ่งทุกก้อน
    }
  }
  for (const nd of nodes.values()) {
    nd.deps = new Set();
    for (const id of nd.ids) for (const k of (nd.scope !== '*' && table[nd.scope][id]) || table['*'][id] || []) nd.deps.add(k);
  }
  const closure = (key) => { const seen = new Set([key]), st = [key]; while (st.length) for (const d of nodes.get(st.pop()).deps) if (!seen.has(d)) { seen.add(d); st.push(d); } return seen; };
  const out = {};
  for (const [sc, t] of Object.entries(table)) {
    out[sc] = {};
    for (const [nm, keys] of Object.entries(t)) {
      const all = new Set(); keys.forEach(k => closure(k).forEach(x => all.add(x)));
      out[sc][nm] = sigHash([...all].map(k => nodes.get(k).own).sort().join(','));
    }
  }
  return out;
}

/* ปลั๊กอิน: ลายเซ็นของฟังก์ชันจอ 1 ตัว · fid = Feature (หาชื่อในไฟล์ Feature ก่อน) · base = ชื่อขั้นตอนที่ทุกจอผ่าน (makeScreen) · data = ป้าย/ข้อความเคส */
function sigOf(fn, fid, base, data) {
  const D = (typeof MF_DEPHASH !== 'undefined' && MF_DEPHASH) || { '*': {} };
  const s = sigScan(fn ? Function.prototype.toString.call(fn) : '');
  const look = (nm) => (D[fid] && D[fid][nm]) || D['*'][nm];
  const deps = [...s.ids].concat(base || []).filter(look).sort().map(nm => nm + '=' + look(nm));
  return sigHash([SIG_SALT, s.code, deps.join(';'), JSON.stringify(data || null)].join('\n'));
}
/* ซอร์สฟังก์ชันอ่านได้จริงไหม (บาง sandbox คืน [native code]) — อ่านไม่ได้ ⇒ ลายเซ็นไว้ใจไม่ได้ โหมดอัปเดตจอที่เปลี่ยนจะไม่ทำงาน */
function sigSourceOk() {
  try { const probe = function mfProbe() { return 'mf-probe-41'; }; return Function.prototype.toString.call(probe).indexOf('mf-probe-41') >= 0; } catch (e) { return false; }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { sigHash, sigScan, sigChunks, sigDepHash, sigOf, sigSourceOk, SIG_SALT };
