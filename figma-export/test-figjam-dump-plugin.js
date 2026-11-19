#!/usr/bin/env node
/* ============================================================
   ทดสอบ figjam-dump-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   ตรวจ: list-pages, list-sections (ถอยไปใช้ top-level node เมื่อไม่มี SECTION),
   start เลือก section เดียวแล้ว trim ได้ข้อความจาก STICKY/SHAPE_WITH_TEXT/CONNECTOR
   และ "มีรูปแปะอยู่" ของ node ที่มี fill เป็น IMAGE (อ่านข้อความในรูปไม่ได้ตามจริง)

   รัน:  node figma-export/test-figjam-dump-plugin.js
   ============================================================ */
const assert = require('assert');
const path = require('path');

const messages = [];
let onmessageHandler;

function node(type, opts) {
  opts = opts || {};
  return Object.assign(
    { id: opts.id || 'n' + Math.random().toString(36).slice(2), name: opts.name || type, type, children: opts.children || [] },
    opts,
  );
}

// section ตัวอย่าง: sticky (ข้อความตรง) + shape-with-text (ข้อความ) + connector (เชื่อม 2 ตัวแรก) + รูปสกรีนช็อต (ไม่มีข้อความ อ่านได้แค่ hasImage)
const sticky = node('STICKY', { id: 's1', text: { characters: 'ขั้น 1: สร้างแผน' } });
const shape = node('SHAPE_WITH_TEXT', { id: 's2', text: { characters: 'ขั้น 2: ออกเลขงาน' } });
const connector = node('CONNECTOR', {
  id: 'c1',
  connectorStart: { endpointNodeId: 's1' },
  connectorEnd: { endpointNodeId: 's2' },
});
const screenshot = node('SECTION', {
  id: 'img1',
  name: 'สกรีนช็อตหน้าแจ้งซ่อม',
  fills: [{ type: 'IMAGE' }],
});
const flowSection = node('SECTION', { id: 'sec1', name: 'โฟลว์สร้างแผน', children: [sticky, shape, connector] });
const otherSection = node('SECTION', { id: 'sec2', name: 'โฟลว์อื่น', children: [] });

const page = {
  id: '0:1',
  name: 'Page 1',
  loadAsync: async () => {},
  children: [flowSection, otherSection, screenshot],
};

global.figma = {
  root: { name: 'Test FigJam', children: [page] },
  loadAllPagesAsync: async () => {},
  showUI: () => {},
  ui: {
    postMessage: (m) => messages.push(m),
    set onmessage(fn) { onmessageHandler = fn; },
    get onmessage() { return onmessageHandler; },
  },
};
global.__html__ = '';

require(path.join(__dirname, 'figjam-dump-plugin', 'code.js'));

async function run() {
  // 1) list-pages
  messages.length = 0;
  await onmessageHandler({ type: 'list-pages' });
  const pagesMsg = messages.find((m) => m.type === 'pages');
  assert.deepStrictEqual(pagesMsg.pages, [{ id: '0:1', name: 'Page 1' }]);
  console.log('✓ list-pages ส่งรายชื่อหน้าถูก');

  // 2) list-sections เจอทั้ง 3 (flowSection, otherSection, screenshot เป็น SECTION ทั้งหมดในเทสนี้)
  messages.length = 0;
  await onmessageHandler({ type: 'list-sections', pageId: '0:1' });
  const secMsg = messages.find((m) => m.type === 'sections');
  assert.strictEqual(secMsg.sections.length, 3, 'ต้องเจอ 3 section (เพราะทั้งหมดเป็น type SECTION)');
  assert.deepStrictEqual(secMsg.sections.map((s) => s.name).sort(), ['สกรีนช็อตหน้าแจ้งซ่อม', 'โฟลว์สร้างแผน', 'โฟลว์อื่น'].sort());
  console.log('✓ list-sections เจอ section ครบตามที่มีในหน้า');

  // 3) start ไม่เลือก section เลย ต้อง error ชัดเจน
  messages.length = 0;
  await onmessageHandler({ type: 'start', pageId: '0:1', sectionIds: [] });
  assert.ok(messages.some((m) => m.type === 'error' && /ยังไม่ได้เลือก/.test(m.message)));
  assert.ok(messages.some((m) => m.type === 'done'));
  console.log('✓ start โดยไม่เลือก section ได้ error ที่อ่านเข้าใจ');

  // 4) start เลือก "โฟลว์สร้างแผน" อย่างเดียว — ต้อง trim ได้ข้อความจาก sticky/shape/connector ครบ ไม่ลาก section อื่นมา
  messages.length = 0;
  await onmessageHandler({ type: 'start', pageId: '0:1', sectionIds: ['sec1'] });
  const total = messages.find((m) => m.type === 'total');
  assert.strictEqual(total.total, 1);
  const secData = messages.find((m) => m.type === 'section').data;
  assert.strictEqual(secData.section, 'โฟลว์สร้างแผน');
  const kids = secData.root.kids;
  const kidTexts = kids.filter((k) => k.text).map((k) => k.text);
  assert.deepStrictEqual(kidTexts.sort(), ['ขั้น 1: สร้างแผน', 'ขั้น 2: ออกเลขงาน'].sort(), 'ต้องอ่านข้อความจาก STICKY และ SHAPE_WITH_TEXT ได้ทั้งคู่');
  const conn = kids.find((k) => k.type === 'CONNECTOR');
  assert.strictEqual(conn.from, 's1');
  assert.strictEqual(conn.to, 's2');
  console.log('✓ trim() อ่านข้อความจาก STICKY/SHAPE_WITH_TEXT และปลายทาง CONNECTOR ได้ถูกต้อง');

  // 5) start เลือก "สกรีนช็อตหน้าแจ้งซ่อม" — ต้องได้ hasImage:true และไม่มี .text (อ่านข้อความในรูปไม่ได้ตามที่เตือนไว้)
  messages.length = 0;
  await onmessageHandler({ type: 'start', pageId: '0:1', sectionIds: ['img1'] });
  const imgData = messages.find((m) => m.type === 'section').data;
  assert.strictEqual(imgData.root.hasImage, true);
  assert.strictEqual(imgData.root.text, undefined, 'รูปสกรีนช็อตต้องไม่มีข้อความให้อ่าน (ตามที่เตือนในคอมเมนต์หัวไฟล์)');
  console.log('✓ section ที่เป็นรูปสกรีนช็อต ได้แค่ hasImage ไม่ได้ข้อความในรูป (ตรงกับคำเตือนที่ให้ผู้ใช้)');

  console.log('\nPASS — figjam-dump-plugin/code.js ทำงานถูกต้องตามที่ทดสอบ');
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
