#!/usr/bin/env node
/* ============================================================
   ท่อนที่ 0 — โหลด SVG ของไอคอน Material Symbols ที่หน้าจอใช้จริง
   ------------------------------------------------------------
   ทำไมต้องมี: Figma ไม่มีฟอนต์ "Material Symbols Outlined"
   ถ้าปล่อยเป็น text มันจะเรนเดอร์ "ชื่อไอคอน" เป็นตัวอักษร
   แล้วกล่องกว้าง 20px บังคับให้ตัดบรรทัดทีละตัว กลายเป็นเสาตัวอักษร
   ที่ดันเลย์เอาต์พังทั้งหน้า (เจอจริงรอบแรก)

   รัน:  node figma-export/0-icons.js
   ผลลัพธ์: out/icons.json  { "build": "<svg…>", … }  — มี cache ไม่โหลดซ้ำ
   ============================================================ */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const CACHE = path.join(OUT, 'icons.json');
const SLUGS = ['index', 'plan-new', 'supplies', 'confirm', 'plan-skeleton'];
const URL = (name) => 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/' + name + '/default/24px.svg';

function collectNames() {
  const names = new Set();
  for (const slug of SLUGS) {
    const file = path.join(OUT, 'dom-' + slug + '.json');
    if (!fs.existsSync(file)) continue;
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    (function walk(n) {
      if (n.tag === '#text') return;
      if ((n.classes || []).includes('ms')) {
        const glyph = (n.children || []).filter(k => k.tag === '#text').map(k => k.chars).join('').trim();
        if (glyph) names.add(glyph);
      }
      (n.children || []).forEach(walk);
    })(d.root);
  }
  return [...names].sort();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const names = collectNames();
  const todo = names.filter(n => !cache[n]);

  console.log('ไอคอนที่หน้าจอใช้ ' + names.length + ' ตัว · มีใน cache แล้ว ' + (names.length - todo.length) + ' · ต้องโหลด ' + todo.length);

  const failed = [];
  for (let i = 0; i < todo.length; i += 8) {
    const batch = todo.slice(i, i + 8);
    await Promise.all(batch.map(async (name) => {
      try {
        const res = await fetch(URL(name));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const svg = (await res.text()).trim();
        if (!svg.startsWith('<svg')) throw new Error('ไม่ใช่ SVG');
        cache[name] = svg;
      } catch (e) {
        failed.push(name + ' (' + e.message + ')');
      }
    }));
    process.stdout.write('.');
  }
  if (todo.length) process.stdout.write('\n');

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 0));
  console.log('เขียน ' + path.relative(process.cwd(), CACHE) + ' — ' + Object.keys(cache).length + ' ไอคอน');

  if (failed.length) {
    console.log('\n⚠ โหลดไม่ได้ ' + failed.length + ' ตัว (จะกลายเป็นกล่องเปล่าในไฟล์ Figma):');
    failed.forEach(f => console.log('   ' + f));
    process.exitCode = 1;
  }
}

main().catch(e => { console.error(e); process.exit(1); });
