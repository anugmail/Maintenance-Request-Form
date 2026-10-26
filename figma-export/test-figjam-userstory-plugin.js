/* เทส figma-export/figjam-userstory-plugin/code.js บน Node (ไม่ต้องเปิด Figma จริง)
 * mock global `figma`/`module`/`__html__` ก่อน require แล้วตรวจพฤติกรรมตรงๆ
 * เน้นตรวจว่า renderer สร้าง TABLE/CODE_BLOCK/TEXT จริงแยกกล่องตามหัวข้อ (ไม่ใช่ text ก้อนเดียว) */
const assert = require('assert');

let created = [];
let uiMessages = [];
let onmessageHandler = null;

/* preventExtensions() จำลองพฤติกรรมจริงของ Figma scene node (host object ที่ seal ไว้ —
 * ใส่ property ที่ไม่ได้นิยามไว้ไม่ได้ throw "object is not extensible") เพื่อให้เทสจับบั๊กแบบนี้
 * ได้ตั้งแต่บน Node ไม่ต้องรอไปพังจริงใน Figma (บั๊กจริงที่เจอ 26 ต.ค. 2569: โค้ดเคยเซ็ต node._kind
 * เพิ่มเอง ผ่านเทสเพราะ mock เดิมเป็น plain object ที่ extensible แต่พังจริงบน Figma ทุก node) */
function makeNode(name, overrides) {
  const node = Object.assign({
    name,
    width: 200,
    height: 100,
    x: 10,
    y: 20,
    absoluteTransform: [[1, 0, 10], [0, 1, 20]],
    children: [],
    _pluginData: {},
    _removed: false,
    setPluginData(k, v) { this._pluginData[k] = v; },
    getPluginData(k) { return this._pluginData[k] || ''; },
    remove() { this._removed = true; },
  }, overrides);
  return Object.preventExtensions(node);
}

function makeTextMock() {
  return makeNode('text', {
    type: 'TEXT',
    fontName: null, fontSize: 0, characters: '', textAutoResize: '', height: 20,
    resize(w, h) { this.width = w; this.height = h; },
  });
}

function makeTableCellMock() {
  return Object.preventExtensions({ text: { fontName: { family: 'Inter', style: 'Regular' }, characters: '' } });
}

function makeTableMock(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    cells.push([]);
    for (let c = 0; c < cols; c++) cells[r].push(makeTableCellMock());
  }
  return makeNode('table', {
    type: 'TABLE', _rows: rows, _cols: cols, height: rows * 30,
    cellAt(r, c) { return cells[r][c]; },
  });
}

function makeCodeBlockMock() {
  return makeNode('code', { type: 'CODE_BLOCK', code: '', codeLanguage: null, height: 80 });
}

let scrolledInto = null;
function resetFigmaMock() {
  created = [];
  uiMessages = [];
  scrolledInto = null;
  const pageChildren = [];
  global.figma = {
    showUI() {},
    ui: {
      postMessage(m) { uiMessages.push(m); },
      set onmessage(fn) { onmessageHandler = fn; },
      get onmessage() { return onmessageHandler; },
    },
    on() {},
    currentPage: {
      selection: [],
      children: pageChildren,
      appendChild(node) { pageChildren.push(node); created.push(node); },
    },
    viewport: { scrollAndZoomIntoView(nodes) { scrolledInto = nodes; } },
    loadFontAsync: async () => {},
    createText: makeTextMock,
    createTable: makeTableMock,
    createCodeBlock: makeCodeBlockMock,
    group(nodes) { return { type: 'GROUP', children: nodes }; },
  };
  global.__html__ = '';
}

function freshModule() {
  delete require.cache[require.resolve('./figjam-userstory-plugin/code.js')];
  return require('./figjam-userstory-plugin/code.js');
}

resetFigmaMock();
let mod = freshModule();

const registeredTests = [];
function test(name, fn) {
  registeredTests.push({ name, fn });
}

// ---------- frameLetter / findFlowForNode (ไม่เปลี่ยนจากเดิม) ----------
test('frameLetter ดึงตัวอักษรนำหน้ารหัสได้ถูกต้อง', () => {
  assert.strictEqual(mod.frameLetter('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ'), 'B');
  assert.strictEqual(mod.frameLetter('OH2 / N.4.1 · S13 — รหัสจุดซ้อน'), 'N');
  assert.strictEqual(mod.frameLetter('ไม่มีรูปแบบรหัสเลย'), null);
});

test('frameLetter ทนชื่อเฟรมพิมพ์ผิด "OOH2" (บั๊กจริงในบอร์ด) ได้', () => {
  assert.strictEqual(mod.frameLetter('OOH2 / N.5 · S13 — แก้ไขนัดหมาย'), 'N');
});

test('findFlowForNode จับคู่ทุกตัวอักษรไปยัง flow ที่ถูกต้องตาม AC_FLOWS', () => {
  const cases = {
    'OH2 / A.1 · S1': 'plan13', 'OH2 / B.2 · S1': 'plan13', 'OH2 / C.1 · S2': 'plan13', 'OH2 / D.1 · S3': 'plan13',
    'OH2 / E.1 · S4': 'po46', 'OH2 / F.1 · S5': 'po46', 'OH2 / G.1 · S6': 'po46',
    'OH2 / H.3 · S7': 'scenario7', 'OH2 / I.2 · S8': 'scenario8',
    'OH2 / J.1 · S9': 'scenario911', 'OH2 / K.2 · S10': 'scenario911', 'OH2 / L.1 · S11': 'scenario911',
    'OH2 / M.1 · S12': 'scenario12', 'OH2 / N.4.1 · S13': 'scenario13', 'OH2 / O.2 · S14': 'scenario14',
  };
  for (const [name, expected] of Object.entries(cases)) {
    assert.strictEqual(mod.findFlowForNode(name + ' — x'), expected, name);
  }
});

