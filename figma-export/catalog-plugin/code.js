/* ============================================================================
   ดัมป์แคตตาล็อก component ที่ "ใช้ได้จริง" ในไฟล์ Figma นี้ — อ่านอย่างเดียว
   ============================================================================
   ไม่สร้าง/ลบ/แก้ node ใดๆ ในไฟล์

   ทำไมต้องมี: จะสร้างหน้าจอจาก prototype ให้ตรง design system ด้วยการ
   **โคลนจาก instance ที่มีอยู่แล้ว** (`instance.clone()`) แทนการวาดกล่องเอง
   — ไม่ต้องใช้ importComponentByKeyAsync (แพลน starter ใช้ไม่ได้)
   และ instance ที่โคลนมายังผูก main component เดิม ⇒ สลับ property ได้ครบ

   ⚠️ รอบแรกเงียบไปเลย ไม่มี POST ถึง serve.js ⇒ รอบนี้:
      · เลิกใช้ figma.root.findAllWithCriteria (ไม่ชัวร์ว่ามีทุกเวอร์ชัน) → ไล่ทีละหน้าแทน
      · รายงานทุกขั้นกลับ UI + figma.notify ให้เห็นด้วยตาว่าเดินถึงไหน
      · ถ้าพัง ส่ง stack กลับไปโชว์ ไม่ใช่เงียบ
   ============================================================================ */

figma.showUI(__html__, { width: 480, height: 460 });
figma.notify('เปิดปลั๊กอินแล้ว — กด "เริ่มอ่านไฟล์"');

function pageNameOf(node) {
  let n = node;
  while (n && n.type !== 'PAGE') n = n.parent;
  return n ? n.name : '(ไม่ทราบ)';
}

function say(text, done) {
  figma.ui.postMessage({ type: 'progress', text: text, done: !!done });
}

function fail(where, e) {
  figma.ui.postMessage({
    type: 'error',
    where: where,
    message: String((e && e.message) || e),
    stack: String((e && e.stack) || ''),
  });
  figma.notify('พังที่ ' + where, { error: true });
}

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== 'scan') return;

  // ---------- 1) โหลดทุกหน้า ----------
  try {
    say('1/4 โหลดทุกหน้าในไฟล์…');
    if (typeof figma.loadAllPagesAsync === 'function') {
      await figma.loadAllPagesAsync();
    } else {
      say('1/4 API นี้ไม่มี loadAllPagesAsync — ข้าม (จะเห็นเฉพาะหน้าที่โหลดแล้ว)');
    }
  } catch (e) { return fail('loadAllPagesAsync', e); }

  // ---------- 2) ไล่หา instance ทีละหน้า ----------
  let instances = [];
  try {
    const pages = figma.root.children;
    say('2/4 ไฟล์นี้มี ' + pages.length + ' หน้า — เริ่มไล่หา instance…');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      let found = [];
      try {
        found = page.findAllWithCriteria({ types: ['INSTANCE'] });
      } catch (e) {
        // เผื่อ findAllWithCriteria ใช้ไม่ได้ — ถอยไปใช้ findAll ธรรมดา
        found = page.findAll(function (n) { return n.type === 'INSTANCE'; });
      }
      instances = instances.concat(found);
      say('2/4 หน้า "' + page.name + '" — เจอ ' + found.length + ' instance (รวม ' + instances.length + ')');
    }
  } catch (e) { return fail('ไล่หา instance', e); }

  if (!instances.length) {
    return fail('ไม่เจอ instance เลย',
      new Error('ไฟล์นี้ไม่มี instance ของ component สักตัว — เปิดถูกไฟล์หรือเปล่า'));
  }

  // ---------- 3) จัดกลุ่มตาม main component ----------
  const byMain = {};
  let skipped = 0;
  try {
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (i % 100 === 0) say('3/4 อ่าน instance ' + i + ' / ' + instances.length + '…');

      let main = null;
      try {
        main = typeof inst.getMainComponentAsync === 'function'
          ? await inst.getMainComponentAsync()
          : inst.mainComponent;
      } catch (e) { skipped++; continue; }
      if (!main) { skipped++; continue; }

      // property ของ variant อยู่ที่ระดับ component set
      let holder = main;
      try {
        if (main.parent && main.parent.type === 'COMPONENT_SET') holder = main.parent;
      } catch (e) { /* remote node บางตัวเข้าถึง parent ไม่ได้ */ }

      const id = holder.id;
      if (!byMain[id]) {
        let defs = {};
        try { defs = holder.componentPropertyDefinitions || {}; } catch (e) { defs = {}; }

        let variants = null;
        try {
          if (holder.type === 'COMPONENT_SET') variants = holder.children.map(function (c) { return c.name; });
        } catch (e) { /* ข้าม */ }

        let remote = false, mainPage = null, key = null;
        try { remote = !!holder.remote; } catch (e) {}
        try { key = holder.key || null; } catch (e) {}
        try { if (!remote) mainPage = pageNameOf(holder); } catch (e) {}

        let cur = null;
        try {
          const cp = inst.componentProperties || {};
          cur = {};
          Object.keys(cp).forEach(function (k) { cur[k] = cp[k].value; });
        } catch (e) { cur = null; }

        byMain[id] = {
          name: holder.name,
          nodeType: holder.type,
          key: key,
          fromLibrary: remote,          // true = ไลบรารี · false = อยู่ในไฟล์นี้เอง
          mainPage: mainPage,
          variants: variants,
          properties: Object.keys(defs).map(function (n) {
            return {
              name: n,
              type: defs[n].type,       // VARIANT | BOOLEAN | TEXT | INSTANCE_SWAP
              defaultValue: defs[n].defaultValue,
              options: defs[n].variantOptions || null,
            };
          }),
          instanceCount: 0,
          sample: {
            id: inst.id,
            page: pageNameOf(inst),
            name: inst.name,
            width: Math.round(inst.width),
            height: Math.round(inst.height),
            currentProperties: cur,
          },
        };
      }
      byMain[id].instanceCount++;
    }
  } catch (e) { return fail('จัดกลุ่ม main component', e); }

  // ---------- 4) ส่งกลับ ----------
  try {
    const list = Object.keys(byMain).map(function (k) { return byMain[k]; })
      .sort(function (a, b) {
        return b.instanceCount - a.instanceCount || String(a.name).localeCompare(String(b.name));
      });

    const catalog = {
      generatedAt: new Date().toISOString(),
      fileName: figma.root.name,
      pages: figma.root.children.map(function (p) { return p.name; }),
      totalInstances: instances.length,
      skippedInstances: skipped,
      componentCount: list.length,
      components: list,
    };

    say('4/4 อ่านครบ — ' + list.length + ' component จาก ' + instances.length + ' instance', true);
    figma.notify('อ่านครบ ' + list.length + ' component');
    figma.ui.postMessage({ type: 'catalog', catalog: catalog });
  } catch (e) { return fail('ประกอบผลลัพธ์', e); }
};
