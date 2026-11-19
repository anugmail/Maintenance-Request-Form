#!/usr/bin/env node
/* ============================================================
   ทดสอบ dump-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   ตรวจเฉพาะตรรกะ "เลือกหน้าเป็นรายตัว" ที่เพิ่ม 22 ต.ค. 2569
   (list-pages ไม่ dump เนื้อหา, start ไม่เลือกหน้า = error ชัด, เลือกหน้าเดียวแล้ว dump แค่หน้านั้น)
   ไม่ครอบคลุม trim()/การยิง fetch จริงไปที่ serve.js — ส่วนนั้นต้องเทสในแอป Figma จริง

   รัน:  node figma-export/test-dump-plugin.js
   ============================================================ */
const assert = require('assert');
const path = require('path');

const messages = [];
let onmessageHandler;

function makePage(id, name, kidCount) {
  return {
    id,
    name,
    loadAsync: async () => {},
    children: Array.from({ length: kidCount || 1 }, (_, i) => ({ name: 'kid' + i, type: 'FRAME', children: [] })),
  };
}

global.figma = {
  root: { name: 'Test File', children: [makePage('0:1', 'Overhaul'), makePage('0:2', 'Component Library')] },
  loadAllPagesAsync: async () => {},
  showUI: () => {},
  ui: {
    postMessage: (m) => messages.push(m),
    set onmessage(fn) {
      onmessageHandler = fn;
    },
    get onmessage() {
      return onmessageHandler;
    },
  },
};
global.__html__ = '';

require(path.join(__dirname, 'dump-plugin', 'code.js'));

async function run() {
  // 1) list-pages ต้องส่งรายชื่อหน้าทั้งหมดกลับมา โดยไม่เริ่ม dump เนื้อหาใดๆ
  messages.length = 0;
  await onmessageHandler({ type: 'list-pages' });
  const pagesMsg = messages.find((m) => m.type === 'pages');
  assert.ok(pagesMsg, 'ต้องมี message type=pages');
  assert.deepStrictEqual(pagesMsg.pages.map((p) => p.name), ['Overhaul', 'Component Library']);
  assert.ok(!messages.some((m) => m.type === 'page'), 'list-pages ต้องไม่ dump เนื้อหาเลย');
  console.log('✓ list-pages ส่งชื่อหน้าครบ ไม่แตะเนื้อหา');

  // 2) start โดยไม่ติ๊กหน้าไหนเลย ต้องได้ error ที่อ่านเข้าใจ ไม่ throw และต้องส่ง done ปิดสถานะ UI ด้วย
  messages.length = 0;
  await onmessageHandler({ type: 'start', pageIds: [] });
  assert.ok(messages.some((m) => m.type === 'error' && /ยังไม่ได้เลือกหน้า/.test(m.message)));
  assert.ok(messages.some((m) => m.type === 'done'));
  assert.ok(!messages.some((m) => m.type === 'page'));
  console.log('✓ start โดยไม่เลือกหน้า ได้ error ที่อ่านเข้าใจ + ไม่ dump อะไร');

  // 3) start เลือกหน้าเดียว ต้อง dump แค่หน้านั้น ไม่ลาก "Component Library" มาด้วย (คือจุดที่ทำให้ช้าเกินไปเดิม)
  messages.length = 0;
  await onmessageHandler({ type: 'start', pageIds: ['0:1'] });
  const total = messages.find((m) => m.type === 'total');
  assert.strictEqual(total.total, 1, 'ต้อง dump แค่ 1 หน้าตามที่เลือก ไม่ใช่ทั้งไฟล์');
  const pageMsgs = messages.filter((m) => m.type === 'page');
  assert.strictEqual(pageMsgs.length, 1);
  assert.strictEqual(pageMsgs[0].name, 'Overhaul');
  assert.strictEqual(pageMsgs[0].id, '0-1', 'id ต้องถูกแปลง : เป็น - สำหรับชื่อไฟล์');
  console.log('✓ เลือกหน้าเดียวแล้ว dump แค่หน้านั้นจริง ไม่ลากหน้าอื่นมาด้วย');

  console.log('\nPASS — dump-plugin/code.js เลือกหน้าได้ถูกต้องตามที่ทดสอบ');
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
