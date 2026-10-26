#!/usr/bin/env node
/* สร้าง USER_STORIES ใน code.js จาก Diagram/01-บำรุงรักษาตามวาระ/25-overhaul-user-stories-AC.md
 * โดยตรง (ไม่พิมพ์มือ) — parse เป็นโครงสร้าง {title, sections:[{level,label,table|code|bullets|paragraph}]}
 * เพื่อให้ตัว plugin สร้าง TABLE/CODE_BLOCK/TEXT จริงใน FigJam แทนการแปะ markdown เป็น text ก้อนเดียว
 * (เจ้าของงานสั่ง 26 ต.ค. 2569 — "แยกเป็นตารางจริง + กล่องย่อยตามหัวข้อ")
 * รันซ้ำได้เรื่อยๆ ถ้าไฟล์ 25 เปลี่ยน: node build-content.js */
const fs = require('fs');
const path = require('path');

const DOC_PATH = path.join(__dirname, '..', '..', 'Diagram', '01-บำรุงรักษาตามวาระ', '25-overhaul-user-stories-AC.md');
const CODE_PATH = path.join(__dirname, 'code.js');

const STORY_TO_FLOW = {
  'US-OH-01': 'plan13',
  'US-OH-02': 'po46',
  'US-OH-03': 'scenario7',
  'US-OH-04': 'scenario8',
  'US-OH-05': 'scenario911',
  'US-OH-06': 'scenario12',
  'US-OH-07': 'scenario13',
  'US-OH-08': 'scenario14',
};

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

function splitMarkers(cleaned) {
  const lines = cleaned.split('\n');
  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = /^## (.+)$/.exec(l))) markers.push({ level: 'h2', label: m[1].trim(), line: i });
    else if ((m = /^### (.+)$/.exec(l))) markers.push({ level: 'h3', label: m[1].trim(), line: i });
    else if ((m = /^\*\*(.+)\*\*$/.exec(l))) markers.push({ level: 'bold', label: m[1].trim(), line: i });
  }
  const segments = [];
  for (let i = 0; i < markers.length; i++) {
    const s = markers[i].line + 1;
    const e = i + 1 < markers.length ? markers[i + 1].line : lines.length;
    const content = lines.slice(s, e).join('\n');
    segments.push({ level: markers[i].level, label: markers[i].label, ...parseSegmentContent(content) });
  }
  return segments;
}

function parseStory(block) {
  const titleMatch = /^# (US-OH-\d\d) (.+)$/m.exec(block);
  const title = titleMatch[1] + ' ' + titleMatch[2];
  const body = block.slice(block.indexOf('\n') + 1).replace(/^\s*---\s*$/gm, '');
  return { title, sections: splitMarkers(body) };
}

const raw = fs.readFileSync(DOC_PATH, 'utf8');
const headerRe = /^# (US-OH-\d\d) .+$/gm;
const matches = [...raw.matchAll(headerRe)];
if (matches.length !== 8) {
  console.error('คาดว่าเจอ 8 story headers แต่เจอ ' + matches.length + ' — ตรวจไฟล์ 25 ก่อน');
  process.exit(1);
}

const storyBlocks = {};
for (let i = 0; i < matches.length; i++) {
  const start = matches[i].index;
  const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
  let body = raw.slice(start, end).trim();
  body = body.replace(/\n+---\s*$/, '');
  storyBlocks[matches[i][1]] = body;
}

const missing = Object.keys(STORY_TO_FLOW).filter((id) => !storyBlocks[id]);
if (missing.length) {
  console.error('ไม่พบ story: ' + missing.join(', '));
  process.exit(1);
}

const USER_STORIES = {};
for (const [id, flowKey] of Object.entries(STORY_TO_FLOW)) {
  USER_STORIES[flowKey] = parseStory(storyBlocks[id]);
  // เช็คว่า parse ไม่มี section เปล่าที่ไม่ใช่ h2 divider (= parser พลาด ต้องตรวจ regex ก่อนใช้)
  for (const s of USER_STORIES[flowKey].sections) {
    const empty = !s.table && !s.code && !s.bullets && !s.paragraph;
    if (empty && s.level !== 'h2') {
      console.error('⚠️  ' + id + ' section "' + s.label + '" parse ไม่ออกอะไรเลย — ตรวจรูปแบบในไฟล์ 25 ก่อนใช้ผลนี้');
      process.exit(1);
    }
  }
}

const block = 'const USER_STORIES = ' + JSON.stringify(USER_STORIES, null, 2) + ';';

let code = fs.readFileSync(CODE_PATH, 'utf8');
const re = /const USER_STORIES = \{[\s\S]*?\n\};/;
if (!re.test(code)) {
  console.error('ไม่พบ USER_STORIES block เดิมใน code.js — แก้ regex หรือตรวจไฟล์มือ');
  process.exit(1);
}
code = code.replace(re, block);
fs.writeFileSync(CODE_PATH, code);

console.log('เติม USER_STORIES (โครงสร้าง table/code/bullets จริง) ครบ 8 flow แล้ว');
for (const [id, flowKey] of Object.entries(STORY_TO_FLOW)) {
  const s = USER_STORIES[flowKey];
  const tables = s.sections.filter((x) => x.table).length;
  const codes = s.sections.filter((x) => x.code).length;
  const bullets = s.sections.filter((x) => x.bullets).length;
  console.log('  ' + flowKey + ' (' + id + '): ' + s.sections.length + ' sections — table:' + tables + ' code:' + codes + ' bullets:' + bullets);
}
