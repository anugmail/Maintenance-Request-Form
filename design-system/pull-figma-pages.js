#!/usr/bin/env node
/* ============================================================================
   ดึงไฟล์ Figma "ทีละหน้า" ผ่าน /v1/files/<key>/nodes?ids=<page-id>
   ----------------------------------------------------------------------------
   ทำไมต้องมี: endpoint ดึงทั้งไฟล์ (/v1/files/<key>) โดน **429 Rate limit** กับไฟล์ใหญ่
   (เจอจริง 1 ก.ย. 2569 กับ (Component) VMS Plus 55 หน้า) ⇒ เปลี่ยนมาไล่รายหน้าแทน
   · resume ได้ — หน้าไหนมีไฟล์แล้วข้าม
   · เจอ 429 ถอยเป็นขั้น (30s → 60s → 120s …) แล้วลองใหม่
   ใช้: node design-system/pull-figma-pages.js [slug]      (ไม่ใส่ = ทำทั้ง 2 ไฟล์)
   ============================================================================ */
const fs = require('fs'), path = require('path'), os = require('os'), https = require('https');
const { trim, colors, radii, fonts } = require('./figma-extract.js');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  { slug: 'component', key: 'VmOC07pKEsDkHZagOgcSU2', label: '(Component) VMS Plus' },
  { slug: 'ui-release2', key: 'fYD1yA1uzWsJSjHlcWKMNe', label: '(UI) VMS Plus - Release 2' },
];
const TOKEN = fs.readFileSync(path.join(os.homedir(), '.figma-token'), 'utf8').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'X-Figma-Token': TOKEN } }, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => {
        if (res.statusCode === 429) return reject(Object.assign(new Error('429'), { rate: true }));
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} — ${s.slice(0, 150)}`));
        try { resolve(JSON.parse(s)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// โควตาของ Figma เป็นถังรายชั่วโมง — ถ้าเพิ่งยิง /v1/files ไฟล์ใหญ่ไป จะติดยาว
// จึงถอยได้ถึง 10 นาทีต่อครั้ง และลองได้ 12 รอบ (รวมประมาณ 1 ชม.)
async function getRetry(url, tries = 20) {
  let wait = 45000;
  for (let i = 0; i < tries; i++) {
    try { return await get(url); }
    catch (e) {
      if (!e.rate || i === tries - 1) throw e;
      console.log(`    429 — รอ ${Math.round(wait / 1000)}s (รอบ ${i + 1}/${tries})`);
      await sleep(wait); wait = Math.min(Math.round(wait * 1.6), 300000);
    }
  }
}

(async () => {
  const only = process.argv[2];
  for (const src of SOURCES) {
    if (only && src.slug !== only) continue;
    const outDir = path.join(ROOT, 'design-system', '.figma-extract', src.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const comps = {}, sets_ = {}, setProps = {}, instCount = {};
    // ⚠️ 1 ก.ย. 2569: endpoint ระดับไฟล์ (`/v1/files/<key>?depth=1`) โดน 429 ยาว
    //    แต่ `/nodes?ids=0:0&depth=1` (โหนด root ของเอกสาร) ยัง 200 และให้รายชื่อหน้าครบเหมือนกัน
    //    ⇒ ใช้ทางนี้แทน จะได้ไม่ติดโควตาตั้งแต่ก้าวแรก
    const rootRes = await getRetry(`https://api.figma.com/v1/files/${src.key}/nodes?ids=0:0&depth=1`);
    const meta = { name: rootRes.name, version: rootRes.version };
    const pages = rootRes.nodes['0:0'].document.children;
    console.log(`\n═══ ${meta.name} · ${pages.length} หน้า → ${path.relative(ROOT, outDir)}`);
    fs.writeFileSync(path.join(outDir, '00-pages.json'), JSON.stringify(
      { file: meta.name, key: src.key, version: meta.version, pages: pages.map(p => ({ id: p.id, name: p.name })) }, null, 1));

    // เรียงลำดับ: หน้าที่ตรงกับงานแจ้งซ่อม/บำรุงรักษาก่อน แล้วค่อยไล่ที่เหลือให้ครบ
    const PRIO = /Breakdown|Maintenance|Repair|Vehicle Management|Checkbox|Radio|Inputs|Button|Table|Badge|Tabs|Progress steps|Breadcrumbs|Pagination|Modals|Alerts|Avatar|Toggle|Date picker|File upload|Dropdowns|Section headers|Page headers|Table headers|Sidebar|Notifications|Metrics|List/i;
    const ordered = [...pages].sort((a, b) => (PRIO.test(b.name) ? 1 : 0) - (PRIO.test(a.name) ? 1 : 0));
    for (const [i, p] of ordered.entries()) {
      const dest = path.join(outDir, p.id.replace(':', '-') + '.json');
      if (fs.existsSync(dest)) { console.log(`  [${i + 1}/${ordered.length}] ข้าม ${p.name}`); continue; }
      const r = await getRetry(`https://api.figma.com/v1/files/${src.key}/nodes?ids=${encodeURIComponent(p.id)}`);
      const node = r.nodes[p.id] || {};
      const doc = node.document;
      // แคตตาล็อก: ชื่อ/variant/property ของ component + จำนวน instance (ไม่เก็บค่าข้อความจริง)
      Object.assign(comps, node.components || {});
      Object.assign(sets_, node.componentSets || {});
      if (doc) (function walk(n) {
        if (n.type === 'COMPONENT_SET' && n.componentPropertyDefinitions) setProps[n.id] = n.componentPropertyDefinitions;
        if (n.type === 'INSTANCE' && n.componentId) instCount[n.componentId] = (instCount[n.componentId] || 0) + 1;
        (n.children || []).forEach(walk);
      })(doc);
      const out = { node: p.id, page: p.name, sets: doc ? (doc.children || []).map(trim) : [] };
      fs.writeFileSync(dest, JSON.stringify(out));
      const kb = (fs.statSync(dest).size / 1024).toFixed(0);
      console.log(`  [${i + 1}/${ordered.length}] ${p.name} — ${out.sets.length} โหนดบนสุด · ${kb} KB`);
      await sleep(5000);   // เว้นจังหวะให้พ้นโควตารายนาที — ยิงถี่กว่านี้เจอ 429 แล้วช้ากว่าเดิม
    }
    fs.writeFileSync(path.join(outDir, '00-summary-colors-radii-fonts.json'), JSON.stringify({ colors, radii, fonts }, null, 0));
    // รวมเป็นแคตตาล็อกคอมโพเนนต์ของไฟล์นี้
    const rows = {};
    for (const [id, c] of Object.entries(comps)) {
      const setId = c.componentSetId;
      const name = setId && sets_[setId] ? sets_[setId].name : c.name;
      const r = rows[name] || (rows[name] = { name, key: c.key, instanceCount: 0, variants: [], properties: [] });
      r.instanceCount += instCount[id] || 0;
      if (c.name && c.name.includes('=')) r.variants.push(c.name);
      if (setId && setProps[setId] && !r.properties.length) {
        r.properties = Object.entries(setProps[setId]).map(([pn, d]) => ({
          name: pn, type: d.type,
          defaultValue: d.type === 'TEXT' ? null : d.defaultValue,   // ไม่เก็บข้อความจริงจากไฟล์งาน
          options: d.variantOptions || null,
        }));
      }
    }
    const list = Object.values(rows).sort((a, b) => b.instanceCount - a.instanceCount);
    fs.writeFileSync(path.join(outDir, '00-components.json'), JSON.stringify(
      { file: meta.name, key: src.key, version: meta.version, componentCount: list.length,
        totalInstances: list.reduce((s, r) => s + r.instanceCount, 0), components: list }, null, 1));
    console.log(`  สรุป: สี ${Object.keys(colors).length} · radius ${Object.keys(radii).length} · ชุดฟอนต์ ${Object.keys(fonts).length} · component ${list.length}`);
  }
})().catch(e => { console.error('ล้มเหลว:', e.message); process.exit(1); });
