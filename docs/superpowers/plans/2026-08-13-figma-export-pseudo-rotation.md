# figma-export — รองรับ pseudo-element ที่หมุนและวางแบบ absolute

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้เส้นคั่น chevron ของ `.wstep` ที่ export เข้า Figma ออกมาเอียงและอยู่ขอบขวาเหมือนหน้าเว็บจริง แทนที่จะเป็นแท่งตรงสองแท่งวางหน้าเลขขั้น

**Architecture:** ข้อมูลมีครบตั้งแต่ `dom-walk.js` แล้ว (`transform` อยู่ใน `PROPS`) — ที่ขาดคือ `convertPseudo()` ใน `2-map.js` ไม่แปลงมันต่อ และสเปก/ปลั๊กอินไม่มีที่รับ · แผนนี้เพิ่มคีย์ `rotation` + `absolute` + `rotateOrigin` เข้าสเปก ให้ `2-map.js` คำนวณตำแหน่งจริงจาก CSS box model ส่วนคณิตศาสตร์การชดเชยจุดหมุนอยู่ที่ `plugin/code.js` ที่เดียว มีเทสคุม

**Tech Stack:** Node.js (ไม่มี build step) · Figma Plugin API · เทสด้วย mock Plugin API ใน `figma-export/test-plugin.js`

## Global Constraints

- ไม่แตะ `design-system/components.css` และ `tokens.css` ⇒ **ไม่ต้องบั๊ม `?v=`**
- ห้ามใส่ hex ในไฟล์ `.html` — งานนี้แตะแต่ `.js` จึงไม่กระทบ แต่ต้องรัน grep ตรวจก่อนปิดงาน
- ทุกคำสั่งรันจากรากโปรเจกต์ `Maintenance-Request-Form/`
- ต้นทางความจริงของ CSS: `.wstep:not(:last-child)::before` = `top:0; right:0; width:1px; height:52%; transform-origin:bottom center; transform:rotate(-16deg)` · `::after` = เหมือนกันแต่ `bottom:0` และ `rotate(16deg)`
- **Figma `rotation` เป็นองศา ทวนเข็มเป็นบวก · CSS `rotate()` ตามเข็มเป็นบวก** ⇒ `figmaDeg = -cssDeg` · เครื่องหมายนี้คือจุดที่พลาดง่ายที่สุด ถ้าผลออกมากลับด้าน ให้กลับเครื่องหมายที่ `2-map.js` จุดเดียว
- `layoutPositioning = 'ABSOLUTE'` ใช้ได้เฉพาะเมื่อ **พ่อมี auto-layout** — ถ้าพ่อเป็น `NONE` ให้ fallback ไปทาง `spec.pos` เดิม

---

## File Structure

| ไฟล์ | หน้าที่ | การเปลี่ยนแปลง |
|---|---|---|
| `figma-export/2-map.js` | แปลง DOM → สเปก | `convertPseudo()` (บรรทัด 464) อ่าน `transform`/`position`/`top`/`right`/`bottom`/`left`/`transformOrigin` แล้วปล่อย `rotation` + `absolute` + `pos` + `rotateOrigin` |
| `figma-export/plugin/code.js` | สร้าง node ใน Figma | `applySizing()` (บรรทัด 267) รองรับ `absolute` → `layoutPositioning` + ชดเชยจุดหมุน แล้วตั้ง `rotation` |
| `figma-export/test-plugin.js` | เทสบน mock Plugin API | เพิ่ม property `rotation`/`layoutPositioning` ใน `MNode` + เคสตรวจ chevron |
| `figma-export/README.md` | เอกสารรูปแบบสเปก | เพิ่ม 3 คีย์ใหม่ในตาราง `<node>` |

---

## Task 1: `2-map.js` ถอดมุมหมุนจาก transform matrix

**Files:**
- Modify: `figma-export/2-map.js:462-484` (`convertPseudo`)
- Test: `figma-export/test-pseudo-geom.js` (สร้างใหม่)

