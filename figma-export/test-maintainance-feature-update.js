#!/usr/bin/env node
/* เทสหน่วยของงาน "อัปเดตเฉพาะจุด" ปลั๊กอินพระผู้สร้าง (18 พ.ย. 2569) — ไม่ต้องเปิด Figma
   ก. ลายเซ็นจอ (maintainance-feature-plugin/sig.js) จากซอร์สจริง:
      แก้ฟังก์ชันจอ ⇒ ลายเซ็นของจอที่ใช้ฟังก์ชันนั้นเปลี่ยน · จอที่ไม่เกี่ยวไม่เปลี่ยน · แก้คอมเมนต์อย่างเดียวไม่เปลี่ยน · ชื่อในไฟล์ Feature หาในไฟล์นั้นก่อน
   ข. (18 พ.ย. 2569 รีวิวโคนัน) คำสั่งคอลัมน์ 0 ที่แก้ตัวแปร (Object.assign · push · X[k] = …) ผูกกับตัวแปรนั้น · แยก scope จอของ screens.js กับจอของไฟล์ Feature
      (rcache.js เลิกใช้แล้ว — ย้ายฐาน origin ใช้ resolveAll ที่มีแคชในตัว)
   รัน:  node figma-export/test-maintainance-feature-update.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, 'maintainance-feature-plugin');
const S = require(path.join(D, 'sig.js'));
const out = []; const t = (ok, m) => out.push((ok ? '✓ ' : '⚠ ') + m);

/* ---------- ก. ลายเซ็น ---------- */
{
  const rd = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  const core = rd('maintainance-feature-plugin/base/core.js'), screens = rd('maintainance-feature-plugin/base/screens.js'), feat = rd('maintainance-feature-plugin/feature.js');   // ฐาน origin (base/)
  const fsrc = (id) => rd('maintainance-feature-plugin/features/' + id + '.js');
  const scopes = (scr, trip) => ({ '*': [core, scr, feat], plan: fsrc('plan'), trip: trip || fsrc('trip') });
  const A = S.sigDepHash(scopes(screens));
  t(S.sigDepHash(scopes(screens)).trip.TOASTS === A.trip.TOASTS && JSON.stringify(S.sigDepHash(scopes(screens))) === JSON.stringify(A), 'คิดซ้ำได้ค่าเดิม (ไม่สุ่ม)');
  /* แก้ตัวเลขในตัวฟังก์ชัน tripList (จอแผนเดินทาง) */
  const m = screens.match(/\nasync function tripList\([^)]*\) \{\n/);
  t(!!m, 'หา async function tripList ใน screens.js เจอ (ใช้ทดสอบ)');
  if (m) {
    const i = screens.indexOf(m[0]) + m[0].length;
    const B = S.sigDepHash(scopes(screens.slice(0, i) + '  const __mfTest = 1;\n' + screens.slice(i)));
    const C = S.sigDepHash(scopes(screens.slice(0, i) + '  /* แก้คอมเมนต์อย่างเดียว */ // อีกบรรทัด\n' + screens.slice(i)));
    t(A['*'].tripList !== B['*'].tripList, 'แก้ tripList ⇒ hash ของ tripList เปลี่ยน');
    t(A['*'].planForm === B['*'].planForm || /tripList/.test(screens.slice(screens.indexOf('function planForm'), screens.indexOf('function planForm') + 20000).split(/\n(?:async )?function /)[0]) , 'จอที่ไม่ได้ใช้ tripList (planForm) hash เท่าเดิม');
    t(JSON.stringify(A) === JSON.stringify(C), 'แก้คอมเมนต์อย่างเดียว ⇒ ทุก hash เท่าเดิม');
    const fn = function () { return tripList('S6 x', { trips: [] }); };
    const sigA = (() => { global.MF_DEPHASH = A; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigB = (() => { global.MF_DEPHASH = B; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigC = (() => { global.MF_DEPHASH = A; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1', label: 'ชื่อใหม่' }); })();
    const fn2 = function () { return listScreen('S1 x', {}); };
    const sigD = (() => { global.MF_DEPHASH = A; return S.sigOf(fn2, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigE = (() => { global.MF_DEPHASH = B; return S.sigOf(fn2, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    t(sigA !== sigB, 'ลายเซ็นจอที่เรียก tripList เปลี่ยนเมื่อ tripList เปลี่ยน');
    t(sigA !== sigC, 'ลายเซ็นเปลี่ยนเมื่อชื่อเคสเปลี่ยน');
    t(sigD === sigE || /tripList/.test(screens.split('function listScreen')[1].split(/\n(?:async )?function /)[0]), 'ลายเซ็นจอ listScreen ไม่เปลี่ยนเมื่อแก้ tripList');
  }
  /* ชื่อซ้ำข้ามไฟล์ Feature: TOASTS ของ trip ต้องไม่ปนของ plan · แก้ข้อความ toast ใน trip ⇒ เฉพาะ trip เปลี่ยน */
  const trip2 = fsrc('trip').replace("S3: { text: 'อนุมัติแผนเดินทางสำเร็จ'", "S3: { text: 'อนุมัติแผนเดินทางสำเร็จแล้ว'");
  t(trip2 !== fsrc('trip'), 'เตรียมแก้ข้อความ toast ใน trip.js ได้');
  const T = S.sigDepHash(scopes(screens, trip2));
  t(T.trip.TOASTS !== A.trip.TOASTS && JSON.stringify(T['*']) === JSON.stringify(A['*']) && JSON.stringify(T.plan) === JSON.stringify(A.plan), 'แก้ TOASTS ใน trip.js ⇒ เปลี่ยนเฉพาะ scope trip (ส่วนกลางและ plan เท่าเดิม)');
  /* ตัวตัดคำ: ตัดคอมเมนต์แล้วยังเป็น JS ที่ถูกต้อง */
  let okParse = true; for (const src of [core, screens, feat]) { try { new Function(S.sigScan(src).code); } catch (e) { okParse = false; } }
  t(okParse, 'ตัดคอมเมนต์ core/screens/feature แล้ว parse ผ่าน (ตัวตัดคำไม่กินโค้ด)');
  const sc = S.sigScan("const a = b.c + `x${d + e}y` + '/* f */' + /g\\/h/.test(i); // j");
  t(['a', 'b', 'd', 'e', 'i'].every(x => sc.ids.has(x)) && !sc.ids.has('c') && !sc.ids.has('f') && !sc.ids.has('j') && !sc.ids.has('h'), 'ตัวตัดคำเก็บชื่อถูก (ไม่นับ property · ข้อความ · regex · คอมเมนต์)');
  global.MF_DEPHASH = undefined;
  t(S.sigSourceOk(), 'node อ่านซอร์สฟังก์ชันได้ (ใน Figma ตรวจตอนกดอีกครั้ง)');
}


/* ---------- ข. คำสั่งที่แก้ตัวแปร + แยก scope ---------- */
{
  const G = "const KEYS = { a: 1 };\nconst NEEDED = ['x'];\nconst PLAN_UNIT = {};\nconst HAPPY = 1;\nfunction listS() { return KEYS.a + NEEDED.length; }\nfunction unitS() { return PLAN_UNIT.q; }\nfunction other() { return 2; }\n";
  const H = (g, plan) => S.sigDepHash({ '*': [g], plan: plan || "const HAPPY = 2;\nconst EXTRA = { q: 1 };\nfor (const [u, v] of Object.entries(EXTRA)) PLAN_UNIT[u] = v;\n" });
  const A = H(G);
  const B = H(G + "Object.assign(KEYS, { b: 2 });\n"), C = H(G + "NEEDED.push('y');\n");
  const P = H(G, "const HAPPY = 2;\nconst EXTRA = { q: 2 };\nfor (const [u, v] of Object.entries(EXTRA)) PLAN_UNIT[u] = v;\n");
  t(A['*'].listS !== B['*'].listS && A['*'].other === B['*'].other, 'Object.assign(KEYS, …) ที่คอลัมน์ 0 ⇒ จอที่ใช้ KEYS เปลี่ยน · จอที่ไม่ใช้ไม่เปลี่ยน');
  t(A['*'].listS !== C['*'].listS, 'NEEDED.push(…) ที่คอลัมน์ 0 ⇒ จอที่ใช้ NEEDED เปลี่ยน');
  t(A['*'].unitS !== P['*'].unitS && A['*'].listS === P['*'].listS, 'plan.js แก้ PLAN_UNIT ตอนโหลด ⇒ จอของ screens.js ที่ใช้ PLAN_UNIT เปลี่ยน');
  global.MF_DEPHASH = A;
  const fn = function () { return HAPPY; };
  const s1 = S.sigOf(fn, '*', [], {}), s2 = S.sigOf(fn, 'plan', [], {});
  global.MF_DEPHASH = H(G, "const HAPPY = 3;\nconst EXTRA = { q: 1 };\nfor (const [u, v] of Object.entries(EXTRA)) PLAN_UNIT[u] = v;\n");
  t(S.sigOf(fn, '*', [], {}) === s1 && S.sigOf(fn, 'plan', [], {}) !== s2, 'ชื่อชน (HAPPY ทั้งส่วนกลางและ plan.js): จอของ screens.js ใช้ของส่วนกลาง · จอของไฟล์ Feature ใช้ของไฟล์นั้น');
  global.MF_DEPHASH = undefined;
  /* build จริง: ภาพ (IMAGES) และเวลา build อยู่ใน code.js */
  const code = fs.readFileSync(path.join(D, 'code.js'), 'utf8');
  const dep = JSON.parse((code.match(/const MF_DEPHASH = (\{.*\});/) || [])[1] || '{}');
  t(dep['*'] && dep['*'].IMAGES && dep['*'].KEYS && dep['*'].NEEDED && /const MF_BUILT_AT = \d{13};/.test(code), 'code.js มีลายเซ็นของ IMAGES KEYS NEEDED และเวลา build (MF_BUILT_AT)');
  t(!/rcache/.test(fs.readFileSync(path.join(D, 'build.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')), 'build.js ไม่ประกอบ rcache.js แล้ว (ใช้ resolveAll ของฐาน)');
}
out.forEach(x => console.log(x));
{ const bad = out.filter(x => x[0] === '⚠').length; console.log(bad ? 'ผล: ⚠ ไม่ผ่าน ' + bad + ' ข้อ' : 'ผล: ผ่านทุกข้อ (' + out.length + ')'); process.exitCode = bad ? 1 : 0; }
