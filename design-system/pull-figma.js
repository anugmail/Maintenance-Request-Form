#!/usr/bin/env node
/* ============================================================================
   ดึงไฟล์ Figma "แหล่งความจริง" ของโปรเจกต์ทั้ง 2 ไฟล์ แล้วสกัดให้พร้อมใช้
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 1 ก.ย. 2569: **ให้ใช้ข้อมูลจาก 2 ไฟล์นี้เท่านั้น**
     1. (Component) VMS Plus        VmOC07pKEsDkHZagOgcSU2   ← คอมโพเนนต์/ไลบรารี
     2. (UI) VMS Plus - Release 2   fYD1yA1uzWsJSjHlcWKMNe   ← หน้าจอจริง
   (ของเดิม IMiHaWKCqp6j3lpWdCnYY8 = EXT_PEA_VMS_v1.0.2_Component เลิกใช้)

   ต้องมี token ก่อน — ดู design-system/HOWTO-read-figma.md ข้อ 2
     printf '%s' 'figd_xxx' > ~/.figma-token && chmod 600 ~/.figma-token
   scope ต้องมี file_content:read

   ใช้:
     node design-system/pull-figma.js --list     # ดูรายชื่อหน้าก่อน (เบา ไม่โหลดทั้งไฟล์)
     node design-system/pull-figma.js            # ดึงเต็ม + สกัด + ทำแคตตาล็อก

   ผลลัพธ์:
     design-system/.figma-extract/<slug>/<page-id>.json     (gitignored — ไฟล์ใหญ่)
     design-system/.figma-extract/<slug>/00-summary-*.json
     design-system/figma-components.json                    (commit ได้ — ถอดข้อความจริงออกแล้ว)
   ดัมป์ดิบเก็บนอก repo (os.tmpdir) เสมอ — ห้าม commit และห้ามเปิดเข้า context ของ AI
   ============================================================================ */
const fs = require('fs'), path = require('path'), os = require('os'), https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  { slug: 'component', key: 'VmOC07pKEsDkHZagOgcSU2', label: '(Component) VMS Plus' },
  { slug: 'ui-release2', key: 'fYD1yA1uzWsJSjHlcWKMNe', label: '(UI) VMS Plus - Release 2' },
];

const tokenPath = path.join(os.homedir(), '.figma-token');
if (!fs.existsSync(tokenPath)) {
  console.error('ไม่พบ ~/.figma-token — ออก token ที่ figma.com → Settings → Security → Personal access tokens');
  console.error('scope ต้องมี file_content:read แล้วเก็บด้วย  printf \'%s\' \'figd_xxx\' > ~/.figma-token');
  process.exit(1);
}
const TOKEN = fs.readFileSync(tokenPath, 'utf8').trim();

function get(url, outFile) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'X-Figma-Token': TOKEN } }, res => {
      if (res.statusCode !== 200) {
        let e = ''; res.on('data', d => e += d);
        return res.on('end', () => reject(new Error(`HTTP ${res.statusCode} — ${e.slice(0, 200)}`)));
      }
      if (outFile) {
        const w = fs.createWriteStream(outFile);
        res.pipe(w); w.on('finish', () => resolve(outFile)); w.on('error', reject);
      } else {
        let s = ''; res.on('data', d => s += d); res.on('end', () => resolve(JSON.parse(s)));
      }
    });
    req.on('error', reject);
  });
}

// ---- แคตตาล็อกคอมโพเนนต์: ชื่อ · variant · property (ถอดค่าข้อความจริงทิ้ง) ----
function catalog(doc, file) {
  const setProps = {}, instByComp = {};
  (function walk(n) {
    if (n.type === 'COMPONENT_SET' && n.componentPropertyDefinitions) setProps[n.id] = n.componentPropertyDefinitions;
    if (n.type === 'INSTANCE' && n.componentId) instByComp[n.componentId] = (instByComp[n.componentId] || 0) + 1;
    (n.children || []).forEach(walk);
  })(doc);

  const comps = file.components || {}, sets = file.componentSets || {};
  const rows = {};
  for (const [id, c] of Object.entries(comps)) {
    const setId = c.componentSetId;
    const name = setId && sets[setId] ? sets[setId].name : c.name;
    const r = rows[name] || (rows[name] = { name, fromLibrary: true, keys: [], instanceCount: 0, variants: [], properties: [] });
    r.keys.push(c.key);
    r.instanceCount += instByComp[id] || 0;
    if (setId && c.name && c.name.includes('=')) r.variants.push(c.name);
    if (setId && setProps[setId] && !r.properties.length) {
      r.properties = Object.entries(setProps[setId]).map(([pname, d]) => ({
        name: pname, type: d.type, defaultValue: typeof d.defaultValue === 'string' && d.type === 'TEXT' ? null : d.defaultValue,
        options: d.variantOptions || null,
      }));
    }
  }
  return Object.values(rows).sort((a, b) => b.instanceCount - a.instanceCount);
}

(async () => {
  const listOnly = process.argv.includes('--list');
  const all = [];
  for (const src of SOURCES) {
    console.log(`\n═══ ${src.label}  (${src.key}) ═══`);
    const meta = await get(`https://api.figma.com/v1/files/${src.key}?depth=1`);
    console.log(`  ไฟล์: ${meta.name} · เวอร์ชัน ${meta.version} · ${meta.document.children.length} หน้า`);
    meta.document.children.forEach(p => console.log(`    ${p.id.padEnd(14)} ${p.name}`));
    if (listOnly) continue;

    const dump = path.join(os.tmpdir(), `figma-${src.slug}.json`);
    console.log('  กำลังโหลดทั้งไฟล์…');
    await get(`https://api.figma.com/v1/files/${src.key}`, dump);
    console.log(`  ได้ ${(fs.statSync(dump).size / 1048576).toFixed(1)} MB → ${dump}`);

    const outDir = path.join(ROOT, 'design-system', '.figma-extract', src.slug);
    execFileSync(process.execPath, [path.join(__dirname, 'figma-extract.js'), dump, outDir], { stdio: 'inherit' });

    const file = JSON.parse(fs.readFileSync(dump, 'utf8'));
    const rows = catalog(file.document, file);
    all.push({ src, name: file.name, version: file.version, pages: file.document.children.length, rows });
    console.log(`  คอมโพเนนต์ ${rows.length} ตัว · instance รวม ${rows.reduce((s, r) => s + r.instanceCount, 0)}`);
  }
  if (listOnly) return;

  const merged = [];
  for (const a of all) for (const r of a.rows) merged.push({ ...r, sourceFile: a.name });
  fs.writeFileSync(path.join(ROOT, 'design-system', 'figma-components.json'), JSON.stringify({
    note: 'กลั่นจากไฟล์ Figma จริงด้วย design-system/pull-figma.js — ค่าข้อความ (TEXT) ถูกถอดทิ้งเพราะเป็นข้อมูลจากไฟล์งาน',
    sources: all.map(a => ({ file: a.name, key: a.src.key, version: a.version, pages: a.pages, components: a.rows.length })),
    generatedAt: new Date().toISOString(),
    totalInstances: merged.reduce((s, r) => s + r.instanceCount, 0),
    componentCount: merged.length,
    components: merged,
  }, null, 1));
  console.log('\n✓ เขียน design-system/figma-components.json แล้ว');
  console.log('  ขั้นต่อไป: node design-system/verify-tokens.js · node design-system/compare-figma.js · node figma-export/6-validate-map.js');
})().catch(e => { console.error('ล้มเหลว:', e.message); process.exit(1); });