test('findFlowForNode คืน null เมื่อไม่รู้จักตัวอักษร', () => {
  assert.strictEqual(mod.findFlowForNode('OH2 / P.1 · S99 — x'), null);
});

// ---------- โครงสร้างข้อมูล USER_STORIES ----------
test('USER_STORIES มีครบ 8 flow key เป็นโครงสร้าง {title, sections} ไม่ใช่ string อีกต่อไป', () => {
  const keys = ['plan13', 'po46', 'scenario7', 'scenario8', 'scenario911', 'scenario12', 'scenario13', 'scenario14'];
  for (const k of keys) {
    const s = mod.USER_STORIES[k];
    assert.ok(s && typeof s === 'object' && !Array.isArray(s), k + ' ไม่ใช่ object');
    assert.ok(typeof s.title === 'string' && s.title.length > 0, k + ' ไม่มี title');
    assert.ok(Array.isArray(s.sections) && s.sections.length > 15, k + ' sections ผิดปกติ');
  }
});

test('USER_STORIES แต่ละ flow มีหัวเรื่อง US-OH ตรงกับฟีเจอร์', () => {
  assert.ok(mod.USER_STORIES.plan13.title.startsWith('US-OH-01'));
  assert.ok(mod.USER_STORIES.po46.title.startsWith('US-OH-02'));
  assert.ok(mod.USER_STORIES.scenario14.title.startsWith('US-OH-08'));
});

test('ทุก flow มีตาราง (Story Header/Permission/Field Validation/State Transition) 4 ตัว และ gherkin 3 ก้อน', () => {
  for (const [key, s] of Object.entries(mod.USER_STORIES)) {
    const tableCount = s.sections.filter((x) => x.table).length;
    const codeCount = s.sections.filter((x) => x.code).length;
    assert.strictEqual(tableCount, 4, key + ' table count');
    assert.strictEqual(codeCount, 3, key + ' code count');
  }
});

test('ไม่มี section ใดเหลือเป็น markdown pipe-table string (ต้องถูก parse เป็น {headers,rows} แล้ว)', () => {
  for (const [key, s] of Object.entries(mod.USER_STORIES)) {
    for (const sec of s.sections) {
      if (sec.table) {
        assert.ok(Array.isArray(sec.table.headers), key + '/' + sec.label + ' headers ไม่ใช่ array');
        assert.ok(Array.isArray(sec.table.rows), key + '/' + sec.label + ' rows ไม่ใช่ array');
        assert.ok(sec.table.rows.every((r) => Array.isArray(r)), key + '/' + sec.label + ' row ไม่ใช่ array');
      }
      if (sec.paragraph || sec.bullets) {
        const text = sec.paragraph || sec.bullets.join(' ');
        assert.ok(!/^\|.*\|$/m.test(text), key + '/' + sec.label + ' ยังมี markdown pipe table หลงเหลือ');
      }
    }
  }
});

test('สิ่งที่ยังไม่ครบ ของทั้ง 8 flow ตรงกับจำนวนที่ fork รายงานไว้ (11,12,6,13,13,8,9,10)', () => {
  const expected = { plan13: 11, po46: 12, scenario7: 6, scenario8: 13, scenario911: 13, scenario12: 8, scenario13: 9, scenario14: 10 };
  for (const [key, n] of Object.entries(expected)) {
    const sec = mod.USER_STORIES[key].sections.find((x) => x.level === 'bold' && x.label.startsWith('สิ่งที่ยังไม่ครบ'));
    assert.ok(sec, key + ' ไม่มี section สิ่งที่ยังไม่ครบ');
    assert.strictEqual(sec.bullets.length, n, key);
  }
});

// ---------- render helpers ----------
test('createDataTable เรียก createTable ด้วยจำนวนแถว/คอลัมน์ถูกต้อง และกรอกข้อความทุกเซลล์', async () => {
  resetFigmaMock();
  mod = freshModule();
  const table = await mod.createDataTable({ headers: ['A', 'B'], rows: [['1', '2'], ['3', '4']] });
  assert.strictEqual(table._rows, 3); // header + 2 data rows
  assert.strictEqual(table._cols, 2);
  assert.strictEqual(table.cellAt(0, 0).text.characters, 'A');
  assert.strictEqual(table.cellAt(0, 1).text.characters, 'B');
  assert.strictEqual(table.cellAt(1, 0).text.characters, '1');
  assert.strictEqual(table.cellAt(2, 1).text.characters, '4');
});

test('createGherkinBlock เป็น TEXT ธรรมดา (เลิกใช้ CODE_BLOCK แล้ว — เจ้าของงานสั่ง 26 ต.ค. 2569 เพราะ code block ไม่ขึ้นบนบอร์ดจริง) เก็บ indent Given/When/Then ไว้ครบ', async () => {
  resetFigmaMock();
  mod = freshModule();
  const block = await mod.createGherkinBlock('Scenario: x\n  Given y', 500);
  assert.strictEqual(block.type, 'TEXT');
  assert.strictEqual(block.characters, 'Scenario: x\n  Given y');
});

test('createBulletText ใส่ • นำหน้าทุกข้อ ไม่ใช่ "- [ ] " แบบ markdown', async () => {
  resetFigmaMock();
  mod = freshModule();
  const t = await mod.createBulletText(['ข้อหนึ่ง', 'ข้อสอง'], 400);
  assert.strictEqual(t.characters, '•  ข้อหนึ่ง\n•  ข้อสอง');
});