**Interfaces:**
- Produces: `degFromMatrix(transformString) -> number` — องศาตามแบบ CSS (ตามเข็มเป็นบวก) · คืน `0` เมื่อไม่มี transform หรือเป็น `none`

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

สร้าง `figma-export/test-pseudo-geom.js`:

```js
#!/usr/bin/env node
/* เทสเรขาคณิตของ pseudo-element — รัน: node figma-export/test-pseudo-geom.js */
const { degFromMatrix } = require('./2-map.js');

let bad = 0;
const eq = (got, want, msg) => {
  const pass = Math.abs(got - want) < 0.01;
  console.log((pass ? '  ok  ' : '  FAIL') + ' ' + msg + ' (ได้ ' + got + ' คาด ' + want + ')');
  if (!pass) bad++;
};

// ค่าจริงที่ dom-walk.js เก็บมาจาก .wstep::before / ::after
eq(degFromMatrix('matrix(0.961262, -0.275637, 0.275637, 0.961262, 0, 0)'), -16, '::before = -16deg');
eq(degFromMatrix('matrix(0.961262, 0.275637, -0.275637, 0.961262, 0, 0)'), 16, '::after = +16deg');
eq(degFromMatrix('none'), 0, 'none = 0');
eq(degFromMatrix(''), 0, 'ว่าง = 0');
eq(degFromMatrix('matrix(1, 0, 0, 1, 0, 0)'), 0, 'identity = 0');

process.exitCode = bad ? 1 : 0;
console.log(bad ? '\nไม่ผ่าน ' + bad + ' ข้อ' : '\nผ่านทุกข้อ');
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
node figma-export/test-pseudo-geom.js
```

คาดว่า: `TypeError: degFromMatrix is not a function` (ยังไม่ได้ export)

- [ ] **Step 3: เขียน `degFromMatrix` แล้ว export ออกไป**

เพิ่มก่อน `function convertPseudo` ใน `figma-export/2-map.js`:

```js
/* CSS transform เป็น matrix(a,b,c,d,e,f) — มุมหมุนอยู่ที่ atan2(b,a)
   คืนค่าเป็น "องศาแบบ CSS" (ตามเข็มเป็นบวก) — ฝั่ง Figma ต้องกลับเครื่องหมายเอง */
function degFromMatrix(t) {
  if (!t || t === 'none') return 0;
  const m = /^matrix\(([^)]+)\)$/.exec(t.trim());
  if (!m) return 0;
  const n = m[1].split(',').map(v => parseFloat(v));
  if (n.length < 4 || !isFinite(n[0]) || !isFinite(n[1])) return 0;
  const deg = Math.atan2(n[1], n[0]) * 180 / Math.PI;
  return Math.abs(deg) < 1e-9 ? 0 : deg;
}
```

ท้ายไฟล์ `2-map.js` มี `main()` ถูกเรียกอยู่ — เพิ่มบรรทัดนี้ **ก่อน** การเรียก `main()` เพื่อให้ require เข้ามาเทสได้โดยไม่รันท่อทั้งท่อ:

```js
module.exports = { degFromMatrix };
if (require.main === module) main();
```

(ถ้าเดิมเขียนเป็น `main();` เฉยๆ ให้แทนที่บรรทัดนั้นด้วยสองบรรทัดข้างบน)

- [ ] **Step 4: รันเทสให้ผ่าน**

```bash
node figma-export/test-pseudo-geom.js
```

คาดว่า: `ผ่านทุกข้อ` · ต้องยืนยันว่า `node figma-export/2-map.js --report` ยังรันได้เหมือนเดิม

```bash
node figma-export/2-map.js --report
```

คาดว่า: พิมพ์สรุปจำนวน frame/text/pseudo เหมือนเดิม ไม่ error

- [ ] **Step 5: commit**

```bash
git add figma-export/2-map.js figma-export/test-pseudo-geom.js
git commit -m "feat(figma-export): ถอดมุมหมุนจาก CSS transform matrix"
```

