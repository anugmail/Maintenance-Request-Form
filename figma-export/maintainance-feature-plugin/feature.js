/* ============================================================================
   maintainance-feature-plugin/feature.js — จัดวางจอของ Feature แผนบำรุงรักษา ตามหน้าและ case (13 พ.ย. 2569)
   ----------------------------------------------------------------------------
   ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/32-บำรุงรักษา-feature-แผนบำรุงรักษา-สำหรับ-dev.md
   ไม่วาดจอเอง — เรียกฟังก์ชันจอของ maintainance-plugin/screens.js (งานของพี่นุ) ผ่านรหัสจอเดิม (A.3 · R.6 …) ⇒ หน้าตาเหมือนชุดเดิมทุกจุด
   ต่างจากชุดเดิมแค่การจัดวาง:
     · แบบตัว Z (ผู้ใช้สั่ง 16 พ.ย. 2569): Title หลัก → 1 journey = 1 แถวยาว เรียงหน้าตามทางเดิน (คร่อมด้วยแถบหน้า) → จบแล้วขึ้น journey ถัดไปด้านล่าง · case ในหน้าเดียวกันห่าง 200 · คนละหน้า/คนละ journey ห่าง 500
     · ไม่สร้างทับ ไม่ลบ ไม่ย้ายของเดิมบนหน้า (ผู้ใช้สั่ง 16 พ.ย. 2569) — วางชุดใหม่ต่อใต้
     · toast = เฟรมโปร่งขนาดจอ มีแค่ instance Notification มุมขวาบน ไม่สร้างทั้งหน้าซ้ำ (ผู้ใช้สั่ง 13 พ.ย. 2569)
     · case ที่หน้าตาซ้ำกัน (R.2 = A.22 · S.4 = A.20 · S.6 = A.21) ไม่สร้าง
   สร้างบนหน้า "Maintainance Feature" (ไม่แตะหน้า Maintainance ชุดเดิม)
   ประกอบด้วย  node figma-export/maintainance-feature-plugin/build.js
   ============================================================================ */
const FEATURE_PREFIX = 'MF';
const PAGE_GAP = 500;            // ระหว่างฉาก/หัวข้อ (case ในฉากเดียวกันใช้ GRID.colGap = 200) · ฉากละแถว จึงไม่ล้นขอบ ±65,500 ของ Figma


/* หลาย Feature (17 พ.ย. 2569): ค่าของแต่ละ Feature อยู่ที่ features/<id>.js ลงทะเบียนใน MF_FEATURES (build.js ประกอบก่อนไฟล์นี้)
   useFeature(id) สลับตัวแปรด้านล่างให้ชี้ Feature ที่เลือก ⇒ ส่วนจัดวาง / happy flow / toast / FigJam ทำงานเหมือนเดิม */
let F = null, FEATURE = [], HAPPY = [], FEATURE_TOASTS = {}, FEATURE_TITLE = '', FEATURE_PAGE = [], SCREEN_FN = {}, FJ_DIR = '', FJ_BOARD = '', FJ_TITLE = '';
const SCREEN_CACHE = {};
function screenFns(f) {   // รหัสจอ → ฟังก์ชันจอ: จอเดิมของ scenario (รหัสบล็อกตาม BLOCK_OF ของ screens.js) แล้วทับด้วย f.screens
  const out = {};
  for (const tag of f.scenarios) {
    const i = BLOCK_OF.indexOf(tag), sc = SCENARIOS.find(x => x[0].split(' · ')[0] === tag);
    if (i < 0 || !sc) { warn('Feature ' + f.title + ': ไม่พบ ' + tag + ' ใน screens.js', 'ข้าม'); continue; }
    flatScreens(sc[1], LETTERS[i]).forEach(s => { out[s.code] = { fn: s.fn, label: s.label }; });
  }
  for (const [code, fn] of Object.entries(f.screens || {})) { if (out[code]) out[code].fn = fn; else out[code] = { fn }; }
  return out;
}
function useFeature(id) {
  const f = MF_FEATURES.find(x => x.id === id) || F || MF_FEATURES[0];
  if (f === F) return f;
  F = f; FEATURE = f.journeys; HAPPY = f.happy || f.journeys.map(() => []); FEATURE_TOASTS = f.toasts || {}; FEATURE_TITLE = f.title; FEATURE_PAGE = f.page;
  SCREEN_FN = SCREEN_CACHE[f.id] || (SCREEN_CACHE[f.id] = screenFns(f));
  FJ_DIR = f.fjDir || 'flow-maintainance-feature-' + f.id; FJ_BOARD = f.fjBoard || 'board-maintainance-feature-' + f.id; FJ_TITLE = 'Feature ' + f.title;
  return f;
}

/* Page ของ Feature (ผู้ใช้สั่ง 17 พ.ย. 2569 ชื่อ Page = ชื่อ Feature อย่างเดียว) — ไม่ใช้ namedPage ของ core เพราะมันหยิบ Page ชื่อตรงมาใช้ทันที
   ใช้ Page ชื่อตรงได้เมื่อว่าง หรือมีแต่ชิ้นของปลั๊กอิน (MF / … · MF · …) · มีของคนอื่นอยู่ ⇒ ใช้/สร้าง "<ชื่อ> (พระผู้สร้าง)" ไม่วางปนของคนอื่น */
const ALT_PAGE = (n) => n + ' (พระผู้สร้าง)';
const ownedNode = (n) => n.name.indexOf(FEATURE_PREFIX + ' / ') === 0 || n.name.indexOf(FEATURE_PREFIX + ' · ') === 0;
async function featurePage(create) {
  const name = FEATURE_PAGE[0], byName = (n) => figma.root.children.find(p => p.type === 'PAGE' && p.name === n);
  const alt = byName(ALT_PAGE(name));
  if (alt) { if (alt.loadAsync) await alt.loadAsync(); return { page: alt, fresh: false }; }
  const same = byName(name);
  if (same) {
    if (same.loadAsync) await same.loadAsync();
    if (same.children.every(ownedNode)) return { page: same, fresh: false };
    if (!create) return null;
    log('· Page "' + name + '" มีของอื่นอยู่ ไม่วางปน ⇒ ใช้ Page "' + ALT_PAGE(name) + '"');
  }
  if (!create) return null;
  const p = figma.createPage(); p.name = same ? ALT_PAGE(name) : name;
  return { page: p, fresh: true };
}
const happyCount = (list) => list.reduce((a, j) => a + (HAPPY[FEATURE.indexOf(j)] || []).length, 0);
/* แถว happy flow ในรูปเดียวกับ featurePages (กลุ่มหน้า = ขั้นที่ติดกันในหน้าเดียวกัน) · รหัส H<journey>.<ขั้น> */
function happyPages(ji) {
  let x = ROW_X0 + GRID.side + GRID.gap, n = 0; const pages = [];
  for (const [ref, label, pg] of HAPPY[ji] || []) {
    let cur = pages[pages.length - 1];
    if (!cur || cur.name !== pg) { if (cur) x = cur.x + cur.w + PAGE_GAP; cur = { name: pg, x, w: 0, items: [] }; pages.push(cur); }
    n++;
    const ix = cur.x + cur.items.length * (GRID.colW + GRID.colGap), s = SCREEN_FN[ref];
    cur.items.push({ code: 'H' + (ji + 1) + '.' + n, x: ix, label: 'ขั้น ' + n + ' · ' + label + (ref.indexOf('H:') === 0 ? '' : ' (' + ref + ')'), fn: s ? s.fn : null, old: ref });
    cur.w = cur.items.length * GRID.colW + (cur.items.length - 1) * GRID.colGap;
  }
  return pages;
}

/* toast เฟรมเดียว: เฟรมโปร่งขนาดจอ (1440 / 402) มี instance Notification ของไลบรารีมุมขวาบน ตำแหน่งเดียวกับ notify() · ไม่มี UI อื่น */
async function toastScreen(id) {
  const t = FEATURE_TOASTS[id];
  const f = frame('toast', 'VERTICAL', { pad: MOB ? [16, 16] : [24, 24] });
  f.counterAxisAlignItems = 'MAX';
  if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
  const box = inst('Notification', { Type: t.err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: t.text, Actions: false });
  const sup = find(box, 'Supporting text'); if (sup) sup.visible = false;
  f.appendChild(box);
  if (MOB) { try { box.resize(VW() - 32, box.height); } catch (e) { warn('toast mobile กว้าง', e); } }
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; f.resize(VW(), f.height);
  try { f.exportSettings = [{ format: 'SVG' }, { format: 'PNG', constraint: { type: 'SCALE', value: 2 } }]; } catch (e) { warn('export settings toast ' + id, e); }
  return f;
}