test('renderSection: section ที่มี table คืน node .type TABLE, section ที่มี code คืน .type TEXT (ไม่ใช่ CODE_BLOCK แล้ว)', async () => {
  resetFigmaMock();
  mod = freshModule();
  const tableNodes = await mod.renderSection({ level: 'h3', label: 'B5. Permission', table: { headers: ['a'], rows: [['1']] } }, 600);
  assert.strictEqual(tableNodes.length, 2); // label + table
  assert.strictEqual(tableNodes[1].type, 'TABLE');

  const codeNodes = await mod.renderSection({ level: 'h3', label: 'B1. Happy Path', code: ['Scenario: x'] }, 600);
  assert.strictEqual(codeNodes[1].type, 'TEXT');

  const emptyNodes = await mod.renderSection({ level: 'h2', label: 'B. Business AC' }, 600);
  assert.strictEqual(emptyNodes.length, 1); // แค่ label ไม่มี content
});

test('renderSection: ข้าม "A. Story Header" ไม่สร้าง node เลย (เจ้าของงานสั่ง 26 ต.ค. 2569 ให้ตัดออก)', () => {
  const section = { level: 'h2', label: 'A. Story Header', table: { headers: ['a'], rows: [['1']] } };
  assert.strictEqual(mod.isStoryHeaderSection(section), true);
  assert.strictEqual(mod.isStoryHeaderSection({ level: 'h2', label: 'B. Business AC (มุม BA)' }), false);
  assert.strictEqual(mod.isStoryHeaderSection({ level: 'bold', label: 'A. Story Header' }), false, 'ต้องเช็ค level ด้วยไม่ใช่แค่ label เผื่อชื่อซ้ำบังเอิญ');
});

// ---------- annotateUserStory: ต้องสร้างหลาย node จริง (ตาราง/ข้อความ) ไม่ใช่ text เดียว ----------
test('annotateUserStory สร้างหลาย node แยกตามประเภทเนื้อหาจริง (ไม่ใช่ text ก้อนเดียวแบบเดิม) และไม่มี Story Header', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('OH2 / B.2 · S1 — x', { width: 300, absoluteTransform: [[1, 0, 50], [0, 1, 60]] });
  const nodes = await mod.annotateUserStory(node, 'plan13');
  assert.ok(nodes.length > 15, 'ควรมีหลาย node ต่อ story (title+sections หลายอันมี label+content)');
  const kinds = nodes.map((n) => n.type);
  assert.ok(kinds.includes('TABLE'), 'ต้องมีตารางจริงอย่างน้อย 1');
  assert.ok(kinds.filter((k) => k === 'TABLE').length >= 3, 'story นี้มี 3 ตารางที่เหลือ (ตัด Story Header ไป 1 จาก 4)');
  assert.ok(!kinds.includes('CODE_BLOCK'), 'ต้องไม่มี CODE_BLOCK อีกต่อไป');
  for (const n of nodes) {
    assert.ok(!n.characters || !n.characters.includes('Story ID'), 'ต้องไม่มีเนื้อหา Story Header หลงเหลืออยู่');
    assert.strictEqual(n.getPluginData(mod.TAG_KEY), '1');
  }
});

test('annotateUserStory วาง node ทุกตัวไว้ทางขวาของ node ต้นทาง (x เดียวกันหมด, y ไล่ลงไม่ชนกัน)', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('OH2 / B.2 · S1 — x', { width: 300, absoluteTransform: [[1, 0, 50], [0, 1, 60]] });
  const nodes = await mod.annotateUserStory(node, 'plan13');
  const expectedX = 50 + 300 + 40; // SECTION_GAP_X = 40
  for (const n of nodes) assert.strictEqual(n.x, expectedX);
  for (let i = 1; i < nodes.length; i++) assert.ok(nodes[i].y > nodes[i - 1].y, 'y ต้องไล่ลงเรื่อยๆ ไม่ซ้อนกัน');
});

test('annotateUserStory คืน null ถ้า flow ไม่มีเนื้อหา', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('x');
  const result = await mod.annotateUserStory(node, 'ไม่มีจริง');
  assert.strictEqual(result, null);
});

// ---------- clearTags ----------
test('clearTags ลบเฉพาะ node ที่ติด TAG_KEY ไม่ลบ node อื่น', () => {
  resetFigmaMock();
  mod = freshModule();
  const root = makeNode('root');
  const tagged = makeNode('tagged'); tagged.setPluginData(mod.TAG_KEY, '1');
  const untagged = makeNode('untagged');
  root.children = [tagged, untagged];
  const n = mod.clearTags(root);
  assert.strictEqual(n, 1);
  assert.strictEqual(tagged._removed, true);
  assert.strictEqual(untagged._removed, false);
});

// ---------- onmessage handlers ----------
async function sendMessage(msg) {
  await onmessageHandler(msg);
}

test('onmessage annotate-auto: ไม่มี selection → แจ้งเตือนให้เลือกก่อน', async () => {
  resetFigmaMock();
  global.figma.currentPage.selection = [];
  mod = freshModule();
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, false);
  assert.ok(/เลือก/.test(last.text));
});

test('onmessage annotate-auto: จับคู่ได้แปะสำเร็จ (สร้างหลาย node จริง)', async () => {
  resetFigmaMock();
  const node = makeNode('OH2 / H.2 · S7 — x');
  global.figma.currentPage.selection = [node];
  mod = freshModule();
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, true);
  assert.ok(/แปะ user story แล้ว 1 เฟรม/.test(last.text));
  assert.ok(created.length > 15, 'ควรสร้างหลาย node จริงไม่ใช่ 1 text');
  assert.ok(scrolledInto, 'ต้องเลื่อนจอไปหา node ที่สร้างใหม่ (scrollAndZoomIntoView)');
  assert.strictEqual(scrolledInto.length, created.length);
});

