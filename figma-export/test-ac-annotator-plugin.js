#!/usr/bin/env node
/* ============================================================
   ทดสอบ ac-annotator-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   จำลอง Plugin API แบบบางๆ พอสำหรับฟังก์ชันที่ไฟล์นี้ใช้จริง:
   TEXT node (characters/fontName/fills/resize), setPluginData/getPluginData,
   appendChild/remove, loadFontAsync, createText

   รัน:  node figma-export/test-ac-annotator-plugin.js
   ============================================================ */
const path = require('path');
const assert = require('assert');

let uid = 0;
class Node {
  constructor(type, opts) {
    opts = opts || {};
    this.id = 'n' + ++uid;
    this.type = type;
    this.characters = opts.text || '';
    this.width = opts.w || 100;
    this.height = opts.h || 20;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.parent = null;
    this.children = [];
    this.fills = [];
    this.fontName = null;
    this.fontSize = null;
    this.textAutoResize = null;
    this._data = {};
  }
  appendChild(c) {
    if (c.parent) c.parent.children = c.parent.children.filter((x) => x !== c);
    c.parent = this;
    this.children.push(c);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this);
  }
  resize(w, h) {
    this.width = w;
    this.height = h;
  }
  setPluginData(k, v) {
    this._data[k] = v;
  }
  getPluginData(k) {
    return this._data[k] || '';
  }
}

function frame(name, opts) {
  const f = new Node('FRAME', opts);
  f.name = name;
  return f;
}

// --- mock global figma ---
const currentPage = frame('Page 1', {});
currentPage.selection = [];
global.figma = {
  loadFontAsync: async () => {},
  createText: () => new Node('TEXT', {}),
  currentPage,
};
global.module = module;

const code = require(path.join(__dirname, 'ac-annotator-plugin', 'code.js'));
const { ENTRIES, annotateNode, clearTags, TAG_KEY, lastSegment, frameCode, entryCode, mismatchWarning, findEntryForName } = code;

