// เทสโครงข้อมูลของ skeleton-data.js — รันด้วย: node test/skeleton-data.test.js
// (เทส migration + การ render อยู่ฝั่งเบราว์เซอร์ เพราะต้องใช้ localStorage จริง)

const { DEFAULT_SKEL, SAMPLE, SRC_LABELS, GROUP_LABELS } = require('../skeleton-data.js');

let pass = 0, fail = 0;
const ok = (cond, msg) => cond ? (pass++, console.log('  ✓', msg)) : (fail++, console.log('  ✗', msg));
const eq = (a, b, msg) => ok(a === b, `${msg} (ได้ ${JSON.stringify(a)} · คาด ${JSON.stringify(b)})`);

const screens = DEFAULT_SKEL.screens;
const allFields = screens.flatMap(s => s.sections.flatMap(se => se.fields));
const allAsks = screens.flatMap(s => s.asks || []);

console.log('\nโครงรวม');
eq(DEFAULT_SKEL.version, 2, 'version = 2');
eq(screens.length, 10, 'มี 10 หน้าจอ');
eq(new Set(screens.map(s => s.id)).size, 10, 'screen id ไม่ซ้ำ');

console.log('\nแบ่งกลุ่ม');
const byGroup = g => screens.filter(s => s.group === g).length;
eq(byGroup('issue'), 2, 'กลุ่ม issue 2 จอ (ตัดจอเลือกอะไหล่ออก 17 ส.ค. 2569)');
eq(byGroup('phase'), 6, 'กลุ่ม phase 6 จอ (เฟส 1 แตกเป็น 1a/1b)');
eq(byGroup('unit'), 2, 'กลุ่ม unit 2 จอ');
ok(screens.every(s => GROUP_LABELS[s.group]), 'ทุกจอมี group ที่รู้จัก');

console.log('\nฟิลด์บังคับของแต่ละหน้าจอ');
ok(screens.every(s => typeof s.title === 'string' && s.title), 'ทุกจอมี title');
ok(screens.every(s => 'no' in s), 'ทุกจอมี no');
ok(screens.every(s => 'real' in s), 'ทุกจอมี real (null = ยังเป็นหน้าเปล่า)');
ok(screens.every(s => Array.isArray(s.sections) && s.sections.length), 'ทุกจอมี sections อย่างน้อย 1');
ok(screens.every(s => Array.isArray(s.asks)), 'ทุกจอมี asks (array)');
ok(screens.every(s => s.no || s.icon), 'จอที่ไม่มีเลข ต้องมี icon แทน');

console.log('\nsection + field');
ok(screens.every(s => s.sections.every(se => se.kind === 'form' || se.kind === 'table')), 'kind เป็น form/table เท่านั้น');
ok(screens.every(s => new Set(s.sections.map(se => se.id)).size === s.sections.length), 'section id ไม่ซ้ำในจอเดียวกัน');
ok(allFields.every(f => typeof f.label === 'string' && f.label), 'ทุกฟิลด์มี label');
ok(allFields.every(f => typeof f.show === 'boolean' && typeof f.done === 'boolean'), 'ทุกฟิลด์มี show/done เป็น boolean');

console.log('\nแหล่งข้อมูล');
const badSrc = allFields.filter(f => f.src && !SAMPLE[f.src]);
ok(badSrc.length === 0, `ทุก src ที่ระบุมีจริงใน SAMPLE${badSrc.length ? ' — เจอผิด: ' + badSrc.map(f => f.src).join(', ') : ''}`);
const missLabel = Object.keys(SAMPLE).filter(k => !(k in SRC_LABELS));
ok(missLabel.length === 0, `ทุก key ใน SAMPLE มีชื่อไทยใน SRC_LABELS${missLabel.length ? ' — ขาด: ' + missLabel.join(', ') : ''}`);
eq(Object.keys(SAMPLE).length, 37, 'แหล่งข้อมูล 37 ตัว (+v.province +v.blockReason +v.bucket)');

console.log('\nคำถามที่ต้องเคาะ');
eq(allAsks.length, 21, 'รวม 21 ข้อ (17 ของเดิม + 4 ของยืนยันรถ)');
eq(new Set(allAsks.map(a => a.id)).size, 21, 'ask id ไม่ซ้ำ');
ok(allAsks.every(a => a.status === 'open' && a.ans === ''), 'ตั้งต้นทุกข้อยัง "รอเคาะ" และคำตอบว่าง');
eq(screens.find(s => s.id === 'ph1a').asks.length, 4, 'จอยืนยันรถมีคำถามใหม่ 4 ข้อ');
eq(screens.find(s => s.id === 'ph2').asks.length, 5, 'เฟส 2 มีคำถาม 5 ข้อ');

console.log('\nสถานะหน้าจริง');
const real = screens.filter(s => s.real);
eq(real.length, 6, 'มี 6 จอที่ทำหน้าจริงแล้ว (ออกเลขงาน 2 · ยืนยันรถ 1a · เฟส 1b · พัสดุ · หน่วยงานเจ้าของรถ)');
ok(screens.filter(s => !s.real).every(s => s.sections.flatMap(se => se.fields).every(f => !f.done)),
   'จอที่ยังไม่มีหน้าจริง ทุกฟิลด์ต้อง done:false');

console.log(`\n${fail ? '✗ ไม่ผ่าน' : '✓ ผ่าน'} — ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
