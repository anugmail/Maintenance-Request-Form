#!/usr/bin/env node
/* ============================================================
   ประกอบ code.js ของปลั๊กอินสร้างจอ = plugin-lib/core.js + <ปลั๊กอิน>/screens.js
   ------------------------------------------------------------
   Figma โหลดปลั๊กอินจากไฟล์เดียว (ไม่มี require) จึงต้องต่อไฟล์กัน · แก้โค้ดที่ core.js / screens.js แล้วรันไฟล์นี้ใหม่ — ห้ามแก้ code.js ตรงๆ
   รัน:  node figma-export/build-plugin.js maintainance-plugin
   ============================================================ */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
if (!dir) { console.error('ใช้: node figma-export/build-plugin.js <โฟลเดอร์ปลั๊กอิน>'); process.exit(1); }
const core = fs.readFileSync(path.join(__dirname, 'plugin-lib', 'core.js'), 'utf8');
const screens = fs.readFileSync(path.join(__dirname, dir, 'screens.js'), 'utf8');
const out = '/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + ' + dir + '/screens.js ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js ' + dir + '  (' + new Date().toISOString().slice(0, 10) + ') */\n\n' +
  core + '\n/* ======================== ' + dir + '/screens.js ======================== */\n' + screens;
fs.writeFileSync(path.join(__dirname, dir, 'code.js'), out);
console.log(dir + '/code.js: ' + out.split('\n').length + ' บรรทัด (core ' + core.split('\n').length + ' + screens ' + screens.split('\n').length + ')');
