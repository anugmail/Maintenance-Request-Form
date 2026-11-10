#!/usr/bin/env node
/* ทดสอบ login-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL/SHOTS_DIR)
   รัน:  node figma-export/build-plugin.js login-plugin && node figma-export/test-login-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=1 DEVICES=desktop · SHOTS_DIR= ว่าง = ไม่มีภาพหน้าจริง (ต้องเตือน) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'login-plugin', 'code.js');
process.env.PREFIX = 'LG';
process.env.FIRST = process.env.FIRST || 'หน้าเข้าสู่ระบบ';
process.env.LOCAL = process.env.LOCAL || 'Device Type,Component 1';
if (process.env.SHOTS_DIR === undefined) process.env.SHOTS_DIR = path.join(__dirname, 'out', 'figjam', 'login');   // ภาพจริงก๊อปจาก ~/PEA/Maintain-D/vmsplus-login/ (นอกรีโป)
require('./test-overhaul2-plugin.js');