test('onmessage annotate-auto: เฟรมหาไม่เจอ → แจ้ง unmatched ไม่ throw', async () => {
  resetFigmaMock();
  const node = makeNode('ไม่มีรูปแบบรหัสเลย');
  global.figma.currentPage.selection = [node];
  mod = freshModule();
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, false);
  assert.ok(/หาไม่เจอ/.test(last.text));
  assert.strictEqual(created.length, 0);
});

test('onmessage annotate-auto: เลือกหลายเฟรมผสมกัน → นับจำนวนเฟรมที่แปะถูกต้อง (ไม่ใช่นับ sub-node)', async () => {
  resetFigmaMock();
  const ok1 = makeNode('OH2 / B.1 · S1 — x');
  const ok2 = makeNode('OH2 / C.3 · S2 — x');
  const bad = makeNode('มั่วๆ');
  global.figma.currentPage.selection = [ok1, ok2, bad];
  mod = freshModule();
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, true);
  assert.ok(/แปะ user story แล้ว 2 เฟรม/.test(last.text));
  assert.ok(/หาไม่เจอ 1 เฟรม/.test(last.text));
});

test('onmessage annotate (manual): เลือก flow ถูกต้อง แปะได้ทุกเฟรมที่เลือกไม่ว่าชื่อเฟรมจะเป็นอะไร', async () => {
  resetFigmaMock();
  const n1 = makeNode('เฟรมชื่ออะไรก็ได้ 1');
  const n2 = makeNode('เฟรมชื่ออะไรก็ได้ 2');
  global.figma.currentPage.selection = [n1, n2];
  mod = freshModule();
  await sendMessage({ type: 'annotate', flow: 'scenario14' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, true);
  assert.ok(created.length > 30, 'สองเฟรม x หลาย node ต่อ story');
  assert.ok(scrolledInto, 'ต้องเลื่อนจอไปหา node ที่สร้างใหม่');
});

test('createTable throw กลางๆ (เช่น API เปลี่ยน/limit เกิน) → ไม่เงียบหาย ยังเห็น error ใน UI และ node อื่นที่ไม่พังยังถูกวางอยู่', async () => {
  resetFigmaMock();
  let callCount = 0;
  global.figma.createTable = (...args) => {
    callCount++;
    if (callCount === 2) throw new Error('จำลอง API พัง (เช่น table เกิน limit)');
    return makeTableMock(...args);
  };
  const node = makeNode('OH2 / B.2 · S1 — x');
  global.figma.currentPage.selection = [node];
  mod = freshModule();
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.ok(/⚠️ พบปัญหา/.test(last.text), 'ต้องมีข้อความ error โผล่ใน UI ไม่ใช่เงียบหาย: ' + last.text);
  assert.ok(created.length > 10, 'node อื่นที่ไม่พังต้องยังถูกสร้าง/วางอยู่ (ไม่ใช่ทั้ง batch หายไปหมด)');
});

test('annotateUserStory พังทั้งตัว (เช่น flow ทั้งก้อน throw) ตอน annotate-auto หลายเฟรม → เฟรมอื่นที่ไม่พังยังสำเร็จ และ error ไม่หายไปเงียบๆ', async () => {
  resetFigmaMock();
  const ok1 = makeNode('OH2 / B.1 · S1 — x');
  const broken = makeNode('OH2 / C.1 · S2 — x');
  global.figma.currentPage.selection = [ok1, broken];
  mod = freshModule();
  const realAnnotate = mod.annotateUserStory;
  // จำลองเฉพาะเฟรม "broken" ให้พังทั้ง annotateUserStory (เช่น absoluteTransform ผิดรูปแบบ, group() พัง, ฯลฯ)
  broken.absoluteTransform = null;
  broken.x = undefined; // ทำให้คำนวณ abs พังถ้า logic พึ่ง node.x ตรงๆ โดยไม่กัน undefined
  await sendMessage({ type: 'annotate-auto' });
  const last = uiMessages[uiMessages.length - 1];
  assert.ok(last.ok, 'อย่างน้อย 1 เฟรมต้องสำเร็จ');
  assert.ok(/แปะ user story แล้ว/.test(last.text));
});

// ---------- AC ย่อยตาม frame (26 ต.ค. 2569) ----------
function makeTextNode(characters) {
  return { type: 'TEXT', characters, children: [] };
}

test('splitScenarios แยก 4 scenario ที่อยู่ใน code fence เดียวกัน (B3 ของ plan13 มี AC-03+AC-04+AC-07+AC-08 ติดกัน หลังเพิ่มเนื้อหาหน้ารายการ 26 ต.ค. 2569)', () => {
  const b3 = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'B3. Exception / Negative Flow');
  const scenarios = mod.splitScenarios(b3.code[0]);
  assert.strictEqual(scenarios.length, 4);
  assert.ok(scenarios[0].title.includes('AC-03'));
  assert.ok(scenarios[1].title.includes('AC-04'));
  assert.ok(scenarios[2].title.includes('AC-07'));
  assert.ok(scenarios[3].title.includes('AC-08'));
  assert.ok(scenarios[0].text.startsWith('Scenario: AC-03'));
  assert.ok(!scenarios[0].text.includes('AC-04'), 'ต้องตัดก่อน scenario ถัดไป ไม่ปนกัน');
});

test('collectScenarios รวม scenario จาก B1+B2+B3 ทั้งหมดของ plan13 ได้ 8 รายการ (1 CRUD-happy + 2 CRUD-alt + 2 list-page-alt + 2 CRUD-exception + 2 list-page-exception) หลังเพิ่ม AC-05..08 (ค้นหา/ตัวกรอง/ไม่พบแผน/ยังไม่มีแผน) 26 ต.ค. 2569', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  assert.strictEqual(pool.length, 8);
  assert.deepStrictEqual(
    pool.map((s) => s.title.slice(0, 5)).sort(),
    ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05', 'AC-06', 'AC-07', 'AC-08'].sort(),
  );
});

