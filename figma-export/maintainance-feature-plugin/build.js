#!/usr/bin/env node
/* ประกอบ code.js ของปลั๊กอิน Feature แผนบำรุงรักษา (13 พ.ย. 2569)
   = plugin-lib/core.js + ค่าฝังที่ screens.js ต้องใช้ + maintainance-plugin/screens.js (จอของพี่นุ อ่านอย่างเดียว ไม่แก้) + feature.js (จัดวางตามหน้าและ case)
   ไม่เรียก build-plugin.js ⇒ maintainance-plugin/code.js ของเดิมไม่ถูกเขียนทับ
   รัน:  node figma-export/maintainance-feature-plugin/build.js */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'plugin-lib', 'core.js'), 'utf8');
const screens = fs.readFileSync(path.join(root, 'maintainance-plugin', 'screens.js'), 'utf8');
const feature = fs.readFileSync(path.join(__dirname, 'feature.js'), 'utf8');
/* หลาย Feature (17 พ.ย. 2569): features/<id>.js ลงทะเบียนใน MF_FEATURES · เรียงตาม ORDER · MF_ONLY=plan,trip รวมเฉพาะบางตัว (เทสแยกระหว่างหลาย agent ทำพร้อมกัน) */
const ORDER = ['plan', 'trip', 'job', 'close', 'track'];
const only = (process.env.MF_ONLY || '').split(',').filter(Boolean);
const fdir = path.join(__dirname, 'features');
const fids = fs.readdirSync(fdir).filter(f => /\.js$/.test(f)).map(f => f.slice(0, -3))
  .filter(id => !only.length || only.indexOf(id) >= 0)
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || (a < b ? -1 : 1));
if (!fids.length) throw new Error('ไม่มี Feature ให้ประกอบ (features/*.js · MF_ONLY=' + (process.env.MF_ONLY || '') + ')');
const features = 'const MF_FEATURES = [];\n' + fids.map(id => '\n/* ---------- features/' + id + '.js ---------- */\n' + fs.readFileSync(path.join(fdir, id + '.js'), 'utf8')).join('\n');
const targets = fs.readFileSync(path.join(__dirname, 'targets.js'), 'utf8');
/* อัปเดตเฉพาะจุด (18 พ.ย. 2569): sig.js = ลายเซ็นจอ · rcache.js = จำผลหา component · update.js = แท็บอัปเดต/ลบ
   MF_DEPHASH = hash ของทุกการประกาศชั้นนอกสุด + ทุกอย่างที่มันพึ่งต่อกันไป (คิดตอน build จากซอร์สจริง) ⇒ ปลั๊กอินรู้ว่าจอไหนเปลี่ยน */
const sigSrc = fs.readFileSync(path.join(__dirname, 'sig.js'), 'utf8');
const rcache = fs.readFileSync(path.join(__dirname, 'rcache.js'), 'utf8');
const update = fs.readFileSync(path.join(__dirname, 'update.js'), 'utf8');
const { sigDepHash } = require('./sig.js');
const depScopes = { '*': [core, screens, sigSrc, rcache, feature, update] };
for (const id of fids) depScopes[id] = fs.readFileSync(path.join(fdir, id + '.js'), 'utf8');
const DEPHASH = sigDepHash(depScopes);
const fjExt = fs.readFileSync(path.join(__dirname, 'figjam.js'), 'utf8');
/* ฝั่ง FigJam (17 พ.ย. 2569): ลอกส่วนสร้างบอร์ดจาก figjam-plugin/code.js ของพี่นุ (อ่านอย่างเดียว) · ตัด showUI ของเขาออก ใช้ขนาดหน้าต่างของปลั๊กอินนี้ */
const FJ_SHOW = "figma.showUI(__html__, { width: 420, height: 560, themeColors: true });";
const fjLift = fs.readFileSync(path.join(root, 'figjam-plugin', 'code.js'), 'utf8');
if (fjLift.indexOf(FJ_SHOW) < 0) throw new Error('figjam-plugin/code.js เปลี่ยนไป — หา showUI ไม่เจอ แก้ build.js ให้ตรง');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'maintainance-plugin', 'build.json'), 'utf8'));
const im = {};   // ภาพ Empty state ที่จอเดิมใช้ (รายการแผนว่าง) — อ่านตามที่ build.json ของปลั๊กอินเดิมระบุ
for (const [k, v] of Object.entries(cfg.images || {})) if (k[0] !== '_') im[k] = fs.readFileSync(path.resolve(root, '..', v)).toString('base64');
const out = '/* ⚠ ไฟล์นี้ประกอบอัตโนมัติด้วย maintainance-feature-plugin/build.js — แก้ที่ feature.js (หรือต้นทาง core.js / screens.js) แล้วรันใหม่ (' + new Date().toISOString().slice(0, 16) + ') */\n' +
  targets +
  '\nif (FJ_EDITOR) (function () {   // ไฟล์ FigJam: วางลงบอร์ด\n' +
  "figma.showUI(__html__, { width: 360, height: 600, themeColors: true });\n" +
  '\n/* ======================== figjam-plugin/code.js (ลอกตอนประกอบ) ======================== */\n' + fjLift.replace(FJ_SHOW, '') +
  '\n/* ======================== maintainance-feature-plugin/figjam.js ======================== */\n' + fjExt +
  '\n})(); else (function () {   // ไฟล์ Figma: สร้างจอ + ส่งจอ\n' +
  core +
  '\n/* ======================== ค่าฝังที่ screens.js ใช้ (ปลั๊กอินนี้ไม่วางผังข้างจอ) ======================== */\n' +
  'const USERFLOW = null;\nconst AC = null;\nconst DOCS = null;\nconst SWIMLANE = null;\nconst ACTIVITY = null;\nconst IMAGES = ' + JSON.stringify(im) + ';\n' +
  '\n/* ======================== maintainance-plugin/screens.js ======================== */\n' + screens +
  '\n/* ======================== maintainance-feature-plugin/features/*.js ======================== */\n' + features +
  '\n/* ======================== maintainance-feature-plugin/sig.js ======================== */\n' + sigSrc +
  '\nconst MF_DEPHASH = ' + JSON.stringify(DEPHASH) + ';\n' +
  '\n/* ======================== maintainance-feature-plugin/rcache.js ======================== */\n' + rcache +
  '\n/* ======================== maintainance-feature-plugin/feature.js ======================== */\n' + feature +
  '\n/* ======================== maintainance-feature-plugin/update.js ======================== */\n' + update +
  '\n})();\n';
const outPath = process.env.MF_OUT || path.join(__dirname, 'code.js');   // MF_OUT = เขียนที่อื่น (agent เทสแยก ไม่ทับ code.js จริง)
fs.writeFileSync(outPath, out);
console.log(path.relative(process.cwd(), outPath) + ': Feature ' + fids.join(' · ') + ' · ' + out.split('\n').length + ' บรรทัด (core ' + core.split('\n').length + ' + screens ' + screens.split('\n').length + ' + feature ' + feature.split('\n').length + ') · ภาพ ' + (Object.keys(im).join(', ') || '-'));