/* หน้าใน journey พร้อมรหัสตามชั้น: journey 1 → หน้า 1.2 → case 1.2.9 · x ของแต่ละจอ (ในหน้า 200 · คนละหน้า 500) */
const ROW_X0 = -60000;   // ขอบพื้นที่วางงานของ Figma ±65,500 ⇒ ทุกแถวเริ่มชิดซ้ายที่นี่ แถวยาวสุด (journey 1 ราว 79,000) จึงไม่ล้น
function featurePages(j, ji) {
  let x = ROW_X0 + GRID.side + GRID.gap;
  return j.pages.map((pg, k) => {
    const items = pg.items.map((it, n) => {
      const code = (ji + 1) + '.' + (k + 1) + '.' + (n + 1), ix = x + n * (GRID.colW + GRID.colGap);
      if (String(it[0]).indexOf('toast:') === 0) {
        const id = it[0].slice(6), t = FEATURE_TOASTS[id];
        return { code, x: ix, label: 'Toast ' + t.text + ' (แสดงบน' + t.page + ' เมื่อ' + t.when + ')', fn: () => toastScreen(id) };
      }
      const s = SCREEN_FN[it[0]];
      return { code, x: ix, label: it[1] + ' (' + it[0] + ')', fn: s ? s.fn : null, old: it[0] };
    });
    const w = items.length * GRID.colW + (items.length - 1) * GRID.colGap, page = { code: (ji + 1) + '.' + (k + 1), name: pg.name, x, w, items };
    x += w + PAGE_GAP;
    return page;
  });
}
const featureCount = (list) => list.reduce((a, j) => a + j.pages.reduce((b, p) => b + p.items.length, 0), 0);
const rowEnd = (pages) => { const l = pages[pages.length - 1]; return l.x + l.w; };

/* กล่อง Title หลักของ feature — กรอบสีเข้ม ข้อความใหญ่ อยู่นอกจอ (แบบแถบ Header) */
async function featureTitle(prefix, width) {
  const h = await headerBlock(prefix + ' · Feature ' + FEATURE_TITLE, FEATURE_TITLE, width); if (h) return h;   // ผู้ใช้ 18 พ.ย. 2569: Title = Header Type=Header
  const f = fixed(frame('Title', 'HORIZONTAL', { fill: rgbOf('#101828'), pad: [0, 80] }), width, 320);
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(await labelText(FEATURE_TITLE, 120, '#FFFFFF'));
  f.name = prefix + ' · Feature ' + FEATURE_TITLE;
  return f;
}

/* จอที่มีชั้นทับ (Background overlay ของ modal · แผงตัวกรอง · bottom sheet หรือ Modal ทั้งก้อน) สูงไม่เกินขนาดจอ 1024 / mobile 874
   (ผู้ใช้สั่ง 16 พ.ย. 2569) — เดิมเฟรมสูงตามเนื้อหา ชั้นทับเลยคลุมแค่ส่วนบน · ตัดความสูงเฟรม (clipsContent อยู่แล้ว) แล้วยืด Background overlay เต็มเฟรม */
/* เปิด Show Placeholder ของช่องกรอกทุกช่อง (ผู้ใช้สั่ง 17 พ.ย. 2569 "component Text Input ต้องปรับ Show placeholder เป็น True")
   field() / area() ใน core.js และช่องวันที่ใน screens.js ตั้ง 'Show Placeholder': !value ⇒ ช่องที่มีค่าถูกซ่อนชั้นข้อความ เห็นแต่ป้าย
   แก้ทีหลังในปลั๊กอินนี้ (ไม่แตะไฟล์พี่นุ) · State คงตามจอเดิม: ไม่มีค่า = Default สีจาง (placeholder) · มีค่า = Filled / Readonly / Focused / Error สีปกติ */
const PH_INPUTS = new Set(['Text input', 'Text area']);
function showPlaceholders(s) {
  const key = (n) => Object.keys(n.componentProperties || {}).find(k => k.split('#')[0].trim() === 'Show Placeholder');
  for (const n of s.findAll(x => x.type === 'INSTANCE' && PH_INPUTS.has(x.name))) {
    const k = key(n); if (!k || n.componentProperties[k].value === true) continue;
    try { n.setProperties({ [k]: true }); } catch (e) { warn('Show Placeholder ' + n.name + ' ใน ' + s.name, e); }
  }
}
const OVERLAY_NAMES = new Set(['Background overlay', 'Modal']);
/* ชั้นทับ = instance ลอย (ABSOLUTE) ชื่อ Background overlay / Modal · หรือวางที่ (0,0) กว้างเต็มจอและสูงเกินครึ่งจอ (กันชื่อ instance ใน Figma จริงไม่ตรง)
   ตรวจ 16 พ.ย. 2569: Modal ของ UI Release#2 = 1440×1024 · Notification (toast) = 520 / 360 กว้างไม่เต็มจอ ⇒ จอที่มี toast ไม่โดนตัด */
const isOverlay = (c) => c.layoutPositioning === 'ABSOLUTE' && c.type === 'INSTANCE' && (OVERLAY_NAMES.has(c.name) || (Math.round(c.x) === 0 && Math.round(c.y) === 0 && c.width >= VW() && c.height >= VH() / 2));
const hasOverlay = (s) => s.children.some(isOverlay);
let capped = 0;
function capOverlayScreen(s) {
  if (!hasOverlay(s) || s.height <= VH()) return;
  try {
    if (s.layoutMode === 'VERTICAL') s.primaryAxisSizingMode = 'FIXED'; else s.counterAxisSizingMode = 'FIXED';
    s.resize(VW(), VH()); s.clipsContent = true;
    s.children.filter(c => c.layoutPositioning === 'ABSOLUTE' && c.name === 'Background overlay').forEach(c => c.resize(VW(), VH()));
    capped++;
  } catch (e) { warn('ตัดความสูงจอที่มีชั้นทับ ' + s.name, e); }
}

/* แถบบน Header navigation ของจอ desktop ใช้ Breakpoint=Desktop (ผู้ใช้สั่ง 16 พ.ย. 2569) แทน Tablet ที่ core.js ใส่ตามกติกา R1 เดิม
   ตรวจแล้ว: ไลบรารีมี variant Breakpoint=Desktop (1187×64) · จอจริงใน UI Release#2 ใช้ Desktop 1,160 ชิ้น ไม่มี Tablet
   แก้เฉพาะปลั๊กอินนี้ ไม่แตะ core.js / component-rules ของพี่นุ · คงความกว้างเต็มคอนเทนเนอร์ (FILL) หลังสลับ variant */
function desktopHeader(s) {
  if (MOB) return;
  for (const h of s.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')) {
    setProps(h, { Breakpoint: 'Desktop' });
    try { h.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ไม่อยู่ใน auto layout */ }
  }
}

