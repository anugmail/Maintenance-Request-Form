#!/usr/bin/env node
// Build readable per-frame stories; preserve all source items and separate tables.
const fs = require('fs');
const path = require('path');
const CODE_PATH = path.join(__dirname, 'code.js');
const {formatContent, mergeQuestions, splitPermissionFacts} = require('./format-content');
const {simplifyScreenSections} = require('./simplify-screen');
const {groupComponents} = require('./group-components');
const {inlineRules} = require('./inline-rules');
const {pageSummary} = require('./page-summary');

function parseSegmentContent(raw) {
  const text = raw.trim();
  if (!text) return {};
  const codeMatches = [...text.matchAll(/```gherkin\n([\s\S]*?)```/g)];
  if (codeMatches.length) return { code: codeMatches.map((m) => m[1].trim()) };
  const lines = text.split('\n');
  if (lines[0] && lines[0].trim().startsWith('|')) {
    let i = 0;
    const tableLines = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i].trim()); i++; }
    const cells = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
    const headers = cells(tableLines[0]);
    const rows = tableLines.slice(2).map(cells); // แถว 2 คือเส้น --- ตัดทิ้ง
    const rest = lines.slice(i).join('\n').trim();
    const result = { table: { headers, rows } };
    if (rest) result.paragraph = rest; // ข้อความเพิ่มเติมท้ายตาราง (เช่น warning/note) ถ้ามี
    return result;
  }
  const bulletLines = lines.filter((l) => /^-\s/.test(l.trim()));
  if (bulletLines.length) {
    return { bullets: bulletLines.map((l) => l.trim().replace(/^-\s*(\[ \]\s*)?/, '')) };
  }
  return { paragraph: text };
}