---

## Task 2: `2-map.js` คำนวณตำแหน่งจริงของ pseudo ที่ absolute

**Files:**
- Modify: `figma-export/2-map.js` (`convertPseudo` — เพิ่มการอ่าน box offset)
- Modify: `figma-export/dom-walk.js:14-29` (`PROPS` — เพิ่ม prop ที่ต้องใช้)
- Test: `figma-export/test-pseudo-geom.js` (เพิ่มเคส)

**Interfaces:**
- Consumes: `degFromMatrix()` จาก Task 1
- Produces: `pseudoBox(hostRect, style) -> { x, y, ox, oy }` — `x`/`y` = มุมซ้ายบนของกล่อง**ก่อนหมุน** เทียบมุมซ้ายบนของ host · `ox`/`oy` = จุดหมุนภายในกล่อง (px)

- [ ] **Step 1: เพิ่ม prop ที่ต้องใช้ใน `dom-walk.js`**

`PROPS` ปัจจุบันไม่มี `position`/`top`/`right`/`bottom`/`left`/`transformOrigin` — ถ้าไม่เพิ่ม `convertPseudo` จะไม่มีข้อมูลให้คำนวณ

แก้ `figma-export/dom-walk.js` บรรทัด 26 จาก:

```js
    'boxShadow', 'transform',
```

เป็น:

```js
    'boxShadow', 'transform', 'transformOrigin',
    'position', 'top', 'right', 'bottom', 'left',
```

- [ ] **Step 2: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มท้าย `figma-export/test-pseudo-geom.js` (ก่อนบรรทัด `process.exitCode`):

```js
const { pseudoBox } = require('./2-map.js');

// host = .wstep ตัวจริง: กว้าง 255.59 สูง 68 · เส้นสูง 52% = 35.36
const host = { x: 129, y: 204, w: 255.59375, h: 68 };
const before = pseudoBox(host, {
  position: 'absolute', top: '0px', right: '0px', bottom: 'auto', left: 'auto',
  width: '1px', height: '35.3594px', transformOrigin: '0.5px 35.3594px'
});
eq(before.x, 254.59375, '::before ชิดขอบขวา');
eq(before.y, 0, '::before ชิดขอบบน');
eq(before.ox, 0.5, '::before จุดหมุน x = กึ่งกลาง');
eq(before.oy, 35.3594, '::before จุดหมุน y = ล่างสุด');

const after = pseudoBox(host, {
  position: 'absolute', top: 'auto', right: '0px', bottom: '0px', left: 'auto',
  width: '1px', height: '35.3594px', transformOrigin: '0.5px 0px'
});
eq(after.x, 254.59375, '::after ชิดขอบขวา');
eq(after.y, 32.6406, '::after ชิดขอบล่าง (68 - 35.3594)');
eq(after.oy, 0, '::after จุดหมุน y = บนสุด');
```

- [ ] **Step 3: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
node figma-export/test-pseudo-geom.js
```

คาดว่า: `TypeError: pseudoBox is not a function`

- [ ] **Step 4: เขียน `pseudoBox` + ต่อเข้า `convertPseudo`**

เพิ่มใน `figma-export/2-map.js` ถัดจาก `degFromMatrix`:

```js
/* กล่องของ pseudo เทียบมุมซ้ายบนของ host — อ่านจาก offset ของ CSS ตรงๆ
   ค่า 'auto' แปลว่าอีกฝั่งเป็นตัวกำหนด (เช่น right:0 + left:auto = ชิดขวา) */