/* ติดป้าย pluginData 'mf' = 'title' หรือเลข journey (ไว้ใช้ภายหลัง · ไม่ได้ใช้ลบอะไร) */
const MF_TAG = 'mf';
let orphans = 0; let TIMES = [];
/* กล่องหัวส่วน (Happy flow / ทุกเคส) — แบบ Title หลักแต่เล็กกว่า อยู่นอกจอ */
async function sectionTitle(prefix, text, width) {
  const h = await headerBlock(prefix + ' · ส่วน ' + text, text, width); if (h) return h;
  const f = fixed(frame('Section title', 'HORIZONTAL', { fill: rgbOf('#344054'), pad: [0, 80] }), width, 200);
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(await labelText(text, 80, '#FFFFFF'));
  f.name = prefix + ' · ส่วน ' + text;
  return f;
}
async function featureGrid(page, prefix, journeys, y0, total, devices, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = ROW_X0 + GRID.side + GRID.gap; orphans = 0; TIMES = []; capped = 0; let tag = 'title';
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; try { if (n.setPluginData) n.setPluginData(MF_TAG, tag); } catch (e) { /* ไม่มีป้ายก็ได้ */ } return n; };
  const happyRows = opts.happy === false ? [] : journeys.map(j => ({ j, ji: FEATURE.indexOf(j), pages: happyPages(FEATURE.indexOf(j)) }));
  const fullRows = opts.full === false ? [] : journeys.map(j => ({ j, ji: FEATURE.indexOf(j), pages: featurePages(j, FEATURE.indexOf(j)) }));
  const fullW = Math.max(...happyRows.concat(fullRows).map(r => rowEnd(r.pages) - x0));
  /* 1 แถว journey: แถบ journey → (แถบหน้า) → แถบ case → แถว Desktop / Mobile · ใช้ร่วมกันทั้ง happy flow และทุกเคส */
  async function renderRow(barCode, barTitle, pages, pageBars, frameTitle) {
    CREATED = []; put(await flowBar(prefix, barCode, barTitle, 'Default', rowEnd(pages) - x0), x0, y);
    y += GRID.barH + GRID.gap;
    if (pageBars) { for (const pg of pages) { CREATED = []; put(await flowBar(prefix, pg.code, pg.name, 'Sub Flow', pg.w), pg.x, y); } y += GRID.barH + GRID.gap; }
    CREATED = []; put(await deviceLabel(prefix, 'Header', GRID.barH), ROW_X0, y);
    for (const pg of pages) for (const it of pg.items) { CREATED = []; put(await flowBar(prefix, it.code, it.label, 'Sub Flow 2', GRID.colW), it.x, y); }
    y += GRID.barH + GRID.gap;
    for (const mob of devices) {
      MOB = mob; let h = 0; const rowY = y;
      for (const pg of pages) for (const it of pg.items) {
        if (!it.fn) { warn(it.code + ' ไม่พบจอเดิม ' + it.old + ' ใน screens.js', 'ข้าม'); continue; }
        CREATED = []; PLACE = { x: it.x, y: rowY }; const ts = Date.now();
        try {
          PINS = []; const s = await it.fn(); desktopHeader(s); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);
          capOverlayScreen(s); showPlaceholders(s);
          s.name = prefix + ' / ' + it.code + ' · ' + frameTitle + ' › ' + pg.name + ' — ' + it.label + (mob ? ' · mobile' : '');
          if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));
          put(s, it.x, rowY); h = Math.max(h, s.height); made.push(s);
          TIMES.push([Date.now() - ts, it.code + (mob ? ' mobile' : '') + ' ' + it.label.slice(0, 40)]);
          /* ชิ้นที่ฟังก์ชันจอสร้างไว้แต่ไม่ได้ใส่เข้าจอ (carPartsScreen สร้าง Section "อะไหล่อื่นๆ" + ช่องน้ำมันทุกครั้ง) ค้างบนหน้า (ผู้ใช้เจอ 13 พ.ย. 2569)
             ⇒ ลบเฉพาะชิ้นที่รอบนี้เพิ่งสร้างและไม่ได้อยู่ในจอ ของเดิมบนหน้าไม่แตะ */
          for (const c of CREATED) { try { if (c !== s && c.parent === page) { c.remove(); orphans++; } } catch (e) { /* ลบไปแล้ว */ } }
          log('  · ' + made.length + '/' + total + ' ' + s.name);
        } catch (e) {
          warn(it.code + ' ' + it.label + (mob ? ' (mobile)' : ''), e);
          const d = dropCreated(page); if (d) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + d + ' ชิ้น');
        }
        CREATED = []; PLACE = null;
      }
      MOB = false;
      const rh = Math.max(h, mob ? GRID.mobH : GRID.deskH);
      CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rh), ROW_X0, rowY);
      y = rowY + rh + GRID.rowGap;
    }
    y += PAGE_GAP - GRID.rowGap;   // แถวถัดไปขึ้นด้านล่าง (ตัว Z) ห่าง 500
  }
  CREATED = []; y += put(await featureTitle(prefix, fullW), x0, y).height + PAGE_GAP;   // Title หลัก
  if (happyRows.length) {
    tag = 'happy'; CREATED = []; y += put(await sectionTitle(prefix, 'Happy flow — เส้นทางหลักแบบสั้น', fullW), x0, y).height + PAGE_GAP;
    for (const { j, ji, pages } of happyRows) {
      tag = 'happy-' + ji; const tj = Date.now();
      await renderRow('H' + (ji + 1), j.title + ' · Happy flow', pages, false, j.title + ' (Happy flow)');
      log('✓ Happy flow ' + (ji + 1) + ' ' + j.title + ' (' + HAPPY[ji].length + ' ขั้น) ⏱ ' + secs(tj));
    }
  }
  if (fullRows.length) {
    if (happyRows.length) { tag = 'full'; CREATED = []; y += put(await sectionTitle(prefix, 'ทุกเคส', fullW), x0, y).height + PAGE_GAP; }
    for (const { j, ji, pages } of fullRows) {
      tag = String(ji); const tj = Date.now();
      await renderRow(String(ji + 1), j.title, pages, true, j.title);
      log('✓ ' + (ji + 1) + ' ' + j.title + ' (' + pages.length + ' หน้า · ' + pages.reduce((a, p) => a + p.items.length, 0) + ' เฟรม) ⏱ ' + secs(tj));
    }
  }
  CREATED = [];
  return { made, y };
}

/* ---------- ลดเวลา export (ผู้ใช้สั่ง 17 พ.ย. 2569) — ไม่แก้ core.js ----------
   ก. นำเข้า component จากไลบรารีพร้อมกันทีละ 10 ตัวก่อน ⇒ ตอน resolveAll() นำเข้าทีละตัวได้จากแคชทันที (ตัวที่พังปล่อยให้ resolveAll จัดการตามเดิม)
   ข. ไม่ให้ resolveAll สแกน instance ทั้งไฟล์ (ไล่ทุก instance + getMainComponentAsync ทีละตัว ช้ามากในไฟล์ที่มีจอเยอะ)
      ⇒ ตัด LOCAL_OPTIONAL ออกจากรายการของ resolveAll แล้วหาเอง: component ในไฟล์ก่อน · ไม่เจอค่อยหา instance ที่ "ชื่อตรง" ตัวแรก (เรียก getMainComponentAsync เฉพาะตัวนั้น)
      ได้ผลเหมือนเดิม (แถบ Header ของทีมออกแบบ · ป้าย Device Type · component ของไฟล์ Maintain-D) · ไม่เจอก็ใช้แบบสำรองเหมือนเดิม */
/* ---------- component ป้ายข้างจอจากไฟล์ (UI) VMS Plus - Release#2 (Backup) (ผู้ใช้ขอ 17 พ.ย. 2569 "วิธีที่ผมไม่ต้องทำอะไรเยอะ") ----------
   ผู้ใช้วาง Device Type / Header / State ไว้ในไฟล์ UI Backup ⇒ เปิดพระผู้สร้างในไฟล์นั้นครั้งเดียว ปลั๊กอินจำ key ไว้ใน clientStorage (ใช้ร่วมทุกไฟล์)
   ไฟล์ที่สร้างจอ: นำเข้าด้วย key ก่อนหา component ในไฟล์ (ต้องเป็นไลบรารีที่ publish แล้ว · นำเข้าไม่ได้ก็หาในไฟล์ / ใช้แบบสำรองเหมือนเดิม)
   Header key จากดัมป์ ui-release2 13 พ.ย. 2569 (Design Annotations · Type=Header/Subheader) ใส่ไว้เป็นค่าเริ่มต้น */
const LKEY = 'mf-label-components';
const LABEL_DEFAULT = { Header: { key: 'cbdb14c4c43c175124ce4c7bb138bb980fc2f4ae', set: true, from: 'ดัมป์ UI Release#2 13 พ.ย. 2569' } };
const LABEL_PICK = {   // ชื่อ → เลือก set ที่ใช่ (ชื่อซ้ำได้ เช่น Header มี 2 ชุด)
  'Device Type': (c) => { const v = JSON.stringify(c.variantGroupProperties || {}).toLowerCase(); return v.indexOf('desktop') >= 0 && v.indexOf('mobile') >= 0; },
  'Header': (c) => ((c.variantGroupProperties || {}).Type || { values: [] }).values.indexOf('Subheader') >= 0,
  'State': (c) => !!(c.variantGroupProperties || {}).State
};
const LABEL_ERR = {}, LABEL_KNOWN = {};   // ชื่อ → ข้อความ error ตอนนำเข้า · เคยจำ key ไว้ไหม (ใช้บอกเหตุผลใน log)
async function labelKeys() { try { return (figma.clientStorage && await figma.clientStorage.getAsync(LKEY)) || {}; } catch (e) { return {}; } }
async function rememberLabels() {   // รันในไฟล์ไหนก็ได้ · เจอ component ชื่อตรงในไฟล์นี้ (ของไฟล์นี้เอง) ⇒ จำ key
  try {
    if (!/VMS Plus/i.test(figma.root.name || '')) return;   // จำเฉพาะไฟล์ไลบรารีทีม (ชื่อมี VMS Plus) · ไฟล์ทำงานอื่นที่มีสำเนาชื่อซ้ำไม่ทับ key ที่จำไว้
    if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
    const got = {};
    for (const c of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
      const pick = LABEL_PICK[c.name]; if (!pick || got[c.name] || c.remote || !c.key) continue;
      if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;
      if (c.type !== 'COMPONENT_SET' || !pick(c)) continue;   // ป้ายทั้ง 3 เป็น set · component เดี่ยวชื่อซ้ำ (เช่น Header อื่นในไฟล์) ไม่จำ
      got[c.name] = { key: c.key, set: c.type === 'COMPONENT_SET', from: figma.root.name };
    }
    if (!Object.keys(got).length) return;
    const all = Object.assign(await labelKeys(), got);
    if (figma.clientStorage) await figma.clientStorage.setAsync(LKEY, all);
    log('✓ จำ component จากไฟล์ "' + figma.root.name + '": ' + Object.keys(got).join(' · ') + ' — ไฟล์อื่นที่สร้างจอจะใช้ตัวนี้ (ไฟล์นี้ต้อง publish เป็นไลบรารี)');
  } catch (e) { warn('จำ component ป้าย', e); }
}
async function importLabels() {   // ก่อน resolveFast หา component ในไฟล์ · คืนชื่อที่นำเข้าได้
  const keys = Object.assign({}, LABEL_DEFAULT, await labelKeys()), ok = [];
  for (const [n, k] of Object.entries(keys)) {
    if (INDEX.has(n) && ROUTE[n] !== 'สำเนาในไฟล์นี้' && ROUTE[n] !== 'จาก instance ในไฟล์') continue;
    try { const c = k.set ? await figma.importComponentSetByKeyAsync(k.key) : await figma.importComponentByKeyAsync(k.key); if (c) { INDEX.set(n, c); ROUTE[n] = 'ไลบรารี (' + k.from + ')'; ok.push(n); } }
    catch (e) { LABEL_ERR[n] = (e && e.message) || String(e); /* ไม่ได้ publish / ไม่มีสิทธิ์ ⇒ หาในไฟล์ต่อ */ }
  }
  return ok;
}
/* ปุ่มอัปเดตป้ายใช้แค่ Header + Device Type (18 พ.ย. 2569: log จริง resolveAll 837 วินาที เพราะสแกน instance ทั้งไฟล์หา component จอที่ปุ่มนี้ไม่ใช้)
   ⇒ นำเข้าเฉพาะ 2 ตัว · ยังไม่รู้จัก Device Type ⇒ หา instance ชื่อ "Device Type" ในไฟล์นี้ (ผู้ใช้ลากจาก Assets มาวาง 1 ชิ้น) ที่ลิงก์ไลบรารี แล้วจำ key ไว้ */
