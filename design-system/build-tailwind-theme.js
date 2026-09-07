#!/usr/bin/env node
/* ============================================================================
   สร้าง design-system/tailwind-theme.js จาก tokens.css — ห้ามแก้ไฟล์ปลายทางมือ
   ----------------------------------------------------------------------------
   ทำไม: เจ้าของงานสั่ง 7 ก.ย. 2569 "ถัดจากนี้ปรับเป็น Tailwind" — สถาปัตยกรรม
   แบบระบบจริง (Tailwind + DaisyUI-style): Tailwind ให้ utilities · theme map
   จาก tokens.css · คลาส component กลาง (components.css) ใช้ต่อตามเดิม

   หลักการ: ค่าสีใน theme ชี้ CSS variable (var(--brand-600)) ไม่ก๊อปค่า hex
   ⇒ แหล่งความจริงยังอยู่ที่ tokens.css ที่เดียว — แก้สีแล้ว utility เปลี่ยนตาม
   ไม่ต้อง regenerate (regenerate เมื่อ "เพิ่ม/ลบชื่อ token" เท่านั้น)

   รัน:  node design-system/build-tailwind-theme.js
   ============================================================================ */
const fs = require('fs');
const path = require('path');

const tokens = fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8');

// เก็บชื่อตัวแปรทั้งหมดใน :root (ไม่สนค่า — theme ชี้ var())
const names = [...tokens.matchAll(/--([a-z0-9-_]+)\s*:/gi)].map(m => m[1]);

const colors = {};      // --brand-600 → colors['brand-600'] = 'var(--brand-600)'
const radius = {};      // --rounded-md → borderRadius['md']
const spacing = {};     // --space-3 → spacing['3'] (ตามสเกล 4px ของไลบรารี)
for (const n of names) {
  if (/^(brand|gray|success|warning|error|info|secondary|chart|primary)-/.test(n) || /^badge-|^btn-|^color-|^focus-ring/.test(n)) {
    colors[n] = `var(--${n})`;
  } else if (/^rounded-(.+)/.test(n)) {
    radius[n.replace('rounded-', '')] = `var(--${n})`;
  } else if (/^r-(sm|md|lg|pill)$/.test(n)) {
    // --r-pill → rounded-pill · ส่วน --r-sm/md/lg (alias เดิม 8/12/16) ชื่อชนกับ --rounded-* จึง prefix r
    radius[n === 'r-pill' ? 'pill' : n.replace('r-', 'r')] = `var(--${n})`;
  } else if (/^space-(.+)/.test(n)) {
    spacing['tk-' + n.replace('space-', '').replace('_', '.')] = `var(--${n})`;   // p-tk-3 = var(--space-3)
  }
}

// colors ด้านบนทับชุด default ของ Tailwind ทั้งหมด — เติมค่าพื้นฐานที่จำเป็นกลับเข้าไป
colors.white = '#fff'; colors.black = '#000';
colors.transparent = 'transparent'; colors.current = 'currentColor'; colors.inherit = 'inherit';

radius.full = '9999px';   // คืนค่า default ของ Tailwind ที่โดน object นี้ทับ

const theme = {
  colors,                                   // ใช้เป็น bg-brand-600 · text-gray-500 · border-gray-300 ฯลฯ
  borderRadius: { ...radius, DEFAULT: 'var(--rounded-md)' },
  fontFamily: { sans: ["'IBM Plex Sans Thai'", 'sans-serif'] },
  fontSize: {                               // สเกลตามไลบรารี (text-xs/sm/md 12/14/16 + h1 20)
    xs: ['var(--fs-text-xs)', 'var(--lh-text-xs)'],
    sm: ['var(--fs-text-sm)', 'var(--lh-text-sm)'],
    md: ['var(--fs-text-md)', 'var(--lh-text-md)'],
    h1: ['var(--fs-h1)', '30px'],
  },
  extend: { spacing },
};

const out = `/* ============================================================
   สร้างโดย design-system/build-tailwind-theme.js — ห้ามแก้ไฟล์นี้มือ
   theme ของ Tailwind (Play CDN) map จาก tokens.css — ค่าชี้ CSS var
   จึงแก้สีที่ tokens.css ที่เดียวเหมือนเดิม · preflight ปิดไว้กันรีเซ็ต
   ทับ components.css (คลาส component กลางใช้ต่อตามเดิมแบบ DaisyUI)
   ============================================================ */
window.tailwind = window.tailwind || {};
tailwind.config = {
  corePlugins: { preflight: false },
  theme: ${JSON.stringify(theme, null, 2)}
};
`;
fs.writeFileSync(path.join(__dirname, 'tailwind-theme.js'), out);
console.log(`เขียน tailwind-theme.js แล้ว — สี ${Object.keys(colors).length} · radius ${Object.keys(radius).length} · spacing ${Object.keys(spacing).length}`);