function pseudoBox(hostRect, s) {
  const px = (v) => { const n = parseFloat(v); return isFinite(n) ? n : null; };
  const w = px(s.width) || 0, h = px(s.height) || 0;
  const left = px(s.left), right = px(s.right), top = px(s.top), bottom = px(s.bottom);

  let x = 0, y = 0;
  if (left !== null) x = left;
  else if (right !== null) x = hostRect.w - right - w;
  if (top !== null) y = top;
  else if (bottom !== null) y = hostRect.h - bottom - h;

  // transform-origin คืนมาเป็น "<x>px <y>px" เสมอเมื่ออ่านจาก computed style
  const o = String(s.transformOrigin || '').split(/\s+/).map(v => parseFloat(v));
  const ox = isFinite(o[0]) ? o[0] : w / 2;
  const oy = isFinite(o[1]) ? o[1] : h / 2;

  return { x, y, ox, oy };
}
```

แก้ `module.exports` ให้ปล่อยออกไปด้วย:

```js
module.exports = { degFromMatrix, pseudoBox };
```

แล้วแทนที่บล็อกท้าย `convertPseudo` — เดิมคือ:

```js
  const radius = radiusOf(s);
  if (radius !== undefined && radius !== 0) spec.radius = radius;
  // pseudo ไม่มี rect จริงให้วัด — วางไว้ที่มุมซ้ายบนของ host แล้วให้ auto-layout จัดต่อ
  spec._rect = { x: hr.x, y: hr.y, w, h };
  return spec;
```

เป็น:

```js
  const radius = radiusOf(s);
  if (radius !== undefined && radius !== 0) spec.radius = radius;

  // pseudo ที่ absolute ไม่ร่วมใน flow ของ auto-layout — บอกตำแหน่ง+มุมหมุนไปตรงๆ
  // ที่เหลือ (static/relative เช่นแถบ magenta ของ .sect) คงพฤติกรรมเดิม: เป็นลูกในแถว
  if (s.position === 'absolute' || s.position === 'fixed') {
    const b = pseudoBox({ w: hr.w, h: hr.h }, s);
    const deg = degFromMatrix(s.transform);
    spec.absolute = true;
    spec.pos = { x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100 };
    if (deg !== 0) {
      spec.rotation = -deg;                       // Figma ทวนเข็มเป็นบวก CSS ตามเข็มเป็นบวก
      spec.rotateOrigin = [b.ox, b.oy];
    }
    spec._rect = { x: hr.x + b.x, y: hr.y + b.y, w, h };
  } else {
    spec._rect = { x: hr.x, y: hr.y, w, h };
  }
  return spec;
```

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
node figma-export/test-pseudo-geom.js
```

คาดว่า: `ผ่านทุกข้อ` (9 ข้อ)

- [ ] **Step 6: extract ใหม่แล้วดูว่าสเปกมีคีย์ใหม่จริง**

`dom-report-*.json` เดิมไม่มี `position`/`transformOrigin` ต้อง extract ใหม่ (ต้องมี `:8123` รันอยู่)

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &
NODE_PATH=<ที่ npm i playwright-core ไว้>/node_modules node figma-export/flow-report-extract.js
node figma-export/2-map.js --report
node -e '
const d=require("./figma-export/out/spec-report.json");
const set=d.components.sets.find(s=>s.set==="stepper step");
const kid=set.variants[0].root.children.find(c=>/::before/.test(c.name));
console.log(JSON.stringify({rotation:kid.rotation,absolute:kid.absolute,pos:kid.pos,rotateOrigin:kid.rotateOrigin}));
'
```

คาดว่า: `{"rotation":16,"absolute":true,"pos":{"x":254.59,"y":0},"rotateOrigin":[0.5,35.3594]}`
(`rotation` เป็น **+16** เพราะ CSS `-16deg` กลับเครื่องหมายแล้ว)

- [ ] **Step 7: commit**

```bash
git add figma-export/2-map.js figma-export/dom-walk.js figma-export/test-pseudo-geom.js
git commit -m "feat(figma-export): คำนวณตำแหน่ง+มุมหมุนของ pseudo ที่ absolute"
```

---

## Task 3: ปลั๊กอินวาง node แบบ absolute + หมุนโดยชดเชยจุดหมุน

**Files:**
- Modify: `figma-export/plugin/code.js:267-295` (`applySizing`)
- Modify: `figma-export/test-plugin.js:19-59` (`MNode` — เพิ่ม property)
- Test: `figma-export/test-plugin.js` (เพิ่มเคสตรวจ)

**Interfaces:**
- Consumes: `spec.absolute` (boolean) · `spec.pos` (`{x,y}`) · `spec.rotation` (องศา Figma) · `spec.rotateOrigin` (`[ox,oy]`) จาก Task 2

**คณิตศาสตร์ที่ต้องทำ:** Figma หมุน node รอบ**มุมซ้ายบนของตัวมันเอง** แต่ CSS หมุนรอบ `transform-origin` ⇒ ถ้าตั้ง `x`/`y` เป็นตำแหน่งกล่องก่อนหมุนตรงๆ เส้นจะเลื่อนไปจากที่ควรอยู่ · ต้องเลื่อนชดเชยให้จุด `o` อยู่กับที่:

```
P = P0 + o − R(φ)·o        โดย R(φ) = [[cos φ,  sin φ],
                                       [−sin φ, cos φ]]   (แกน y ชี้ลง, φ ทวนเข็มเป็นบวก)
