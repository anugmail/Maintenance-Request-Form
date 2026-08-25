/* ============================================================================
   สร้างหน้าจอใน Figma จาก spec v3 — ใช้ component จริงของ VMS Plus
   ============================================================================
   ต่างจาก plugin/ เดิม (ท่อ B): ตัวนั้นวาด frame + fill ตาม computed style
   ตัวนี้สร้าง **instance ของ component จริง** แล้ว setProperties
   ⇒ ดีไซเนอร์กดสลับ property ได้ เพราะผูกกับ design system

   หา main component 2 ทาง ลองไล่ลงมา — ไม่ต้องรู้ล่วงหน้าว่าสิทธิ์พอไหม
     A) importComponentByKeyAsync(key)  — ใช้ได้แม้ไฟล์ไม่มี instance อยู่เลย
     B) หา instance ในไฟล์แล้ว clone()  — ไม่ต้องใช้สิทธิ์ไลบรารี
   ทั้งสองทางได้ instance ที่ผูก main component เดิม property จึงสลับได้เหมือนกัน

   ⚠️ เขียนของลงไฟล์ — สร้างหน้าใหม่ชื่อ "📄 <ชื่อหน้าจอ>" ไม่แตะหน้าอื่น
      ให้รันในไฟล์ที่ duplicate มาแล้วเท่านั้น
   ============================================================================ */

figma.showUI(__html__, { width: 520, height: 460 });

var FONT = { family: 'IBM Plex Sans Thai', style: 'Regular' };
var fontOk = false;

function say(t, cls) { figma.ui.postMessage({ type: 'log', text: t, cls: cls || '' }); }

/* ---------- แคชหาตัว main component ---------- */
var cache = {};          // ชื่อ component → { how:'import'|'clone', comp?, sample? }
var sampleIndex = null;  // ชื่อ → instance ตัวอย่างในไฟล์ (สร้างครั้งเดียว)

async function buildSampleIndex() {
  if (sampleIndex) return sampleIndex;
  sampleIndex = {};
  var pages = figma.root.children;
  for (var p = 0; p < pages.length; p++) {
    var list = pages[p].findAllWithCriteria
      ? pages[p].findAllWithCriteria({ types: ['INSTANCE'] })
      : pages[p].findAll(function (n) { return n.type === 'INSTANCE'; });
    for (var i = 0; i < list.length; i++) {
      var inst = list[i], main = null;
      try { main = await inst.getMainComponentAsync(); } catch (e) { continue; }
      if (!main) continue;
      var holder = (main.parent && main.parent.type === 'COMPONENT_SET') ? main.parent : main;
      if (!sampleIndex[holder.name]) sampleIndex[holder.name] = { inst: inst, key: holder.key };
    }
  }
  return sampleIndex;
}

async function makeInstance(name) {
  if (cache[name] === null) return null;

  var idx = await buildSampleIndex();
  var s = idx[name];

  if (cache[name] && cache[name].how === 'import') {
    try { return cache[name].comp.createInstance(); } catch (e) { /* ตกไปทาง clone */ }
  }
  // ทาง A
  if (!cache[name] && s && s.key) {
    try {
      var comp = await figma.importComponentByKeyAsync(s.key);
      cache[name] = { how: 'import', comp: comp };
      return comp.createInstance();
    } catch (e) { /* เงียบไว้ ลองทาง B ต่อ */ }
  }
  // ทาง B
  if (s) {
    cache[name] = { how: 'clone' };
    return s.inst.clone();
  }
  cache[name] = null;
  return null;
}

/* ---------- สร้าง node ตาม spec ---------- */
var made = { instance: 0, frame: 0, text: 0 };
var missing = {};
var propFail = 0;

