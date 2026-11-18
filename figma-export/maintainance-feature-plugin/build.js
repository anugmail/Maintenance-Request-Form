#!/usr/bin/env node
/* ประกอบ code.js ของปลั๊กอิน Feature แผนบำรุงรักษา (13 พ.ย. 2569)
   = plugin-lib/core.js + ค่าฝังที่ screens.js ต้องใช้ + maintainance-plugin/screens.js (จอของพี่นุ อ่านอย่างเดียว ไม่แก้) + feature.js (จัดวางตามหน้าและ case)
   ไม่เรียก build-plugin.js ⇒ maintainance-plugin/code.js ของเดิมไม่ถูกเขียนทับ
   รัน:  node figma-export/maintainance-feature-plugin/build.js */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
/* 18 พ.ย. 2569 ย้ายฐาน: core / screens / build.json อ่านจากสำเนาใน base/ (ลอกจาก origin/main ee11614) ไม่อ่านไฟล์ของพี่นุใน working tree
   figjam-plugin/code.js ของ origin ตรงกับ working tree ทุกบรรทัด ⇒ ยังอ่านที่เดิม · ย้ายฐานรอบหน้า: ลอกไฟล์ใหม่ทับ base/ แล้วแก้หัวไฟล์ */
const BASE = path.join(__dirname, 'base');
const core = fs.readFileSync(path.join(BASE, 'core.js'), 'utf8');
const screens = fs.readFileSync(path.join(BASE, 'screens.js'), 'utf8');
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
/* อัปเดตเฉพาะจุด (18 พ.ย. 2569): sig.js = ลายเซ็นจอ · update.js = แท็บอัปเดต/ลบ (rcache.js เลิกใช้ ย้ายฐาน: resolveAll ของ origin มีแคชแล้ว)
   MF_DEPHASH = hash ของทุกการประกาศชั้นนอกสุด + ทุกอย่างที่มันพึ่งต่อกันไป (คิดตอน build จากซอร์สจริง) ⇒ ปลั๊กอินรู้ว่าจอไหนเปลี่ยน */
const sigSrc = fs.readFileSync(path.join(__dirname, 'sig.js'), 'utf8');
const update = fs.readFileSync(path.join(__dirname, 'update.js'), 'utf8');
const { sigDepHash } = require('./sig.js');
const cfg = JSON.parse(fs.readFileSync(path.join(BASE, 'build.json'), 'utf8'));
const BUILT_AT = Date.now();   // เวลา build — จอเก่าที่ไม่มีลายเซ็นเก็บเป็นฐานได้เฉพาะเมื่อสร้างหลังเวลานี้ (update.js)
/* รีวิวโคนัน 18 พ.ย. 2569: ทุกอย่างที่ทำให้หน้าตาจอเปลี่ยนต้องอยู่ในลายเซ็น — ภาพ (IMAGES) · KEYS · NEEDED (อยู่ใน core/screens) · targets/figjam ของเรา */
const imagesSrc = 'const IMAGES = ' + JSON.stringify(Object.fromEntries(Object.entries(cfg.images || {}).filter(([k, v]) => k[0] !== '_' && typeof v === 'string').map(([k, v]) => [k, require('crypto').createHash('sha1').update(fs.readFileSync(path.resolve(root, '..', v))).digest('hex')]))) + ';';
const depScopes = { '*': [core, screens, sigSrc, feature, update, targets, fs.readFileSync(path.join(__dirname, 'figjam.js'), 'utf8'), imagesSrc] };
for (const id of fids) depScopes[id] = fs.readFileSync(path.join(fdir, id + '.js'), 'utf8');
const DEPHASH = sigDepHash(depScopes);
/* ชื่อที่ไฟล์ Feature ประกาศซ้ำกับส่วนกลาง: จอของ screens.js ใช้ของส่วนกลาง · จอที่ Feature แทนเอง (screens/H:) ใช้ของไฟล์ Feature (sigOf แยก scope) — แจ้งไว้ให้รู้ */
{ const dup = fids.map(id => [id, Object.keys(DEPHASH[id]).filter(n => DEPHASH['*'][n])]).filter(x => x[1].length); if (dup.length) console.log('ⓘ ชื่อซ้ำ Feature/ส่วนกลาง (แยก scope แล้ว): ' + dup.map(([id, n]) => id + ': ' + n.join(' ')).join(' · ')); }
const fjExt = fs.readFileSync(path.join(__dirname, 'figjam.js'), 'utf8');
/* ฝั่ง FigJam (17 พ.ย. 2569): ลอกส่วนสร้างบอร์ดจาก figjam-plugin/code.js ของพี่นุ (อ่านอย่างเดียว) · ตัด showUI ของเขาออก ใช้ขนาดหน้าต่างของปลั๊กอินนี้ */
const FJ_SHOW = "figma.showUI(__html__, { width: 420, height: 560, themeColors: true });";
const fjLift = fs.readFileSync(path.join(root, 'figjam-plugin', 'code.js'), 'utf8');
if (fjLift.indexOf(FJ_SHOW) < 0) throw new Error('figjam-plugin/code.js เปลี่ยนไป — หา showUI ไม่เจอ แก้ build.js ให้ตรง');
const im = {};   // ภาพ Empty state ที่จอเดิมใช้ (รายการแผนว่าง) — อ่านตามที่ build.json ของปลั๊กอินเดิมระบุ
for (const [k, v] of Object.entries(cfg.images || {})) if (k[0] !== '_' && typeof v === 'string') im[k] = fs.readFileSync(path.resolve(root, '..', v)).toString('base64');
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
  '\nconst MF_DEPHASH = ' + JSON.stringify(DEPHASH) + ';\nconst MF_BUILT_AT = ' + BUILT_AT + ';\n' +
  '\n/* ======================== maintainance-feature-plugin/feature.js ======================== */\n' + feature +
  '\n/* ======================== maintainance-feature-plugin/update.js ======================== */\n' + update +
  '\n})();\n';
const outPath = process.env.MF_OUT || path.join(__dirname, 'code.js');   // MF_OUT = เขียนที่อื่น (agent เทสแยก ไม่ทับ code.js จริง)
fs.writeFileSync(outPath, out);
console.log(path.relative(process.cwd(), outPath) + ': Feature ' + fids.join(' · ') + ' · ' + out.split('\n').length + ' บรรทัด (core ' + core.split('\n').length + ' + screens ' + screens.split('\n').length + ' + feature ' + feature.split('\n').length + ') · ภาพ ' + (Object.keys(im).join(', ') || '-'));