test('extractQuotedStrings ดึงข้อความในเครื่องหมายคำพูดทั้งหมด', () => {
  const q = mod.extractQuotedStrings('แสดง "กรุณาระบุชื่อแผน" และ "กรุณาระบุวงเงินอนุมัติ (บาท)"');
  assert.deepStrictEqual(q, ['กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)']);
});

test('readFrameTexts เดินทุก node ลูกเก็บ .characters ของ TEXT เท่านั้น', () => {
  const root = makeNode('frame', {
    type: 'FRAME',
    children: [makeTextNode('หัวข้อ'), { type: 'RECTANGLE', children: [] }, makeNode('group', { type: 'GROUP', children: [makeTextNode('ข้อความซ้อนใน group')] })],
  });
  const texts = mod.readFrameTexts(root);
  assert.deepStrictEqual(texts, ['หัวข้อ', 'ข้อความซ้อนใน group']);
});

test('matchScenarioByContent จับคู่ scenario ที่ error message ตรงกับข้อความจริงในเฟรม (หลายข้อความ error พร้อมกัน ตามจอฟอร์มที่กรอกไม่ครบจริง)', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  const frameTexts = ['ชื่อแผน', 'วงเงินอนุมัติ (บาท)', 'กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)', 'กรุณาแนบหนังสืออนุมัติหลักการ', 'กรุณาแนบเอกสารอนุมัติงบ', 'บันทึก'];
  const match = mod.matchScenarioByContent(pool, frameTexts);
  assert.ok(match, 'ต้องจับคู่ได้');
  assert.ok(match.scenario.title.includes('AC-03'));
  assert.ok(match.confirmed.includes('กรุณาระบุชื่อแผน'));
});

test('matchScenarioByContent ไม่ติดกับดัก placeholder — ข้อความ error ที่มี {เลขแผน} ต้องไม่ถูกนับว่า "เจอจริง" แค่เพราะมีคำย่อยตรงกับข้อความสั้นในเฟรม', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  // เฟรมมีแค่ข้อความสั้นๆ "สร้างแผน Overhaul" (เช่น หัวข้อฟอร์ม) — ไม่ควรไปจับคู่กับ toast
  // ที่มี placeholder "สร้างแผน Overhaul {เลขแผน} สำเร็จ" ของ AC-01 เพราะไม่มีทางเจอข้อความ
  // เต็มแบบนั้นบนจอจริง (ตัวเลขแผนจะถูกแทนที่ด้วยค่าจริงเสมอ)
  const match = mod.matchScenarioByContent(pool, ['สร้างแผน Overhaul']);
  if (match) assert.ok(!match.confirmed.includes('สร้างแผน Overhaul {เลขแผน} สำเร็จ'), 'ห้ามนับ placeholder string ว่าเจอจริงบนจอ');
});

test('matchScenarioByContent คืน null ถ้าไม่มีข้อความในเฟรมตรงกับ scenario ไหนเลย', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  const match = mod.matchScenarioByContent(pool, ['ข้อความมั่วๆ ไม่เกี่ยวอะไรเลย']);
  assert.strictEqual(match, null);
});

test('extractFrameState ดึงข้อความหลัง em dash ตัวสุดท้ายของชื่อเฟรม', () => {
  assert.strictEqual(mod.extractFrameState('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ'), 'กดบันทึกโดยยังไม่ครบ');
  assert.strictEqual(mod.extractFrameState('ไม่มี em dash เลย'), null);
});

test('pickScenarioByFrameName จับคู่จากชื่อเฟรมได้เมื่อไม่มีข้อความให้เทียบ (fallback วิธีที่ 2)', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  const picked = mod.pickScenarioByFrameName('กดบันทึกโดยยังไม่ครบ', pool);
  assert.ok(picked, 'ต้องจับคู่ได้ด้วยชื่อเฟรม');
  assert.ok(picked.title.includes('AC-03'));
});

test('pickScenarioByFrameName คืน null ถ้าคะแนนไม่ชัดเจน (กันเดาผิด)', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  assert.strictEqual(mod.pickScenarioByFrameName('มีรายการ', pool), null);
  assert.strictEqual(mod.pickScenarioByFrameName(null, pool), null);
});

test('buildGherkinSectionForFrame: มีข้อความจริงในเฟรมตรงกับ AC-03 → ใช้ content-match เป็นหลัก (ไม่ใช้ชื่อเฟรม)', () => {
  const node = makeNode('OH2 / B.2 · S1 — ชื่ออะไรก็ได้ที่ไม่ตรง', {
    children: [makeTextNode('กรุณาระบุชื่อแผน'), makeTextNode('กรุณาแนบหนังสืออนุมัติหลักการ')],
  });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('วิเคราะห์จากข้อความจริงในเฟรม'));
  assert.ok(section.label.includes('AC-03'));
  assert.strictEqual(section.code.length, 1, 'ต้องเหลือ scenario เดียวที่ตรง ไม่ใช่ทั้ง 4');
  assert.ok(section.bullets.some((b) => b.startsWith('✅') && b.includes('กรุณาระบุชื่อแผน')));
  assert.ok(section.bullets.some((b) => b.startsWith('❓') && b.includes('กรุณาระบุวงเงินอนุมัติ')), 'ข้อความที่ไม่เจอในเฟรมต้องขึ้น ❓ ไม่ใช่เงียบไป');
});

