#!/usr/bin/env node
/* ============================================================
   ประกอบ code.js ของปลั๊กอินสร้างจอ = plugin-lib/core.js + (ผัง userflow) + <ปลั๊กอิน>/screens.js
   ------------------------------------------------------------
   Figma โหลดปลั๊กอินจากไฟล์เดียว (ไม่มี require) จึงต้องต่อไฟล์กัน · แก้โค้ดที่ core.js / screens.js แล้วรันไฟล์นี้ใหม่ — ห้ามแก้ code.js ตรงๆ
   ผัง userflow ข้างจอ (22 ต.ค. 2569): ถ้ามี <ปลั๊กอิน>/build.json { "userflow": "Diagram/…/NN-<เรื่อง>-userflow.md" }
     → อ่านไฟล์นั้นด้วย plugin-lib/userflow-layout.js แล้วฝังเป็น const USERFLOW (ไม่มี = null · ปลั๊กอินไม่วาดผัง)
     ⇒ แก้ไฟล์ userflow แล้วต้องรันไฟล์นี้ใหม่ ผังบน Figma ถึงจะตาม
   รัน:  node figma-export/build-plugin.js maintainance-plugin
   ============================================================ */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
if (!dir) { console.error('ใช้: node figma-export/build-plugin.js <โฟลเดอร์ปลั๊กอิน>'); process.exit(1); }
const core = fs.readFileSync(path.join(__dirname, 'plugin-lib', 'core.js'), 'utf8');
const screens = fs.readFileSync(path.join(__dirname, dir, 'screens.js'), 'utf8');
const cfgFile = path.join(__dirname, dir, 'build.json');
const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
let flow = 'null', flowNote = 'ไม่มีผัง userflow';
if (cfg.userflow) {
  const src = path.resolve(__dirname, '..', cfg.userflow);
  const uf = require('./plugin-lib/userflow-layout.js').build(src);
  flow = JSON.stringify(Object.assign({ src: cfg.userflow }, { scenarios: uf }));
  flowNote = 'ผัง userflow ' + Object.keys(uf).length + ' scenario จาก ' + cfg.userflow;
  if (cfg.journey) {   // journey แนวขวาง (22 ต.ค. 2569): ผังแนวนอนทุก scenario + ลำดับ/จุดต่อจาก build.json
    const j = Object.assign({}, cfg.journey, { scenarios: require('./plugin-lib/userflow-layout.js').build(src, true) });
    if (cfg.activity) {   // 6 พ.ย. 2569 เจ้าของงาน "flow chart ยาวๆ … เล่าเรื่องทั้งเส้น … ไม่เอาเป็น userflow แล้ว" ⇒ journey ต่อผัง flowchart กิจกรรม (แนวนอน) แทนผัง userflow
      j.scenarios = {}; require('./plugin-lib/activity-layout.js').build(path.resolve(__dirname, '..', cfg.activity), true).scenarios.forEach(sc => { j.scenarios[sc.n] = sc; });
      j.kind = 'activity'; j.title = j.titleActivity || j.title;
    }
    flow = JSON.stringify(Object.assign({ src: cfg.userflow }, { scenarios: uf, journey: j }));
    flowNote += ' + journey แนวขวาง' + (j.kind === 'activity' ? ' (flowchart กิจกรรม)' : '') + ' ' + j.cols.length + ' คอลัมน์ · จุดต่อ ' + j.links.length;
  }
}
let ac = 'null', acNote = '';
if (cfg.ac) {   // AC รายจอ (30 ต.ค. 2569 แม่แบบของทีม): .md ใน Diagram/ → const AC = { 'A.1': {...} } ให้ปลั๊กอินวางการ์ดใต้จอ
  const parsed = require('./plugin-lib/ac-md.js').parse(path.resolve(__dirname, '..', cfg.ac));
  ac = JSON.stringify(Object.assign({ src: cfg.ac }, { screens: parsed }));
  acNote = ' · AC ' + Object.keys(parsed).length + ' จอ จาก ' + cfg.ac;
}
let docs = 'null', docsNote = '';
if (cfg.docs) {   // เอกสารที่ปลั๊กอินวางเป็นกรอบบนหน้า (30 ต.ค. 2569 story map + use case ใน Figma) → const DOCS = { key: { src, … } }
  const dt = require('./plugin-lib/doc-tables.js'), d = {};
  for (const [k, v] of Object.entries(cfg.docs)) { const src = path.resolve(__dirname, '..', v); d[k] = Object.assign({ src: v }, /\.csv$/.test(v) ? dt.csv(src) : dt.md(src)); }
  docs = JSON.stringify(d);
  docsNote = ' · เอกสาร ' + Object.keys(d).join(', ');
}
let swim = 'null', swimNote = '';
if (cfg.swimlane) {   // user journey swimlane ตามผู้เกี่ยวข้อง (4 พ.ย. 2569): .md ใน Diagram/ → const SWIMLANE (ตำแหน่งกล่อง/เส้นคำนวณที่นี่)
  const sw = require('./plugin-lib/swimlane-layout.js').build(path.resolve(__dirname, '..', cfg.swimlane));
  if (sw.problems.length) { console.error('✗ swimlane จัดวางไม่ผ่าน:\n' + sw.problems.join('\n')); process.exit(1); }
  swim = JSON.stringify(Object.assign({ src: cfg.swimlane }, sw));
  swimNote = ' · swimlane ' + sw.lanes.length + ' lane ' + sw.nodes.length + ' กล่อง ' + sw.edges.length + ' เส้น';
}
let act = 'null', actNote = '';
if (cfg.activity) {   // flowchart กิจกรรมราย scenario (6 พ.ย. 2569 เจ้าของงาน "ทำ script ให้ export ใน figma" + "อยากได้ flowchart") — แค่กิจกรรม ไม่มีหน้าจอ → const ACTIVITY
  const ac2 = require('./plugin-lib/activity-layout.js').build(path.resolve(__dirname, '..', cfg.activity));
  if (ac2.problems.length) { console.error('✗ flowchart กิจกรรม จัดวางไม่ผ่าน:\n' + ac2.problems.join('\n')); process.exit(1); }
  act = JSON.stringify(Object.assign({ src: cfg.activity }, ac2));
  actNote = ' · flowchart กิจกรรม ' + ac2.scenarios.length + ' scenario ' + ac2.scenarios.reduce((n, s) => n + s.nodes.length, 0) + ' กล่อง ' + ac2.scenarios.reduce((n, s) => n + s.edges.length, 0) + ' เส้น';
}
let images = 'null', imagesNote = '';
if (cfg.images) {   // ภาพประกอบที่ UI Release#2 ใส่ทับภาพตั้งต้นของ component (5 พ.ย. 2569 Empty state รถ) → const IMAGES = { key: base64 PNG }
  const im = {};
  for (const [k, v] of Object.entries(cfg.images)) if (k[0] !== '_') im[k] = fs.readFileSync(path.resolve(__dirname, '..', v)).toString('base64');
  images = JSON.stringify(im);
  imagesNote = ' · ภาพ ' + Object.keys(im).join(', ');
}
/* include (12 พ.ย. 2569 เจ้าของงาน "อยากให้เขียนเรื่องการประเมิน กบค มาใส่ในนี้" ที่หน้าต่างปลั๊กอินประเมินผู้รับจ้าง)
   build.json { "include": { "SAT": "satisfaction-plugin" } } ⇒ ต่อ screens.js ของปลั๊กอินนั้นไว้ใน IIFE (ชื่อไม่ชนกัน) + ผัง flowchart ของมันเอง → const INCLUDE = { SAT: {...} }
   ต้นทางยังเป็นโฟลเดอร์ปลั๊กอินนั้นที่เดียว (ไม่ก๊อปโค้ด) · ตัดส่วน figma.ui ท้ายไฟล์ออก · screens.js ของปลั๊กอินหลักสลับ PLUGIN/ACTIVITY/NEEDED ตอนสร้าง (withInclude) */