async function resolveLabelsOnly() {
  const t = Date.now();
  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
  const lab = await importLabels();
  if (!INDEX.has('Device Type')) {
    for (const i of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
      if (!/Device Type/i.test(i.name || '')) continue;
      try {
        const mc = await i.getMainComponentAsync(); const h = mc && holderOf(mc);
        if (!h || h.type !== 'COMPONENT_SET' || !h.remote || !LABEL_PICK['Device Type'](h)) continue;
        INDEX.set('Device Type', h); ROUTE['Device Type'] = 'ไลบรารี (จาก instance ที่วางในไฟล์นี้)'; lab.push('Device Type');
        try { const all = Object.assign(await labelKeys(), { 'Device Type': { key: h.key, set: true, from: 'instance ในไฟล์ ' + figma.root.name } }); if (figma.clientStorage) await figma.clientStorage.setAsync(LKEY, all); } catch (e) { /* จำไม่ได้ก็ใช้รอบนี้ไป */ }
        break;
      } catch (e) { /* ข้าม */ }
    }
  }
  log('นำเข้าป้าย: ' + (lab.join(' · ') || '-') + ' ' + secs(t));
}
const secs = (t) => '(' + ((Date.now() - t) / 1000).toFixed(1) + ' วินาที)';
async function preImport(names) {
  const jobs = names.filter(n => KEYS[n]).map(n => () => (KEYS[n][1] ? figma.importComponentSetByKeyAsync(KEYS[n][0]) : figma.importComponentByKeyAsync(KEYS[n][0])).catch(() => null));
  for (let i = 0; i < jobs.length; i += 10) await Promise.all(jobs.slice(i, i + 10).map(j => j()));
  return jobs.length;
}
async function resolveFast() {
  const lib = NEEDED.filter(n => LOCAL_OPTIONAL.indexOf(n) < 0);
  let t = Date.now();
  const pre = await preImport(lib);
  log('⏱ นำเข้าจากไลบรารีพร้อมกัน ' + pre + ' ตัว ' + secs(t));
  t = Date.now();
  await resolveAll(lib);   // ตัวที่นำเข้าไม่ได้จริงๆ resolveAll ยังสแกนเป็นทางสุดท้ายตามเดิม
  log('⏱ resolveAll ' + secs(t));
  t = Date.now();
  const lab = await importLabels();
  if (lab.length) log('ป้ายข้างจอจากไลบรารี: ' + lab.join(' · ') + ' ' + secs(t));
  const want = new Map();   // ชื่อที่จะหา → ชื่อใน LOCAL_OPTIONAL
  for (const n of LOCAL_OPTIONAL) if (!INDEX.has(n)) [n].concat(ALIAS[n] || []).forEach(x => want.set(x, n));
  for (const c of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;
    const n = want.get(c.name); if (n && !INDEX.has(n)) { INDEX.set(n, c); ROUTE[n] = 'สำเนาในไฟล์นี้'; }
  }
  const left = () => [...new Set(want.values())].filter(n => !INDEX.has(n));
  if (left().length) for (const i of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
    const n = want.get(i.name); if (!n || INDEX.has(n)) continue;
    try { const mc = await i.getMainComponentAsync(); if (mc) { INDEX.set(n, holderOf(mc)); ROUTE[n] = 'จาก instance ในไฟล์'; } } catch (e) { /* ข้าม */ }
    if (!left().length) break;
  }
  const miss = left();
  log('component ของไฟล์ Maintain-D / ป้าย: ได้ ' + (LOCAL_OPTIONAL.length - miss.length) + '/' + LOCAL_OPTIONAL.length + (miss.length ? ' · ไม่พบ ' + miss.join(' · ') + ' — ใช้แบบสำรอง' : '') + ' ' + secs(t));
}

async function buildFeature(devices, pick, happyOnly) {
  errors.length = 0;
  const t0 = Date.now();
  let journeys = pick && pick.length ? FEATURE.filter((j, i) => pick.indexOf(String(i)) >= 0) : FEATURE;
  if (!journeys.length) { log('ยังไม่ได้ติ๊ก journey'); return; }
  log('Feature ' + FEATURE_TITLE + ' · ' + journeys.map(j => (FEATURE.indexOf(j) + 1) + ' ' + j.title).join(' · '));
  log('นำเข้า component จากไลบรารี…');
  await resolveFast();
  log(deviceSetInfo());
  const tp = await featurePage(true);
  const page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  /* ไม่สร้างทับของเดิม (ผู้ใช้สั่ง 16 พ.ย. 2569 "ไม่สร้างทับของเดิม เดี๋ยวผมลบเอง") — ไม่ลบ ไม่ย้าย ไม่เรียงชิ้นที่มีอยู่บนหน้า
     ทุกครั้งวางชุดใหม่ต่อใต้ของเดิม และมี Title หลักติดมาด้วยเสมอ (ทั้งสร้างทั้ง feature และสร้างเฉพาะหัวข้อ) */
  const mine = (n) => n.name.indexOf(FEATURE_PREFIX + ' / ') === 0 || n.name.indexOf(FEATURE_PREFIX + ' · ') === 0;
  const total = ((happyOnly ? 0 : featureCount(journeys)) + happyCount(journeys)) * devices.length;
  const before = new Set(page.children);
  const made = (await featureGrid(page, FEATURE_PREFIX, journeys, before.size ? pageBottom(page) + 1000 : 0, total, devices, { full: !happyOnly })).made;
  const fresh = page.children.filter(n => !before.has(n));
  const fit = fresh.length ? fitOn(page, fresh, 1000) : { dx: 0, dy: 0 };
  if (fit) shiftAll(fresh, fit);
  else log('⚠ หน้า "' + page.name.trim() + '" ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ลบชุดเก่าบนหน้านี้ก่อน แล้วกดใหม่');
  log(tp.fresh ? 'สร้างหน้าใหม่ "' + page.name + '" แล้ววางลงไป' : 'วางชุดใหม่บนหน้า "' + page.name.trim() + '" ต่อจากของเดิม · ของเดิมไม่ถูกแตะ (ลบชุดเก่าเองได้)');
  let loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) if (n.type !== 'INSTANCE' && n.type !== 'FRAME') loose++;
  figma.currentPage.selection = made.slice(0, 1);
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  log('สร้าง ' + made.length + ' เฟรม (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + journeys.length + ' journey');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('ชิ้นที่หลุดนอกจอระหว่างสร้าง (ลบแล้ว): ' + orphans);
  log('จอที่มีชั้นทับ (modal · ตัวกรอง · bottom sheet) ตัดความสูงเหลือขนาดจอ: ' + capped + ' จอ');
  const stray = page.children.filter(n => !mine(n));
  log('ชิ้นบนหน้านี้ที่ไม่ใช่จอหรือป้ายของปลั๊กอิน: ' + stray.length + (stray.length ? ' ⚠ ' + stray.slice(0, 5).map(n => n.type + ' ' + n.name).join(' · ') : ' ✓'));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  reportOversize();
  if (TIMES.length) log('⏱ จอที่ช้าที่สุด: ' + TIMES.sort((p, q) => q[0] - p[0]).slice(0, 5).map(x => x[1] + ' ' + (x[0] / 1000).toFixed(1) + 's').join(' · '));
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}