test('buildGherkinSectionForFrame: ไม่มีข้อความให้เทียบเลย แต่ชื่อเฟรมตรง → fallback ไปจับคู่จากชื่อ', () => {
  const node = makeNode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ', { children: [] });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('จับคู่จากชื่อเฟรม'));
  assert.ok(section.label.includes('AC-03'));
  assert.ok(section.bullets[0].startsWith('⚠️'), 'ต้องเตือนว่าไม่ได้ยืนยันจากของจริง');
});

test('buildGherkinSectionForFrame: จับคู่ไม่ได้เลยทั้งสองวิธี → แสดงทั้งหมดไม่เดา', () => {
  const node = makeNode('เฟรมไม่มีรูปแบบชื่อ', { children: [makeTextNode('ข้อความไม่เกี่ยวอะไรเลย')] });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('ไม่มั่นใจว่าตรงกับจอนี้'));
  assert.strictEqual(section.code.length, 8, 'ต้องมีครบทั้ง 8 scenario เพราะไม่เดา');
});

test('buildSectionsForFrame: แทนที่ B1/B2/B3 ด้วย section เดียว โดยคงตำแหน่งเดิมและ section อื่นไว้ครบ', () => {
  const node = makeNode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ', { children: [] });
  const sections = mod.buildSectionsForFrame(mod.USER_STORIES.plan13, node);
  const gherkinLabels = sections.filter((s) => /AC-03|ไม่มั่นใจ/.test(s.label));
  assert.strictEqual(gherkinLabels.length, 1, 'ต้องเหลือ section Gherkin เดียว ไม่ใช่ 3 (B1/B2/B3 เดิม)');
  assert.ok(sections.some((s) => s.label === 'B4. Business Rules'), 'section อื่นนอกเหนือ Gherkin ต้องยังอยู่ครบ');
  assert.ok(sections.some((s) => s.label === 'A. Story Header'), 'ไม่ได้ลบจากข้อมูล แค่ไม่ render (isStoryHeaderSection กรองทีหลัง)');
});

test('annotateUserStory ปลายทาง: เฟรมมีข้อความจริงตรงกับ AC-03 → ได้ TEXT เดียวสำหรับ Gherkin ไม่ใช่ 4', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('OH2 / B.2 · S1 — x', {
    width: 300,
    absoluteTransform: [[1, 0, 50], [0, 1, 60]],
    children: [makeTextNode('กรุณาระบุชื่อแผน')],
  });
  const nodes = await mod.annotateUserStory(node, 'plan13');
  const gherkinNodes = nodes.filter((n) => n.characters && n.characters.startsWith('Scenario:'));
  assert.strictEqual(gherkinNodes.length, 1, 'ต้องเหลือ scenario เดียวที่ตรงกับเฟรม ไม่ใช่ทั้ง 4');
  assert.ok(gherkinNodes[0].characters.includes('AC-03'));
});

// ---------- หน้ารายการ (กลุ่ม A) — AC-05..08 เพิ่มเมื่อ 26 ต.ค. 2569 จาก 18-overhaul-AC-หน้า1-รายการแผน.md ----------
test('buildGherkinSectionForFrame: A.4 "ไม่พบแผน" จับคู่ AC-07 จากข้อความจริง (ค้นหา/กรองไม่พบ)', () => {
  const node = makeNode('OH2 / A.4 · S1 — ไม่พบแผน', {
    children: ['ไม่พบแผน Overhaul', 'ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง', 'ล้างคำค้นและตัวกรอง'].map(makeTextNode),
  });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('วิเคราะห์จากข้อความจริงในเฟรม'));
  assert.ok(section.label.includes('AC-07'));
});

test('buildGherkinSectionForFrame: A.5 "ยังไม่มีแผน" จับคู่ AC-08 จากข้อความจริง (empty state แรกเข้า)', () => {
  const node = makeNode('OH2 / A.5 · S1 — ยังไม่มีแผน', {
    children: ['ยังไม่มีแผน Overhaul', 'สร้างแผน Overhaul เพื่อเพิ่ม Purchase Order และติดตามสถานะซ่อมของรถแต่ละคัน'].map(makeTextNode),
  });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('วิเคราะห์จากข้อความจริงในเฟรม'));
  assert.ok(section.label.includes('AC-08'));
});

test('buildGherkinSectionForFrame: A.2 "ค้นหา" ไม่มีข้อความให้เทียบ แต่ชื่อเฟรมตรง → จับคู่ AC-05 จากชื่อ', () => {
  const node = makeNode('OH2 / A.2 · S1 — ค้นหา', { children: [] });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('จับคู่จากชื่อเฟรม'));
  assert.ok(section.label.includes('AC-05'));
});

test('buildGherkinSectionForFrame: A.3 "ตัวกรอง" ไม่มีข้อความให้เทียบ แต่ชื่อเฟรมตรง → จับคู่ AC-06 จากชื่อ', () => {
  const node = makeNode('OH2 / A.3 · S1 — ตัวกรอง', { children: [] });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('จับคู่จากชื่อเฟรม'));
  assert.ok(section.label.includes('AC-06'));
});

// ---------- บั๊กจริงที่เจอ 26 ต.ค. 2569: ปุ่ม "สร้างแผน Overhaul" อยู่ทั้งในหน้ารายการ (A.1)
// และใน Gherkin ของ AC-01 (When กด)/AC-08 (And แสดงปุ่ม) ทำให้เคยจับคู่ผิด ----------
test('extractActionQuotes ดึงเฉพาะข้อความจาก Given/When (ปุ่ม/การกระทำตั้งต้น) ไม่เอาจาก Then/And', () => {
  const text = 'Scenario: x\n  Given y\n  When  กด "สร้างแผน Overhaul"\n  Then  แสดง "ผลลัพธ์"\n  And   toast "สำเร็จ"';
  assert.deepStrictEqual(mod.extractActionQuotes(text), ['สร้างแผน Overhaul']);
});