async function run() {
  // 1) ทุก entry ต้องมีข้อความไม่ว่าง และต้องมี toast + ข้อห้าม (เนื้อหาร่วมของหน้านั้น) อยู่ด้วยเสมอ
  const keys = Object.keys(ENTRIES);
  assert.ok(keys.length >= 55, 'ต้องมี AC entry อย่างน้อย 55 รายการ (ครอบ S1-S14 ทั้งหมด: กลุ่ม A ถึง O)');
  for (const k of keys) {
    const text = ENTRIES[k];
    assert.ok(/toast (บนหน้านี้|ของ)/.test(text), `entry "${k}" ต้องมีบล็อก toast ร่วมของหน้านั้น`);
    assert.ok(text.includes('ข้อห้าม'), `entry "${k}" ต้องมีบล็อกข้อห้ามร่วม`);
    assert.ok(text.includes('มุมมอง dev'), `entry "${k}" ต้องมีบล็อกมุมมอง dev (คำถาม+คำตอบล่วงหน้า)`);
    assert.ok(/ถาม: .+\nตอบ: /.test(text), `entry "${k}" ต้องมีคำถาม-คำตอบอย่างน้อย 1 คู่ตามรูปแบบ ถาม/ตอบ`);
  }
  assert.ok(ENTRIES['A.1 มีรายการ'].includes('การสร้างแผน overhaul สำเร็จ'), 'entry หน้ารายการแผน ต้องลอก toast ตรงตัว');
  assert.ok(ENTRIES['E.9 บันทึกสำเร็จ (toast 7)'].includes('การสร้าง purchase order สำเร็จ'), 'entry ฟอร์ม PO ต้องลอก toast ตรงตัว');
  assert.ok(ENTRIES['H.6 หน่วยงานปฏิเสธ (toast 16)'].includes('ปฏิเสธนัดหมาย'), 'entry นัดหมาย ต้องลอก toast ตรงตัว');
  assert.ok(ENTRIES['B.6 บันทึกสำเร็จ'].includes('สร้างแผน Overhaul {เลขแผน} สำเร็จ'), 'entry ฟอร์มสร้างแผน ต้องลอก toast ตรงตัว');
  assert.ok(ENTRIES['B.1 ฟอร์มสร้างแผน (ว่าง)'].includes('วงเงินอนุมัติ'), 'entry ฟอร์มสร้างแผน (ว่าง) ต้องพูดถึงช่องงบ — เคสที่เจ้าของงานเจอว่ายังไม่มีดึงมา');
  console.log('✓ ทุก AC entry (รวม B.*, E.* และ H.* ที่เพิ่มใหม่) มีข้อความ + มุมมอง dev (ถาม-ตอบ) + toast + ข้อห้ามร่วมของหน้าครบ');

  // 2) annotateNode ต้องวางป้ายทางขวาของ node ที่เลือก (x = abs.x + width + 40, y = abs.y) ไม่ใช่ใต้ node
  const target = frame('OH2 / A.4 · หน้ารายการแผน — ยังไม่มีแผน', { x: 100, y: 200, w: 1440, h: 1024 });
  const tag = await annotateNode(target, 'A.4 ยังไม่มีแผน');
  assert.strictEqual(tag.x, 100 + 1440 + 40, 'ป้ายต้องอยู่ทางขวาของเฟรม (กันซ้อนเฟรมที่เรียงกันแนวตั้ง)');
  assert.strictEqual(tag.y, 200, 'ป้ายต้องอยู่ระดับเดียวกับด้านบนของเฟรม');
  assert.strictEqual(tag.parent, currentPage, 'ป้ายต้องอยู่ที่ระดับ page');
  assert.ok(tag.characters.startsWith('AC: A.4 ยังไม่มีแผน'), 'ป้ายต้องขึ้นต้นด้วยชื่อ entry ที่เลือก');
  assert.ok(tag.characters.includes('ยังไม่มีแผน Overhaul'), 'ป้ายต้องมีข้อความจริงจาก AC (ข้อความ empty state)');
  assert.strictEqual(tag.textAutoResize, 'HEIGHT', 'ป้ายต้องตั้ง textAutoResize เป็น HEIGHT ให้ย่อหน้าตัดบรรทัดถูก');
  assert.strictEqual(tag.getPluginData(TAG_KEY), '1', 'ป้ายต้องมี TAG_KEY ไว้ให้ clearTags หาเจอ');
  console.log('✓ annotateNode วางป้ายทางขวาของเฟรม พร้อมเนื้อหา AC และ TAG_KEY ครบ');

  // 3) clearTags ต้องลบป้ายที่สร้างไว้ทั้งหมด โดยไม่แตะเฟรมเดิม
  assert.strictEqual(currentPage.children.length, 1, 'หน้าต้องมีป้าย 1 อันจากขั้นก่อนหน้า');
  const removed = clearTags(currentPage);
  assert.strictEqual(removed, 1, 'ต้องลบป้ายไป 1 อัน');
  assert.strictEqual(currentPage.children.length, 0, 'หน้าต้องว่างจากป้ายหลังล้าง');
  console.log('✓ clearTags ลบเฉพาะป้ายที่ปลั๊กอินสร้าง');

  // 4) lastSegment ต้องตัดเอาเฉพาะส่วนท้ายสุดหลัง em dash ตัวสุดท้าย ไม่ใช่ตัวแรก (กันชนกับ "ค้นหา" ที่ซ้ำทุกเฟรม)
  assert.strictEqual(lastSegment('OH2 / A.1 · หน้ารายการแผน — ค้นหา — รายการแผน'), 'รายการแผน');
  assert.strictEqual(lastSegment('OH2 / A.4 · หน้ารายการแผน — ค้นหา — ยังไม่มีแผน'), 'ยังไม่มีแผน');
  console.log('✓ lastSegment ตัดส่วนท้ายชื่อเฟรมถูกต้อง');

  // 5) frameCode/entryCode ต้องดึง "รหัสเฟรม" ได้ถูก ไม่ใช่ข้อความส่วนท้าย — กันชนกันระหว่างกลุ่ม
  //    (เช่น "กดบันทึกโดยยังไม่ครบ" มีทั้งใน B.2 ของฟอร์มสร้างแผนและ E.3 ของฟอร์ม PO ข้อความชนกันแต่รหัสไม่ชน)
  assert.strictEqual(frameCode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ'), 'B.2');
  assert.strictEqual(frameCode('OH2 / E.3 · S4 — กดบันทึกโดยยังไม่ครบ'), 'E.3');
  assert.strictEqual(entryCode('B.2 กดบันทึกโดยยังไม่ครบ'), 'B.2');
  console.log('✓ frameCode/entryCode จับรหัสเฟรมถูก ไม่ชนกันระหว่างกลุ่มที่มีข้อความสภาพซ้ำ');

  // 6) mismatchWarning ต้องเงียบ (null) เมื่อรหัสเฟรมตรงกับ entry และต้องเตือนเมื่อไม่ตรง — กันเคสที่เลือกเฟรมผิดกลุ่ม
  //    (เช่น เลือกเฟรมฟอร์ม PO แต่ dropdown ยังค้างค่าเริ่มต้น A.1 มีรายการ จากตัวอย่างจริงที่เจ้าของงานเจอ)
  assert.strictEqual(mismatchWarning('OH2 / A.1 · หน้ารายการแผน — ค้นหา — รายการแผน', 'A.1 มีรายการ'), null, 'รหัสตรง ต้องไม่เตือน');
  assert.strictEqual(
    mismatchWarning('OH2 / E.2 · S4 — ฟอร์ม PO (ว่าง)', 'A.1 มีรายการ'),
    'ชื่อเฟรม "OH2 / E.2 · S4 — ฟอร์ม PO (ว่าง)" มีรหัส "E.2" แต่ entry "A.1 มีรายการ" คาดว่าควรเป็นรหัส "A.1" — อาจเลือกผิด',
    'เลือกเฟรมฟอร์ม PO แต่ dropdown เป็น A.1 ต้องเตือน',
  );
  assert.strictEqual(mismatchWarning('เฟรมอะไรก็ได้', 'กำลังโหลด'), null, 'entry ที่ไม่มีรหัสให้เทียบ (ยังไม่มีเฟรมจริง) ต้องไม่เตือน');
  console.log('✓ mismatchWarning เตือนเฉพาะตอนรหัสเฟรมไม่ตรง entry ที่เลือกจริงๆ');

  // 7) ทางเข้า onmessage ต้องกันการแปะทันทีถ้าชื่อไม่ตรง (ส่ง type "mismatch" แทน) จนกว่าจะส่ง force:true มา
  const sentMessages = [];
  global.figma.showUI = () => {};
  global.figma.on = () => {};
  global.figma.ui = { postMessage: (m) => sentMessages.push(m) };
  global.__html__ = '';
  delete require.cache[path.join(__dirname, 'ac-annotator-plugin', 'code.js')];
  require(path.join(__dirname, 'ac-annotator-plugin', 'code.js'));
  const wrongFrame = frame('OH2 / E.2 · S4 — ฟอร์ม PO (ว่าง)', { x: 0, y: 0, w: 1440, h: 1038 });
  currentPage.selection = [wrongFrame];
  await global.figma.ui.onmessage({ type: 'annotate', key: 'A.1 มีรายการ' });
  const mismatchMsg = sentMessages.find((m) => m.type === 'mismatch');
  assert.ok(mismatchMsg, 'ต้องส่ง type mismatch กลับมา ไม่ใช่แปะเลย เมื่อชื่อเฟรมไม่ตรง entry');
  assert.strictEqual(currentPage.children.length, 0, 'ต้องไม่สร้างป้ายใดๆ จนกว่าจะยืนยัน');
  await global.figma.ui.onmessage({ type: 'annotate', key: 'A.1 มีรายการ', force: true });
  assert.strictEqual(currentPage.children.length, 1, 'กด force แล้วต้องแปะได้ แม้ชื่อเฟรมไม่ตรง');
  clearTags(currentPage);
  console.log('✓ onmessage บล็อกการแปะผิดเฟรมไว้ก่อน ต้องกด force ยืนยันเองถึงจะแปะ');

  // 8) findEntryForName ต้องหา entry ที่ตรงจากชื่อเฟรมเองได้ ไม่ต้องให้ผู้ใช้เลือกจาก dropdown
  assert.strictEqual(findEntryForName('OH2 / A.4 · หน้ารายการแผน — ค้นหา — ยังไม่มีแผน'), 'A.4 ยังไม่มีแผน');
  assert.strictEqual(findEntryForName('OH2 / E.2 · S4 — ฟอร์ม PO (ว่าง)'), 'E.2 ฟอร์ม PO (ว่าง)');
  assert.strictEqual(findEntryForName('OH2 / H.6 · S7 — หน่วยงานปฏิเสธ (toast 16)'), 'H.6 หน่วยงานปฏิเสธ (toast 16)');
  assert.strictEqual(findEntryForName('เฟรมที่ไม่มี AC ให้เลย'), null, 'ไม่มี entry ตรง ต้องคืน null ไม่ใช่เดาอันใกล้เคียง');
  console.log('✓ findEntryForName จับคู่ชื่อเฟรมกับ entry ที่ตรงได้เอง ไม่เจอก็คืน null ตรงๆ');

  // 9) ทางเข้า onmessage type "annotate-auto" ต้องแปะได้เลยจากชื่อเฟรม ไม่ต้องส่ง key มา — และรายงานเฟรมที่หาไม่เจอแยกไว้
  const okFrame = frame('OH2 / E.9 · S4 — บันทึกสำเร็จ (toast 7)', { x: 0, y: 0, w: 1440, h: 1853 });
  const unknownFrame = frame('เฟรมที่ไม่มี AC ให้เลย', { x: 2000, y: 0, w: 1440, h: 1024 });
  currentPage.selection = [okFrame, unknownFrame];
  sentMessages.length = 0;
  await global.figma.ui.onmessage({ type: 'annotate-auto' });
  assert.strictEqual(currentPage.children.length, 1, 'ต้องแปะเฉพาะเฟรมที่จับคู่ได้ (1 ใน 2) โดยไม่ต้องเลือก entry เอง');
  const autoResult = sentMessages.find((m) => m.type === 'result');
  assert.ok(autoResult.text.includes('1 เฟรม'), 'ต้องรายงานจำนวนเฟรมที่แปะสำเร็จ');
  assert.ok(autoResult.text.includes('เฟรมที่ไม่มี AC ให้เลย'), 'ต้องรายงานชื่อเฟรมที่หา AC ไม่เจอด้วย ไม่ใช่เงียบไปเลย');
  clearTags(currentPage);
  console.log('✓ onmessage "annotate-auto" แปะ AC จากชื่อเฟรมได้เองโดยไม่ต้องใช้ dropdown');

  console.log('\nPASS — ac-annotator-plugin/code.js ทำงานถูกต้องตามที่ทดสอบ');
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
