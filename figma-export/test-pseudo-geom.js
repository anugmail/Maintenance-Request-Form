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

const { pseudoBox } = require('./2-map.js');

// host = .wstep ตัวจริง: กว้าง 255.59 สูง 68 · เส้นสูง 52% = 35.36
const host = { x: 129, y: 204, w: 255.59375, h: 68 };
const before = pseudoBox(host, {
  position: 'absolute', top: '0px', right: '0px', bottom: 'auto', left: 'auto',
  width: '1px', height: '35.3594px', transformOrigin: '0.5px 35.3594px'
});
eq(before.x, 254.59375, '::before ชิดขอบขวา');
eq(before.y, 0, '::before ชิดขอบบน');
eq(before.ox, 0.5, '::before จุดหมุน x = กึ่งกลาง');
eq(before.oy, 35.3594, '::before จุดหมุน y = ล่างสุด');

const after = pseudoBox(host, {
  position: 'absolute', top: 'auto', right: '0px', bottom: '0px', left: 'auto',
  width: '1px', height: '35.3594px', transformOrigin: '0.5px 0px'
});
eq(after.x, 254.59375, '::after ชิดขอบขวา');
eq(after.y, 32.6406, '::after ชิดขอบล่าง (68 - 35.3594)');
eq(after.oy, 0, '::after จุดหมุน y = บนสุด');

process.exitCode = bad ? 1 : 0;
console.log(bad ? '\nไม่ผ่าน ' + bad + ' ข้อ' : '\nผ่านทุกข้อ');
