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
    fontName: null, fontSize: 0, characters: '', textAutoResize: '', textAlignHorizontal: 'LEFT', height: 20,
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
    createShapeWithText() {
      return makeNode('AC shape', {
        type: 'SHAPE_WITH_TEXT', shapeType: '', fills: [], strokes: [],
        text: Object.preventExtensions({
          fontName: {family: 'Inter', style: 'Regular'}, fontSize: 13,
          characters: '', textAlignHorizontal: 'CENTER', _bold: [], _sizes: [],
          setRangeFontName(start, end, font) {this._bold.push([start, end, font]);},
          setRangeFontSize(start, end, size) {this._sizes.push([start, end, size]);},
        }),
        resize(w, h) { this.width = w; this.height = h; },
      });
    },
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

test('สิ่งที่ยังไม่ครบ ของทั้ง 8 flow ตรงกับจำนวนปัจจุบันใน 25-overhaul-user-stories-AC.md (sync 27 ต.ค. 2569 — scenario7/scenario911/scenario14 เพิ่มขึ้นจากของเดิม)', () => {
  const expected = { plan13: 11, po46: 12, scenario7: 9, scenario8: 13, scenario911: 14, scenario12: 8, scenario13: 9, scenario14: 12 };
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
  assert.strictEqual(t.characters, '•  ข้อหนึ่ง\n\n•  ข้อสอง');
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
test('annotateUserStory writes the full narrative directly in one native shape', async () => {
  resetFigmaMock(); mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / B.2 · S1'), 'plan13');
  assert.strictEqual(nodes.filter(n => n.type === 'TEXT').length, 0);
  assert.strictEqual(nodes.filter(n => n.type === 'SHAPE_WITH_TEXT').length, 1);
  const text = nodes.find(n => n.type === 'SHAPE_WITH_TEXT').text.characters;
  assert.ok(text.startsWith(mod.FRAME_STORIES['B.2'].title));
  assert.ok(text.indexOf('ภาพรวมหน้านี้') < text.indexOf('As-is — Sprint 06'));
  assert.ok(text.indexOf('UI Component & Behavior') < text.indexOf('ประเด็นที่ต้องเคาะ'));
  assert.ok(text.includes('UI Component & Behavior รวมแนวทางพัฒนาจากโปรเจกต์และข้อเสนอ'));
  for (const n of nodes) assert.strictEqual(n.getPluginData(mod.TAG_KEY), '1');
});

test('annotateUserStory วาง node ทุกตัวไว้ทางขวาของ node ต้นทาง (x เดียวกันหมด, y ไล่ลงไม่ชนกัน)', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('OH2 / B.2 · S1 — x', { width: 300, absoluteTransform: [[1, 0, 50], [0, 1, 60]] });
  const nodes = await mod.annotateUserStory(node, 'plan13');
  const expectedX = 50 + 300 + 40; // SECTION_GAP_X = 40
  for (const n of nodes) assert.strictEqual(n.x, expectedX - (n.type === 'SHAPE_WITH_TEXT' ? 20 : 0));
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
  assert.ok(created.filter(n => n.name.endsWith(' / เรื่องราว')).length === 1, 'หนึ่ง text เนื้อเรื่องต่อเฟรม พร้อมตารางแยก');
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

test('onmessage annotate (manual): ไม่เดา AC เมื่อชื่อเฟรมไม่มีรหัส', async () => {
  resetFigmaMock();
  const n1 = makeNode('เฟรมชื่ออะไรก็ได้ 1');
  const n2 = makeNode('เฟรมชื่ออะไรก็ได้ 2');
  global.figma.currentPage.selection = [n1, n2];
  mod = freshModule();
  await sendMessage({ type: 'annotate', flow: 'scenario14' });
  const last = uiMessages[uiMessages.length - 1];
  assert.strictEqual(last.ok, false);
  assert.strictEqual(created.length, 0);
  assert.ok(last.text.includes('ไม่พบ AC ตรงรหัสเฟรม'));
});

test('separate tables retain narrative when table API fails', async () => {
  resetFigmaMock(); mod = freshModule();
  const story = mod.FRAME_STORIES['B.2'];
  const saved = story.sections;
  try {
    story.sections = [...saved, {label: 'ตารางข้อมูล', table: {headers: ['ฟิลด์'], rows: [['ชื่อแผน']]}}];
    global.figma.createTable = () => {throw new Error('table failure');};
    const nodes = await mod.annotateUserStory(makeNode('OH2 / B.2 · S1'), 'plan13');
    assert.ok(nodes.errors.some(e => e.includes('table failure')));
    assert.ok(nodes.some(n => n.text && n.text.characters.includes('ดูตารางที่ 1 ด้านล่าง')));
  } finally {story.sections = saved;}
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

test('collectScenarios รวม scenario จาก B1+B2+B3 ทั้งหมดของ plan13 ได้ 10 รายการ (เพิ่ม AC-09/AC-10 จากบอร์ด Refinement 29 oct 2026 เข้ามาอีก 2 — sync 27 ต.ค. 2569)', () => {
  const pool = mod.collectScenarios(mod.USER_STORIES.plan13);
  assert.strictEqual(pool.length, 10);
  assert.deepStrictEqual(
    pool.map((s) => s.title.slice(0, 5)).sort(),
    ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05', 'AC-06', 'AC-07', 'AC-08', 'AC-09', 'AC-10'].sort(),
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
  assert.strictEqual(section.code.length, 10, 'ต้องมีครบทั้ง 10 scenario เพราะไม่เดา');
});

test('buildSectionsForFrame: แทนที่ B1/B2/B3 ด้วย section เดียว โดยคงตำแหน่งเดิมและ section อื่นไว้ครบ', () => {
  const node = makeNode('OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ', { children: [] });
  const sections = mod.buildSectionsForFrame(mod.USER_STORIES.plan13, node);
  const gherkinLabels = sections.filter((s) => /AC-03|ไม่มั่นใจ/.test(s.label));
  assert.strictEqual(gherkinLabels.length, 1, 'ต้องเหลือ section Gherkin เดียว ไม่ใช่ 3 (B1/B2/B3 เดิม)');
  assert.ok(sections.some((s) => s.label === 'B4. Business Rules'), 'section อื่นนอกเหนือ Gherkin ต้องยังอยู่ครบ');
  assert.ok(sections.some((s) => s.label === 'A. Story Header'), 'ไม่ได้ลบจากข้อมูล แค่ไม่ render (isStoryHeaderSection กรองทีหลัง)');
});

test('annotateUserStory ปลายทาง: ใช้ AC B.2 จากเอกสารใหม่โดยตรง', async () => {
  resetFigmaMock();
  mod = freshModule();
  const node = makeNode('OH2 / B.2 · S1 — x', {
    width: 300,
    absoluteTransform: [[1, 0, 50], [0, 1, 60]],
    children: [makeTextNode('กรุณาระบุชื่อแผน')],
  });
  const nodes = await mod.annotateUserStory(node, 'plan13');
  assert.ok(nodes.some(n => n.text && n.text.characters.startsWith(mod.FRAME_STORIES['B.2'].title)));
  assert.ok(!nodes.some(n => n.characters && n.characters.startsWith('Scenario:')));
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

test('new document: exact IDs, shared delete modal, corrected A.3/A.4 and Sheet notes', () => {
  assert.strictEqual(Object.keys(mod.FRAME_STORIES).length, 72);
  assert.ok(mod.FRAME_STORIES['A.3'].title.includes('ค้นไม่เจอ'));
  assert.ok(mod.FRAME_STORIES['A.4'].title.includes('ยังไม่มีแผน'));
  for (const id of ['D.2.1', 'D.2.2']) assert.ok(mod.FRAME_STORIES[id].sections.some(x => x.label === 'UI Component & Behavior'));
  assert.ok(JSON.stringify(mod.FRAME_STORIES['I.5']).includes('ยืนยันรับรถสำเร็จ'));
  assert.ok(mod.FRAME_STORIES['O.3'].source.includes('Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md'));
});

test('legacy D.2 shared modal accepts slash and dot names and preserves both origins', async () => {
  for (const name of ['OH2 / D.2 · S3 — ยืนยันการลบแผน', 'OH2 · D.2 ยืนยันการลบแผน']) {
    resetFigmaMock(); mod = freshModule();
    assert.strictEqual(mod.findFlowForNode(name), mod.LETTER_TO_FLOW.D);
    const nodes = await mod.annotateUserStory(makeNode(name), mod.LETTER_TO_FLOW.D);
    const text = nodes.map(node => node.text ? node.text.characters : node.characters || '').join('\n');
    assert.ok(text.includes('AC D.2 — ยืนยันการลบแผน'));
    assert.ok(text.includes('กลับรายการแผน A.1'));
    assert.ok(text.includes('กลับรายละเอียดแผน B.7'));
  }
});

test('legacy H.4 failure toast resolves to H.4.1 without guessing other states', async () => {
  resetFigmaMock(); mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / H.4 · S7 — สร้างนัดไม่สำเร็จ (toast 14)'), mod.LETTER_TO_FLOW.H);
  const text = nodes.map(node => node.text ? node.text.characters : node.characters || '').join('\n');
  assert.ok(text.includes('AC H.4.1 — สร้างนัดไม่สำเร็จ'));
  assert.ok(!text.includes('AC H.4.2'));
  await assert.rejects(() => mod.annotateUserStory(makeNode('OH2 / H.4 · S7 — รอหน่วยงานตอบรับ'), mod.LETTER_TO_FLOW.H), /ไม่พบ AC/);
});

test('legacy H.7 edit and H.6 rejection resolve to their specific appointment AC', async () => {
  for (const [name, expected] of [
    ['OH2 / H.7 · S7 — แก้ไขนัดหมาย', 'H.4.3'],
    ['OH2 / H.6 · S7 — หน่วยงานปฏิเสธนัดเข้าอู่', 'H.4.4'],
  ]) {
    resetFigmaMock(); mod = freshModule();
    const nodes = await mod.annotateUserStory(makeNode(name), mod.LETTER_TO_FLOW.H);
    const text = nodes.map(node => node.text ? node.text.characters : node.characters || '').join('\n');
    assert.ok(text.includes('AC ' + expected + ' —'), name);
  }
  await assert.rejects(() => mod.annotateUserStory(makeNode('OH2 / H.7 · S7 — สร้างนัดไม่สำเร็จ'), mod.LETTER_TO_FLOW.H), /ไม่พบ AC/);
});

test('unknown frame and mismatched manual flow never attach another AC', async () => {
  await assert.rejects(() => mod.annotateUserStory(makeNode('OH2 / B.99 · S1'), 'plan13'), /ไม่พบ AC/);
  await assert.rejects(() => mod.annotateUserStory(makeNode('OH2 / B.2 · S1'), 'scenario14'), /flow ที่เลือกไม่ตรง/);
});

test('readable edition retains every frame section and item in the composed text', () => {
  for (const story of Object.values(mod.FRAME_STORIES)) {
    const result = mod.composeFrameStory(story);
    for (const section of story.sections) {
      if (section.paragraph) assert.ok(result.text.includes(section.paragraph));
      for (const item of section.bullets || []) assert.ok(result.text.includes(item));
    }
    assert.ok(!result.text.includes('**'));
    assert.ok(!result.text.includes('Senior Dev'));
  }
});

test('annotation omits trailing source reference without repeating all shared rules', async () => {
  resetFigmaMock();
  mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  const texts = nodes.map(n => n.text ? n.text.characters : n.characters || '').join('\n');
  assert.ok(!texts.includes('Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md'));
  assert.ok(!texts.includes('อ้างอิง:'));
  assert.ok(!texts.includes('กติกากลาง / Sheet'));
  assert.ok(!texts.includes('สถานะงานรายคัน (chip'));
  assert.ok(texts.includes('UI Component & Behavior'));
});

test('each frame has its own component Dev notes and readable AC source', () => {
  const payloads = new Set();
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    const expectedSource = ['D.2.1', 'D.2.2'].includes(id) ? 'Overhaul-AC-รายเฟรม.md' : 'Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md';
    assert.ok(story.source.startsWith(expectedSource));
    const notes = story.sections.filter(x => x.label === 'UI Component & Behavior');
    assert.strictEqual(notes.length, 1, id);
    assert.ok(notes[0].bullets.length >= 1 , id);
    const payload = JSON.stringify(notes);
    assert.ok(!payloads.has(payload), 'Dev notes reused verbatim: ' + id);
    payloads.add(payload);
  }
});

test('native shape owns editable text, bold headings and cleanup', async () => {
  resetFigmaMock(); mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  assert.strictEqual(nodes.length, 1);
  const shape = nodes[0];
  assert.strictEqual(shape.shapeType, 'SQUARE');
  assert.ok(shape.text.characters.startsWith('AC A.1'));
  assert.strictEqual(shape.text.textAlignHorizontal, 'LEFT');
  for (const heading of ['UI Component & Behavior', 'UI Component & Behavior', 'ประเด็นที่ต้องเคาะ', 'As-is — Sprint 06', 'To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่', 'UI Component & Behavior']) {
    assert.ok(shape.text._bold.some(([start, end]) => shape.text.characters.slice(start, end) === heading), 'heading not bold: ' + heading);
  }
  mod.clearTags(global.figma.currentPage);
  assert.ok(shape._removed);
});

test('component Dev notes distinguish search, filters, signature and read-only states', async () => {
  resetFigmaMock(); mod = freshModule();
  const notes = id => JSON.stringify(mod.FRAME_STORIES[id].sections.filter(s => s.label === 'UI Component & Behavior'));
  for (const word of ['ช่องค้นหา (SearchInput)', 'ตารางรายการแผน', 'ปุ่มเปลี่ยนหน้าใต้ตาราง', 'ปุ่ม']) assert.ok(notes('A.1').includes(word));
  for (const word of ['แผง', 'ช่องเลือกปีงบ', 'ช่องติ๊ก', 'ตกลง']) assert.ok(notes('A.2').includes(word));
  assert.ok(!notes('A.2').includes('ปุ่มเปลี่ยนหน้าใต้ตาราง'));
  assert.ok(notes('E.4').includes('vendor_id'));
  assert.ok(notes('F.2').includes('ช่องติ๊กเลือก'));
  assert.ok(notes('I.3').includes('พื้นที่วาดลายเซ็น'));
  assert.ok(!notes('I.3').includes('ช่องค้นหาเหนือรายการ'));
  assert.ok(notes('H.5').includes('อ่านอย่างเดียว'));
  assert.ok(notes('O.3').includes('ไม่มีแถว ช่องกรอก'));
  const nodes = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  assert.strictEqual(nodes.filter(n => n.type === 'TEXT').length, 0);
  assert.strictEqual(nodes.find(n => n.type === 'SHAPE_WITH_TEXT').shapeType, 'SQUARE');
});

test('all readable behavior and unresolved questions survive design-only simplification', () => {
  const fs = require('fs');
  const path = require('path');
  const raw = fs.readFileSync(path.join(__dirname, 'figjam-userstory-plugin', 'Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md'), 'utf8');
  const headers = [...raw.matchAll(/^### ([A-O]\.\d+(?:\.\d+)?) — (.+)$/gm)];
  assert.strictEqual(headers.length, 70);
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const block = raw.slice(header.index + header[0].length, i + 1 < headers.length ? headers[i + 1].index : raw.length).replace(/\n---[\s\S]*$/, '');
    const text = mod.composeFrameStory(mod.FRAME_STORIES[header[1]]).text;
    let topic = '';
    for (const line of block.split('\n')) {
      const heading = /^\*\*(.+)\*\*$/.exec(line.trim());
      if (heading) {topic = heading[1]; continue;}
      if (!['พฤติกรรมที่ควรทำ', 'ต้องตกลงก่อนทำ'].includes(topic) || !line.startsWith('- ')) continue;
      const bullet = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
      // Visual sample-value mismatches are now intentionally omitted.
      if (/^ชื่อแผน "Overhaul.*mock ไม่ตรงกัน/.test(bullet)) continue;
      if (header[1] === 'A.2' && topic === 'พฤติกรรมที่ควรทำ') continue; // Reworded as comprehensive contracts, tested below.
      if (header[1] === 'E.10' && bullet.includes('รายละเอียดตามสถานะ') && bullet.includes('ตารางกติกากลาง')) {
        const questions = mod.FRAME_STORIES['E.10'].sections
          .filter(section => section.label === 'ประเด็นที่ต้องเคาะ')
          .flatMap(section => section.bullets || []);
        const question = questions.find(value => value.includes('รายละเอียดตามสถานะ'));
        assert.ok(question, 'E.10 must retain the unresolved status-detail question');
        for (const detail of ['ต้องตกลง', 'ตัวอย่างข้อความเพียง 2 สถานะ',
          'รอนัดหมายเข้าอู่', 'รอหน่วยงานตอบรับนัดเข้าอู่', 'หน่วยงานปฏิเสธนัดเข้าอู่',
          'รอตรวจรับรถ', 'กำลังซ่อม', 'รอตรวจสภาพ Safety', 'รอนัดหมายรับรถ',
          'รอหน่วยงานตอบรับนัดหมายรับรถ', 'หน่วยงานปฏิเสธนัดหมายรับรถ',
          'รอปิดงาน', 'ปิดงานแล้ว', 'ชื่อที่ต่างจาก status final ใน Sheet ยังต้องตกลง']) {
          assert.ok(question.includes(detail), 'E.10 missing status-question detail: ' + detail);
        }
        assert.ok(text.includes(question), 'E.10 must render the expanded question');
        continue;
      }
      const {plainLanguage} = require('./figjam-userstory-plugin/merge-behavior');
      assert.ok(text.includes(plainLanguage(bullet.replace(/…$/, ''))), header[1] + ': dropped behavior/question: ' + bullet);
    }
  }
});

test('requested headings include frame-specific source questions and Sheet without mixing AC', () => {
  const text = mod.composeFrameStory(mod.FRAME_STORIES['A.1']).text;
  for (const heading of ['UI Component & Behavior', 'UI Component & Behavior', 'ประเด็นที่ต้องเคาะ', 'As-is — Sprint 06', 'To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่', 'UI Component & Behavior']) assert.ok(text.includes(heading));
  assert.ok(text.includes('ICON Action'));
  assert.ok(text.includes('คอลัมน์ในตาราง'));
  assert.ok(text.includes('AutoComplete'));
  const validation = mod.composeFrameStory(mod.FRAME_STORIES['B.2']).text;
  assert.ok(validation.includes('ช่องเอกสารใน B.2 ไม่ขึ้น error'));
  assert.ok(!validation.includes('คอลัมน์ CF'));
  assert.ok(!validation.includes('[Sheet พี่นุ — 1 รายการแผน]'));
  assert.ok(!validation.includes('[Sheet พี่นุ'));
});

test('A.2 documents overlay, Esc, cancel destination and draft persistence from project components', () => {
  const text = mod.composeFrameStory(mod.FRAME_STORIES['A.2']).text;
  for (const term of ['คลิกพื้นหลังทึบ', 'Esc', 'กลับไปดูรายการ A.1', 'ไม่ใช้ตัวกรองที่เพิ่งเปลี่ยน', 'คลิกภายในแผง', 'แผงยังเปิด', 'ล้างแล้วกดยกเลิก', 'กรองทันที']) assert.ok(text.includes(term), term);
});

test('cancel destinations distinguish page forms, confirmation dialogs and popup drafts', () => {
  const text = id => mod.composeFrameStory(mod.FRAME_STORIES[id]).text;
  assert.ok(text('C.2').includes('เข้าจากหน้ารายละเอียด'));
  assert.ok(text('C.3').includes('กลับ C.2 พร้อม ข้อมูลที่ยังไม่บันทึก'));
  assert.ok(text('C.4').includes('ไม่บันทึกและไม่กลับรายการ'));
  assert.ok(text('D.2.2').includes('กลับรายละเอียดแผนเดิม B.7 ไม่กลับรายการ'));
  assert.ok(text('F.2').includes('มาจากรายละเอียด PO กลับ PO เดิม'));
  assert.ok(text('J.2').includes('กลับ J.1/J.3'));
  assert.ok(text('L.2').includes('กลับตาราง L.1 พร้อมรายการครบเดิม'));
});

test('observed project gaps are explicit rather than treated as implemented AC', () => {
  const text = id => mod.composeFrameStory(mod.FRAME_STORIES[id]).text;
  assert.ok(text('H.3').includes('ไม่มีปุ่ม Apply/Cancel'));
  assert.ok(text('I.3').includes('ยังไม่มี กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) วาดลายเซ็น'));
  assert.ok(text('J.2').includes('ไม่นำช่องนี้มาเพิ่มใน AC'));
  assert.ok(text('B.1').includes('เส้นทางนำทางด้านบน เป็นลิงก์ตรง'));
  assert.ok(text('C.4').includes('ยังปิดด้วยพื้นหลัง/Esc ได้ระหว่างรอ'));
});

test('Dev names pair the visible label and internal component in parentheses', () => {
  const notes = id => JSON.stringify(mod.FRAME_STORIES[id].sections.filter(x => x.label === 'UI Component & Behavior'));
  for (const [id, label] of [
    ['C.1', 'เมนู “…” ท้ายแถวรายการ (RowMenu)'],
    ['A.1', 'ช่องค้นหา (SearchInput)'],
    ['A.2', 'แผงด้านขวา (FilterPanel / PlanFilter)'],
    ['D.2.1', 'กล่อง “ยืนยันการลบแผน” (ConfirmDialog)'],
    ['E.4', 'ช่องพิมพ์ค้นและเลือกจากรายการ (Combobox)'],
    ['I.3', 'กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้)'],
  ]) assert.ok(notes(id).includes(label), id + ': ' + label);
});

test('Sprint 06 baseline matches state semantics when H/I/N frame IDs changed', () => {
  assert.ok(mod.FRAME_STORIES['H.4.2'].baseline.frameNames.every(n => n.includes('H.5') && n.includes('รอหน่วยงานตอบรับ')));
  assert.ok(mod.FRAME_STORIES['I.5'].baseline.frameNames.some(n => n.includes('I.2') && n.includes('ลงนาม')));
  assert.ok(mod.FRAME_STORIES['N.4.2'].baseline.frameNames.some(n => n.includes('N.2') && n.includes('รอหน่วยงานตอบรับ')));
  assert.strictEqual(mod.FRAME_STORIES['I.3'].baseline.frameNames.length, 0);
  assert.ok(mod.FRAME_STORIES['I.3'].sections.find(s => s.label.startsWith('To-be')).bullets.some(t => t.startsWith('NEW')));
});

test('A.2 separates an existing filter from new behavior specifications and integrates Sheet provenance', () => {
  const story = mod.FRAME_STORIES['A.2'];
  assert.ok(story.sections.find(s => s.label === 'As-is — Sprint 06').bullets.some(text => text.includes('จากเดิม มีปีงบ')));
  const delta = story.sections.find(s => s.label.startsWith('To-be'));
  assert.ok(delta.bullets.some(t => t.startsWith('CHANGE') && t.includes('[Sheet พี่นุ — 1 รายการแผน]')));
  assert.ok(delta.bullets.some(t => t.startsWith('NEW') && t.includes('ไม่ใช่สร้างตัวกรองใหม่ทั้งชุด')));
  assert.ok(!story.sections.some(s => s.label.startsWith('จาก Sheet')));
  const text = mod.composeFrameStory(story).text;
  assert.ok(text.includes('ประเภทยานพาหนะ (เพิ่ม):'));
  assert.ok(text.includes('[Sheet พี่นุ — 1 รายการแผน]'));
});

test('every frame has baseline evidence and a bounded To-be claim', () => {
  for (const story of Object.values(mod.FRAME_STORIES)) {
    assert.strictEqual(story.sections[0].label, 'ภาพรวมหน้านี้');
    assert.ok(story.sections.some(s => s.label === 'As-is — Sprint 06'));
    assert.ok(story.sections.some(s => s.label.startsWith('To-be')));
    assert.ok(story.sections.find(s => s.label.startsWith('To-be')).bullets.every(t => /^(NEW|CHANGE) — /.test(t)));
    assert.ok(story.baseline.board.includes('Refinement 15/10/69'));
  }
});

test('all 72 frames have authored As-is and at least two specific NEW/CHANGE requirements', () => {
  const payloads = new Set();
  assert.strictEqual(Object.keys(mod.FRAME_STORIES).length, 72);
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    const asIs = story.sections.find(x => x.label === 'As-is — Sprint 06');
    const toBe = story.sections.find(x => x.label.startsWith('To-be'));
    assert.ok(asIs.bullets.length >= 1, id);
    assert.ok(asIs.bullets.every(text => !/baseline/i.test(text)), id);
    assert.strictEqual(asIs.paragraph, undefined, id);
    assert.ok(toBe.bullets.length >= 2, id);
    assert.ok(toBe.bullets.every(t => /^(NEW|CHANGE) — /.test(t)), id);
    const payload = JSON.stringify(toBe.bullets);
    assert.ok(!payload.includes('ยังไม่มีข้อแตกต่างเฉพาะเฟรม'), id);
    assert.ok(!payload.includes('คงเดิมในระดับ flow'), id);
    assert.ok(!payloads.has(payload), 'generic delta copied to ' + id);
    payloads.add(payload);
  }
});

test('all frames order overview, As-is, To-be and UI components', () => {
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    const labels = story.sections.map(s => s.label);
    assert.strictEqual(labels[0], 'ภาพรวมหน้านี้', id);
    assert.deepStrictEqual(story.sections[0].bullets.map(text => text.split(':')[0]), ['What', 'Who', 'Do'], id);
    assert.ok(!JSON.stringify(story.sections).includes('Page Behavior'), id);
    assert.ok(!labels.includes('จากจอเดิม'), id);
    assert.ok(!labels.includes('พฤติกรรมที่ควรทำ'), id);
    const asIs = labels.indexOf('As-is — Sprint 06');
    const toBe = labels.indexOf('To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่');
    const details = labels.indexOf('UI Component & Behavior');
    const dev = labels.indexOf('UI Component & Behavior');
    assert.ok(asIs === 1 && toBe === 2 && details === 3 && details === dev, id);
    assert.strictEqual(story.sections[details].level, 'h2');
    assert.ok(story.sections[toBe].bullets.length >= 2, id);
  }
});

test('A.2 screen section retains all fields, defaults and footer actions', () => {
  const story = mod.FRAME_STORIES['A.2'];
  const start = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
  const end = story.sections.findIndex(s => s.label === 'Error Handling / Edge Cases');
  const text = JSON.stringify(story.sections.slice(start, start + 1));
  for (const word of ['โดยแสดงตัวกรองที่ใช้อยู่จริง', '× / Esc', 'คลิกพื้นหลังทึบ',
    'ปีงบประมาณ: dropdown ค่าเริ่มต้น', 'ทั้งหมด', 'checkbox 6 ช่วง', 'เลือกได้หลายช่วง',
    'ช่องเลือกสถานะ', 'ล้างตัวกรอง', 'ยกเลิก', 'ตกลง', '[Sheet พี่นุ — 1 รายการแผน]']) {
    assert.ok(text.includes(word), 'missing A.2 screen detail: ' + word);
  }
});

test('screen facts use bullets without restarted numbering and coalesce adjacent lists', () => {
  const story = mod.FRAME_STORIES['A.2'];
  const start = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
  const end = story.sections.findIndex(s => s.label === 'Error Handling / Edge Cases');
  const screen = story.sections.slice(start, start + 1);
  assert.strictEqual(screen.filter(s => s.bullets).length, 1);
  const text = mod.composeFrameStory(story).text;
  assert.ok(text.includes('- ปีงบประมาณ: dropdown'));
  assert.ok(!/^\d+\. /m.test(text));
  assert.ok(!text.includes('ปีงบประมาณ: ✅ CF'));
  assert.ok(screen[0].bullets.some(t => t.includes('ปีงบประมาณ: dropdown') && t.includes('[Sheet พี่นุ — 1 รายการแผน]')));
});

test('empty question placeholders are omitted without dropping real questions', () => {
  for (const story of Object.values(mod.FRAME_STORIES)) {
    const text = mod.composeFrameStory(story).text;
    assert.ok(!text.includes('ฉบับอ่านง่ายยังไม่ได้ระบุคำถามสำหรับเฟรมนี้'));
    assert.ok(!text.includes('ยังไม่มีประเด็นเพิ่มเติมระบุใน AC ต้นฉบับของเฟรมนี้'));
  }
  assert.ok(mod.composeFrameStory(mod.FRAME_STORIES['B.2']).text.includes('ช่องเอกสารใน B.2 ไม่ขึ้น error'));
});

test('status changes are explicit old-to-new pairs with per-line Sheet provenance', () => {
  const text = mod.composeFrameStory(mod.FRAME_STORIES['A.1']).text;
  assert.ok(text.includes('ลูกค้าแก้ชื่อสถานะ:'));
  assert.ok(text.includes('ยังไม่มี PO -> รอเลข PO [Sheet พี่นุ — 1 รายการแผน]'));
  assert.ok(text.includes('ดำเนินการ -> รอดำเนินการ [Sheet พี่นุ — 1 รายการแผน]'));
  assert.ok(text.includes('เสร็จสิ้น: ใช้ชื่อเดิม'));
  assert.ok(!text.includes('ลูกค้าแก้จาก'));
  const delta = mod.FRAME_STORIES['A.2'].sections.find(s => s.label.startsWith('To-be'));
  assert.ok(delta.bullets.some(t => t.startsWith('CHANGE — ลูกค้าแก้ชื่อสถานะ:')));
});

test('formatting clarifies pagination options and other explicit change notes without changing values', () => {
  const {formatContent} = require('./figjam-userstory-plugin/format-content');
  assert.strictEqual(formatContent('Pagination (10,25,50,100)'), 'จำนวนรายการต่อหน้า: 10, 25, 50 หรือ 100 รายการ');
  assert.strictEqual(formatContent('Pagination (10, 25, 50)'), 'จำนวนรายการต่อหน้า: 10, 25 หรือ 50 รายการ');
  const text = mod.composeFrameStory(mod.FRAME_STORIES['G.2']).text;
  assert.ok(text.includes('ลบ purchase order สำเร็จ -> ลบ PO สำเร็จ [Sheet พี่นุ'));
  assert.strictEqual(formatContent('1. Status: คงเดิม'), 'Status: คงเดิม');
});

test('permission facts are separated before screen details with their Sheet provenance', () => {
  const story = mod.FRAME_STORIES['A.1'];
  const access = story.sections.findIndex(s => s.label === 'สิทธิ์การใช้งาน (Permission)');
  const screen = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
  assert.ok(access > screen);
  const permission = story.sections[access].bullets.join('\n');
  assert.ok(permission.includes('กบค. (admin-super): เห็นทุกแผน'));
  assert.ok(permission.includes('กรย. เขต (admin-region): เปิดได้เฉพาะแผนที่มีรถในเขตตัวเอง'));
  assert.ok(permission.includes('[Sheet พี่นุ — OH-Permission]'));
  const screenEnd = story.sections.findIndex(s => s.label === 'Error Handling / Edge Cases');
  assert.ok(!JSON.stringify(story.sections.slice(screen, screen + 1)).includes('Permission:'));
  for (const value of Object.values(mod.FRAME_STORIES)) {
    assert.ok(!value.sections.some(s => s.label === 'ต้องตกลงก่อนทำ'));
    assert.ok(!value.sections.some(s => s.label === 'สิ่งที่อยู่บนหน้าจอ'));
  }
});

test('mixed Sheet facts keep status, permission and notifications in their appropriate sections', () => {
  const {splitPermissionFacts, mergeQuestions} = require('./figjam-userstory-plugin/format-content');
  const split = splitPermissionFacts('Status: รอตรวจ · Permission อัปโหลด/ยืนยัน เฉพาะ กบค. · ไม่มี notification · ไม่สำเร็จใช้ General Error [Sheet พี่นุ — OH-Toast #22]');
  assert.strictEqual(split.permission.length, 1);
  assert.ok(split.permission[0].startsWith('อัปโหลด/ยืนยัน เฉพาะ กบค.'));
  assert.ok(split.permission[0].includes('[Sheet พี่นุ — OH-Toast #22]'));
  assert.ok(split.other.some(t => t.startsWith('Status:')));
  assert.ok(split.other.some(t => t.startsWith('ไม่มี notification')));
  assert.ok(split.other.some(t => t.startsWith('ไม่สำเร็จ')));
  const merged = mergeQuestions([{bullets: ['ต้องเคาะ: ขนาดไฟล์สูงสุด…']}, {bullets: ['ขนาดไฟล์สูงสุดต่อไฟล์และจำนวนไฟล์']}, {bullets: ['คำถามคนละเรื่อง']}]);
  assert.deepStrictEqual(merged, ['ขนาดไฟล์สูงสุดต่อไฟล์และจำนวนไฟล์', 'คำถามคนละเรื่อง']);
});

test('A.1 uses one confirmed column set and removes passive design annotations', () => {
  const story = mod.FRAME_STORIES['A.1'];
  const start = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
  const end = story.sections.findIndex(s => s.label === 'Error Handling / Edge Cases');
  const text = JSON.stringify(story.sections.slice(start, start + 1));
  assert.strictEqual((text.match(/คอลัมน์ในตาราง/g) || []).length, 1);
  for (const unwanted of ['ตารางมี 8 คอลัมน์', 'คอลัมน์ CF', 'แสดง 2 บรรทัด', 'ตัดออก:', 'Status: chip', 'เป็น chip:']) assert.ok(!text.includes(unwanted), unwanted);
  for (const needed of ['นับรถไม่ซ้ำจากทุก PO', 'รถที่ปิดงานแล้ว / รถทั้งหมด', 'ยังไม่มี PO -> รอเลข PO', 'ดำเนินการ -> รอดำเนินการ', '[Sheet พี่นุ — 1 รายการแผน]', 'Sorting:']) assert.ok(text.includes(needed), needed);
});

test('A.2 keeps multi-select behavior while explaining status renames only once', () => {
  const text = mod.composeFrameStory(mod.FRAME_STORIES['A.2']).text;
  assert.strictEqual((text.match(/ลูกค้าแก้ชื่อสถานะ:/g) || []).length, 1);
  assert.ok(text.includes('ช่องเลือกสถานะ: เลือกได้หลายค่าพร้อมกัน'));
  assert.ok(!text.includes('สถานะ: checkbox 3 ค่า'));
});

test('all 72 frames have specific Error Handling / Edge Cases immediately after Dev', () => {
  const seen = new Set();
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    const dev = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
    const sections = story.sections.filter(s => s.label === 'Error Handling / Edge Cases');
    assert.strictEqual(sections.length, 1, id);
    assert.strictEqual(story.sections.find(s => s.label === 'Error Handling / Edge Cases'), sections[0], id);
    assert.ok(sections[0].bullets.length >= 2, id);
    const payload = JSON.stringify(sections[0].bullets);
    assert.ok(!seen.has(payload), 'reused generic cases: ' + id);
    seen.add(payload);
    const questions = story.sections.findIndex(s => s.label === 'ประเด็นที่ต้องเคาะ');
    if (questions >= 0) assert.ok(dev + 1 < questions, id);
  }
});

test('edge cases cover actual state-specific failures, not a global checklist', async () => {
  const cases = id => mod.FRAME_STORIES[id].sections.find(s => s.label === 'Error Handling / Edge Cases').bullets.join('\n');
  assert.ok(cases('A.1').includes('ผลคำเก่าที่กลับมาช้า'));
  assert.ok(cases('B.5').includes('ไม่ทราบว่าคำขอเดิมสำเร็จหรือยัง'));
  assert.ok(cases('H.4.3').includes('หน่วยงานตอบรับขณะ'));
  assert.ok(cases('I.3').includes('ยังไม่มีเส้นวาด'));
  assert.ok(cases('M.2').includes('คงไฟล์สำเร็จอื่น'));
  assert.ok(cases('O.3').includes('อ่านอย่างเดียว'));
  assert.ok(!cases('O.3').includes('พิมพ์ค้นหา'));
  resetFigmaMock(); mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  const shape = nodes.find(n => n.type === 'SHAPE_WITH_TEXT');
  assert.ok(shape.text.characters.includes('Error Handling / Edge Cases'));
  assert.ok(shape.text._bold.some(([start, end]) => shape.text.characters.slice(start, end) === 'Error Handling / Edge Cases'));
  assert.strictEqual(nodes.filter(n => n.type === 'TEXT').length, 0);
});

test('long plan-name overflow remains an explicit screen behavior after simplification', async () => {
  const story = mod.FRAME_STORIES['A.1'];
  const start = story.sections.findIndex(s => s.label === 'UI Component & Behavior');
  const end = story.sections.findIndex(s => s.label === 'Error Handling / Edge Cases');
  const facts = story.sections.slice(start, start + 1).flatMap(s => s.bullets || []);
  assert.strictEqual(facts.filter(t => t.includes('ชื่อแผนยาวเกินคอลัมน์')).length, 1);
  assert.ok(facts.some(t => t.includes('ชื่อแผนยาวเกินคอลัมน์') && t.includes('…')));
  resetFigmaMock(); mod = freshModule();
  const nodes = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  const shape = nodes.find(n => n.type === 'SHAPE_WITH_TEXT');
  assert.ok(shape.text.characters.includes('ชื่อแผนยาวเกินคอลัมน์ตัดด้วย'));
});

test('screen cleanup preserves QA display and state contracts alongside actions', () => {
  const {simplifyScreenSections} = require('./figjam-userstory-plugin/simplify-screen');
  const behaviors = [
    'หัวข้อ เมื่อชื่อแผนยาวเกินคอลัมน์ ตัดด้วย “…”',
    'breadcrumb อ่านอย่างเดียวสำหรับผู้ไม่มีสิทธิ์แก้ไข',
    'หัวข้อ ซ่อนเมื่อไม่มีข้อมูล',
    'หัวข้อ แสดง error เมื่อโหลดไม่สำเร็จ',
    'ตารางมี 8 คอลัมน์: เมื่อไม่มี PO แสดง “-”',
    'ปุ่มยืนยัน disabled จนกว่าจะกรอกข้อมูลครบ',
    'กดยกเลิกแล้วกลับหน้ารายการโดยไม่บันทึก',
  ];
  const sections = simplifyScreenSections([
    {label: 'รายละเอียดหน้าจอ', bullets: [
      'คอลัมน์ CF: เลขแผน, ชื่อแผน, ประเภทงบ',
      'หัวข้อ จัดการงาน Overhaul',
      'คอลัมน์ "ประเภทงบ" แสดง 2 บรรทัด: ประเภทงบ และเลขงบ',
      ...behaviors,
    ]},
    {label: 'มุม Dev', bullets: ['แนวทางพัฒนา']},
  ]);
  const facts = sections[0].bullets;
  for (const behavior of behaviors) assert.ok(facts.includes(behavior), behavior);
  assert.ok(!facts.includes('หัวข้อ จัดการงาน Overhaul'));
  assert.ok(!facts.some(t => t.includes('แสดง 2 บรรทัด')));
});

test('component grouping retains source contracts, provenance and separate tables', () => {
  const {groupComponents} = require('./figjam-userstory-plugin/group-components');
  const input = [
    {label: 'Behavior', bullets: ['เปิดหน้า']},
    {label: 'รายละเอียดหน้าจอ', bullets: ['ชื่อแผนยาวเกินคอลัมน์ตัดด้วย “…” [Sheet พี่นุ — 1 รายการแผน]']},
    {label: '', table: {headers: ['Field'], rows: [['ชื่อแผน']]}},
    {label: 'มุม Dev', bullets: [
      'เมนู “…” ท้ายแถว (RowMenu): กด Esc แล้วปิดและคืน focus',
      'ปุ่ม “ยกเลิก”: กลับรายการและทิ้งข้อมูลที่ยังไม่บันทึกเมื่อยืนยันออก',
    ]},
    {label: 'Error Handling / Edge Cases', bullets: ['โหลดไม่สำเร็จ']},
  ];
  const snapshot = JSON.stringify(input);
  const output = groupComponents(input);
  assert.strictEqual(JSON.stringify(input), snapshot, 'must not mutate source sections');
  const ui = output.find(s => s.label === 'UI Component & Behavior');
  for (const source of input.slice(1, 4)) {
    for (const fact of source.bullets || []) assert.ok(ui.bullets.some(t => t.includes(fact)), fact);
  }
  assert.deepStrictEqual(output.find(s => s.table).table, input[2].table);
  assert.ok(!output.some(s => s.label === 'รายละเอียดหน้าจอ' || s.label.startsWith('มุม Dev')));
});

test('A.1 names each button destination and keeps overflow on the plan-name column', () => {
  const ui = mod.FRAME_STORIES['A.1'].sections.find(section => section.label === 'UI Component & Behavior');
  const buttons = ui.bullets.find(text => text.startsWith('Buttons\n'));
  assert.ok(buttons.includes('ปุ่ม “ตัวกรอง”: เปิดแผงตัวกรอง A.2'));
  assert.ok(buttons.includes('\n  - ปุ่ม “+ สร้างแผน Overhaul”: เปิดฟอร์มสร้างแผน B.1'));
  assert.ok(!buttons.includes('ตามลำดับ'));
  const table = ui.bullets.find(text => text.startsWith('Table (DataTable)\n'));
  assert.ok(table.includes('ชื่อแผน: ชื่อแผนยาวเกินคอลัมน์ตัดด้วย'));
});

test('72 frames use component groups and distinguish absent controls', async () => {
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    const groups = story.sections.filter(s => s.label === 'UI Component & Behavior');
    assert.strictEqual(groups.length, 1, id);
    assert.ok(!story.sections.some(s => s.label === 'รายละเอียดหน้าจอ' || s.label.startsWith('มุม Dev')), id);
    assert.ok(groups[0].bullets.every(t => t.includes('\n  - ')), id);
  }
  const table = mod.FRAME_STORIES['A.1'].sections.find(s => s.label === 'UI Component & Behavior').bullets.find(t => t.startsWith('Table (DataTable)\n'));
  for (const child of ['Columns', 'Row Actions (RowMenu)', 'Sorting', 'Pagination']) assert.ok(table.includes('  - ' + child));
  const empty = mod.FRAME_STORIES['A.4'].sections.find(s => s.label === 'UI Component & Behavior');
  assert.ok(!empty.bullets.some(t => t.startsWith('Search Input')));
  assert.ok(empty.bullets.some(t => t.startsWith('Visibility\n') && t.includes('ไม่มีช่องค้นหา')));
  resetFigmaMock(); mod = freshModule();
  const [shape] = await mod.annotateUserStory(makeNode('OH2 / A.1 · S1'), 'plan13');
  assert.ok(shape.text._bold.some(([a, b]) => shape.text.characters.slice(a, b) === 'Table (DataTable)'));
});

test('all frames have a single Behavior with development details inline', () => {
  for (const [id, story] of Object.entries(mod.FRAME_STORIES)) {
    assert.strictEqual(story.sections.filter(s => s.label === 'UI Component & Behavior').length, 1, id);
    assert.strictEqual(story.sections[0].label, 'ภาพรวมหน้านี้', id);
    const text = mod.composeFrameStory(story).text;
    assert.ok(!text.includes('Dev Note'), id);
    assert.ok(!/\n\s*- Actions\n/.test(text), id);
    assert.ok(!text.includes('ค่าร่าง'), id);
  }
  const behavior = mod.FRAME_STORIES['A.2'].sections.find(section => section.label === 'UI Component & Behavior').bullets.join('\n');
  for (const term of ['ไม่เปลี่ยนตารางด้านหลัง', 'คลิกพื้นหลังทึบ', 'เปิดใหม่แสดงตัวกรองที่ใช้อยู่จริง', 'ต้องกด “ตกลง” จึงเปลี่ยนผลในตาราง', 'หน้าเบื้องหลังเลื่อนไม่ได้', 'คลิก label']) assert.ok(behavior.includes(term), term);
  assert.strictEqual((behavior.match(/กด “ล้างตัวกรอง” →/g) || []).length, 1);
});

test('rule merging keeps distinct source tags and qualifications', () => {
  const {mergeRules} = require('./figjam-userstory-plugin/merge-behavior');
  assert.deepStrictEqual(mergeRules(['กด Esc ปิดเมนู', 'กด Esc ปิดเมนูและคืน focus', 'กด Esc ปิดเมนู']), ['กด Esc ปิดเมนูและคืน focus']);
  const tagged = ['ปิดได้ [Sheet พี่นุ — 1]', 'ปิดได้ [Sheet พี่นุ — 2]', 'ปิดได้เฉพาะเมื่อไม่กำลังบันทึก'];
  assert.deepStrictEqual(mergeRules(tagged), tagged);
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
