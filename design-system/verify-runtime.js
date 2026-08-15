#!/usr/bin/env node
/* ============================================================
   ตรวจ tokens.css กับค่าที่วัดจาก VMS Plus "ตัวจริง" (.vms-runtime/)
   ------------------------------------------------------------
   เจ้าของงานเคาะ 14 ส.ค. 2569: เจอว่า Figma library กับระบบที่รันอยู่จริง
   ใช้ชุดสีเทาคนละเวอร์ชัน (Figma = Untitled UI v2 · ระบบจริง = v1)
   → ตัดสินให้ "ระบบจริงมาก่อน Figma"

   ไฟล์นี้จึงเป็นด่านแรก · verify-tokens.js (เทียบ Figma) เป็นด่านรอง
   ถ้าสองด่านขัดกัน ให้ยึดไฟล์นี้ แล้วเขียนเหตุผลกำกับใน tokens.css

   รัน:  node design-system/verify-runtime.js
   คืน exit 1 ถ้ามี token ที่ไม่ตรงค่าจริง
   ============================================================ */

const fs = require('fs');
const path = require('path');

const RT = path.join(__dirname, '.vms-runtime');
if (!fs.existsSync(RT)) {
  console.error('ไม่พบ .vms-runtime/ — ต้องต่อ VPN กฟภ. แล้วเก็บค่าใหม่');
  console.error('วิธีเก็บ: docs/superpowers/specs/2026-08-14-vmsplus-runtime-alignment.md ข้อ 2');
  process.exit(1);
}
const pal = JSON.parse(fs.readFileSync(path.join(RT, 'palette.json'), 'utf8'));
const css = fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8');

/* ---------- สีที่ระบบจริงเรนเดอร์ (รวม text + bg + border) ---------- */
const seen = new Map();
for (const kind of ['text', 'bg', 'bd']) {
  for (const [hex, v] of Object.entries(pal[kind] || {})) {
    const k = hex.toUpperCase();
    seen.set(k, (seen.get(k) || 0) + v.n);
  }
}

/* ---------- ค่าที่ผูก token ↔ runtime ไว้ตายตัว (สเปกข้อ 4) ----------
   ที่มาของทุกค่า: .vms-runtime/palette.json + probe.json + real-2.json      */
const MUST = {
  '--gray-25':   ['#FCFCFD', 'พื้น pill "ยกเลิก"'],
  '--gray-50':   ['#F9FAFB', 'พื้น form-card-body'],
  '--gray-100':  ['#F2F4F7', 'พื้นหัวตาราง · พื้นปุ่ม disabled'],
  '--gray-200':  ['#EAECF0', 'เส้นใต้แถวตาราง · ขอบ sidebar'],
  '--gray-300':  ['#D0D5DD', 'ขอบ input/ปุ่มรอง/pagination'],
  '--gray-400':  ['#98A2B3', 'ตัวอักษร disabled'],
  '--gray-500':  ['#667085', 'ไอคอน sidebar · แท็บที่ไม่ได้เลือก'],
  '--gray-600':  ['#475467', 'ตัวอักษรปุ่มรอง · ไอคอน topbar'],
  '--gray-700':  ['#344054', 'ตัวอักษร pill "ยกเลิก"'],
  '--success-700': ['#027A48', 'ตัวอักษร pill "เสร็จสิ้น"'],
  '--success-200': ['#A6F4C5', 'ขอบ pill success'],
  '--success-25':  ['#F6FEF9', 'พื้น pill success'],
  '--warning-700': ['#B54708', 'ตัวอักษร badge warning'],
  '--warning-200': ['#FEDF89', 'ขอบ badge warning'],
  '--warning-50':  ['#FFFAEB', 'พื้น badge warning'],
  '--error-700':   ['#B42318', 'ตัวอักษร badge error'],
  '--error-600':   ['#D92D20', 'ตัวอักษรปุ่ม tertiary-danger'],
  '--error-200':   ['#FECDCA', 'ขอบ badge error'],
  '--error-50':    ['#FEF3F2', 'พื้น badge error'],
  '--info-700':    ['#3538CD', 'ตัวอักษร badge info'],
  '--info-200':    ['#C7D7FE', 'ขอบ badge info'],
  '--info-50':     ['#EEF4FF', 'พื้น badge info'],
  '--brand-600':   ['#A80689', 'สีแบรนด์ · พื้นปุ่มหลัก'],
  '--badge-brand-bg':     ['#FFF5FD', 'พื้น badge แบรนด์'],
  '--badge-brand-border': ['#FED8F6', 'ขอบ badge แบรนด์'],
  '--badge-neutral-border': ['#E4E7EC', 'ขอบ pill "ยกเลิก" · ขอบ topbar'],
};

/* ---------- อ่านค่าที่ประกาศไว้ใน tokens.css ---------- */
const declared = new Map();
for (const m of css.matchAll(/^\s*(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/gm)) {
  declared.set(m[1], m[2].toUpperCase());
}

let bad = 0;
console.log('ตรวจ tokens.css กับค่าจริงจาก vmsplus-dev\n');
console.log('token'.padEnd(24) + 'ในไฟล์'.padEnd(12) + 'ค่าจริง'.padEnd(12) + 'ผล');
console.log('-'.repeat(78));
for (const [tok, [want, why]] of Object.entries(MUST)) {
  const got = declared.get(tok);
  const ok = got === want.toUpperCase();
  if (!ok) bad++;
  console.log(
    tok.padEnd(24) + (got || '—').padEnd(12) + want.padEnd(12) +
    (ok ? '✅' : '❌ ไม่ตรง') + '   ' + why
  );
}

/* ---------- สีที่ประกาศไว้แต่ระบบจริงไม่เคยใช้ — เตือน ไม่ fail ---------- */
const orphan = [...declared].filter(([t, h]) => !seen.has(h) && !(t in MUST));
console.log(`\nไม่พบใน runtime ${orphan.length} ตัว (เตือนเฉยๆ — หน้าที่เก็บมาอาจยังไม่ได้ใช้ของพวกนี้):`);
console.log('  ' + (orphan.map(([t, h]) => `${t}=${h}`).join(' · ') || '(ไม่มี)'));

console.log(`\nสรุป: ไม่ตรง ${bad} ตัว จาก ${Object.keys(MUST).length}`);
if (bad) console.log('→ แก้ tokens.css ให้ตรงค่าจริง หรือถ้าจงใจไม่ตรง ต้องเขียนเหตุผลกำกับในไฟล์');
process.exit(bad ? 1 : 0);
