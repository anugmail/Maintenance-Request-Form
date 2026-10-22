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
}
const out = '/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + ' + dir + '/screens.js' + (cfg.userflow ? ' + ' + cfg.userflow : '') + ' ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js ' + dir + '  (' + new Date().toISOString().slice(0, 10) + ') */\n\n' +
  core + '\n/* ======================== userflow (ฝังตอน build) ======================== */\nconst USERFLOW = ' + flow + ';\n' +
  '\n/* ======================== ' + dir + '/screens.js ======================== */\n' + screens;
fs.writeFileSync(path.join(__dirname, dir, 'code.js'), out);
console.log(dir + '/code.js: ' + out.split('\n').length + ' บรรทัด (core ' + core.split('\n').length + ' + screens ' + screens.split('\n').length + ') · ' + flowNote);