// The per-frame refinement document supersedes document 25 for annotations.
const FRAME_DOC_PATH = path.join(__dirname, 'Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md');
function cleanInline(text) {
  return text.replace(/senior\s+developer/gi, 'Dev').replace(/senior\s+dev/gi, 'Dev').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
}
function readable(text) {
  return cleanInline(text).replace(/\s+(Given|When|Then|And)(?=\s)/g, '\n$1');
}
function parseBlocks(raw, defaultLabel) {
  const sections = [];
  let pendingLabel = defaultLabel;
  let current = null;
  function section(kind) {
    if (!current || !current[kind] || pendingLabel) {
      current = {level: 'h3', label: pendingLabel || ''};
      current[kind] = kind === 'bullets' ? [] : '';
      sections.push(current);
      pendingLabel = '';
    }
    return current;
  }
  for (const line of raw.trim().split('\n')) {
    const text = line.trim();
    if (!text || /^---+$/.test(text)) continue;
    const heading = /^#{2,4} (.+)$/.exec(text);
    const boldHeading = /^\*\*(.+?)\*\*(.*)$/.exec(text);
    if (heading || boldHeading) {
      pendingLabel = cleanInline(heading ? heading[1] : boldHeading[1]).replace(/:$/, '');
      current = null;
      if (heading || !boldHeading[2].trim()) continue;
      section('paragraph').paragraph = readable(boldHeading[2].trim());
    } else if (text.startsWith('|')) {
      if (!current || !current._tableLines) {
        current = {level: 'h3', label: pendingLabel || '', _tableLines: []};
        pendingLabel = '';
        sections.push(current);
      }
      current._tableLines.push(text);
    } else if (text.startsWith('⚠️')) {
      if (!current || current.label !== 'ประเด็นที่ต้องเคาะ') {
        pendingLabel = 'ประเด็นที่ต้องเคาะ';
        current = null;
      }
      section('bullets').bullets.push(readable(text.replace(/^⚠️\s*/, '')));
    } else if (/^-\s/.test(text)) {
      section('bullets').bullets.push(readable(text.replace(/^-\s*/, '')));
    } else {
      const target = section('paragraph');
      target.paragraph += (target.paragraph ? '\n\n' : '') + readable(text);
    }
  }
  for (const item of sections) {
    if (item._tableLines) {
      Object.assign(item, parseSegmentContent(item._tableLines.join('\n')));
      delete item._tableLines;
      item.table.headers = item.table.headers.map(cleanInline);
      item.table.rows = item.table.rows.map(row => row.map(cleanInline));
    }
  }
  return sections;
}
const raw = fs.readFileSync(FRAME_DOC_PATH, 'utf8');
const headers = [...raw.matchAll(/^### ([A-O]\.\d+(?:\.\d+)?) — (.+)$/gm)];
const frames = {};
for (let i = 0; i < headers.length; i++) {
  const h = headers[i];
  const end = i + 1 < headers.length ? headers[i + 1].index : raw.length;
  const body = raw.slice(h.index + h[0].length, end).replace(/\n---[\s\S]*$/, '');
  if (frames[h[1]]) throw new Error('Duplicate frame ' + h[1]);
  frames[h[1]] = {title: 'AC ' + h[1] + ' — ' + h[2], sections: parseBlocks(body, ''), source: path.basename(FRAME_DOC_PATH)};
}
// Readable AC is the presentation baseline. Full source is used only for the
// two missing modal frames; Dev notes are explicitly authored per complete ID.
const originalName = 'Overhaul-AC-รายเฟรม.md';
const original = fs.readFileSync(path.join(__dirname, originalName), 'utf8');
const shared = /^### AC D\.2\.1 \/ D\.2\.2 — (.+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/m.exec(original);
for (const id of ['D.2.1', 'D.2.2']) {
  if (!frames[id]) {
    if (!shared) throw new Error('Missing delete confirmation AC');
    frames[id] = {title: 'AC ' + id + ' — ' + shared[1], sections: parseBlocks(shared[2], 'จากจอเดิม'), source: originalName};
  }
}
const devName = 'Overhaul-Dev-แนวทางประกอบ.md';
const devRaw = fs.readFileSync(path.join(__dirname, devName), 'utf8');
const devHeaders = [...devRaw.matchAll(/^## ([A-O]\.\d+(?:\.\d+)?)$/gm)];
const devByFrame = {};
for (let i = 0; i < devHeaders.length; i++) {
  const h = devHeaders[i];
  if (devByFrame[h[1]]) throw new Error('Duplicate Dev frame ' + h[1]);
  const body = devRaw.slice(h.index + h[0].length, i + 1 < devHeaders.length ? devHeaders[i + 1].index : devRaw.length);
  devByFrame[h[1]] = parseBlocks(body, 'มุม Dev — Component ในเฟรมนี้ (แนวทางพัฒนา)');
}
// Read only the selected frame's warnings and Sheet notes from the full AC.
const originalHeaders = [...original.matchAll(/^### AC ([A-O]\.\d+(?:\.\d+)?(?: \/ [A-O]\.\d+(?:\.\d+)?)*) — (.+)$/gm)];
const extraByFrame = {};
for (const h of originalHeaders) {
  const rest = original.slice(h.index + h[0].length);
  const nextHeading = rest.search(/^#{2,3} /m);
  const sections = parseBlocks(nextHeading < 0 ? rest : rest.slice(0, nextHeading), '');
  for (const id of h[1].split(' / ')) extraByFrame[id] = sections;
}
function combined(label, sections, empty) {
  const bullets = [...new Set(sections.flatMap(x => [...(x.bullets || []), ...(x.paragraph ? [x.paragraph] : [])]))];
  return bullets.length ? {level: 'h3', label, bullets} : null;
}
for (const [id, story] of Object.entries(frames)) {
  if (!devByFrame[id] || !devByFrame[id].length) throw new Error('Missing component Dev notes: ' + id);
  const base = story.sections.filter(x => !['ต้องตกลงก่อนทำ', 'ประเด็นที่ต้องเคาะ'].includes(x.label) && !x.label.startsWith('จาก Sheet'));
  const questions = story.sections.filter(x => x.label === 'ต้องตกลงก่อนทำ');
  const details = extraByFrame[id] || [];
  const warnings = details.filter(x => x.label === 'ประเด็นที่ต้องเคาะ');
  const sheet = details.filter(x => x.label.startsWith('จาก Sheet'));
  story.sections = [
    ...base, ...devByFrame[id],
    combined('ประเด็นที่ต้องเคาะ', [{bullets: mergeQuestions([...questions, ...warnings])}]),
    ...sheet,
  ].filter(Boolean);
  if (!story.source.includes(originalName)) story.source += ' + ' + originalName;
  story.source += ' + ' + devName;
}
// Sprint 06 baseline: the named FigJam board and the prior-screen snapshot
// referenced by the repository's baseline audit. Never match state IDs alone:
// H/N/I changed numbering, and E/L contain duplicate IDs in the old snapshot.
const baselineBoardPath = path.join(__dirname, '..', 'out', 'figjam-dump', 'overhaul-flow', '7733-73340.json');
const baselineScreensPath = path.join(__dirname, '..', 'out', 'figma-dump', 'component-overhaul', '1387-1201443.json');
const baselineBoard = JSON.parse(fs.readFileSync(baselineBoardPath, 'utf8'));
const baselineScreens = JSON.parse(fs.readFileSync(baselineScreensPath, 'utf8'));
const baselineFrames = [];
function walkBaseline(value) {
  if (Array.isArray(value)) { value.forEach(walkBaseline); return; }
  if (!value || typeof value !== 'object') return;
  if ((value.name || '').startsWith('OH2 /')) baselineFrames.push(value);
  Object.values(value).forEach(v => {if (v && typeof v === 'object') walkBaseline(v);});
}
walkBaseline(baselineScreens);
function baselineTexts(value, result = []) {
  if (Array.isArray(value)) {value.forEach(v => baselineTexts(v, result)); return result;}
  if (!value || typeof value !== 'object' || value.visible === false) return result;
  const text = value.characters || value.text;
  if (typeof text === 'string') result.push(text);
  Object.values(value).forEach(v => {if (v && typeof v === 'object') baselineTexts(v, result);});
  return result;
}
const baselineBoardText = baselineTexts(baselineBoard).join('\n');
if (!baselineBoardText.includes('Overhaul')) throw new Error('Invalid Sprint 06 board');
const stateMap = {
  'A.3':['A.3','ค้นไม่เจอ'],
  'D.1.1':['D.1','เมนู'], 'D.1.2':null,
  'D.2.1':['D.2','ยืนยันการลบ'], 'D.2.2':['D.2','ยืนยันการลบ'],
  'H.1':['H.1','ฟอร์มนัด'], 'H.2':['H.2','ยังไม่ครบ'], 'H.3':['H.3','ผู้ประสานงาน'],
  'H.4.1':['H.4','ไม่สำเร็จ'], 'H.4.2':['H.5','รอหน่วยงาน'],
  'H.4.3':['H.7','แก้ไขนัดหมาย'], 'H.4.4':['H.6','ปฏิเสธ'], 'H.5':null,
  'I.1':['I.1','รายการตรวจสอบ'], 'I.2':null, 'I.3':null, 'I.4':null, 'I.5':['I.2','ลงนาม'],
  'K.2':null, 'K.3':null,
  'L.2':['L.2','ยืนยันการลบ'], 'L.3':null,
  'N.1':['N.1','ฟอร์มนัด'], 'N.2':null, 'N.3':null, 'N.4.1':null,
  'N.4.2':['N.2','รอหน่วยงาน'], 'N.4.3':null, 'N.4.4':['N.3','ปฏิเสธ'], 'N.5':null,
};
const deltaName = 'Overhaul-Sprint06-Delta-รายเฟรม.md';
const deltaRaw = fs.readFileSync(path.join(__dirname, deltaName), 'utf8');
const deltaHeaders = [...deltaRaw.matchAll(/^## ([A-O]\.\d+(?:\.\d+)?)$/gm)];
const deltas = {};
for (let i = 0; i < deltaHeaders.length; i++) {
  const h = deltaHeaders[i];
  if (deltas[h[1]]) throw new Error('Duplicate delta frame ' + h[1]);
  const sections = parseBlocks(deltaRaw.slice(h.index + h[0].length, i + 1 < deltaHeaders.length ? deltaHeaders[i + 1].index : deltaRaw.length), '');
  const asIs = sections.find(x => x.label === 'As-is');
  const toBe = sections.find(x => x.label === 'To-be');
  if (!asIs || !asIs.bullets || !asIs.bullets.length || !toBe || !toBe.bullets || toBe.bullets.length < 2 || toBe.bullets.some(t => !/^(NEW|CHANGE) — /.test(t))) {
    throw new Error('Incomplete As-is/NEW/CHANGE for ' + h[1]);
  }
  deltas[h[1]] = {asIs: asIs.bullets, toBe: toBe.bullets};
}
if (Object.keys(deltas).length !== Object.keys(frames).length) throw new Error('Delta coverage must match every frame');
function annotateSheet(section) {
  const suffix = section.label.replace(/^จาก Sheet\s*/, '').replace(/:$/, '').trim();
  const tag = '[Sheet พี่นุ' + (suffix ? ' — ' + suffix.replace(/^\(|\)$/g, '') : '') + ']';
  return {
    ...section, label: '',
    ...(section.bullets ? {bullets: section.bullets.map(t => t + ' ' + tag)} : {}),
    ...(section.paragraph ? {paragraph: section.paragraph + ' ' + tag} : {}),
  };
}
for (const [id, story] of Object.entries(frames)) {
  const mapping = Object.prototype.hasOwnProperty.call(stateMap, id) ? stateMap[id] : [id, ''];
  let candidates = mapping ? baselineFrames.filter(n => n.name.startsWith('OH2 / ' + mapping[0] + ' ·') && n.name.includes(mapping[1])) : [];
  // Exclude obsolete alternate versions when a canonical state has a toast suffix.
  if (id.startsWith('E.') && candidates.length > 1) {
    const named = candidates.filter(n => /toast|บันทึกไม่สำเร็จ|เปิดฟอร์ม/.test(n.name));
    if (named.length) candidates = named;
  }
  const frameNames = [...new Set(candidates.map(n => n.name))];
  if (!deltas[id]) throw new Error('Missing frame delta: ' + id);
  const asIs = deltas[id].asIs.map(text => text.replace(/baseline/gi, 'จากเดิม'));
  const delta = deltas[id].toBe;
  const remaining = [];
  const sheetFacts = [];
  for (const section of story.sections) {
    if (section.label.startsWith('จาก Sheet')) {
      if (section.paragraph && section.paragraph.startsWith('ยังไม่มีข้อมูลจาก Sheet')) continue;
      sheetFacts.push(annotateSheet(section));
    } else remaining.push(section);
  }
  const permissionFacts = [];
  const splitSheet = [];
  for (const section of sheetFacts) {
    const result = {...section};
    if (result.bullets) result.bullets = result.bullets.flatMap(text => {
      const separated = splitPermissionFacts(text);
      permissionFacts.push(...separated.permission);
      return separated.other;
    });
    if (result.paragraph) {
      const separated = splitPermissionFacts(result.paragraph);
      permissionFacts.push(...separated.permission);
      if (separated.other.length) result.paragraph = separated.other.join('\n\n');
      else delete result.paragraph;
    }
    if (result.paragraph || result.table || result.code || (result.bullets && result.bullets.length)) splitSheet.push(result);
  }
  sheetFacts.splice(0, sheetFacts.length, ...splitSheet);
  // To-be is the complete target screen, not just the change list. Preserve
  // every readable on-screen statement, and restore the full screen's concrete
  // fields/buttons/defaults omitted by that summary (e.g. A.2's six ranges).
  const onScreen = remaining.filter(x => x.label === 'จากจอเดิม');
  const behavior = remaining.filter(x => x.label === 'พฤติกรรมที่ควรทำ');
  const rest = remaining.filter(x => !['จากจอเดิม', 'พฤติกรรมที่ควรทำ'].includes(x.label));
  const fullScreen = (extraByFrame[id] || []).filter(x => !x.label);
  const details = [];
  const seenDetails = new Set();
  for (const section of [...onScreen, ...fullScreen]) {
    const result = {...section, label: ''};
    if (result.bullets) {
      result.bullets = result.bullets.map(text => text
        .replace(/(^|\n)(?:Given|When|Then|And)\s+/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(text => {
          if (seenDetails.has(text)) return false;
          seenDetails.add(text); return true;
        });
    }
    if (result.paragraph || result.table || result.code || (result.bullets && result.bullets.length)) details.push(result);
  }
  // Screen facts are a single logical list. Merge adjacent blocks and prefer
  // attributed copies when the only difference is the Sheet provenance tag.
  const screen = [];
  const normalizeFact = text => text.replace(/\[Sheet พี่นุ[^\]]*\]/g, '')
    .replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const allFacts = [...details, ...sheetFacts];
  const seenFacts = new Map();
  for (const section of allFacts) {
    const result = {...section, label: ''};
    if (result.bullets) result.bullets = result.bullets.filter(text => {
      const key = normalizeFact(text);
      if (!key) return false;
      if (seenFacts.has(key)) {
        const previous = seenFacts.get(key);
        if (text.includes('[Sheet พี่นุ') && !previous.text.includes('[Sheet พี่นุ')) {
          previous.list[previous.index] = text;
          previous.text = text;
        }
        return false;
      }
      return true;
    });
    const previous = screen[screen.length - 1];
    if (result.bullets && !result.paragraph && !result.table && !result.code) {
      const target = previous && previous.bullets && !previous.paragraph && !previous.table && !previous.code
        ? previous : {level: 'h2', label: '', bullets: []};
      if (target !== previous && result.bullets.length) screen.push(target);
      for (const text of result.bullets) {
        const key = normalizeFact(text);
        if (seenFacts.has(key)) continue;
        seenFacts.set(key, {list: target.bullets, index: target.bullets.length, text});
        target.bullets.push(text);
      }
    } else if (result.paragraph || result.table || result.code || (result.bullets && result.bullets.length)) screen.push(result);
  }
  // A bare "ปีงบประมาณ: CF" adds no new screen fact. Keep its provenance
  // on the actual field description instead of giving confirmation its own row.
  const redundantConfirmations = new Set();
  for (const section of screen) {
    for (const text of section.bullets || []) {
      const confirmation = /^([^:]+):\s*(?:✅\s*)?CF\s*(\[Sheet พี่นุ[^\]]*\])$/.exec(text);
      if (!confirmation) continue;
      for (const other of screen) {
        const index = (other.bullets || []).findIndex(t => t !== text && t.startsWith(confirmation[1] + ':'));
        if (index < 0) continue;
        if (!other.bullets[index].includes(confirmation[2])) other.bullets[index] += ' ' + confirmation[2];
        redundantConfirmations.add(text);
        break;
      }
    }
  }
  for (const section of screen) {
    if (section.bullets) section.bullets = section.bullets.filter(text => !redundantConfirmations.has(text));
  }
  if (!screen.length) throw new Error('Missing screen content: ' + id);
  screen[0].label = 'รายละเอียดหน้าจอ';
  screen[0].level = 'h2';
  const behaviorContent = behavior.length ? behavior : onScreen;
  const behaviorTop = behaviorContent.map((section, index) => ({...section, level: 'h2', label: index === 0 ? 'Behavior' : ''}));
  story.sections = [
    ...behaviorTop,
    {level: 'h2', label: 'As-is — Sprint 06', bullets: asIs},
    {level: 'h2', label: 'To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่', bullets: delta},
    ...(permissionFacts.length ? [{level: 'h2', label: 'สิทธิ์การใช้งาน (Permission)', bullets: [...new Set(permissionFacts)]}] : []),
    ...screen,
    ...rest,
  ];
  story.source += ' + ' + deltaName;
  story.baseline = {board: 'Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026', frameNames};
}
// Rephrase compressed change notes after merging/deduplication so source tags
// remain attached to each expanded change and screen content is not dropped.
for (const story of Object.values(frames)) {
  story.sections = story.sections.map(section => ({
    ...section,
    ...(section.bullets ? {bullets: section.bullets.map(formatContent)} : {}),
    ...(section.paragraph ? {paragraph: formatContent(section.paragraph)} : {}),
  }));
  story.sections = simplifyScreenSections(story.sections);
}
if (Object.keys(devByFrame).length !== Object.keys(frames).length) throw new Error('Unexpected Dev frame IDs');
const edgeName = 'Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md';
const edgeRaw = fs.readFileSync(path.join(__dirname, edgeName), 'utf8');
const edgeHeaders = [...edgeRaw.matchAll(/^## ([A-O]\.\d+(?:\.\d+)?)$/gm)];
const edges = {};
for (let i = 0; i < edgeHeaders.length; i++) {
  const h = edgeHeaders[i];
  if (edges[h[1]]) throw new Error('Duplicate edge case frame: ' + h[1]);
  const body = edgeRaw.slice(h.index + h[0].length, i + 1 < edgeHeaders.length ? edgeHeaders[i + 1].index : edgeRaw.length);
  const sections = parseBlocks(body, 'Error Handling / Edge Cases');
  if (sections.length !== 1 || !sections[0].bullets || sections[0].bullets.length < 2) throw new Error('Incomplete edge cases: ' + h[1]);
  edges[h[1]] = {...sections[0], level: 'h2'};
}
if (Object.keys(edges).length !== Object.keys(frames).length) throw new Error('Edge cases must cover every frame');
for (const [id, story] of Object.entries(frames)) {
  if (!edges[id]) throw new Error('Missing edge cases: ' + id);
  const index = story.sections.findIndex(s => s.label.startsWith('มุม Dev'));
  if (index < 0) throw new Error('Missing Dev insertion point: ' + id);
  // Move standalone failure instructions out of Dev instead of duplicating them.
  // Mixed component/action descriptions remain there: they describe normal use.
  const moved = (story.sections[index].bullets || []).filter(t => /^เมื่อยืนยันไม่สำเร็จ:|^Loading\/ไม่พบอู่\/error/.test(t));
  story.sections[index].bullets = (story.sections[index].bullets || []).filter(t => !moved.includes(t));
  const edge = {...edges[id], bullets: [...edges[id].bullets]};
  for (const note of moved) {
    const matching = edge.bullets.findIndex(t => note.startsWith('เมื่อยืนยันไม่สำเร็จ:')
      ? t.startsWith('บันทึกล้มเหลว') : t.startsWith('ค้นอู่ไม่สำเร็จ'));
    if (matching < 0) edge.bullets.push(note);
    else edge.bullets[matching] += '\n' + note;
  }
  story.sections.splice(index + 1, 0, edge);
  story.source += ' + ' + edgeName;
}
for (const [id, story] of Object.entries(frames)) {
  story.sections = inlineRules(story);
  story.sections = groupComponents(story.sections, id);
  const ui = story.sections[0];
  const pageRules = ui.bullets.filter(text => text.startsWith('Page Behavior\n'));
  const summary = pageSummary(id, story.title).split('\n').slice(1)
    .map(text => text.replace(/^  - /, ''));
  ui.bullets = [
    ...(pageRules.length ? ['พฤติกรรมการใช้งาน\n' + pageRules.map(text => text.slice('Page Behavior\n'.length)).join('\n')] : []),
    ...ui.bullets.filter(text => !text.startsWith('Page Behavior\n')),
  ];
  const remaining = story.sections.slice(1);
  const asIs = remaining.filter(section => section.label === 'As-is — Sprint 06');
  const toBe = remaining.filter(section => section.label.startsWith('To-be'));
  story.sections = [
    {level: 'h2', label: 'ภาพรวมหน้านี้', bullets: summary},
    ...asIs, ...toBe, ui,
    ...remaining.filter(section => !asIs.includes(section) && !toBe.includes(section)),
  ];
}
const common = parseBlocks(raw.slice(raw.indexOf('## กติกาที่ใช้ร่วมกัน'), headers[0].index), '');
if (Object.keys(frames).length !== 72) throw new Error('Expected 72 frame IDs, got ' + Object.keys(frames).length);
let code = fs.readFileSync(CODE_PATH, 'utf8');
const generated = '// BEGIN FRAME_STORIES\nconst FRAME_STORIES = ' + JSON.stringify(frames, null, 2) + ';\nconst FRAME_COMMON = ' + JSON.stringify(common, null, 2) + ';\n// END FRAME_STORIES';
if (code.includes('// BEGIN FRAME_STORIES')) code = code.replace(/\/\/ BEGIN FRAME_STORIES[\s\S]*?\/\/ END FRAME_STORIES/, () => generated);
else code = code.replace('const TAG_KEY', generated + '\n\nconst TAG_KEY');
fs.writeFileSync(CODE_PATH, code);
const review = [
  '# Overhaul — As-is Sprint 06 / To-be รายเฟรม',
  'อ้างอิง: Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026',
  'หลักฐาน: figma-export/out/figjam-dump/overhaul-flow/7733-73340.json และจอประกอบ sprint ก่อนใน figma-export/out/figma-dump/component-overhaul/1387-1201443.json',
  'NEW = เพิ่มรายละเอียดจากสิ่งที่แหล่งอ้างอิงระบุ ไม่ใช่ยืนยันว่าต้องเขียนใหม่ทุกกรณี; ส่วนที่โค้ดรองรับแล้วระบุแยกไว้ ไม่ใช้จำนวนเฟรมหรือรหัสเดียวกันเป็นหลักฐานว่าพฤติกรรมเหมือนกันทั้งหมด',
];
for (const story of Object.values(frames)) {
  review.push('## ' + story.title);
  for (const section of story.sections) {
    if (section.label.startsWith('มุม Dev') || ['ต้องตกลงก่อนทำ', 'ประเด็นที่ต้องเคาะ'].includes(section.label)) break;
    if (section.label) review.push((section.level === 'h2' ? '### ' : '#### ') + section.label);
    if (section.paragraph) review.push(section.paragraph);
    if (section.bullets) review.push(...section.bullets.map(t => '- ' + t));
    if (section.code) review.push(...section.code.map(t => '```gherkin\n' + t + '\n```'));
    if (section.table) {
      review.push('| ' + section.table.headers.join(' | ') + ' |');
      review.push('| ' + section.table.headers.map(() => '---').join(' | ') + ' |');
      review.push(...section.table.rows.map(row => '| ' + row.join(' | ') + ' |'));
    }
  }
}
fs.writeFileSync(path.join(__dirname, 'Overhaul-Sprint06-As-is-To-be.md'), review.join('\n\n') + '\n');

console.log('Built exact AC for ' + Object.keys(frames).length + ' frames from ' + path.basename(FRAME_DOC_PATH));
