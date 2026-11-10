// Rebuild embedded Sprint 09 AC from the reviewed Markdown source.
const fs = require('fs');
const path = require('path');
const source = path.resolve(__dirname, '../../docs/sprint09-acceptance-criteria.md');
const labels = {R: 'ข้อสรุป refinement', D: 'ตามหน้าจอ — รอยืนยัน Sprint scope', P: 'ข้อเสนอ — รอรับรอง'};
function parse(text) {
  const stories = {};
  const headings = [...text.matchAll(/^## (US-S09-\d+) — (.+)$/gm)];
  for (let i = 0; i < headings.length; i++) {
    const [, id, title] = headings[i];
    const body = text.slice(headings[i].index + headings[i][0].length, headings[i + 1]?.index || text.indexOf('## ประเด็นที่ต้องสรุป'));
    const ac = [];
    const context = [];
    for (const line of body.split('\n')) {
      if (line.startsWith('| AC-S09-')) {
        const cells = line.split('|').slice(1, -1).map(s => s.trim());
        const level = cells.length === 3 ? cells[1] : 'D';
        if (!labels[level]) throw Error('Unknown level: ' + level);
        ac.push({id: cells[0], level, text: cells.at(-1)});
      } else if (!/^\| (AC ID|ระดับ|---)/.test(line) && line.trim()) context.push(line);
    }
    if (!ac.length) throw Error('Missing AC for ' + id);
    stories[id] = {id, title, ac, context: context.join('\n')};
  }
  const ids = Object.values(stories).flatMap(s => s.ac.map(a => a.id));
  if (headings.length !== 9 || ids.length !== 62 || new Set(ids).size !== ids.length) throw Error('Incomplete/duplicate Sprint 09 AC');
  return stories;
}
function build() {
  const stories = parse(fs.readFileSync(source, 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'sprint09-frame-map.json'), 'utf8'));
  for (const rule of rules) {
    new RegExp(rule.pattern, 'i');
    const story = stories['US-S09-' + rule.story];
    if (!story || rule.ac.some(id => !story.ac.some(ac => ac.id === 'AC-S09-' + rule.story + '-' + id))) throw Error('Invalid frame mapping');
  }
  const file = path.join(__dirname, 'code.js');
  let code = fs.readFileSync(file, 'utf8');
  const block = '// BEGIN SPRINT09_AC\nconst SPRINT09_AC = ' + JSON.stringify(stories, null, 2) + ';\nconst SPRINT09_FRAME_MAP = ' + JSON.stringify(rules, null, 2) + ';\n// END SPRINT09_AC';
  code = code.includes('// BEGIN SPRINT09_AC')
    ? code.replace(/\/\/ BEGIN SPRINT09_AC[\s\S]*?\/\/ END SPRINT09_AC/, () => block)
    : code.replace('/* ---------- ทางเข้าจริงของปลั๊กอิน ---------- */', block + '\n\n/* ---------- ทางเข้าจริงของปลั๊กอิน ---------- */');
  fs.writeFileSync(file, code);
  console.log('Built Sprint 09: 9 stories / 62 AC');
}
if (require.main === module) build();
module.exports = {parse, build};