/* ---------- ส่งจอไปบอร์ด FigJam (ผู้ใช้สั่ง 17 พ.ย. 2569 "export UI ไปลง board figjam ด้วย") ----------
   ทางเดียวกับของพี่นุ (exportShots ใน core.js · serve.js · figjam-plugin) แต่ปุ่มเดียวทำทั้งภาพและสเปกบอร์ด ไม่ต้องรัน 3-figjam-board.js
   1) export เฟรม MF / … ชุดล่าสุด (pluginData builtAt) เป็น PNG ด้านยาว ≤ 4000 → UI POST เข้า serve.js ที่ out/figjam/flow-maintainance-feature/
   2) สเปกบอร์ดแบบ image section ที่ figjam-plugin อ่านได้ (รูปแบบ 3-figjam-board.js) แยกไฟล์ Happy flow + ราย journey (ภาพทั้งไฟล์โหลดรอบเดียว 208 ภาพหนักเกิน)
   3) ในไฟล์ FigJam เปิด "Maintain-D → FigJam board" ติ๊ก Feature แผนบำรุงรักษา (กลุ่ม "อื่น ๆ") */
const FJ_RE = /^MF \/ (H?\d+(?:\.\d+)+) · (.+?) › (.+?) — (.+)$/;
const FJ_COLOR = { happy: [241, 254, 253], j: [[248, 245, 255], [245, 251, 255], [255, 251, 240], [255, 240, 250], [249, 249, 249]] };
const fjKey = (code) => (code[0] === 'H' ? '0' : '1') + code.replace('H', '').split('.').map(x => x.padStart(3, '0')).join('.');
function fjShots(page, devices, pick) {
  const want = new Set(devices.map(m => m ? 'mobile' : 'desktop'));
  const js = pick && pick.length ? new Set(pick.map(i => String(+i + 1))) : null;
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const all = [], skipped = [];
  for (const f of page.children) {
    if (f.type !== 'FRAME' || f.name.indexOf(FEATURE_PREFIX + ' / ') !== 0) continue;
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(FJ_RE);
    if (!m) { skipped.push(f.name); continue; }
    const code = m[1], jn = code.replace('H', '').split('.')[0];
    if (!want.has(mob ? 'mobile' : 'desktop') || (js && !js.has(jn))) continue;
    all.push({ f, code, happy: code[0] === 'H', j: +jn - 1, page: m[3], label: m[4], device: mob ? 'mobile' : 'desktop', t: builtAt(f) });
  }
  all.sort((p, q) => q.t - p.t);   // หลายชุดบนหน้า ⇒ จอรหัสเดียวกันเอาชุดที่สร้างล่าสุด
  const seen = new Set(), shots = all.filter(x => !seen.has(x.code + x.device) && seen.add(x.code + x.device));
  shots.sort((a, b) => fjKey(a.code) < fjKey(b.code) ? -1 : fjKey(a.code) > fjKey(b.code) ? 1 : (a.device === 'desktop' ? -1 : 1));
  return { shots, older: all.length - shots.length, skipped };
}
function fjSection(name, color, list) {   // 1 journey = 1 section · คอลัมน์ละจอ · แถว Desktop / Mobile · ลูกศรต่อตามลำดับ (แบบ 3-figjam-board.js)
  const codes = [...new Set(list.map(x => x.code))];
  const hasMob = list.some(x => x.device === 'mobile'), hasDesk = list.some(x => x.device === 'desktop');
  const rowH = (d) => Math.max(0, ...list.filter(x => x.device === d).map(x => x.h));
  const two = hasMob && hasDesk;
  return {
    name, color, connect: 'sequence',
    rows: two ? [{ label: 'Desktop', h: rowH('desktop') }, { label: 'Mobile', h: rowH('mobile') }] : undefined,
    cols: codes.map(code => {
      const d = list.find(x => x.code === code && x.device === 'desktop'), mo = list.find(x => x.code === code && x.device === 'mobile'), a = d || mo;
      const im = (x, row) => ({ src: 'figjam/' + FJ_DIR + '/' + x.file, w: x.w, h: x.h, row });
      return { label: code + ' · ' + a.page + ' — ' + a.label, note: '', images: [d && im(d, 0), mo && im(mo, two ? 1 : 0)].filter(Boolean) };
    })
  };
}
function fjBoards(done, target) {   // done = ภาพที่ export แล้ว (มี file w h) ⇒ ไฟล์สเปก { file, spec }
  const head = () => ({ version: 1, anchor: 'below', generatedAt: new Date().toISOString(), font: { family: 'IBM Plex Sans Thai', style: 'Medium' }, fallbackFont: { family: 'Inter', style: 'Medium' }, target: target || undefined });   // target = บอร์ดปลายทางที่เลือก (ฝั่ง FigJam ใช้เตือนเมื่อเปิดผิดบอร์ด · figjam-plugin ของพี่นุไม่อ่าน)
  const jName = (j, happy) => { const J = FEATURE[j]; return FJ_TITLE + ' · ' + (happy ? 'H' : '') + (j + 1) + ' ' + J.title + (happy ? ' · Happy flow' : ''); };
  const out = [];
  const hp = done.filter(x => x.happy);
  if (hp.length) out.push({ file: FJ_BOARD + '-happy.json', spec: Object.assign(head(), { title: FJ_TITLE + ' · Happy flow', sections: [...new Set(hp.map(x => x.j))].map(j => fjSection(jName(j, true), FJ_COLOR.happy, hp.filter(x => x.j === j))) }) });
  [...new Set(done.filter(x => !x.happy).map(x => x.j))].forEach(j => {
    out.push({ file: FJ_BOARD + '-' + (j + 1) + '.json', spec: Object.assign(head(), { title: FJ_TITLE + ' · ' + (j + 1) + ' ' + FEATURE[j].title, sections: [fjSection(jName(j, false), FJ_COLOR.j[j % FJ_COLOR.j.length], done.filter(x => !x.happy && x.j === j))] }) });
  });
  return out;
}
async function exportFigJam(devices, pick) {
  errors.length = 0; const t0 = Date.now();
  const fp = await featurePage(false), page = fp && fp.page;
  if (!page) { log('ไม่พบ Page "' + FEATURE_PAGE[0] + '" — กดสร้าง feature ก่อน'); return; }
  const { shots, older, skipped } = fjShots(page, devices, pick);
  if (!shots.length) { log('ไม่พบเฟรม "' + FEATURE_PREFIX + ' / …" ตามอุปกรณ์/journey ที่เลือก บนหน้า "' + page.name + '"'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ ไปที่ out/figjam/' + FJ_DIR + '/' + (older ? ' · ข้ามชุดเก่าบนหน้า ' + older + ' จอ' : ''));
  const done = [];
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + (s.device === 'mobile' ? '-mobile' : '') + '.png';
      figma.ui.postMessage({ type: 'shot', dir: FJ_DIR, file, bytes, n: done.length + 1, total: shots.length });
      done.push(Object.assign({}, s, { f: undefined, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) }));
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), shots: done.map(x => ({ code: x.code, scenario: FEATURE_PREFIX, name: x.page + ' — ' + x.label, device: x.device, file: x.file, w: x.w, h: x.h })) };
  const target = await tgtCurrent();
  const boards = fjBoards(done, target ? { name: target.name, url: target.url } : null);
  figma.ui.postMessage({ type: 'fj-file', path: 'figjam/' + FJ_DIR + '/manifest.json', text: JSON.stringify(manifest, null, 1) });
  for (const b of boards) figma.ui.postMessage({ type: 'fj-file', path: b.file, text: JSON.stringify(b.spec), board: true });
  figma.ui.postMessage({ type: 'fj-done', shots: done.length, boards: boards.map(b => b.file) });
  log('export แล้ว ' + done.length + '/' + shots.length + ' จอ · บอร์ด ' + boards.length + ' ไฟล์: ' + boards.map(b => b.spec.title.replace(FJ_TITLE + ' · ', '')).join(' · ') + (skipped.length ? ' · ข้ามเฟรมชื่อไม่ตรงรูปแบบ ' + skipped.length : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : '') + ' ' + secs(t0));
  log('ขั้นต่อไป: ' + (target ? 'กด "เปิดบอร์ดปลายทาง" (' + target.name + ')' : 'เปิดบอร์ด FigJam ที่จะใช้') + ' → รันปลั๊กอินตัวนี้ในบอร์ดนั้น → กด "วางลงบอร์ดนี้"');
}

