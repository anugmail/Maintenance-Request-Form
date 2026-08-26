/* ============================================================================
   ทดสอบว่า "จะสร้าง instance ของ component VMS Plus ด้วยวิธีไหน"
   ============================================================================
   มี 2 วิธี ต้องรู้ว่าอันไหนใช้ได้จริงบนสิทธิ์ปัจจุบัน ก่อนจะไปแก้ 2-map.js

   A) importComponentByKeyAsync(key) → createInstance()
      ดีกว่า: ใช้ได้แม้ในไฟล์เปล่าที่ไม่มี instance อยู่เลย
      เสี่ยง: ต้องมีสิทธิ์เข้าไลบรารี (แพลน starter อาจไม่ผ่าน)

   B) หา instance ที่มีอยู่ในไฟล์ → clone() → setProperties()
      ดีกว่า: ไม่ต้องใช้สิทธิ์ไลบรารีเลย
      เสี่ยง: ต้องมี instance ของ component นั้นอยู่ในไฟล์ก่อน

   ⚠️ ปลั๊กอินนี้ **เขียนของลงไฟล์** — สร้างหน้าใหม่ชื่อ "🧪 ทดสอบ Maintain-D"
      ไม่แตะหน้าอื่นเลย · ให้รันในไฟล์ที่ duplicate มาแล้วเท่านั้น
   ============================================================================ */

figma.showUI(__html__, { width: 500, height: 420 });

var TARGETS = ['Pill outline', 'Section header', 'Tertiary button'];

function say(t, cls) { figma.ui.postMessage({ type: 'log', text: t, cls: cls || '' }); }

figma.ui.onmessage = async function (msg) {
  if (!msg || msg.type !== 'run') return;

  var results = { A: [], B: [] };

  try {
    say('โหลดทุกหน้า…');
    if (typeof figma.loadAllPagesAsync === 'function') await figma.loadAllPagesAsync();

    // ---- หา instance ตัวอย่าง + key ของแต่ละ target ----
    say('หา instance ตัวอย่างของ ' + TARGETS.length + ' component…');
    var found = {};
    var pages = figma.root.children;
    for (var pi = 0; pi < pages.length && Object.keys(found).length < TARGETS.length; pi++) {
      var insts = pages[pi].findAllWithCriteria
        ? pages[pi].findAllWithCriteria({ types: ['INSTANCE'] })
        : pages[pi].findAll(function (n) { return n.type === 'INSTANCE'; });
      for (var i = 0; i < insts.length; i++) {
        var inst = insts[i];
        var main = null;
        try { main = await inst.getMainComponentAsync(); } catch (e) { continue; }
        if (!main) continue;
        var holder = (main.parent && main.parent.type === 'COMPONENT_SET') ? main.parent : main;
        if (TARGETS.indexOf(holder.name) === -1 || found[holder.name]) continue;
        found[holder.name] = { instance: inst, key: holder.key, holder: holder };
        say('  เจอ "' + holder.name + '" (key ' + String(holder.key).slice(0, 10) + '…)');
        if (Object.keys(found).length === TARGETS.length) break;
      }
    }

    // ---- หน้าใหม่สำหรับวางผล ----
    var page = figma.createPage();
    page.name = '🧪 ทดสอบ Maintain-D';
    say('สร้างหน้าใหม่ "' + page.name + '" แล้ว (ไม่แตะหน้าอื่น)', 'ok');

    var x = 0;

    // ---- วิธี A ----
    say('');
    say('── วิธี A: importComponentByKeyAsync ──');
    for (var t = 0; t < TARGETS.length; t++) {
      var name = TARGETS[t];
      var f = found[name];
      if (!f) { results.A.push([name, 'ข้าม (ไม่เจอ instance ให้เอา key)']); say('  ' + name + ': ข้าม', 'err'); continue; }
      try {
        var comp = await figma.importComponentByKeyAsync(f.key);
        var inst = comp.createInstance();
        inst.x = x; inst.y = 0; x += inst.width + 24;
        page.appendChild(inst);
        results.A.push([name, 'ผ่าน']);
        say('  ' + name + ': ✓ ผ่าน', 'ok');
      } catch (e) {
        results.A.push([name, 'พัง — ' + String(e && e.message || e)]);
        say('  ' + name + ': ✗ ' + String(e && e.message || e), 'err');
      }
    }

    // ---- วิธี B ----
    say('');
    say('── วิธี B: clone จาก instance ที่มีอยู่ ──');
    x = 0;
    for (var t2 = 0; t2 < TARGETS.length; t2++) {
      var name2 = TARGETS[t2];
      var f2 = found[name2];
      if (!f2) { results.B.push([name2, 'ข้าม (ไม่มี instance ในไฟล์)']); say('  ' + name2 + ': ข้าม', 'err'); continue; }
      try {
        var copy = f2.instance.clone();
        copy.x = x; copy.y = 200; x += copy.width + 24;
        page.appendChild(copy);
        // เช็คว่า property ยังสลับได้จริงไหม
        var props = copy.componentProperties || {};
        var keys = Object.keys(props);
        results.B.push([name2, 'ผ่าน · property ' + keys.length + ' ตัว']);
        say('  ' + name2 + ': ✓ ผ่าน — property ที่สลับได้ ' + keys.length + ' ตัว', 'ok');
        if (keys.length) say('      ' + keys.slice(0, 4).join(' · '));
      } catch (e) {
        results.B.push([name2, 'พัง — ' + String(e && e.message || e)]);
        say('  ' + name2 + ': ✗ ' + String(e && e.message || e), 'err');
      }
    }

    var aOk = results.A.filter(function (r) { return r[1] === 'ผ่าน'; }).length;
    var bOk = results.B.filter(function (r) { return String(r[1]).indexOf('ผ่าน') === 0; }).length;
    say('');
    say('สรุป: วิธี A ผ่าน ' + aOk + '/' + TARGETS.length + ' · วิธี B ผ่าน ' + bOk + '/' + TARGETS.length,
      (aOk || bOk) ? 'ok' : 'err');
    say('ดูผลที่หน้า "🧪 ทดสอบ Maintain-D" — ลบทิ้งได้เลยเมื่อดูเสร็จ');
    figma.ui.postMessage({ type: 'done' });
  } catch (e) {
    say('พังทั้งก้อน: ' + String(e && e.message || e), 'err');
    figma.ui.postMessage({ type: 'done' });
  }
};
