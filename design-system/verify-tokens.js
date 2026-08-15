#!/usr/bin/env node
/* ============================================================
   ตรวจ tokens.css ทีละค่ากับไลบรารี Figma EXT_PEA_VMS
   ------------------------------------------------------------
   เจ้าของงานสั่ง 12 ส.ค. 2569: "ในไฟล์ component และ token เป็นของที่ตรง
   กับดีไซน์ที่ไปดึงมาหรือยัง ทำตรงนี้ให้ถูกต้องก่อน"

   ตรวจ 3 อย่างแบบเครื่องอ่าน ไม่ใช่ตาดู:
     1. สีทุกตัว — hex นั้นมีใช้จริงในไลบรารีไหม + ป้าย ✔/⚠ ในไฟล์ตรงกับความจริงไหม
     2. radius ทุกตัว — ค่านั้นมีในไลบรารีไหม (และไลบรารีใช้บ่อยแค่ไหน)
     3. ขนาด/line-height ตัวอักษร — ตรงกับชุดที่ไลบรารีใช้จริงไหม

   ที่ตรวจไม่ได้ (บอกไว้ให้รู้ ไม่ใช่ปล่อยเงียบ):
     · ชื่อ Figma Variable จริง — /variables/local เป็น Enterprise API
     · space scale — ไลบรารีไม่ได้ประกาศเป็น token มีแต่ค่า padding/gap บน node
     · เงา — เก็บมาเฉพาะ node ที่มีเงา ไม่ได้แยกเป็นชุด token

   รัน:  node design-system/verify-tokens.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const EX = path.join(__dirname, '.figma-extract');
if (!fs.existsSync(EX)) {
  console.error('ไม่พบ .figma-extract/ — ต้องรันบนเครื่องที่สกัดไลบรารีไว้ (ดู SOURCES.md)');
  process.exit(1);
}
const lib = JSON.parse(fs.readFileSync(path.join(EX, '00-summary-colors-radii-fonts.json'), 'utf8'));
const css = fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8');

const libColors = new Map(Object.entries(lib.colors).map(([k, v]) => [k.toUpperCase(), v]));
const libRadii = new Map(Object.entries(lib.radii).map(([k, v]) => [parseFloat(k), v]));
const libFonts = Object.entries(lib.fonts)
  .filter(([k]) => k.startsWith('Google Sans'))
  .map(([k, v]) => { const [, size, weight, lh] = k.split('|'); return { size: +size, weight: +weight, lh: +lh, n: v }; });

const rows = [];
const problems = [];

/* ---------- 1. สี ---------- */
const colorRe = /^\s*(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;?\s*(?:\/\*\s*(.)?([^*]*)\*\/)?/gm;
let m;
while ((m = colorRe.exec(css))) {
  const [, name, hex, mark, note] = m;
  const used = libColors.get(hex.toUpperCase()) || 0;
  const claimsOk = mark === '✔';
  const claimsMissing = mark === '⚠';
  // ✅ = วัดจากระบบจริง (.vms-runtime) — เจ้าของงานเคาะ 14 ส.ค. 2569 ว่า runtime มาก่อน Figma
  // ค่าพวกนี้ verify-runtime.js เป็นเจ้าของการตรวจ ไฟล์นี้แค่รายงานว่าไลบรารีมี/ไม่มี
  const claimsRuntime = mark === '✅';
  let verdict = 'ตรง';
  if (claimsRuntime) { verdict = used ? 'ตรง (runtime — ไลบรารีก็มี)' : 'ตรง (runtime — ไลบรารีไม่มี ถือว่า runtime ชนะ)'; }
  else if (used && !claimsOk) { verdict = 'ป้ายผิด — มีในไลบรารีแต่กำกับ ' + (mark || '(ไม่มีป้าย)'); problems.push({ name, hex, verdict, used }); }
  else if (!used && claimsOk) { verdict = 'ป้ายผิด — กำกับ ✔ แต่ไม่พบในไลบรารี'; problems.push({ name, hex, verdict, used }); }
  else if (!used && !claimsMissing) { verdict = 'ไม่พบในไลบรารีและไม่ได้กำกับ ⚠'; problems.push({ name, hex, verdict, used }); }
  rows.push({ kind: 'สี', name, value: hex, used, mark: mark || '-', verdict, note: (note || '').trim().slice(0, 40) });
}

/* ---------- 2. radius ---------- */
const radRe = /^\s*(--(?:rounded|r)-[\w-]+)\s*:\s*(\d+)px/gm;
while ((m = radRe.exec(css))) {
  const [, name, v] = m;
  const px = parseFloat(v);
  // 99px ของเรา = "กลมสุด" ซึ่งไลบรารีใช้ 9999
  const used = libRadii.get(px) || (px >= 99 ? (libRadii.get(9999) || 0) : 0);
  const verdict = used ? 'ตรง' : 'ไม่พบค่านี้ในไลบรารี';
  if (!used) problems.push({ name, hex: v + 'px', verdict, used: 0 });
  rows.push({ kind: 'radius', name, value: v + 'px', used, mark: '-', verdict, note: '' });
}

/* ---------- 3. ขนาดตัวอักษร ---------- */
const fsRe = /^\s*(--fs-[\w-]+)\s*:\s*(\d+)px/gm;
while ((m = fsRe.exec(css))) {
  const [, name, v] = m;
  const px = parseFloat(v);
  const hit = libFonts.filter(f => f.size === px);
  const used = hit.reduce((a, f) => a + f.n, 0);
  const verdict = used ? 'ตรง (ไลบรารีใช้ ' + hit.map(f => f.weight).sort().join('/') + ')' : 'ไลบรารีไม่มีขนาดนี้';
  if (!used) problems.push({ name, hex: v + 'px', verdict, used: 0 });
  rows.push({ kind: 'ฟอนต์', name, value: v + 'px', used, mark: '-', verdict, note: '' });
}

/* ---------- รายงาน ---------- */
const pad = (s, n) => String(s).padEnd(n);
console.log('ค่าที่ตรวจทั้งหมด ' + rows.length + ' ตัว\n');
for (const kind of ['สี', 'radius', 'ฟอนต์']) {
  const list = rows.filter(r => r.kind === kind);
  console.log('══════ ' + kind + ' (' + list.length + ') ══════');
  for (const r of list) {
    const flag = r.verdict === 'ตรง' || r.verdict.startsWith('ตรง') ? '  ' : '! ';
    console.log(flag + pad(r.name, 26) + pad(r.value, 10) + pad('ใช้ในไลบรารี ' + r.used, 22) + pad(r.mark, 3) + r.verdict);
  }
  console.log('');
}

if (problems.length) {
  console.log('══════ ต้องแก้ ' + problems.length + ' จุด ══════');
  problems.forEach(p => console.log('  ' + pad(p.name, 26) + pad(p.hex, 10) + p.verdict));
  process.exitCode = 1;
} else {
  console.log('✓ ทุกค่าตรงกับไลบรารี และป้ายกำกับที่มา ✔/⚠ ตรงกับความจริงทั้งหมด');
}