const LABEL_RE = /^MF · (Device|Desktop|Mobile)$/;
const HEAD_RE = /^MF · (Feature|ส่วน) (.+)$/;
/* กล่อง Title Feature / หัวส่วน = Header Type=Header ของทีมออกแบบ (ผู้ใช้ 18 พ.ย. 2569 copy ตัวอย่างมาวางให้ดู) · ใส่ข้อความที่ Text ตัวแรกที่มองเห็น · ป้าย Status คงค่าเริ่มต้นของ component
   ไม่มี Header / ไม่มี variant Type=Header / ใส่ข้อความไม่ได้ ⇒ null (คนเรียกใช้กรอบเดิม) */
async function headerBlock(name, value, width) {
  const H = INDEX.get('Header');
  if (!H || HEADER_BROKEN || H.type !== 'COMPONENT_SET' || !H.children.some(c => (c.variantProperties || {}).Type === 'Header')) return null;
  let n; try { n = inst('Header', { Type: 'Header' }); } catch (e) { return null; }
  const t = n.findAll(c => c.type === 'TEXT' && c.visible !== false)[0];
  if (!t || !(await text(n, t, value))) { try { n.remove(); } catch (e) { /* */ } return null; }
  try { n.resize(width, n.height); } catch (e) { /* */ }
  n.name = name;
  return n;
}
const BAR_RE = /^MF · (H?\d+(?:\.\d+)*) (.+)$/;
const CODE_RE = /^H?\d+(?:\.\d+)*$/;
function barState(code) {   // ตรงกับ featureGrid: journey = Default · แถบหน้า = Sub Flow · แถบ case / ขั้น Happy = Sub Flow 2
  const d = code.replace('H', '').split('.').length - 1;
  return d === 0 ? 'Default' : code[0] === 'H' || d >= 2 ? 'Sub Flow 2' : 'Sub Flow';
}
/* หาจากหน้าตา ไม่ใช่แค่ชื่อ (ผู้ใช้ 17 พ.ย. 2569 "ชื่อมันอาจจะไม่เหมือนกันแต่หน้าตามันตรงกัน · เอาให้เจอให้หมดทุกจุด")
   ป้าย Device: ชื่อ MF · Device|Desktop|Mobile · instance ของ Device Type / Component 1 · กรอบเทา #667085 กว้าง ~300 มีข้อความ Device/Desktop/Mobile
   แถบ Header: ชื่อ MF · <รหัส> <ชื่อ> · instance ของ Header · กรอบที่มีลูก State (รหัส) + Detail (ชื่อ) */
const DEV_WORD = { device: 'Header', header: 'Header', desktop: 'Desktop', mobile: 'Mobile' };
const texts = (n) => { try { return (n.findAll ? n.findAll(x => x.type === 'TEXT') : []).filter(t => t.visible !== false).map(t => String(t.characters || '').trim()).filter(Boolean); } catch (e) { return []; } };
const isGrey = (n) => { const f = (n.fills && n.fills[0] && n.fills[0].color) || null; return !!f && Math.abs(f.r - 0x66 / 255) < 0.04 && Math.abs(f.g - 0x70 / 255) < 0.04 && Math.abs(f.b - 0x85 / 255) < 0.04; };
async function mainOf(n) {
  if (n.type !== 'INSTANCE') return null;
  try { const m = await n.getMainComponentAsync(); if (!m) return null; const s = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m; return { name: s.name, key: s.key, vp: m.variantProperties || n.variantProperties || {} }; } catch (e) { return null; }
}
/* ถูกต้องแล้ว = เป็น instance ของตัวใหม่ (key ตรง) และ variant ถูก (18 พ.ย. 2569: ผู้ใช้เจอแถบ H1 เป็น Header Type=Header "???" ⇒ key ตรงอย่างเดียวไม่พอ)
   แถบ: Type = Subheader · ป้าย: Type ตรงคำบนป้าย */
const devTypeOf = (vp) => { for (const v of Object.values(vp || {})) { const t = DEV_WORD[String(v).trim().toLowerCase()]; if (t) return t; } return null; };
const newKeyOf = (kind) => { const c = INDEX.get(kind === 'dev' ? 'Device Type' : 'Header'); return c && c.key; };
async function classify(n) {
  const nm = n.name || '', md = nm.match(LABEL_RE), mb = nm.match(BAR_RE), main = await mainOf(n), tx = texts(n);
  const devType = () => { if (md) return DEV_WORD[md[1].toLowerCase()]; if (main) { const t = devTypeOf(main.vp); if (t) return t; } for (const t of tx) if (DEV_WORD[t.toLowerCase()]) return DEV_WORD[t.toLowerCase()]; return null; };
  if (md || (main && /^(Device Type|Component 1)$/.test(main.name)) || (n.type === 'FRAME' && Math.abs(n.width - GRID.side) < 30 && isGrey(n) && tx.length === 1 && DEV_WORD[tx[0].toLowerCase()])) {
    const type = devType(); if (!type) return null;
    const D = INDEX.get('Device Type'), fresh = !!(main && main.key && main.key === newKeyOf('dev') && (!D || D.type !== 'COMPONENT_SET' || devTypeOf(main.vp) === type));
    return { kind: 'dev', type, via: md ? 'ชื่อ' : main ? 'instance ' + main.name : 'หน้าตา', fresh };
  }
  const mh = nm.match(HEAD_RE);
  if (mh && (n.type === 'FRAME' || (main && main.name === 'Header'))) {   // Title Feature / หัวส่วน
    return { kind: 'head', code: mh[1] === 'Feature' ? 'Title' : 'หัวส่วน', title: mh[2], via: main ? 'instance Header' : 'ชื่อ', fresh: !!(main && main.key === newKeyOf('head') && main.vp.Type === 'Header') };
  }
  const looksBar = n.type === 'FRAME' && n.children && n.children.some(c => c.name === 'State') && n.children.some(c => c.name === 'Detail');
  if (mb || (main && main.name === 'Header') || looksBar) {
    const code = mb ? mb[1] : tx.find(t => CODE_RE.test(t)), title = mb ? mb[2] : tx.filter(t => t !== code)[0];   // ชื่อ layer มาก่อน (ตัวที่ variant ผิดมีข้อความ "???")
    if (!code || !title || /^(Feature|ส่วน) /.test(title)) return null;
    const sub = !!(main && main.vp && main.vp.Type === 'Subheader');
    if (main && main.name === 'Header' && !sub) return null;   // Header แบบ Type=Header (หัวใหญ่) ไม่ใช่แถบรหัส · ผู้ใช้วางเป็นตัวอย่างเอง (18 พ.ย. 2569) ⇒ ไม่แตะ ไม่นับ
    const fresh = !!(main && main.key === newKeyOf('bar') && sub);
    return { kind: 'bar', code, title, via: mb ? 'ชื่อ' : main ? 'instance Header' : 'หน้าตา', fresh };
  }
  return null;
}
async function scanLabels(page) {   // ไล่ทั้ง Page แบบลึก · ไม่เข้าไปในจอ (MF / …) · เจอแล้วไม่ไล่ลูกต่อ
  const out = [];
  async function walk(node) {
    for (const c of (node.children || []).slice()) {
      if ((c.name || '').indexOf(FEATURE_PREFIX + ' / ') === 0) continue;
      const k = await classify(c);
      if (k) { out.push(Object.assign(k, { node: c })); continue; }
      if (c.children && (c.type === 'SECTION' || c.type === 'GROUP' || c.type === 'FRAME')) await walk(c);
    }
  }
  await walk(page);
  return out;
}
/* Device Type ตัวใหม่เป็น component เดี่ยว (ไม่มี variant) — กันไว้เผื่อ · ไฟล์ UI Backup ตอนนี้เป็น set มี Type = Header / Desktop / Mobile ใช้ deviceLabel ของ core */
function singleDeviceInfo() {
  const c = INDEX.get('Device Type'); if (!c || c.type !== 'COMPONENT') return '';
  const props = Object.entries(c.componentPropertyDefinitions || {}).map(([k, v]) => k + ':' + v.type);
  return 'Device Type ตัวใหม่เป็น component เดี่ยว · property [' + (props.join(', ') || '-') + '] · ตัวหนังสือข้างใน [' + texts(c).join(', ') + ']';
}
async function singleDevice(type, w, h) {
  const c = INDEX.get('Device Type'); if (!c || c.type !== 'COMPONENT') return null;
  const word = type === 'Header' ? 'Device' : type, n = c.createInstance(); CREATED.push(n);
  const fail = (m) => { throw new Error(m); };
  const tp = Object.entries(n.componentProperties || {}).find(([, v]) => v.type === 'TEXT');
  const ts = n.findAll(x => x.type === 'TEXT'), hits = ts.filter(t => DEV_WORD[String(t.characters).trim().toLowerCase()]);
  if (tp) n.setProperties({ [tp[0]]: word });
  else if (hits.length > 1) {
    const keep = hits.find(t => DEV_WORD[String(t.characters).trim().toLowerCase()] === type); if (!keep) fail('ไม่มีคำ ' + word + ' ใน Device Type ตัวใหม่');
    const branch = (t) => { let b = t; while (b.parent && b.parent !== n) b = b.parent; return b; };
    for (const t of hits) if (t !== keep) { const b = branch(t); if (b !== branch(keep)) b.visible = false; else t.visible = false; }
  } else if (ts.length === 1) {
    for (const f of ts[0].getRangeAllFontNames(0, ts[0].characters.length)) await figma.loadFontAsync(f);
    ts[0].characters = word;
  } else fail('ไม่รู้ว่าจะใส่คำตรงไหน (' + singleDeviceInfo() + ')');
  try { n.resize(w, h); } catch (e) { /* */ }
  n.name = FEATURE_PREFIX + ' · ' + word;
  return n;
}
/* ตรวจชิ้นที่เพิ่งสร้างก่อนวางแทน — ไม่ผ่าน ⇒ ลบทิ้ง เก็บของเดิม (ไม่วางของผิดลงหน้า) */
function checkMade(n, f) {
  if (!n || n.type !== 'INSTANCE') return 'ได้กรอบธรรมดา ไม่ใช่ component ตัวใหม่ (ใส่ข้อความลง component ไม่ได้)';
  const vp = n.variantProperties || {};
  if (f.kind === 'head') {
    if (vp.Type !== 'Header') return 'ได้ Header แบบ Type=' + (vp.Type || '?') + ' ไม่ใช่ Header';
    if (texts(n).indexOf(f.title) < 0) return 'ข้อความไม่ขึ้นบนหัว';
  } else if (f.kind === 'bar') {
    if (vp.Type !== 'Subheader') return 'ได้ Header แบบ Type=' + (vp.Type || '?') + ' ไม่ใช่ Subheader';
    const tx = texts(n); if (tx.indexOf(f.code) < 0) return 'รหัส ' + f.code + ' ไม่ขึ้นบนแถบ (เห็น: ' + tx.slice(0, 3).join(' / ') + ')';
    if (tx.indexOf(f.title) < 0) return 'ชื่อไม่ขึ้นบนแถบ';
  } else if (INDEX.get('Device Type') && INDEX.get('Device Type').type === 'COMPONENT_SET' && devTypeOf(vp) !== f.type) return 'ได้ป้าย Type=' + JSON.stringify(vp) + ' ไม่ตรง ' + f.type;
  return '';
}
const dropMade = () => { for (const x of CREATED) { try { if (x && !x.removed && x.parent) x.remove(); } catch (e) { /* ลบไปแล้ว */ } } CREATED = []; };
/* ---------- อัปเดตป้ายบนจอที่สร้างแล้ว (ผู้ใช้ขอ 17 พ.ย. 2569: export ครบแล้ว ไม่อยากสร้างใหม่ทั้งหมด) ----------
   แทนแถบ Header และป้าย Device / Desktop / Mobile ด้วย component ตัวใหม่ ที่เดิม (parent · ลำดับ · x/y · กว้าง/สูง) ข้อความเดิม · จอไม่ถูกแตะ
   ไม่มีตัวใหม่ ⇒ ไม่แทน · สร้างแล้วตรวจไม่ผ่าน ⇒ ลบตัวใหม่ เก็บของเดิม · Header แบบ Type=Header (หัวใหญ่) ไม่นับเป็นแถบ ไม่แตะ
   จบแล้วสแกนซ้ำด้วยเกณฑ์เดียวกัน ต้องเหลือ 0 */