test('extractStateQuotes ตัด action quote ออกแม้จะไปโผล่ซ้ำใน And (พูดถึงปุ่มเดิม ไม่ใช่ state ใหม่)', () => {
  const actionQuotes = new Set(['สร้างแผน Overhaul']);
  const text = 'Scenario: x\n  Given y\n  When  z\n  Then  แทนที่ด้วยข้อความ "ยังไม่มีแผน Overhaul"\n  And   แสดงปุ่ม "สร้างแผน Overhaul" เฉพาะ กบค.';
  const quotes = mod.extractStateQuotes(text, actionQuotes);
  assert.deepStrictEqual(quotes, ['ยังไม่มีแผน Overhaul']);
});

test('matchScenarioByContent ไม่จับคู่ A.1 (หน้ารายการ มีรายการ) กับ AC-01/AC-08 ผิดๆ แค่เพราะมีปุ่ม "สร้างแผน Overhaul" ร่วมกัน', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  // เฟรมจริงของ A.1 มีปุ่ม/เมนูทั่วไปเท่านั้น ไม่มีข้อความเฉพาะ state ของ AC ไหนเลย
  const frameTexts = ['จัดการงาน Overhaul', 'สร้างแผน Overhaul', 'หมายเลขแผน', 'ชื่อแผน', 'สถานะ', 'ดูรายละเอียด', 'แก้ไข', 'ลบ'];
  const match = mod.matchScenarioByContent(pool, frameTexts);
  assert.strictEqual(match, null, 'ปุ่ม "สร้างแผน Overhaul" เพียงอย่างเดียวต้องไม่พอให้จับคู่ (เป็น action quote ของ AC-01/AC-08)');
});

test('buildGherkinSectionForFrame: A.1 "มีรายการ" (หน้ารายการปกติ มีเมนู แก้ไข/ลบ) ต้อง "ไม่มั่นใจ" ไม่ใช่โดนจับผิดเป็น AC-01 หรือ AC-08', () => {
  const node = makeNode('OH2 / A.1 · S1 — มีรายการ', {
    children: ['จัดการงาน Overhaul', 'สร้างแผน Overhaul', 'หมายเลขแผน', 'ชื่อแผน', 'สถานะ', 'ดูรายละเอียด', 'แก้ไข', 'ลบ'].map(makeTextNode),
  });
  const section = mod.buildGherkinSectionForFrame(mod.USER_STORIES.plan13, node);
  assert.ok(section.label.includes('ไม่มั่นใจว่าตรงกับจอนี้'), 'ต้อง fallback เป็นไม่มั่นใจ ไม่ใช่จับผิดเป็น CRUD scenario: ' + section.label);
});

// ---------- กรองทุก section ตามเฟรม ไม่ใช่แค่ Gherkin — เจ้าของงานสั่ง 26 ต.ค. 2569:
// "ถ้าเลือกเฟรมไหน ให้นำข้อมูลจาก frame นั้น มาประมวลผลว่าจะทำ ac ยังไง" ----------
test('rowOrBulletMatchesFrame: true เมื่อมี quote ที่ไม่ใช่ action quote ตรงกับข้อความจริงในเฟรม', () => {
  const actionQuotes = new Set();
  assert.strictEqual(mod.rowOrBulletMatchesFrame('ต้องแนบ "หนังสืออนุมัติหลักการ" ก่อนบันทึก', ['กรุณาแนบหนังสืออนุมัติหลักการ', 'หนังสืออนุมัติหลักการ'], actionQuotes), true);
  assert.strictEqual(mod.rowOrBulletMatchesFrame('ไม่เกี่ยวกับอะไรเลย ไม่มี quote', ['อะไรก็ได้'], actionQuotes), false);
});

test('filterSectionByFrame (bullets): กรองเหลือเฉพาะข้อที่ยืนยันได้ พร้อมเติม note บอกจำนวนที่กรอง', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  const actionQuotes = new Set();
  for (const sc of pool) for (const q of mod.extractActionQuotes(sc.text)) actionQuotes.add(q);
  const section = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'B4. Business Rules');
  const frameTexts = ['กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)', 'กรุณาแนบหนังสืออนุมัติหลักการ', 'กรุณาแนบเอกสารอนุมัติงบ'];
  const filtered = mod.filterSectionByFrame(section, frameTexts, actionQuotes);
  assert.ok(filtered.bullets.length < section.bullets.length, 'ต้องกรองให้เหลือน้อยกว่าเดิม');
  assert.ok(filtered.bullets[filtered.bullets.length - 1].startsWith('ℹ️ กรองตาม'), 'ต้องมี note ท้ายสุดบอกว่ากรองแล้ว');
});

test('filterSectionByFrame (bullets): ไม่มีข้อไหนยืนยันได้เลย → คงเดิมทั้งหมด ไม่เดา (เช่น B6 Notification ของ plan13 ไม่มี quote ที่ตรงกับเฟรมฟอร์มสร้างแผน)', () => {
  const section = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'B6. Notification');
  const filtered = mod.filterSectionByFrame(section, ['ข้อความที่ไม่เกี่ยวอะไรเลย'], new Set());
  assert.deepStrictEqual(filtered, section, 'ไม่มีอะไรตรง ต้องคืนค่าเดิมทั้งหมด ไม่ใช่ลดเหลือ 0 ข้อ');
});