let inc = '', incNote = '';
for (const [key, idir] of Object.entries(cfg.include || {})) {
  const src = fs.readFileSync(path.join(__dirname, idir, 'screens.js'), 'utf8');
  const cut = src.indexOf('\nfigma.ui.onmessage');
  if (cut < 0) { console.error('✗ include ' + idir + ': ไม่พบ figma.ui.onmessage ท้าย screens.js'); process.exit(1); }
  const icfgFile = path.join(__dirname, idir, 'build.json'), icfg = fs.existsSync(icfgFile) ? JSON.parse(fs.readFileSync(icfgFile, 'utf8')) : {};
  let iact = 'null';
  if (icfg.activity) {
    const a2 = require('./plugin-lib/activity-layout.js').build(path.resolve(__dirname, '..', icfg.activity));
    if (a2.problems.length) { console.error('✗ include ' + idir + ' flowchart กิจกรรม จัดวางไม่ผ่าน:\n' + a2.problems.join('\n')); process.exit(1); }
    iact = JSON.stringify(Object.assign({ src: icfg.activity }, a2));
  }
  inc += '\n/* ======================== include ' + key + ' = ' + idir + '/screens.js (ฝังตอน build) ======================== */\n' +
    'INCLUDE[' + JSON.stringify(key) + '] = (() => {\nconst ACTIVITY_INC = ' + iact + ';\n' + src.slice(0, cut) +
    '\nreturn { PLUGIN, NEEDED, NESTED, ACTIVITY: ACTIVITY_INC, SCENARIOS, groupsFor, ALL_IDX, buildSet, buildPick };\n})();\n';
  incNote += ' · รวม ' + idir + ' (' + key + ')';
}
const out = '/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + ' + dir + '/screens.js' + (cfg.userflow ? ' + ' + cfg.userflow : '') + ' ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js ' + dir + '  (' + new Date().toISOString().slice(0, 10) + ') */\n\n' +
  core + '\n/* ======================== userflow (ฝังตอน build) ======================== */\nconst USERFLOW = ' + flow + ';\n' +
  '\n/* ======================== AC รายจอ (ฝังตอน build) ======================== */\nconst AC = ' + ac + ';\n' +
  '\n/* ======================== เอกสาร story map / use case (ฝังตอน build) ======================== */\nconst DOCS = ' + docs + ';\n' +
  '\n/* ======================== user journey swimlane (ฝังตอน build) ======================== */\nconst SWIMLANE = ' + swim + ';\n' +
  '\n/* ======================== flowchart กิจกรรมราย scenario (ฝังตอน build) ======================== */\nlet ACTIVITY = ' + act + ';   // let: ปลั๊กอินที่รวมปลั๊กอินอื่นเข้ามา (build.json include) สลับผังตอนสร้างจอของปลั๊กอินนั้น\n' +
  '\n/* ======================== ภาพประกอบ (ฝังตอน build) ======================== */\nconst IMAGES = ' + images + ';\n' +
  '\n/* ======================== ปลั๊กอินที่รวมเข้ามา (build.json include · เติมท้ายไฟล์) ======================== */\nconst INCLUDE = {};\n' +
  '\n/* ======================== ' + dir + '/screens.js ======================== */\n' + screens +
  (inc ? '\n/* ======================== ปลั๊กอินที่รวมเข้ามา (build.json include) ======================== */\n' + inc : '');
fs.writeFileSync(path.join(__dirname, dir, 'code.js'), out);
console.log(dir + '/code.js: ' + out.split('\n').length + ' บรรทัด (core ' + core.split('\n').length + ' + screens ' + screens.split('\n').length + ') · ' + flowNote + acNote + docsNote + swimNote + actNote + imagesNote + incNote);