async function patchLabels() {
  const fp = await featurePage(false), page = fp && fp.page;
  if (!page) { log('· ' + FEATURE_TITLE + ': ยังไม่มี Page "' + FEATURE_PAGE[0] + '" ข้าม'); return 0; }
  const ok = labelReady();
  await figma.setCurrentPageAsync(page);
  const t0 = Date.now(), found = await scanLabels(page);
  const st = { head: { all: 0, via: {}, fresh: 0, done: 0, skip: 0 }, bar: { all: 0, via: {}, fresh: 0, done: 0, skip: 0, dup: 0 }, dev: { all: 0, via: {}, fresh: 0, done: 0, skip: 0, dup: 0 } }, why = [];
  for (const f of found) {
    const s = st[f.kind]; s.all++; s.via[f.via] = (s.via[f.via] || 0) + 1;
    if (f.fresh) { s.fresh++; continue; }
    if (!(f.kind === 'head' ? ok.head : ok[f.kind])) { s.skip++; continue; }
    const old = f.node, parent = old.parent;
    CREATED = [];
    try {
      const n = f.kind === 'head' ? await headerBlock(old.name, f.title, old.width) : f.kind === 'dev' ? (INDEX.get('Device Type').type === 'COMPONENT' ? await singleDevice(f.type, old.width, old.height) : await deviceLabel(FEATURE_PREFIX, f.type, old.height)) : await flowBar(FEATURE_PREFIX, f.code, f.title, barState(f.code), old.width);
      const bad = checkMade(n, f);
      if (bad) { dropMade(); s.skip++; if (why.length < 10) why.push((f.kind === 'head' ? f.code : f.kind === 'bar' ? 'แถบ ' + f.code : 'ป้าย ' + f.type) + ': ' + bad); continue; }
      parent.insertChild(parent.children.indexOf(old), n); n.x = old.x; n.y = old.y;
      if (f.kind === 'dev') { try { n.resize(old.width, old.height); } catch (e) { /* */ } }
      try { if (old.getPluginData && n.setPluginData) n.setPluginData(MF_TAG, old.getPluginData(MF_TAG)); } catch (e) { /* */ }
      old.remove(); s.done++; CREATED = [];
    } catch (e) { dropMade(); s.skip++; if (why.length < 10) why.push(old.name + ' — ' + (e && e.message ? e.message : e)); }
  }
  CREATED = [];
  const left = (await scanLabels(page)).filter(f => !f.fresh);
  const fmt = (k, label) => { const s = st[k]; return label + ' เจอ ' + s.all + ' (' + (Object.entries(s.via).map(([v, c]) => v + ' ' + c).join(' · ') || '-') + ') · แทน ' + s.done + (s.fresh ? ' · ถูกอยู่แล้ว ' + s.fresh : '') + (s.skip ? ' · ข้าม ' + s.skip : ''); };
  log('· ' + FEATURE_TITLE + ': ' + fmt('head', 'Title/หัวส่วน') + ' | ' + fmt('bar', 'แถบ Header') + ' | ' + fmt('dev', 'ป้าย Device') + ' ' + secs(t0));
  if (!ok.bar && st.bar.all - st.bar.fresh) log('  ⓘ ข้ามแถบ Header: ' + ok.barWhy);
  if (!ok.head && st.head.all - st.head.fresh) log('  ⓘ ข้าม Title/หัวส่วน: ' + (ok.bar ? 'Header ตัวใหม่ไม่มี variant Type=Header' : ok.barWhy));
  if (!ok.dev && st.dev.all - st.dev.fresh) log('  ⓘ ข้ามป้าย Device: ' + ok.devWhy);
  why.forEach(w => log('  ⓘ ' + w));
  if (left.length) { log('⚠ ' + FEATURE_TITLE + ': เหลือของเก่า ' + left.length + ' ชิ้น — ' + left.slice(0, 10).map(f => (f.kind === 'head' ? f.code : f.kind === 'bar' ? 'แถบ ' + f.code : 'ป้าย ' + (f.type === 'Header' ? 'Device' : f.type)) + ' "' + f.node.name + '" (' + Math.round(f.node.x) + ',' + Math.round(f.node.y) + ')').join(' · ')); }
  else log('✓ ' + FEATURE_TITLE + ': ป้ายเป็นตัวใหม่ครบ เหลือของเก่า 0');
  return left.length;
}
/* พร้อมแทนไหม + เหตุผลภาษาคน (ใช้ทั้งตอนแทนและตอนตรวจก่อน) */
function labelReady() {
  const lib = (n) => INDEX.has(n) && /^ไลบรารี/.test(ROUTE[n] || '');
  const r = { bar: false, dev: false, barWhy: '', devWhy: '' };
  const H = INDEX.get('Header');
  if (!lib('Header')) r.barWhy = 'นำเข้า Header ตัวใหม่ไม่ได้' + (LABEL_ERR.Header ? ' (' + LABEL_ERR.Header + ')' : '') + ' — ไฟล์ UI Backup ต้อง publish Header';
  else if (H.type !== 'COMPONENT_SET' || !H.children.some(c => (c.variantProperties || {}).Type === 'Subheader')) r.barWhy = 'Header ที่นำเข้าไม่มี variant Type=Subheader';
  else r.bar = true;
  r.head = r.bar && H.children.some(c => (c.variantProperties || {}).Type === 'Header');
  const D = INDEX.get('Device Type');
  if (!lib('Device Type')) r.devWhy = LABEL_KNOWN['Device Type'] ? 'นำเข้า Device Type ตัวใหม่ไม่ได้' + (LABEL_ERR['Device Type'] ? ' (' + LABEL_ERR['Device Type'] + ')' : '') + ' — น่าจะยังไม่ได้ publish Device Type ในไฟล์ UI Backup' : 'ยังไม่รู้จัก Device Type ตัวใหม่ — ลาก Device Type จาก Assets มาวางในไฟล์นี้ 1 ชิ้น (ที่ไหนก็ได้) แล้วกดใหม่ · หรือเปิดพระผู้สร้างในไฟล์ UI Backup 1 ครั้ง';
  else if (D.type === 'COMPONENT_SET' && !['Header', 'Desktop', 'Mobile'].every(k => deviceVariant(k))) r.devWhy = 'Device Type ตัวใหม่มี variant ไม่ครบ — ' + deviceSetInfo();
  else r.dev = true;
  return r;
}
async function labelPreflight() {   // บอกก่อนแตะอะไร ว่ารอบนี้จะแทนอะไรได้บ้าง
  const keys = await labelKeys();
  ['Header', 'Device Type'].forEach(n => { LABEL_KNOWN[n] = !!keys[n] || !!LABEL_DEFAULT[n]; });
  const r = labelReady(), vals = (n) => { const c = INDEX.get(n); return c && c.type === 'COMPONENT_SET' ? c.children.map(x => Object.values(x.variantProperties || {}).join('/')).join(', ') : c ? 'component เดี่ยว' : '-'; };
  log('ตรวจก่อนแทน: Header ' + (r.bar ? '✓ [' + vals('Header') + '] จาก ' + ROUTE.Header : '✗ ' + r.barWhy));
  log('ตรวจก่อนแทน: Device Type ' + (r.dev ? '✓ [' + vals('Device Type') + '] จาก ' + ROUTE['Device Type'] : '✗ ' + r.devWhy));
  if (INDEX.get('Device Type') && INDEX.get('Device Type').type === 'COMPONENT') log('ⓘ ' + singleDeviceInfo());
  return r;
}