```

- [ ] **Step 1: เพิ่ม property ที่ยังไม่มีใน mock**

`MNode` ใน `figma-export/test-plugin.js` ยังไม่มี `rotation` กับ `layoutPositioning` ⇒ เทสจะผ่านแบบหลอกๆ

แก้ `figma-export/test-plugin.js` — ในคอนสตรัคเตอร์ของ `MNode` ถัดจากบรรทัด `this.layoutSizingVertical = 'FIXED';` เพิ่ม:

```js
    this.rotation = 0;
    this.layoutPositioning = 'AUTO';
```

- [ ] **Step 2: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มใน `figma-export/test-plugin.js` ก่อนบล็อก `/* รันซ้ำ — variable ต้องไม่งอกเพิ่ม */`:

```js
  /* chevron ของ stepper — ต้องหมุนและอยู่ขอบขวา ไม่ใช่แท่งตรงหน้าเลขขั้น */
  const fPage2 = root.children.find(p => p.name === spec.components.pageName);
  let chev = [];
  (function findChev(n) {
    if (/::(before|after)$/.test(n.name || '') && /wstep/.test(n.name || '')) chev.push(n);
    n.children.forEach(findChev);
  })(fPage2);

  if (!chev.length) fail('ไม่เจอ node chevron ของ .wstep เลย');
  else {
    const rotated = chev.filter(c => Math.abs(c.rotation) > 1);
    rotated.length === chev.length
      ? ok('chevron หมุนครบ ' + chev.length + ' เส้น (' + chev.map(c => Math.round(c.rotation)).join(',') + '°)')
      : fail('chevron ไม่หมุน ' + (chev.length - rotated.length) + ' เส้นจาก ' + chev.length);

    const abs = chev.filter(c => c.layoutPositioning === 'ABSOLUTE');
    abs.length === chev.length
      ? ok('chevron วางแบบ ABSOLUTE ครบ ' + chev.length + ' เส้น')
      : fail('chevron ยังอยู่ใน flow ของ auto-layout ' + (chev.length - abs.length) + ' เส้น');

    // ต้องอยู่ครึ่งขวาของขั้น ไม่ใช่มุมซ้ายบน
    const left = chev.filter(c => c.x < (c.parent ? c.parent.width : 256) / 2);
    left.length === 0
      ? ok('chevron อยู่ครึ่งขวาทุกเส้น')
      : fail('chevron ยังอยู่ครึ่งซ้าย ' + left.length + ' เส้น (x=' + left.map(c => Math.round(c.x)).join(',') + ')');
  }
```

- [ ] **Step 3: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
node figma-export/test-plugin.js --report
```

คาดว่า: `FAIL chevron ไม่หมุน 2 เส้นจาก 2` และ `FAIL chevron ยังอยู่ใน flow ของ auto-layout 2 เส้น`