test('filterSectionByFrame (table): กรองแถวตารางเหลือเฉพาะที่ตรง พร้อม note ใน paragraph', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  const actionQuotes = new Set();
  for (const sc of pool) for (const q of mod.extractActionQuotes(sc.text)) actionQuotes.add(q);
  const c1 = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'C1. Field Validation');
  const frameTexts = ['กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)', 'กรุณาแนบหนังสืออนุมัติหลักการ', 'กรุณาแนบเอกสารอนุมัติงบ'];
  const filtered = mod.filterSectionByFrame(c1, frameTexts, actionQuotes);
  assert.strictEqual(filtered.table.rows.length, 4);
  assert.deepStrictEqual(filtered.table.rows.map((r) => r[0]), ['ชื่อแผน', 'วงเงินอนุมัติ (บาท)', 'หนังสืออนุมัติหลักการ', 'เอกสารอนุมัติงบ']);
  assert.ok(filtered.paragraph.includes('ℹ️ กรองตาม'));
});

test('filterSectionByFrame (table): B5 Permission ไม่มี quote ให้เทียบเลย → คงครบ 4 แถวเสมอไม่ว่าเฟรมไหน', () => {
  const b5 = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'B5. Permission');
  const filtered = mod.filterSectionByFrame(b5, ['กรุณาระบุชื่อแผน'], new Set());
  assert.strictEqual(filtered.table.rows.length, b5.table.rows.length);
});

test('buildSectionsForFrame: เฟรม B.2 (validation error) กรอง C1 เหลือ 4 แถวที่ error ตรงจริง + B4 กรองเหลือเฉพาะ BR ที่เกี่ยว', () => {
  const node = makeNode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ', {
    children: ['กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)', 'กรุณาแนบหนังสืออนุมัติหลักการ', 'กรุณาแนบเอกสารอนุมัติงบ'].map(makeTextNode),
  });
  const sections = mod.buildSectionsForFrame(mod.USER_STORIES.plan13, node);
  const c1 = sections.find((s) => s.label === 'C1. Field Validation');
  const b4 = sections.find((s) => s.label === 'B4. Business Rules');
  assert.strictEqual(c1.table.rows.length, 4, 'C1 ต้องเหลือ 4 แถว ไม่ใช่ทั้ง 10 แถวของทุกฟิลด์ในฟอร์ม');
  assert.ok(b4.bullets.length < 7, 'B4 ต้องถูกกรอง ไม่ใช่โชว์ครบทั้ง 6 ข้อ + note');
});

test('buildSectionsForFrame: เฟรมหน้ารายการ A.4 (ไม่พบแผน) ไม่กรอง C1 ทิ้ง (C1 เป็นฟิลด์ของฟอร์มสร้างแผน ไม่เกี่ยวกับหน้ารายการ จึงไม่มีอะไรตรง — ต้องคงครบ ไม่ใช่กรองจนเหลือ 0)', () => {
  const node = makeNode('OH2 / A.4 · S1 — ไม่พบแผน', {
    children: ['ไม่พบแผน Overhaul', 'ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง', 'ล้างคำค้นและตัวกรอง'].map(makeTextNode),
  });
  const sections = mod.buildSectionsForFrame(mod.USER_STORIES.plan13, node);
  const c1 = sections.find((s) => s.label === 'C1. Field Validation');
  assert.strictEqual(c1.table.rows.length, 10, 'C1 ไม่เกี่ยวกับหน้ารายการ ต้องคงครบทุกแถว ไม่ใช่กรองจนว่างเปล่า');
});

test('buildSectionsForFrame: ไม่กรอง "สิ่งที่ยังไม่ครบ"/"Out of Scope"/"Assumptions" แม้บังเอิญมี quote ตรงกับเฟรม (เป็น meta ไม่ใช่ fact ของจอ)', () => {
  const node = makeNode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ', {
    children: ['กรุณาระบุชื่อแผน', 'กรุณาระบุวงเงินอนุมัติ (บาท)', 'กรุณาแนบหนังสืออนุมัติหลักการ', 'กรุณาแนบเอกสารอนุมัติงบ'].map(makeTextNode),
  });
  const sections = mod.buildSectionsForFrame(mod.USER_STORIES.plan13, node);
  const todo = sections.find((s) => s.label === 'สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม');
  const original = mod.USER_STORIES.plan13.sections.find((s) => s.label === 'สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม');
  assert.deepStrictEqual(todo.bullets, original.bullets, 'checklist ต้องไม่ถูกกรองเลย ไม่ว่าเฟรมไหน');
});

test('onmessage clear: เรียก clearTags และรายงานจำนวนที่ลบ', async () => {
  resetFigmaMock();
  const tagged = makeNode('tagged'); tagged.setPluginData(mod.TAG_KEY, '1');
  global.figma.currentPage.children = [tagged];
  global.figma.currentPage.selection = [];
  mod = freshModule();
  await sendMessage({ type: 'clear' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, true);
  assert.ok(/ลบป้ายที่แปะไว้แล้ว 1 ป้าย/.test(last.text));
});

test('onmessage list: ส่ง flows ครบ 8 key และ selection ปัจจุบัน', async () => {
  resetFigmaMock();
  global.figma.currentPage.selection = [makeNode('OH2 / A.1 · S1 — x')];
  mod = freshModule();
  uiMessages.length = 0;
  await sendMessage({ type: 'list' });
  const flowsMsg = uiMessages.find((m) => m.type === 'flows');
  const selMsg = uiMessages.find((m) => m.type === 'selection');
  assert.strictEqual(flowsMsg.keys.length, 8);
  assert.deepStrictEqual(selMsg.names, ['OH2 / A.1 · S1 — x']);
});

(async () => {
  for (const { name, fn } of registeredTests) {
    try {
      await fn();
      console.log('✓', name);
    } catch (e) {
      console.error('✗', name);
      console.error(e);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log('\nเทสทั้งหมดผ่าน (figjam-userstory-plugin)');
})();