/* ส่งทุก Feature ไป FigJam ในรอบเดียว (ผู้ใช้สั่ง 17 พ.ย. 2569 "ทำ Figma ให้นิ่งก่อน แล้วเอาไป FigJam ได้ง่าย")
   ไล่ทุก Feature ที่มีหน้าและมีจอ MF / … อยู่แล้ว ⇒ export แบบเดียวกับปุ่มส่งราย Feature · Feature ที่ยังไม่สร้างข้ามไป */
async function exportAll(devices) {
  const sent = [], skip = [];
  for (const f of MF_FEATURES) {
    useFeature(f.id);
    const fp = await featurePage(false), page = fp && fp.page;
    if (!page || !page.children.some(n => n.type === 'FRAME' && n.name.indexOf(FEATURE_PREFIX + ' / ') === 0)) { skip.push(f.title); continue; }
    log('━━ Feature ' + f.title);
    await exportFigJam(devices, null);
    sent.push(f.title);
  }
  log('');
  log('ส่งแล้ว ' + sent.length + ' Feature: ' + (sent.join(' · ') || '-') + (skip.length ? ' · ยังไม่มีจอ (ข้าม): ' + skip.join(' · ') : ''));
  figma.ui.postMessage({ type: 'fj-all-done', sent, skip });
}
const featureList = () => MF_FEATURES.map(f => { useFeature(f.id); return { id: f.id, title: f.title, page: f.page[0], cases: featureCount(FEATURE), happy: happyCount(FEATURE), jcases: FEATURE.map(j => featureCount([j])), jhappy: FEATURE.map((j, i) => (HAPPY[i] || []).length), journeys: FEATURE.map((j, i) => (i + 1) + ' ' + j.title + ' (' + j.pages.length + ' หน้า · ' + featureCount([j]) + ' เฟรม)') }; });

/* แทนตัวรับคำสั่งของ screens.js (ตัวที่ประกาศทีหลังมีผล) · msg.feature = Feature ที่เลือกในหน้าต่าง (ไม่ส่งมา = ตัวที่ใช้อยู่ · เริ่มต้น plan) */
figma.ui.onmessage = async (msg) => {
  try {
    if (await tgtHandle(msg)) return;   // เลือก / เพิ่ม / ลบบอร์ดปลายทาง · เปิดลิงก์ (targets.js)
    /* msg.features = หลาย Feature ที่ติ๊ก (17 พ.ย. 2569) ⇒ ทำทีละ Feature ตามลำดับ · journey ที่ติ๊ก (pick) ใช้เฉพาะตอนเลือก Feature เดียว */
    const ids = Array.isArray(msg.features) && msg.features.length ? msg.features : [msg.feature];
    const multi = ids.length > 1, picks = msg.picks || {};   // picks = { id: [journey] } เลือก journey ราย Feature · ไม่มี id = ทุก journey
    const devices = msg.type === 'build-desktop' ? [false] : msg.type === 'build-mobile' ? [true] : devOf({ devices: msg.devices });
    const run = /^(build|export-figjam$|patch-labels$)/.test(msg.type), ok = [], fail = [];
    if (msg.type === 'patch-labels') { log('นำเข้า Header / Device Type ตัวใหม่…'); await resolveLabelsOnly(); const r = await labelPreflight(); if (!r.bar && !r.dev) { log('⚠ ยังไม่แทนอะไร: เหลือของเก่าทั้งหมด — แก้ตามเหตุผลข้างบนก่อน แล้วกดใหม่'); figma.ui.postMessage({ type: 'build-all-done', ok: [], fail: [], total: 0 }); return; } }
    if (run && multi) log('จะทำ ' + ids.length + ' Feature: ' + ids.map(id => (MF_FEATURES.find(f => f.id === id) || {}).title || id).join(' · '));
    for (const id of ids) {
      useFeature(id);
      const pick = picks[id] && picks[id].length ? picks[id] : multi ? null : msg.pick;
      if (run && multi) log('━━ Feature ' + F.title);
      /* Feature ไหนพัง ไปต่อ Feature ถัดไป (17 พ.ย. 2569 ผู้ใช้เจอสร้างได้ Page เดียว) */
      try {
        if (msg.type === 'build' || msg.type === 'build-desktop' || msg.type === 'build-mobile' || msg.type === 'build-pick') await buildFeature(devices, msg.type === 'build-pick' || picks[id] ? pick : null);
        if (msg.type === 'build-happy') await buildFeature(devices, pick && pick.length ? pick : null, true);   // เฉพาะ Happy flow (17 พ.ย. 2569)
        if (msg.type === 'export-figjam') await exportFigJam(devices, pick);   // ส่งจอไปบอร์ด FigJam (17 พ.ย. 2569)
        if (msg.type === 'patch-labels') await patchLabels();   // แทนป้ายบนจอที่สร้างแล้ว (17 พ.ย. 2569)
        if (run) ok.push(F.title);
      } catch (e) { fail.push(F.title); log('✗ Feature ' + F.title + ' หยุด — ' + (e && e.message ? e.message : e) + (multi ? ' · ไปต่อ Feature ถัดไป' : '')); }
    }
    if (run) {
      if (multi) { log(''); log((fail.length ? '⚠ ' : '') + 'ทำครบ ' + ok.length + '/' + ids.length + ' Feature' + (fail.length ? ' · พัง: ' + fail.join(' · ') : '') + ' · Page: ' + ids.map(id => (MF_FEATURES.find(f => f.id === id) || { page: ['?'] }).page[0]).join(' · ')); }
      figma.ui.postMessage({ type: 'build-all-done', ok, fail, total: ids.length });
    }
    if (msg.type === 'export-figjam-all') await exportAll(devices);   // ส่งทุก Feature (17 พ.ย. 2569)
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
{ const list = featureList(); useFeature(MF_FEATURES[0].id); figma.ui.postMessage({ type: 'features', list }); figma.ui.postMessage({ type: 'journeys', items: list[0].journeys }); }
tgtPost();   // รายการบอร์ดปลายทางที่จำไว้
rememberLabels();   // เปิดในไฟล์ที่มี Device Type / Header / State ⇒ จำ key ไว้ใช้ในไฟล์อื่น (17 พ.ย. 2569)
try { figma.ui.resize(360, 620); } catch (e) { /* core.js เปิดหน้าต่าง 460×520 · หน้าต่างพระผู้สร้างแบบ Figma ใช้ 360×620 (17 พ.ย. 2569) */ }
