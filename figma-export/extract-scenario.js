#!/usr/bin/env node
/* ดึงเนื้อหา (label/text/button) ของ scenario เดียวจาก figjam-dump JSON
   โดยหา FRAME ที่ชื่อมี "S<N> —" หรือ "S<N> " ตรงกับเลข scenario แล้วเดิน subtree นั้นพิมพ์ label/text
   ใช้: node extract-scenario.js <json-path> <scenarioNum>
*/
const fs = require('fs');
const [jsonPath, numArg] = process.argv.slice(2);
if (!jsonPath || !numArg) {
  console.error('ใช้: node extract-scenario.js <json-path> <scenarioNum>');
  process.exit(1);
}
const num = numArg;
const d = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const root = d.root;

// หา FRAME ทุกตัวที่ชื่อ match " S<num> " หรือ " S<num>—" หรือ "S<num> —"
const re = new RegExp('\\bS' + num + '\\b');
const frames = [];
function collectFrames(n) {
  if (n.type === 'FRAME' && n.name && re.test(n.name)) {
    frames.push(n);
  }
  for (const k of n.kids || []) collectFrames(k);
}
collectFrames(root);

console.log('=== Scenario ' + num + ' — พบ ' + frames.length + ' เฟรม ===\n');

function dump(n, depth, lines) {
  const indent = '  '.repeat(depth);
  if (n.type === 'TEXT' && n.text) {
    lines.push(indent + '[' + (n.name || 'Text') + '] ' + n.text.replace(/\n/g, ' ⏎ '));
  } else if (n.name && (n.type === 'FRAME' || n.type === 'INSTANCE' || n.type === 'GROUP')) {
    lines.push(indent + '— ' + n.name + ' [' + n.type + ']');
  }
  for (const k of n.kids || []) dump(k, depth + 1, lines);
}

for (const f of frames) {
  console.log('### FRAME: ' + f.name + '  (' + f.w + 'x' + f.h + ')');
  const lines = [];
  dump(f, 0, lines);
  console.log(lines.join('\n'));
  console.log();
}