- [ ] **Step 4: เขียนโค้ดในปลั๊กอิน**

แทนที่บล็อกท้าย `applySizing` ใน `figma-export/plugin/code.js` — เดิมคือ:

```js
  // พ่อไม่มี auto-layout ⇒ ลูกต้องบอกตำแหน่งเอง (2-map.js ใส่ pos มาให้เฉพาะกรณีนี้)
  // ต้องทำหลัง resize ไม่งั้นค่าที่ตั้งไว้โดนเขียนทับ
  if (spec.pos && !parentIsAuto && 'x' in node) {
    node.x = spec.pos.x;
    node.y = spec.pos.y;
  }
}
```

เป็น:

```js
  // pseudo ที่ CSS สั่ง position:absolute — ต้องหลุดจาก flow ของ auto-layout
  // ไม่งั้นมันจะถูกจัดเรียงเป็นลูกในแถวแทนที่จะทับอยู่ตามพิกัด
  if (spec.absolute && parentIsAuto && 'layoutPositioning' in node) {
    try { node.layoutPositioning = 'ABSOLUTE'; }
    catch (e) { warn('ตั้ง ABSOLUTE ไม่ได้ที่ "' + node.name + '"'); }
  }

  // พ่อไม่มี auto-layout ⇒ ลูกต้องบอกตำแหน่งเอง · หรือลูกเป็น absolute ก็ต้องบอกเอง
  // ต้องทำหลัง resize ไม่งั้นค่าที่ตั้งไว้โดนเขียนทับ
  const positioned = spec.absolute || !parentIsAuto;
  if (spec.pos && positioned && 'x' in node) {
    let { x, y } = spec.pos;
    // Figma หมุนรอบมุมซ้ายบนของ node แต่ CSS หมุนรอบ transform-origin
    // ⇒ เลื่อนชดเชยให้จุดหมุนอยู่ที่เดิม: P = P0 + o − R·o
    if (typeof spec.rotation === 'number' && spec.rotation !== 0 && spec.rotateOrigin) {
      const rad = spec.rotation * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const [ox, oy] = spec.rotateOrigin;
      x += ox - (ox * cos + oy * sin);
      y += oy - (-ox * sin + oy * cos);
    }
    node.x = x;
    node.y = y;
  }

  if (typeof spec.rotation === 'number' && spec.rotation !== 0 && 'rotation' in node) {
    try { node.rotation = spec.rotation; }
    catch (e) { warn('ตั้งมุมหมุนไม่ได้ที่ "' + node.name + '"'); }
  }
}
```

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
node figma-export/test-plugin.js --report
```

คาดว่า: ทั้ง 3 ข้อใหม่เป็น `ok` และข้อเดิมทั้งหมดยังผ่าน ปิดท้ายด้วย `ผ่านทุกข้อ`

- [ ] **Step 6: เทสท่อ FigJam ไม่พังตาม**

```bash
node figma-export/test-figjam-plugin.js
```

คาดว่า: ผ่านเหมือนเดิม (คนละปลั๊กอิน ไม่ควรกระทบ — ถ้าพังแปลว่าแตะของที่ใช้ร่วมกัน)

- [ ] **Step 7: commit**

```bash
git add figma-export/plugin/code.js figma-export/test-plugin.js
git commit -m "fix(figma-export): วาง pseudo แบบ absolute + หมุนโดยชดเชยจุดหมุน"
```

---

## Task 4: อัปเดตเอกสาร แล้วให้เจ้าของงานกดสร้างในไฟล์จริง

**Files:**
- Modify: `figma-export/README.md` (ตาราง `<node>` ราวบรรทัด 177-189)
- Modify: `plan.md` (รายการค้าง)

- [ ] **Step 1: เพิ่มคีย์ใหม่ในตารางรูปแบบสเปก**

ใน `figma-export/README.md` ตาราง `<node>` เพิ่ม 3 แถวถัดจากแถว `radius`:

```markdown
| `rotation` | องศา **ทวนเข็มเป็นบวก** (แบบ Figma — ตรงข้ามกับ CSS) ใช้คู่กับ `rotateOrigin` |
| `rotateOrigin` | `[ox, oy]` จุดหมุนภายในกล่อง (px) — ปลั๊กอินเลื่อนชดเชยให้จุดนี้อยู่กับที่ เพราะ Figma หมุนรอบมุมซ้ายบน |
| `absolute` | `true` = หลุดจาก flow ของ auto-layout (`layoutPositioning:'ABSOLUTE'`) ใช้กับ pseudo ที่ CSS สั่ง `position:absolute` · ต้องมี `pos` มาด้วย |
```

- [ ] **Step 2: ปิดรายการค้างใน `plan.md`**

หารายการ `- [ ] **figma-export: chevron ของ stepper ออกมาผิด**` แล้วเปลี่ยนเป็น:

```markdown
- [x] ~~**figma-export: chevron ของ stepper ออกมาผิด**~~ — **แก้แล้ว 13 ส.ค.** สาเหตุ: `convertPseudo()` ทิ้ง `transform` + ฮาร์ดโค้ดตำแหน่งเป็นมุมซ้ายบนของ host · แก้ด้วยการเพิ่มคีย์ `rotation`/`rotateOrigin`/`absolute` เข้าสเปก · `dom-walk.js` เก็บ `position`/`top`/`right`/`bottom`/`left`/`transformOrigin` เพิ่ม · ปลั๊กอินตั้ง `layoutPositioning='ABSOLUTE'` แล้วชดเชยจุดหมุนด้วย `P = P0 + o − R·o` (Figma หมุนรอบมุมซ้ายบน CSS หมุนรอบ transform-origin) · เทส `test-pseudo-geom.js` 9 ข้อ + `test-plugin.js` 3 ข้อใหม่ · **ค้าง: เจ้าของงานกด "โหลด + สร้าง" ในไฟล์ Figma จริงเพื่อยืนยันด้วยตา**
```

- [ ] **Step 3: ตรวจก่อนปิดงาน**

```bash
node figma-export/test-pseudo-geom.js
node figma-export/test-plugin.js --report
node figma-export/test-figjam-plugin.js

grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'
```

คาดว่า: เทสผ่านทั้ง 3 ตัว · grep ได้ผลว่าง

- [ ] **Step 4: commit + push**

```bash
git add figma-export/README.md plan.md
git commit -m "docs(figma-export): บันทึกคีย์ rotation/rotateOrigin/absolute ในรูปแบบสเปก"
git push origin main
```

- [ ] **Step 5: ส่งให้เจ้าของงานยืนยันด้วยตา**

⚠️ **ขั้นนี้ทำแทนไม่ได้** — ต้องให้เจ้าของงานกดเอง แจ้งไปว่า:

```bash
node figma-export/serve.js        # พอร์ต 8124
```

แล้วเปิด Figma desktop → ไฟล์ design → Plugins → Development → Maintain-D → Figma → กด **"โหลด + สร้าง"** (ช่องสเปกชี้ `spec-report.json` เป็นค่าเริ่มต้นอยู่แล้ว)

**สิ่งที่ต้องดู:** เส้นคั่นระหว่างขั้นใน stepper ต้องเป็นลูกศร `>` เอียง อยู่**ขอบขวา**ของแต่ละขั้น ไม่ใช่แท่งตรงสองแท่งหน้าเลขขั้น

**ถ้าเอียงกลับด้าน** (เป็น `<` แทน `>`) แปลว่าเครื่องหมายมุมหมุนกลับ — แก้ที่ `2-map.js` บรรทัด `spec.rotation = -deg;` เป็น `spec.rotation = deg;` แล้วรัน `2-map.js --report` ใหม่ ไม่ต้องแตะที่อื่น