async function build(node, parent) {
  if (!node) return;

  if (node.kind === 'instance') {
    var inst = await makeInstance(node.component);
    if (!inst) { missing[node.component] = (missing[node.component] || 0) + 1; return; }
    try { inst.setProperties(node.properties || {}); }
    catch (e) {
      propFail++;
      say('   ตั้ง property ไม่ได้ที่ ' + node.component + ': ' + String(e && e.message || e).slice(0, 90), 'err');
    }
    if (node.rect) {
      inst.x = node.rect.x; inst.y = node.rect.y;
      // ย่อ/ขยายให้เท่าของจริงในหน้าเว็บ — ไม่งั้น instance ที่ใหญ่กว่าเดิมจะทับตัวข้างๆ
      // บาง component ปรับขนาดไม่ได้ (ล็อกจากไลบรารี) จึงต้องกันพัง
      try { if (node.rect.w > 1 && node.rect.h > 1) inst.resize(node.rect.w, node.rect.h); } catch (e) {}
    }
    parent.appendChild(inst);
    made.instance++;
    return;
  }

  if (node.kind === 'text') {
    if (!fontOk) return;
    var t = figma.createText();
    t.fontName = FONT;
    t.characters = node.characters || '';
    if (node.rect) { t.x = node.rect.x; t.y = node.rect.y; }
    parent.appendChild(t);
    made.text++;
    return;
  }

  // frame / vector — ใช้เป็นโครงวางตำแหน่ง (พิกัดมาจาก rect ของหน้าจริง)
  var kids = node.children || [];
  if (!kids.length) return;
  for (var i = 0; i < kids.length; i++) await build(kids[i], parent);
  made.frame++;
}

figma.ui.onmessage = async function (msg) {
  if (!msg || msg.type !== 'build') return;
  var spec = msg.spec;

  try {
    if (typeof figma.loadAllPagesAsync === 'function') await figma.loadAllPagesAsync();

    try { await figma.loadFontAsync(FONT); fontOk = true; }
    catch (e) {
      try { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); FONT = { family: 'Inter', style: 'Regular' }; fontOk = true;
            say('ไม่มีฟอนต์ IBM Plex Sans Thai ในเครื่อง — ใช้ Inter แทน', 'err'); }
      catch (e2) { say('โหลดฟอนต์ไม่ได้เลย — ข้อความจะไม่ถูกสร้าง', 'err'); }
    }

    say('ทำดัชนี instance ในไฟล์…');
    await buildSampleIndex();
    say('เจอ component ที่ใช้ได้ ' + Object.keys(sampleIndex).length + ' ตัว');

    for (var s = 0; s < spec.screens.length; s++) {
      var sc = spec.screens[s];
      made = { instance: 0, frame: 0, text: 0 };
      var page = figma.createPage();
      page.name = '📄 ' + sc.name;

      var frame = figma.createFrame();
      frame.name = sc.slug;
      frame.resize(sc.viewport.width, Math.min(sc.viewport.height, 8000));
      frame.x = 0; frame.y = 0;
      page.appendChild(frame);

      say('');
      say('── ' + sc.name + ' ──');
      await build(sc.root, frame);
      say('  instance ' + made.instance + ' · text ' + made.text, 'ok');
    }

    var miss = Object.keys(missing);
    say('');
    if (miss.length) {
      say('หา component ไม่เจอ ' + miss.length + ' ตัว:', 'err');
      miss.forEach(function (m) { say('   ' + m + ' (' + missing[m] + ' จุด)', 'err'); });
    } else {
      say('✓ หา component เจอครบทุกตัว', 'ok');
    }
    if (propFail) say('ตั้ง property ไม่ได้ ' + propFail + ' จุด', 'err');

    var howList = Object.keys(cache).filter(function (k) { return cache[k]; })
      .map(function (k) { return cache[k].how; });
    var nImport = howList.filter(function (h) { return h === 'import'; }).length;
    say('วิธีที่ใช้ได้จริง — import ' + nImport + ' · clone ' + (howList.length - nImport), 'ok');
    say('ดูผลที่หน้า "📄 …" · ลบทิ้งได้เมื่อดูเสร็จ');
    figma.ui.postMessage({ type: 'done' });
  } catch (e) {
    say('พัง: ' + String(e && e.message || e), 'err');
    say(String(e && e.stack || '').split('\n').slice(0, 3).join('\n'), 'err');
    figma.ui.postMessage({ type: 'done' });
  }
};
