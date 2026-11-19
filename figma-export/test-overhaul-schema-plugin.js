#!/usr/bin/env node
/* ============================================================
   ทดสอบ overhaul-schema-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   จำลอง Plugin API แบบบางๆ พอสำหรับฟังก์ชันที่ไฟล์นี้ใช้จริง:
   TEXT node (characters/fontName/fills), setPluginData/getPluginData,
   appendChild/remove, loadFontAsync, createText

   รัน:  node figma-export/test-overhaul-schema-plugin.js
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
  setPluginData(k, v) {
    this._data[k] = v;
  }
  getPluginData(k) {
    return this._data[k] || '';
  }
}

function frame(name, kids) {
  const f = new Node('FRAME', {});
  f.name = name;
  (kids || []).forEach((k) => f.appendChild(k));
  return f;
}
function text(characters, opts) {
  return new Node('TEXT', Object.assign({ text: characters }, opts));
}

// --- mock global figma (ไม่มี figma.showUI เพื่อข้าม top-level ui.onmessage block) ---
const currentPage = frame('Page 1', []);
currentPage.selection = [];
global.figma = {
  loadFontAsync: async () => {},
  createText: () => new Node('TEXT', {}),
  createFrame: () => new Node('FRAME', {}),
  currentPage,
};
global.module = module;

const code = require(path.join(__dirname, 'overhaul-schema-plugin', 'code.js'));
const {
  SCHEMA, AC_FLOWS, normalize, findHeaderTexts, tagMatch, clearTags, debugListTexts,
  buildRuleTable, buildFlowSection, buildPermissionSection, buildBaSection, buildDevFaqSection,
  buildAcDraft, buildAcDraftForFlow, writeAcNode, writeAllAcDrafts,
} = code;

async function run() {
  // 1) สร้างตารางปลอม: header 3 ตัว ตรง key ใน SCHEMA ("ชื่อแผน","งบประมาณ (บาท)","หน่วยงาน") + 1 ตัวที่ไม่ตรง ("คอลัมน์แปลกปลอม")
  const h1 = text('ชื่อแผน', { x: 0, y: 0, w: 120, h: 18 });
  const h2 = text('งบประมาณ (บาท)', { x: 130, y: 0, w: 120, h: 18 });
  const h3 = text('หน่วยงาน', { x: 260, y: 0, w: 120, h: 18 }); // RESOLVED ใน SCHEMA (อัปเดต 22 ต.ค. 2569 — เคยเป็น GAP เข้าใจผิด ตรวจซ้ำแล้วไม่ใช่ gap จริง)
  const h4 = text('คอลัมน์แปลกปลอม', { x: 390, y: 0, w: 120, h: 18 }); // ไม่อยู่ใน SCHEMA เลย
  const table = frame('Table', [frame('Header row', [h1, h2, h3, h4])]);

  // 2) findHeaderTexts ต้องเจอ 3 รายการ ไม่ใช่ 4
  const matches = findHeaderTexts(table);
  assert.strictEqual(matches.length, 3, 'ต้องจับคู่ได้ 3 header ไม่รวม "คอลัมน์แปลกปลอม"');
  assert.deepStrictEqual(
    matches.map((m) => m.key).sort(),
    ['งบประมาณ (บาท)', 'ชื่อแผน', 'หน่วยงาน'].sort(),
  );
  console.log('✓ findHeaderTexts จับคู่ header ที่รู้จักครบ ไม่หลุดตัวที่ไม่รู้จัก');

  // 3) ป้ายที่สร้างต้องมี label ตรงกับ SCHEMA (DB/DB/GAP) และสีคนละสีกันตาม label
  const tags = [];
  for (const m of matches) tags.push(await tagMatch(m));
  const byHeader = Object.fromEntries(matches.map((m, i) => [m.key, { match: m, tag: tags[i] }]));
  assert.strictEqual(byHeader['ชื่อแผน'].match.info.label, 'DB');
  assert.strictEqual(byHeader['งบประมาณ (บาท)'].match.info.label, 'DB');
  assert.strictEqual(byHeader['หน่วยงาน'].match.info.label, 'RESOLVED');
  console.log('✓ label ของแต่ละ header ตรงกับ SCHEMA (DB/DB/RESOLVED)');

  // 4) ป้ายต้องถูก append ที่ระดับ page เสมอ (กัน instance-lock ของ header cell จริง) ไม่ใช่ลูกของ header
  const headerRow = table.children[0];
  assert.strictEqual(headerRow.children.length, 4, 'header เดิม 4 ตัวต้องไม่ถูกแก้ไข (ป้ายไม่ไปแตะ header row)');
  assert.strictEqual(currentPage.children.length, 3, 'ป้ายทั้ง 3 ต้องถูก appendChild เข้า figma.currentPage');
  for (const key of Object.keys(byHeader)) {
    const { match, tag } = byHeader[key];
    assert.strictEqual(tag.parent, currentPage, `ป้ายของ "${key}" ต้องอยู่ที่ระดับ page ไม่ใช่ลูกของ header instance`);
    assert.strictEqual(tag.y, match.node.y + match.node.height + 2, 'ป้ายต้องวางตำแหน่งอิงพิกัดของ header (ตกกรณี absoluteTransform ไม่มีใน mock)');
    assert.strictEqual(tag.getPluginData('mtd-schema-tag'), '1', 'ป้ายต้องมี TAG_KEY ไว้ให้ clearTags หาเจอ');
    assert.ok(match.node.getPluginData('mtd-schema'), 'header node ต้นทางต้องมี mtd-schema ติดไว้ด้วย');
  }
  console.log('✓ ป้ายวางที่ระดับ page (กัน instance-lock) และ setPluginData ครบทั้งป้ายและ header ต้นทาง');

  // 5) clearTags(figma.currentPage) ต้องลบป้ายทั้ง 3 ออก โดยไม่แตะ header เดิมหรือ "คอลัมน์แปลกปลอม"
  const removed = clearTags(currentPage);
  assert.strictEqual(removed, 3, 'ต้องลบป้ายไป 3 อัน');
  assert.strictEqual(currentPage.children.length, 0, 'หน้าต้องว่างจากป้ายหลังล้าง');
  assert.strictEqual(headerRow.children.length, 4, 'เหลือ header เดิม 4 ตัว ไม่โดนลบ');
  assert.ok(headerRow.children.includes(h4), '"คอลัมน์แปลกปลอม" ต้องไม่ถูกแตะ');
  console.log('✓ clearTags ลบเฉพาะป้ายที่ปลั๊กอินสร้าง ไม่กระทบ header เดิม');

  // 6) normalize ต้องตัดช่องว่างซ้ำ/หัวท้าย ก่อนเทียบกับ SCHEMA
  assert.strictEqual(normalize('  ชื่อแผน   '), 'ชื่อแผน');
  assert.ok(SCHEMA[normalize('  งบประมาณ (บาท)  ')]);
  console.log('✓ normalize() ทำให้จับคู่ได้แม้มีช่องว่างเกินมา');

  // 7) debugListTexts ต้องคัดข้อความ noise (Button/Badge/ตัวเลขล้วน ฯลฯ) ออก และติดป้าย ✓/✗ ตรงกับ SCHEMA จริง
  const debugNode = frame('Debug', [
    text('ชื่อแผน', {}),
    text('คอลัมน์แปลกปลอม', {}),
    text('Button', {}),
    text('123,456', {}),
    text('(ถ้ามี)', {}),
  ]);
  const dbgLines = debugListTexts(debugNode);
  assert.ok(dbgLines.some((l) => l.startsWith('✓ ชื่อแผน')), 'ต้องติ๊ก ✓ ให้ข้อความที่ตรง SCHEMA');
  assert.ok(dbgLines.some((l) => l.startsWith('✗ คอลัมน์แปลกปลอม')), 'ต้องติ๊ก ✗ ให้ข้อความที่ไม่ตรง SCHEMA');
  assert.ok(!dbgLines.some((l) => l.includes('Button') || l.includes('123,456') || l.includes('(ถ้ามี)')), 'ต้องกรอง noise (Button/ตัวเลข/placeholder) ออกไม่ให้รก');
  console.log('✓ debugListTexts กรอง noise ออก และติดป้าย ✓/✗ ตรงกับ SCHEMA');

  // 8) ทางเข้า onmessage "annotate" ต้องไม่หยุดทั้ง loop เงียบๆ ถ้าจุดใดจุดหนึ่ง throw ระหว่างแปะ
  //    (เจอจริง 22 ต.ค. 2569 — debug เจอ ✓ หลายจุด แต่กด "แปะ schema" แล้วขึ้นจุดเดียว สงสัยว่า throw กลางทาง)
  const sentMessages = [];
  global.figma.showUI = () => {};
  global.figma.ui = { postMessage: (m) => sentMessages.push(m) };
  global.__html__ = '';
  const h1b = text('ชื่อแผน', { x: 0, y: 0, w: 120, h: 18 });
  const h2b = text('งบประมาณ (บาท)', { x: 130, y: 0, w: 120, h: 18 });
  h2b.setPluginData = () => { throw new Error('จำลอง node ที่ setPluginData ไม่ได้'); };
  const h3b = text('หน่วยงาน', { x: 260, y: 0, w: 120, h: 18 });
  currentPage.selection = [frame('Table2', [frame('Header row 2', [h1b, h2b, h3b])])];
  delete require.cache[path.join(__dirname, 'overhaul-schema-plugin', 'code.js')];
  require(path.join(__dirname, 'overhaul-schema-plugin', 'code.js'));
  await global.figma.ui.onmessage({ type: 'annotate' });
  const batchResult = sentMessages.find((m) => m.type === 'result');
  assert.ok(batchResult, 'ต้องส่ง result กลับมาเสมอ แม้มีจุดที่แปะพัง');
  assert.ok(batchResult.text.includes('แปะ schema แล้ว 2 จุด'), 'ต้องแปะจุดที่ไม่พังได้ครบ (2 ใน 3) ไม่ใช่หยุดตั้งแต่จุดแรกที่พัง');
  assert.ok(batchResult.text.includes('แปะไม่ได้ 1 จุด'), 'ต้องรายงานจุดที่พังแยกไว้ ไม่ใช่เงียบหาย');
  console.log('✓ onmessage "annotate" แปะต่อได้แม้มีจุดพังกลางทาง และรายงานจุดที่พังแยกไว้');

  // 9) buildRuleTable: เอาเฉพาะ field ที่มี info.rule สั้นๆ จริง (ไม่ dump info.note ทั้งก้อนเข้าไปในตาราง)
  //    field ธรรมดาที่ไม่มี rule (เช่น "ชื่อแผน" — DB แค่โชว์ค่า) ต้องถูกข้าม ไม่ใช่ขึ้นมาเกะกะ
  const ruleMatches = [
    { key: 'ผู้ประสานงาน (กบค.)', info: SCHEMA['ผู้ประสานงาน (กบค.)'] }, // DB แต่มี rule สั้น → ต้องขึ้น
    { key: 'ชั่วโมงสะสม', info: SCHEMA['ชั่วโมงสะสม'] }, // GAP มี rule สั้น → ต้องขึ้น
    { key: 'ชื่อแผน', info: SCHEMA['ชื่อแผน'] }, // DB ไม่มี rule เลย → ต้องถูกข้าม
  ];
  const ruleTable = buildRuleTable(ruleMatches);
  assert.ok(ruleTable.includes('1. ผู้ประสานงาน (กบค.)') && ruleTable.includes('search-select'), 'field ที่มี rule สั้นต้องขึ้น rule นั้นตรงๆ ไม่ใช่ note ยาว');
  assert.ok(ruleTable.includes('ชั่วโมงสะสม') && ruleTable.includes('ต้องเคาะก่อน'), 'field ที่เป็น GAP ต้องขึ้น rule สั้นของ GAP นั้น');
  assert.ok(!ruleTable.includes('3. ชื่อแผน'), 'field ธรรมดาไม่มี rule ("ชื่อแผน") ต้องไม่ขึ้นเป็นแถวที่ 3');
  assert.ok(ruleTable.includes('ข้าม 1 field') && ruleTable.includes('ชื่อแผน'), 'field ที่ถูกข้ามต้องแจ้งไว้ท้ายลิสต์ ไม่ใช่หายไปเงียบๆ');
  console.log('✓ buildRuleTable เอาเฉพาะ field ที่มี rule สั้นจริง และแจ้ง field ที่ข้ามไว้ท้ายลิสต์ ไม่หายไปเงียบๆ');

  // 9b) buildRuleTable ต้องรวมแถวที่ชี้ table.column เดียวกันเป๊ะเป็นแถวเดียว (เจอจริง 26 ต.ค. 2569 —
  //     "หมายเลขแผน"/"เลขแผน"/"เลขที่แผน" ทั้ง 3 key ชี้ plan_no เดียวกัน เคยขึ้นซ้ำ 3 แถวเนื้อหาเป๊ะ
  //     อ่านแล้วไม่ใช่ AC มือโปร) แต่ห้ามรวมถ้า rule ต่างกันแม้ table.column จะเหมือนกัน
  const aliasMatches = [
    { key: 'หมายเลขแผน', info: SCHEMA['หมายเลขแผน'] },
    { key: 'เลขแผน', info: SCHEMA['เลขแผน'] },
    { key: 'เลขที่แผน', info: SCHEMA['เลขที่แผน'] },
  ];
  const aliasTable = buildRuleTable(aliasMatches);
  assert.ok(
    aliasTable.includes('1. หมายเลขแผน / เลขแผน / เลขที่แผน'),
    'สามคีย์ที่ชี้ plan_no เดียวกันเป๊ะต้องรวมเป็นแถวเดียว คั่นด้วย " / "',
  );
  assert.strictEqual((aliasTable.match(/vms_trn_overhaul_job\.plan_no/g) || []).length, 1, 'ต้องมีแถวอ้างอิง plan_no แค่แถวเดียว ไม่ซ้ำ 3 รอบ');

  // ยืนยันด้วยคู่สังเคราะห์ (ไม่พึ่ง SCHEMA จริงที่อาจแก้ rule ให้ตรงกันในอนาคตจนเทสนี้ไม่มีความหมาย)
  // ว่าแถวที่ table.column เหมือนกันแต่ rule ต่างกันจริงๆ ต้อง "ไม่" ถูกรวม กันพลาดเนื้อหาคนละเรื่องมาปนกัน
  const syntheticMatches = [
    { key: 'ฟิลด์ A', info: { label: 'DB', table: 'x', column: 'y', rule: 'กฎข้อที่ 1' } },
    { key: 'ฟิลด์ B', info: { label: 'DB', table: 'x', column: 'y', rule: 'กฎข้อที่ 2 (คนละเรื่องกัน)' } },
  ];
  const syntheticTable = buildRuleTable(syntheticMatches);
  assert.ok(!syntheticTable.includes('ฟิลด์ A / ฟิลด์ B'), 'table.column เหมือนกันแต่ rule ต่างกันจริง ต้องไม่ถูกรวมแถว');
  assert.ok(syntheticTable.includes('1. ฟิลด์ A') && syntheticTable.includes('2. ฟิลด์ B'), 'ต้องขึ้นเป็น 2 แถวแยกกัน คนละ rule');
  console.log('✓ buildRuleTable รวมแถวที่ table.column + rule เหมือนกันเป๊ะเป็นแถวเดียว ไม่รวมถ้า rule ต่างกัน');

  // 10) buildFlowSection: ต้องมีเฉพาะ flow ที่เก็บไว้จริง (scenario7) ไม่เดา flow ที่ไม่มี
  const flowText = buildFlowSection('scenario7');
  assert.ok(flowText.includes('FLOW — Scenario 7'), 'ต้องมีหัวข้อ Flow');
  assert.ok(flowText.includes('หน่วยงานกด "ตอบรับ"') && flowText.includes('หน่วยงานกด "ปฏิเสธ"'), 'ต้องมีทั้ง 2 สายของการแตกสาย (ตอบรับ/ปฏิเสธ)');
  assert.strictEqual(buildFlowSection('scenario-ที่ไม่มีจริง'), '', 'flow ที่ไม่ได้เก็บไว้ ต้องได้ค่าว่าง ไม่ใช่เดาให้');
  console.log('✓ buildFlowSection คืนเฉพาะ flow ที่เก็บไว้จริง ไม่เดา flow ที่ไม่รู้จัก');

  // 10.4) regression guard: ทุก scenario ใน AC_FLOWS ต้องมีทั้ง permissions และ steps เสมอ อย่างน้อย 1 รายการ
  //       (permissions ของ scenario7 เคยหายไปรอบหนึ่งแล้วตอนมีคนเพิ่ม scenario ใหม่โดยลืมใส่ — กันไม่ให้เกิดซ้ำ
  //       กับ scenario ที่เพิ่งเพิ่มเข้ามา 22 ต.ค. 2569: plan13/po46/scenario8/scenario911/scenario12/scenario13/scenario14)
  const flowKeys = Object.keys(AC_FLOWS);
  assert.ok(flowKeys.length >= 8, `ต้องมีอย่างน้อย 8 scenario ใน AC_FLOWS (plan13, po46, scenario7-14 ที่รวมกลุ่มแล้ว) เจอ ${flowKeys.length}`);
  for (const k of flowKeys) {
    const f = AC_FLOWS[k];
    assert.ok(Array.isArray(f.permissions) && f.permissions.length >= 1, `AC_FLOWS.${k} ต้องมี permissions อย่างน้อย 1 role`);
    assert.ok(Array.isArray(f.steps) && f.steps.length >= 1, `AC_FLOWS.${k} ต้องมี steps อย่างน้อย 1 ขั้น`);
    for (const p of f.permissions) {
      assert.ok(p.role && p.can, `ทุก permission ของ AC_FLOWS.${k} ต้องมีทั้ง role และ can`);
    }
    // 22 ต.ค. 2569 รอบ 2: มุม BA (feature/value/roles/ac) หายไปทั้งก้อนตอนทำ AC_FLOWS ครั้งแรก
    // เพิ่ง porting กลับมาจาก 22-recap-...md — กันไว้แบบเดียวกับ permissions ไม่ให้หายอีกรอบตอนมีคนเพิ่ม scenario ใหม่
    assert.ok(f.ba && f.ba.feature && f.ba.value && f.ba.roles, `AC_FLOWS.${k} ต้องมี ba.feature/value/roles ครบ`);
    assert.ok(Array.isArray(f.ba.ac) && f.ba.ac.length >= 1, `AC_FLOWS.${k} ต้องมี ba.ac อย่างน้อย 1 ข้อ`);
    assert.ok(Array.isArray(f.devFaq), `AC_FLOWS.${k} ต้องมี devFaq เป็น array เสมอ (ว่างได้ แต่ต้องเป็น array ไม่ใช่ undefined)`);
    for (const faq of f.devFaq) {
      assert.ok(faq.q && faq.a, `ทุกคำถามของ AC_FLOWS.${k}.devFaq ต้องมีทั้ง q และ a`);
    }
  }
  console.log(`✓ ทุก scenario ใน AC_FLOWS (${flowKeys.length} ตัว) มีทั้ง permissions, steps, มุม BA ครบ ไม่มีตัวไหนหายไปเงียบๆ`);

  // 10.5) buildPermissionSection: คนละมิติจาก field rule — ต้องมีครบทุก role ที่เก็บไว้ ไม่ใช่แค่ role เดียว
  //       (เคยหายไปตอนย้ายมาเป็น AC_FLOWS รอบแรก ผู้ใช้ทักว่า "ใครดูได้ ทำอะไรได้" ไม่เห็นใน AC ที่เขียนลงหน้า)
  const permText = buildPermissionSection('scenario7');
  assert.ok(permText.includes('สิทธิ์การเข้าถึง — Scenario 7'), 'ต้องมีหัวข้อสิทธิ์');
  assert.ok(permText.includes('กบค.:') && permText.includes('หน่วยงานเจ้าของรถ:') && permText.includes('กรย. เขตนั้นๆ:'), 'ต้องมีครบทั้ง 3 role ไม่ใช่แค่บางตัว');
  assert.strictEqual(buildPermissionSection('scenario-ที่ไม่มีจริง'), '', 'flow ที่ไม่มี permissions เก็บไว้ ต้องได้ค่าว่าง ไม่ใช่เดาให้');
  console.log('✓ buildPermissionSection คืนสิทธิ์ครบทุก role ที่เก็บไว้ แยกจาก field rule');

  // 10.6) buildBaSection: มุม BA (ฟีเจอร์/คุณค่า/ใครใช้/AC ภาษาธุรกิจ) — คนละมิติจาก field rule และ permission
  //       ของ dev สิ้นเชิง (เคยหายไปทั้งก้อนตอนทำ AC_FLOWS รอบแรก ผู้ใช้ทักว่า "ไม่ค่อยเป็น AC ของ BA")
  const baText = buildBaSection('scenario7');
  assert.ok(baText.includes('มุม BA — Scenario 7'), 'ต้องมีหัวข้อมุม BA');
  assert.ok(baText.includes('ฟีเจอร์:') && baText.includes('คุณค่าทางธุรกิจ:') && baText.includes('ใครใช้:'), 'ต้องมีทั้ง 3 หัวข้อย่อยของ BA');
  assert.ok(baText.includes('Acceptance criteria (ภาษาธุรกิจ):') && baText.includes('\n- '), 'ต้องมีลิสต์ AC ภาษาธุรกิจต่อท้าย เป็น bullet "- "');
  assert.strictEqual(buildBaSection('scenario-ที่ไม่มีจริง'), '', 'flow ที่ไม่มี ba เก็บไว้ ต้องได้ค่าว่าง ไม่ใช่เดาให้');
  console.log('✓ buildBaSection คืนมุม BA ครบ (ฟีเจอร์/คุณค่า/ใครใช้/AC ภาษาธุรกิจ) แยกจากมุม dev');

  // 10.7) buildDevFaqSection: คำถามที่ dev จะถาม ตอบไว้ล่วงหน้าเป็นคู่ Q/A — ต้องมีครบทุกคู่ที่เก็บไว้
  const faqText = buildDevFaqSection('scenario7');
  assert.ok(faqText.includes('คำถามที่ dev จะถาม — Scenario 7'), 'ต้องมีหัวข้อคำถามที่ dev จะถาม');
  assert.ok(faqText.includes('Q1:') && faqText.includes('A:') && faqText.includes('Q2:'), 'ต้องมีครบทุกคู่ Q/A ที่เก็บไว้ (scenario7 มี 2 คู่)');
  assert.strictEqual(buildDevFaqSection('scenario-ที่ไม่มีจริง'), '', 'flow ที่ไม่มี devFaq เก็บไว้ ต้องได้ค่าว่าง ไม่ใช่เดาให้');
  console.log('✓ buildDevFaqSection คืนคำถาม-คำตอบครบทุกคู่ที่เก็บไว้');

  // 11) buildAcDraft: ต้อง dedup field ที่ซ้ำ (เช่น header เดิมปรากฏ 2 ครั้งในตารางเดียวกัน) และรวม Rule list + Flow เป็นก้อนเดียว
  const dupMatches = [
    { key: 'ผู้ประสานงาน (กบค.)', info: SCHEMA['ผู้ประสานงาน (กบค.)'] },
    { key: 'ผู้ประสานงาน (กบค.)', info: SCHEMA['ผู้ประสานงาน (กบค.)'] }, // ซ้ำโดยตั้งใจ
  ];
  const draft = buildAcDraft(dupMatches, 'scenario7');
  assert.ok(draft.includes('AC draft — 1 field'), 'ต้อง dedup เหลือ 1 field ไม่ใช่ 2');
  assert.ok(draft.includes('สิทธิ์การเข้าถึง — Scenario 7') && draft.includes('หน่วยงานเจ้าของรถ:'), 'ต้องมีสิทธิ์การเข้าถึงต่อจาก Rule list (คนละมิติ ไม่ใช่แค่ field rule)');
  assert.ok(draft.includes('FLOW — Scenario 7'), 'ต้องมี Flow ต่อท้าย Rule list เมื่อระบุ flow');
  assert.strictEqual(buildAcDraft([], 'scenario7'), null, 'ไม่มี match เลย ต้องได้ null ไม่ใช่ตารางว่าง');
  console.log('✓ buildAcDraft dedup field ซ้ำ และคืน null เมื่อไม่มี field ให้สร้าง AC');

  // 12) writeAcNode: ต้องสร้าง frame "AC draft" จริงบน canvas วางข้างๆ anchor ที่ให้มา และ tag ด้วย TAG_KEY
  //     เดียวกับป้าย schema (ให้ "ล้างป้ายที่แปะไว้" ลบได้ด้วย) — ไม่ใช่ copy ไปวางที่อื่นแบบเดิม
  const anchor = frame('Anchor', []);
  anchor.x = 500;
  anchor.y = 100;
  anchor.width = 300;
  currentPage.appendChild(anchor);
  const acNode = await writeAcNode('AC draft — 1 field\n\n1. ทดสอบ', anchor);
  assert.strictEqual(acNode.parent, currentPage, 'AC node ต้องอยู่ที่ระดับ page เหมือนป้าย schema อื่น');
  assert.strictEqual(acNode.x, anchor.x + anchor.width + 40, 'ต้องวางข้างขวาของ anchor ห่าง 40px');
  assert.strictEqual(acNode.y, anchor.y, 'ต้องวางเสมอแนวบนของ anchor');
  assert.strictEqual(acNode.getPluginData('mtd-schema-tag'), '1', 'AC node ต้อง tag ด้วย TAG_KEY เดียวกับป้าย schema เพื่อให้ clearTags ลบได้ด้วย');
  assert.strictEqual(acNode.children[0].characters, 'AC draft — 1 field\n\n1. ทดสอบ', 'เนื้อหาต้องอยู่ใน text node ลูกของ frame');
  console.log('✓ writeAcNode สร้าง frame บน canvas ข้าง anchor จริง และ tag ด้วย TAG_KEY เดียวกับป้ายอื่น');

  // 13) onmessage "generate-ac" แบบเต็ม — ไม่มี selection ต้อง error ชัด, มี selection ต้องเขียน node ขึ้นจริงบน canvas
  //     (ไม่ใช่ส่ง draft เต็มกลับมาทาง message ให้ copy แบบเดิม — ข้อความกลับมาแค่ยืนยันสั้นๆ)
  sentMessages.length = 0;
  currentPage.selection = [];
  await global.figma.ui.onmessage({ type: 'generate-ac', flow: 'scenario7' });
  const noSelResult = sentMessages.find((m) => m.type === 'ac-result');
  assert.strictEqual(noSelResult.ok, false);
  assert.ok(/ยังไม่ได้เลือก/.test(noSelResult.text));

  sentMessages.length = 0;
  const beforeCount = currentPage.children.length;
  const acH1 = text('ผู้ประสานงาน (กบค.)', { x: 0, y: 0, w: 140, h: 18 });
  const acH2 = text('ชั่วโมงสะสม', { x: 150, y: 0, w: 140, h: 18 });
  const acTable = frame('Table3', [frame('Header row 3', [acH1, acH2])]);
  acTable.x = 0; acTable.y = 0; acTable.width = 300;
  currentPage.appendChild(acTable);
  currentPage.selection = [acTable];
  await global.figma.ui.onmessage({ type: 'generate-ac', flow: 'scenario7' });
  const acResult = sentMessages.find((m) => m.type === 'ac-result');
  assert.strictEqual(acResult.ok, true);
  assert.ok(/เขียน AC ลงหน้าแล้ว/.test(acResult.text), 'ข้อความกลับต้องยืนยันว่าเขียนลงหน้าแล้ว ไม่ใช่ส่ง draft เต็มมาให้ copy');
  const newFrames = currentPage.children.filter((c) => c.name === 'AC draft');
  assert.strictEqual(newFrames.length, beforeCount === 0 ? 1 : newFrames.length, 'ต้องมี frame "AC draft" ถูกสร้างขึ้นจริงบนหน้า');
  assert.ok(newFrames.length >= 1, 'ต้องเจอ frame "AC draft" อย่างน้อย 1 อันบนหน้าหลังสั่ง generate-ac');
  const createdText = newFrames[newFrames.length - 1].children[0].characters;
  assert.ok(
    createdText.includes('ผู้ประสานงาน (กบค.)') && createdText.includes('ชั่วโมงสะสม')
      && createdText.includes('สิทธิ์การเข้าถึง — Scenario 7') && createdText.includes('FLOW — Scenario 7'),
    'เนื้อหาใน node ที่เขียนลงหน้าต้องมีทั้ง field ที่จับคู่ได้, สิทธิ์การเข้าถึง, และ Flow',
  );
  console.log('✓ onmessage "generate-ac" เขียน frame "AC draft" ขึ้นจริงบน canvas พร้อม Rule list + Flow ไม่ใช่ copy ไปวางที่อื่น');

  // 14) buildAcDraftForFlow: ทุก scenario ใน AC_FLOWS ต้องสร้าง draft ได้จาก fields ของตัวเองล้วนๆ
  //     โดยไม่ต้องมี selection/หน้า Figma มาจับคู่เลย (ใช้จริงโดย "สร้าง AC ทุกหน้า")
  for (const key of Object.keys(AC_FLOWS)) {
    const d = buildAcDraftForFlow(key);
    assert.ok(d, `buildAcDraftForFlow('${key}') ต้องไม่เป็น null/undefined`);
    assert.ok(d.includes(AC_FLOWS[key].title), `draft ของ '${key}' ต้องมีชื่อ scenario ของตัวเองอยู่ในนั้น`);
    assert.ok(d.includes('สิทธิ์การเข้าถึง'), `draft ของ '${key}' ต้องมีส่วนสิทธิ์การเข้าถึงด้วย`);
    assert.ok(d.includes('FLOW —'), `draft ของ '${key}' ต้องมีส่วน Flow ด้วย`);
  }
  console.log(`✓ buildAcDraftForFlow สร้าง draft ครบทั้ง ${Object.keys(AC_FLOWS).length} scenario จาก fields ของตัวเอง ไม่ต้องมี selection`);

  // 15) writeAllAcDrafts: ต้องสร้าง frame "AC draft" ครบทุก scenario เรียงซ้อนคอลัมน์เดียว (y เพิ่มขึ้นเรื่อยๆ ไม่ทับกัน)
  //     และทุกอันต้อง tag ด้วย TAG_KEY เดียวกัน เพื่อให้ "ล้างป้ายที่แปะไว้" ลบได้ทั้งหมดในทีเดียว
  const beforeAllCount = currentPage.children.length;
  const createdAll = await writeAllAcDrafts();
  assert.strictEqual(createdAll.length, Object.keys(AC_FLOWS).length, 'ต้องสร้าง AC ครบทุก scenario ใน AC_FLOWS');
  assert.strictEqual(currentPage.children.length, beforeAllCount + createdAll.length, 'ทุก frame ต้องถูก appendChild เข้า currentPage จริง');
  let prevY = -1;
  for (const { container } of createdAll) {
    assert.strictEqual(container.x, 0, 'ทุก frame ต้องอยู่คอลัมน์เดียวกัน (x=0)');
    assert.ok(container.y > prevY, 'y ต้องเรียงเพิ่มขึ้นเรื่อยๆ ไม่ทับซ้อนกับอันก่อนหน้า');
    assert.strictEqual(container.getPluginData('mtd-schema-tag'), '1', 'ทุก AC frame ต้อง tag ด้วย TAG_KEY เดียวกับป้าย schema อื่น');
    prevY = container.y;
  }
  console.log(`✓ writeAllAcDrafts สร้าง frame ครบ ${createdAll.length} scenario เรียงซ้อนไม่ทับกัน และ tag ด้วย TAG_KEY ให้ล้างได้ทีเดียว`);

  // 16) onmessage "generate-ac-all" — ไม่ต้องเลือกอะไรเลย ต้องเขียน AC ครบทุก scenario และสรุปรายชื่อกลับมา
  sentMessages.length = 0;
  currentPage.selection = []; // ตั้งใจเคลียร์ไว้เพื่อยืนยันว่าโหมดนี้ไม่ต้องพึ่ง selection เลย
  await global.figma.ui.onmessage({ type: 'generate-ac-all' });
  const allResult = sentMessages.find((m) => m.type === 'ac-result');
  assert.strictEqual(allResult.ok, true);
  for (const key of Object.keys(AC_FLOWS)) {
    assert.ok(allResult.text.includes(key), `ข้อความสรุปต้องมีชื่อ key '${key}' อยู่ด้วย`);
  }
  console.log('✓ onmessage "generate-ac-all" เขียน AC ครบทุก scenario โดยไม่ต้องเลือกอะไรเลย และสรุปรายชื่อกลับมาครบ');

  console.log('\nPASS — overhaul-schema-plugin/code.js ทำงานถูกต้องตามที่ทดสอบ');
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
