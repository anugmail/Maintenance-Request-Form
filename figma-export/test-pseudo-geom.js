#!/usr/bin/env node
/* เทสเรขาคณิตของ pseudo-element — รัน: node figma-export/test-pseudo-geom.js */
const { degFromMatrix } = require('./2-map.js');

let bad = 0;
const eq = (got, want, msg) => {
  const pass = Math.abs(got - want) < 0.01;
  console.log((pass ? '  ok  ' : '  FAIL') + ' ' + msg + ' (ได้ ' + got + ' คาด ' + want + ')');
  if (!pass) bad++;
};

// ค่าจริงที่ dom-walk.js เก็บมาจาก .wstep::before / ::after
eq(degFromMatrix('matrix(0.961262, -0.275637, 0.275637, 0.961262, 0, 0)'), -16, '::before = -16deg');
eq(degFromMatrix('matrix(0.961262, 0.275637, -0.275637, 0.961262, 0, 0)'), 16, '::after = +16deg');
eq(degFromMatrix('none'), 0, 'none = 0');
eq(degFromMatrix(''), 0, 'ว่าง = 0');
eq(degFromMatrix('matrix(1, 0, 0, 1, 0, 0)'), 0, 'identity = 0');

process.exitCode = bad ? 1 : 0;
console.log(bad ? '\nไม่ผ่าน ' + bad + ' ข้อ' : '\nผ่านทุกข้อ');
