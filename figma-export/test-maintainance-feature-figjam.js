#!/usr/bin/env node
/* ทดสอบฝั่ง FigJam ของ maintainance-feature-plugin/code.js (17 พ.ย. 2569 ปลั๊กอินตัวเดียวใช้ได้ทั้งไฟล์ Figma และ FigJam)
   1) บอร์ดปลายทาง: เพิ่มจากลิงก์ · ตั้งบอร์ดที่เปิดอยู่ · เลือก · ลบ · เปิดลิงก์ · จำข้ามไฟล์ (clientStorage)
   2) เปิดในไฟล์ FigJam ได้หน้าต่างโหมด FigJam (fj-mode) ไม่รันโค้ดสร้างจอ
   3) วางบอร์ด: รันเทสของ figjam-plugin (test-figjam-plugin.js ของพี่นุ) โดยสลับให้โหลด code.js ของปลั๊กอินนี้แทน · SPEC=test-mf/… (สร้างจาก MODE=export-figjam)
   รัน:  node figma-export/test-maintainance-feature-figjam.js            (ข้อ 1–2)
         SPEC=test-mf/board-maintainance-feature-1.json node figma-export/test-maintainance-feature-figjam.js   (ข้อ 1–3) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const CODE = path.join(__dirname, 'maintainance-feature-plugin', 'code.js');
const code = fs.readFileSync(CODE, 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };
const store = new Map();   // clientStorage ใช้ร่วมทุกไฟล์ของปลั๊กอินเดียวกัน
function open(editorType, fileName, fileKey) {
  const msgs = []; let handler = null; const opened = [];
  const figma = {
    editorType, fileKey, root: { name: fileName, children: [] },
    showUI() {}, notify() {}, openExternal(u) { opened.push(u); },
    createSticky() {}, createShapeWithText() {}, createConnector() {}, createSection() {},
    clientStorage: { async getAsync(k) { return store.has(k) ? JSON.parse(store.get(k)) : undefined; }, async setAsync(k, v) { store.set(k, JSON.stringify(v)); } },
    ui: { postMessage: (m) => msgs.push(m), set onmessage(f) { handler = f; }, get onmessage() { return handler; } }
  };
  vm.runInNewContext(code, { figma, __html__: '', console, Set, Map, Promise, Object, Array, JSON, Math, Symbol, Error, setTimeout });
  return { figma, msgs, opened, send: (m) => handler(m), last: (t) => msgs.filter(x => x.type === t).pop() };
}
const tick = () => new Promise(r => setTimeout(r, 0));
(async () => {
  const fj = open('figjam', 'Maintain-D บอร์ดบำรุงรักษา', '');
  await tick();
  const mode = fj.last('fj-mode');
  ok(mode && mode.file === 'Maintain-D บอร์ดบำรุงรักษา', 'เปิดในไฟล์ FigJam ได้หน้าต่างโหมด FigJam พร้อมชื่อบอร์ด');
  ok(!fj.msgs.some(m => m.type === 'journeys'), 'ไฟล์ FigJam ไม่รันส่วนสร้างจอ');
  await fj.send({ type: 'fj-target-add', url: 'https://www.figma.com/board/AbC123xyz/Maintain-D-%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%94?node-id=0-1' });
  let t = fj.last('fj-targets');
  ok(t && t.list.length === 1 && t.sel === 0 && t.list[0].key === 'AbC123xyz' && t.list[0].name === 'Maintain D บอร์ด' && !/node-id/.test(t.list[0].url), 'เพิ่มบอร์ดจากลิงก์: ชื่อจากลิงก์ ' + (t && JSON.stringify(t.list[0])));
  await fj.send({ type: 'fj-target-here' });
  t = fj.last('fj-targets');
  ok(t.list.length === 2 && t.sel === 1 && t.list[1].name === 'Maintain-D บอร์ดบำรุงรักษา', 'ตั้งบอร์ดที่เปิดอยู่เป็นปลายทาง (ไม่มี fileKey ก็จำชื่อ)');
  await fj.send({ type: 'fj-target-here' });
  ok(fj.last('fj-targets').list.length === 2, 'ตั้งบอร์ดเดิมซ้ำไม่เพิ่มรายการซ้ำ');
  await fj.send({ type: 'fj-target-select', index: 0 });
  ok(fj.last('fj-targets').sel === 0, 'เลือกบอร์ดปลายทาง');
  const de2 = open('figma', 'Maintain-D', 'designKey');
  await tick(); await tick();
  const t2 = de2.last('fj-targets');
  ok(t2 && t2.list.length === 2 && t2.sel === 0, 'ไฟล์ Figma เห็นรายการบอร์ดเดียวกัน (จำข้ามไฟล์)');
  ok(de2.msgs.some(m => m.type === 'journeys') && !de2.msgs.some(m => m.type === 'fj-mode'), 'เปิดในไฟล์ Figma ได้หน้าต่างสร้างจอ');
  await de2.send({ type: 'open-url', url: t2.list[0].url });
  ok(de2.opened[0] === 'https://www.figma.com/board/AbC123xyz/Maintain-D-%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%94', 'ปุ่มเปิดบอร์ดปลายทางเปิดลิงก์ที่เลือก');
  await de2.send({ type: 'fj-target-del', index: 1 });
  ok(de2.last('fj-targets').list.length === 1, 'ลบบอร์ดออกจากรายการ');
  await de2.send({ type: 'fj-target-add', url: 'https://example.com/x' });
  ok(de2.last('fj-targets').list.length === 1 && de2.msgs.some(m => m.type === 'log' && /ไม่ใช่บอร์ด/.test(m.text)), 'ลิงก์ที่ไม่ใช่บอร์ด FigJam ไม่ถูกเพิ่ม');
  console.log(fails ? '✗ บอร์ดปลายทาง ผิด ' + fails + ' ข้อ' : 'บอร์ดปลายทาง ผ่านทุกข้อ');
  if (fails) process.exitCode = 1;
  /* วางบอร์ด: ใช้เทสของ figjam-plugin (ของพี่นุ) แต่ให้โหลด code.js ของปลั๊กอินนี้ */
  if (process.env.SPEC) {
    const rf = fs.readFileSync, want = path.join(__dirname, 'figjam-plugin', 'code.js');
    fs.readFileSync = function (p, enc) { return path.resolve(String(p)) === want ? rf.call(fs, CODE, enc) : rf.apply(fs, arguments); };
    console.log('— วางบอร์ด ' + process.env.SPEC + ' ด้วย code.js ของปลั๊กอินนี้ (เทสของ figjam-plugin)');
    require('./test-figjam-plugin.js');
  }
})();
