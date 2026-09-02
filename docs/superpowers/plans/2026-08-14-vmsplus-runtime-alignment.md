> ⛔ **เอกสารเก่าเก็บเป็นประวัติ (2 ก.ย. 2569)** — แผนนี้ยึด "เว็บ vmsplus-dev ที่รันจริง" เป็นแหล่งค่า ซึ่ง**ยกเลิกแล้ว**
> ตอนนี้แหล่งดีไซน์เดียวคือ Figma 2 ไฟล์ (ดู `design-system/SOURCES.md`) · `design-system/verify-runtime.js` ถูกลบทิ้งแล้ว

# ปรับ design-system ให้ตรง VMS Plus ตัวจริง — Implementation Plan

> **สำหรับผู้ลงมือ:** ใช้ `superpowers:subagent-driven-development` หรือ `superpowers:executing-plans` เดินทีละ task · ทุกขั้นเป็น checkbox

**Goal:** ทำให้ทุกค่าที่ตามองเห็นใน `design-system/` และทั้ง 24 หน้า ตรงกับ VMS Plus ที่รันอยู่จริงบน `vmsplus-dev.pea.co.th`

**Architecture:** static HTML ไม่มี build step · แหล่งความจริงชั้นเดียวคือ `design-system/tokens.css` + `components.css` · หน้าจอทุกหน้า `<link>` สองไฟล์นี้ ⇒ แก้ที่ต้นทางแล้วบั๊ม `?v=` ทุกหน้า · การตรวจใช้สคริปต์ Node อ่านไฟล์เทียบค่าที่วัดมา ไม่ใช่ตาดู

**Tech Stack:** HTML/CSS ล้วน · Node (สคริปต์ตรวจ) · playwright-core + Chrome ติดเครื่อง (วัดระยะ)

**Spec:** `docs/superpowers/specs/2026-08-14-vmsplus-runtime-alignment.md`

## Global Constraints

- **ลำดับแหล่งอ้างอิงใหม่:** runtime จริง (`design-system/.vms-runtime/`) → Figma library (`.figma-extract/`) → **ถามเจ้าของงาน** · ห้ามเดาค่าเอง
- ห้าม hardcode hex ในหน้า — สีต้องเป็น `var(--…)` เท่านั้น (ยกเว้น `#fff` / `#000`)
- ไอคอนต้องเป็น `<span class="ms">ชื่อ</span>` (Material Symbols) · ห้าม emoji · ห้าม inline `<svg>`
- ปุ่มต้องใช้ `.btn` + `.btn-p/.btn-s/.btn-t/…` · ห้ามเขียนสไตล์ปุ่มเอง
- light-only · ห้าม `prefers-color-scheme:dark` รายหน้า
- แก้ `components.css` หรือ `tokens.css` → **บั๊ม `?v=` ทุกหน้าที่ลิงก์** (24 หน้า)
- `<style>` ในหน้าเก็บได้เฉพาะของที่ใช้ที่อื่นไม่ได้จริงๆ + ต้องมีคอมเมนต์เหตุผล
- ไม่แตะ `admin-config.html`, `maintainance-yearly/admin.html`, ไฟล์ `*backup*`, `mock/test/`
- **ไม่เปลี่ยนชื่อคลาสให้เหมือน DaisyUI** — ค่าต้องตรง ชื่อไม่ต้อง
- คอมมิตท้ายทุก task · ข้อความคอมมิตภาษาไทย ตามแบบเดิมของ repo

---

### Task 1: เครื่องมือตรวจ `verify-runtime.js` (เขียนก่อน ให้มันฟ้องของเดิม)

**Files:**
- Create: `design-system/verify-runtime.js`
- อ่าน: `design-system/.vms-runtime/palette.json`, `design-system/tokens.css`

**Interfaces:**
- Produces: คำสั่ง `node design-system/verify-runtime.js` — exit 1 ถ้ามี token ที่ไม่ตรง runtime · พิมพ์ตาราง `token | ค่าในไฟล์ | ค่าที่วัดได้ | สถานะ`
- Consumes: `palette.json` โครง `{text:{HEX:{n,s[]}}, bg:{…}, bd:{…}, pills:[…]}`

- [ ] **Step 1: เขียนสคริปต์ตรวจ**

```js
#!/usr/bin/env node
/* ตรวจ tokens.css กับค่าที่วัดจาก VMS Plus ตัวจริง (.vms-runtime/palette.json)
   เจ้าของงานเคาะ 14 ส.ค. 2569: ระบบจริงมาก่อน Figma library */
const fs = require('fs'), path = require('path');
const RT = path.join(__dirname, '.vms-runtime');
if (!fs.existsSync(RT)) { console.error('ไม่พบ .vms-runtime/ — ต้องต่อ VPN แล้วรันสคริปต์เก็บค่าก่อน'); process.exit(1); }
const pal = JSON.parse(fs.readFileSync(path.join(RT, 'palette.json'), 'utf8'));
const css = fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8');

// สีที่ระบบจริงเรนเดอร์ (รวม text+bg+border) → Set
const seen = new Map();
for (const kind of ['text', 'bg', 'bd'])
  for (const [hex, v] of Object.entries(pal[kind] || {}))
    seen.set(hex.toUpperCase(), (seen.get(hex.toUpperCase()) || 0) + v.n);

// ค่าที่ผูก token ↔ runtime ไว้ตายตัว (จากสเปกข้อ 4)
const MUST = {
  '--gray-50': '#F9FAFB', '--gray-100': '#F2F4F7', '--gray-200': '#EAECF0',
  '--gray-300': '#D0D5DD', '--gray-400': '#98A2B3', '--gray-500': '#667085',
  '--gray-600': '#475467', '--gray-700': '#344054', '--gray-25': '#FCFCFD',
  '--success-700': '#027A48', '--success-200': '#A6F4C5', '--success-25': '#F6FEF9',
  '--warning-700': '#B54708', '--warning-200': '#FEDF89', '--warning-50': '#FFFAEB',
  '--error-700': '#B42318', '--error-200': '#FECDCA', '--error-50': '#FEF3F2',
  '--error-600': '#D92D20', '--info-700': '#3538CD', '--info-200': '#C7D7FE',
  '--info-50': '#EEF4FF', '--brand-600': '#A80689',
  '--badge-brand-bg': '#FFF5FD', '--badge-brand-border': '#FED8F6',
};

const declared = new Map();
for (const m of css.matchAll(/^\s*(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/gm))
  declared.set(m[1], m[2].toUpperCase());

let bad = 0;
console.log('token'.padEnd(24), 'ในไฟล์'.padEnd(10), 'ที่วัดได้'.padEnd(10), 'สถานะ');
for (const [tok, want] of Object.entries(MUST)) {
  const got = declared.get(tok);
  const ok = got === want.toUpperCase();
  if (!ok) bad++;
  console.log(tok.padEnd(24), (got || '—').padEnd(12), want.padEnd(12), ok ? '✅' : '❌ ไม่ตรง runtime');
}

// สีที่ประกาศไว้แต่ระบบจริงไม่เคยใช้ — เตือนอย่างเดียว ไม่ fail
const orphan = [...declared].filter(([t, h]) => !seen.has(h) && !Object.keys(MUST).includes(t));
console.log(`\nไม่พบใน runtime ${orphan.length} ตัว (เตือนเฉยๆ — ไลบรารีอาจมีของที่หน้าที่เก็บมายังไม่ได้ใช้):`);
console.log(orphan.map(([t, h]) => `${t}=${h}`).join(' · ') || '  (ไม่มี)');

console.log(`\nสรุป: ไม่ตรง ${bad} ตัว จาก ${Object.keys(MUST).length}`);
process.exit(bad ? 1 : 0);
```

- [ ] **Step 2: รันให้เห็นว่าฟ้อง**

```bash
node design-system/verify-runtime.js; echo "exit=$?"
```

คาดหวัง: `exit=1` และมี ❌ อย่างน้อย 12 ตัว (gray-50/100/200/300/400/500/600/700, success-700/200/25, info-700, badge-brand-*)

- [ ] **Step 3: คอมมิต**

```bash
git add design-system/verify-runtime.js
git commit -m "test(design-system): เครื่องมือตรวจ token เทียบค่าจริงจาก vmsplus-dev"
```

---

### Task 2: `tokens.css` — เปลี่ยนชุดสีเป็นของจริง

**Files:**
- Modify: `design-system/tokens.css:22-36` (บล็อก Gray), `:39-60` (semantic), เพิ่มบล็อก badge

**Interfaces:**
- Produces: token ใหม่ `--success-25` `--info-700` `--badge-brand-bg` `--badge-brand-border` `--neutral-badge-*`
- Consumes: `verify-runtime.js` จาก Task 1

- [ ] **Step 1: แทนบล็อก Gray ทั้งแถบ**

แทนที่ `design-system/tokens.css` บรรทัด 22–36 ด้วย:

```css
  /* ---------- Gray (Untitled UI v1 — ramp ที่ "ระบบจริง" ใช้) ----------
     🔴 14 ส.ค. 2569 เจ้าของงานเคาะ: ยึด runtime จริงเหนือ Figma library
     ค่าทั้งแถบวัดจาก vmsplus-dev (ดู .vms-runtime/palette.json)
     v0.12 เคยเปลี่ยนไปเป็น v2 ตาม Figma — ย้อนกลับมา v1 เพราะระบบจริงเป็น v1 */
  --gray-950:#0A0D12;      /* ⚠ ไม่พบใน runtime — คงค่าจาก Figma ไว้ ใช้ที่ .work เท่านั้น */
  --gray-900:#181D27;      /* ⚠ ไม่พบใน runtime — ระบบจริงใช้ #000 เป็นตัวอักษรหลัก (745 ครั้ง) */
  --gray-800:#252B37;      /* ⚠ ไม่พบใน runtime — คงค่าจาก Figma */
  --gray-700:#344054;      /* ✅ runtime — ตัวอักษร pill "ยกเลิก" */
  --gray-600:#475467;      /* ✅ runtime — ตัวอักษรปุ่มรอง · ไอคอน topbar (370 ครั้ง) */
  --gray-500:#667085;      /* ✅ runtime — ไอคอน sidebar · แท็บที่ไม่ได้เลือก (210 ครั้ง) */
  --gray-400:#98A2B3;      /* ✅ runtime — ตัวอักษร disabled */
  --gray-300:#D0D5DD;      /* ✅ runtime — ขอบ input/ปุ่มรอง/pagination (222 ครั้ง) */
  --gray-200:#EAECF0;      /* ✅ runtime — เส้นใต้แถวตาราง · ขอบ sidebar (495 ครั้ง) */
  --gray-100:#F2F4F7;      /* ✅ runtime — พื้นหัวตาราง · พื้นปุ่ม disabled (98 ครั้ง) */
  --gray-50:#F9FAFB;       /* ✅ runtime — พื้น form-card-body (276 ครั้ง) */
  --gray-25:#FCFCFD;       /* ✅ runtime — พื้น pill "ยกเลิก" */
```

- [ ] **Step 2: แก้ semantic 4 ค่า + เพิ่ม 2 ค่า**

ใน `design-system/tokens.css` เปลี่ยนบรรทัดเดิมเป็น:

```css
  --success-700:#027A48;   /* ✅ runtime — ตัวอักษร pill "เสร็จสิ้น" (Figma ให้ #067647 — runtime ชนะ) */
  --success-200:#A6F4C5;   /* ✅ runtime — ขอบ pill success (Figma ให้ #ABEFC6) */
  --success-25:#F6FEF9;    /* ✅ runtime — พื้น pill success */
  --info-700:#3538CD;      /* ✅ runtime — ตัวอักษร badge info */
```

> `--success-50:#ECFDF3` เดิม **คงไว้** (ยังใช้ที่อื่น) แต่ badge success ต้องใช้ `--success-25`

- [ ] **Step 3: เพิ่มบล็อก token ของ badge ต่อท้าย semantic palette**

```css
  /* ---------- Badge (วัดจาก runtime — pill outline) ✅ ทั้งบล็อก ---------- */
  --badge-brand-bg:#FFF5FD;      /* ✅ runtime — พื้น badge แบรนด์ (Figma ให้ #FDEEFC) */
  --badge-brand-border:#FED8F6;  /* ✅ runtime — ขอบ badge แบรนด์ (Figma ให้ #F8BFF4) */
  --badge-neutral-text:var(--gray-700);
  --badge-neutral-bg:var(--gray-25);
  --badge-neutral-border:#E4E7EC; /* ✅ runtime — ขอบ pill "ยกเลิก" (ไม่ตรง gray-200 ของ v1) */
```

- [ ] **Step 4: รันตรวจให้ผ่าน**

```bash
node design-system/verify-runtime.js; echo "exit=$?"
```

คาดหวัง: `exit=0` · ทุกแถวเป็น ✅

- [ ] **Step 5: คอมมิต**

```bash
git add design-system/tokens.css
git commit -m "fix(design-system): ยึดชุดสีจาก VMS Plus ตัวจริง — gray กลับเป็น Untitled UI v1 + success/info/badge"
```

---

### Task 3: `components.css` — โครงหน้า (หัวเรื่อง · breadcrumb · แท็บ · sidebar · topbar)

**Files:**
- Modify: `design-system/components.css` — `.page-title:273`, `.crumbs:269-272`, `.tabs/.tab-btn:184-189`, `.side:250-262`, `.topbar:264`

**Interfaces:**
- Consumes: token จาก Task 2
- Produces: คลาสเดิมชื่อเดิม ค่าใหม่ — หน้าที่ใช้อยู่ไม่ต้องแก้ HTML

- [ ] **Step 0: พื้นหลัง — เจ้าของงานทักเอง 15 ส.ค. 2569 ว่า "ของจริงขาว ของเราเทา"**

`design-system/components.css:11` — `body` มี **hex ฮาร์ดโค้ดที่ไม่ใช่ token** (`#E9EAEC`) เปลี่ยนเป็น:

```css
body{font-family:var(--font);background:#fff;color:#000;font-size:var(--fs-body);line-height:var(--lh)}
```

และ `.work` (บรรทัด ~263) เดิมเป็น `var(--gray-25)` → ของจริงเป็นขาว:

```css
.work{flex:1;min-width:0;display:flex;flex-direction:column;background:#fff}
```

และไอคอนเมนู sidebar ของจริง 24px (base `.ms` เราเป็น 22px — ไม่ต้องแก้ base แก้เฉพาะ sidebar ใน Step 4)

ตรวจ:

```bash
grep -nE '#[0-9a-fA-F]{6}' design-system/components.css | grep -viE '#ffffff|#000000'
```

คาดหวัง: เหลือเฉพาะ `#E4E7EC` ที่มีคอมเมนต์กำกับว่าเป็นค่า runtime

- [ ] **Step 1: หัวเรื่องหน้า**

```css
.page-title{font-size:32px;font-weight:600;line-height:48px;color:#000;margin-bottom:20px}
```

> ของจริง `.page-title-label` = 32/600/lh48/`#000` — ไม่ใช่ 28/700/gray-900

- [ ] **Step 2: breadcrumb — น้ำหนัก 400 + ตัวคั่นแบบสี่เหลี่ยมหมุน**

```css
.crumbs{display:flex;align-items:center;gap:8px;font-size:var(--fs-text-sm);font-weight:400;color:var(--gray-600);padding:8px 0;margin-bottom:6px;flex-wrap:wrap}
.crumbs .ms{font-size:20px;color:var(--gray-500)}
.crumbs .sep{width:6px;height:6px;border-right:1px solid var(--gray-300);border-bottom:1px solid var(--gray-300);transform:rotate(-45deg);display:inline-block}
.crumbs .cur{color:var(--brand-600)}
```

- [ ] **Step 3: แท็บ**

```css
.tabs{display:flex;gap:0;border-bottom:1px solid var(--gray-300)}
.tab-btn{font-family:inherit;background:none;border:none;border-bottom:4px solid transparent;
  padding:12px 24px;margin-bottom:-1px;display:inline-flex;align-items:center;gap:8px;
  font-size:var(--fs-text-sm);font-weight:600;letter-spacing:-.2px;line-height:21px;
  color:var(--gray-500);cursor:pointer;transition:color .18s ease,border-color .18s ease}
.tab-btn:hover{color:var(--gray-700)}
.tab-btn.on{color:#000;border-bottom-color:var(--brand-600)}
```

- [ ] **Step 4: sidebar — 80px ไม่ขยายตอน hover**

แทน `.side` และลบกฎ `.side:hover …` ทั้งหมด (บรรทัด 251, 257–260):

```css
.side{width:80px;flex-shrink:0;background:#fff;border-right:1px solid var(--gray-200);
  display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:20px;
  position:sticky;top:0;height:100dvh;z-index:40;overflow:hidden}
.side .nv{width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  color:var(--gray-500);cursor:pointer;transition:background-color .18s ease,color .18s ease}
.side .nv>.ms{font-size:24px}
.side .nv:hover{background:var(--gray-100)}
.side .nv.on{background:var(--gray-100);color:var(--brand-600)}
```

> ลบ `.side .nv::after` (ป้ายชื่อที่โผล่ตอน hover) ด้วย — ของจริงไม่มี

- [ ] **Step 5: topbar**

```css
.topbar{background:#fff;border-bottom:1px solid #E4E7EC;padding:12px 28px;display:flex;justify-content:flex-end;align-items:center;gap:4px;color:var(--gray-600)}
.topbar .btn-icon{width:40px;height:40px;border-radius:var(--r-pill);color:var(--gray-500)}
```

- [ ] **Step 6: เช็คว่าไม่มีสี hardcode หลุด**

```bash
grep -nE '#[0-9a-fA-F]{3,8}\b' design-system/components.css | grep -viE '#fff|#000|E4E7EC'
```

คาดหวัง: ว่าง (มีแต่ `#E4E7EC` ที่คอมเมนต์กำกับว่าเป็นค่า runtime)

- [ ] **Step 7: คอมมิต**

```bash
git add design-system/components.css
git commit -m "fix(design-system): โครงหน้าตรง runtime — หัวเรื่อง 32/600 · breadcrumb 400 · แท็บเส้น 4px · sidebar 80px"
```

---

### Task 4: `components.css` — ตาราง · badge · ช่องค้นหา

**Files:**
- Modify: `design-system/components.css` — `.tbl:429-434`, `.badge:175-179`, `.search:41-43`

- [ ] **Step 1: ตาราง — เลิกใส่กรอบ/เงา · หัวเทา · เซลล์ padding 8×16**

```css
.tbl{width:100%;border-collapse:separate;border-spacing:0;background:#fff;font-size:var(--fs-text-sm);letter-spacing:-.2px}
.tbl th{background:var(--gray-100);color:#000;font-weight:600;font-size:var(--fs-text-sm);line-height:21px;
  letter-spacing:-.2px;text-align:left;padding:12px 16px;border:0;white-space:nowrap;height:56px}
.tbl th:first-child{border-radius:var(--rounded-md) 0 0 var(--rounded-md)}
.tbl th:last-child{border-radius:0 var(--rounded-md) var(--rounded-md) 0}
.tbl th .ms{font-size:20px}
.tbl td{padding:8px 16px;border-bottom:1px solid var(--gray-200);color:#000;font-size:var(--fs-text-sm);line-height:21px;vertical-align:middle}
.tbl td a{text-decoration:underline}
.tbl tbody tr:hover td{background:var(--gray-50)}
.tbl .num{text-align:center;font-weight:600}
```

> ของจริง**ไม่มี** `.tbl tr:last-child td{border-bottom:none}` — ลบกฎนั้นออก

- [ ] **Step 2: badge — 12/600 padding 4×8**

```css
.badge{display:inline-flex;align-items:center;gap:4px;border-radius:var(--r-pill);padding:4px 8px;
  font-size:var(--fs-text-xs);line-height:var(--lh-text-xs);font-weight:600;letter-spacing:-.2px;border:1px solid transparent}
.b-ok{background:var(--success-25);color:var(--success-700);border-color:var(--success-200)}
.b-low{background:var(--warning-50);color:var(--warning-700);border-color:var(--warning-200)}
.b-out{background:var(--error-50);color:var(--error-700);border-color:var(--error-200)}
.b-brand{background:var(--badge-brand-bg);color:var(--brand-600);border-color:var(--badge-brand-border)}
.b-info{background:var(--info-50);color:var(--info-700);border-color:var(--info-200)}
.b-neutral{background:var(--badge-neutral-bg);color:var(--badge-neutral-text);border-color:var(--badge-neutral-border)}
.badge .dot{width:6px;height:6px;border-radius:var(--r-pill);background:currentColor;flex:0 0 auto}
```

- [ ] **Step 3: ช่องค้นหา — เป็นกล่องมีขอบจริง ไม่ใช่ไอคอนลอย**

```css
.search{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px;
  background:#fff;border:1px solid var(--gray-300);border-radius:var(--rounded-md)}
.search .ms{position:static;transform:none;font-size:20px;color:var(--gray-500);flex:0 0 auto}
.search input{border:0;padding:0;height:100%;flex:1;background:none;font-size:16px;outline:none}
```

- [ ] **Step 4: รันตรวจการใช้งาน**

```bash
node design-system/audit-usage.js
```

คาดหวัง: ไม่มีรายการ "นิยาม component ซ้ำในหน้า" เพิ่มขึ้นจากเดิม (บันทึกจำนวนก่อน/หลัง)

- [ ] **Step 5: คอมมิต**

```bash
git add design-system/components.css
git commit -m "fix(design-system): ตาราง/badge/ช่องค้นหา ตรงค่าจริง — หัวตารางเทา ไม่มีกรอบ · badge 12/600 · search h40 มีขอบ"
```

---

### Task 5: คอมโพเนนต์ที่ยังไม่มี — ปุ่ม tertiary/icon/circle · pagination · ปุ่ม action ในตาราง

**Files:**
- Modify: `design-system/components.css` (ต่อท้ายบล็อกปุ่ม บรรทัด ~107)
- Modify: `design-system/index.html` (เพิ่มตัวอย่าง), `design-system/buttons.html`

- [ ] **Step 1: เพิ่มปุ่มแบบใหม่**

```css
/* ---- Tertiary / icon / circle — วัดจาก runtime ✅ ---- */
.btn-t{background:none;border-color:transparent;box-shadow:none;color:var(--gray-600)}
.btn-t:hover{background:var(--gray-50)}
.btn-tb{background:none;border-color:transparent;box-shadow:none;color:var(--brand-600)}
.btn-tb:hover{background:var(--badge-brand-bg)}
.btn-td{background:none;border-color:transparent;box-shadow:none;color:var(--error-600)}
.btn-td:hover{background:var(--error-50)}
.btn-icon{width:40px;height:40px;padding:0;border-radius:var(--r-pill);gap:0}
.btn-circle{width:43px;height:43px;padding:0;border-radius:var(--r-pill);gap:0;border-color:var(--gray-300)}
.btn-p:disabled,.btn-p[aria-disabled=true]{background:var(--gray-100);border-color:var(--gray-100);color:var(--gray-400)}
```

- [ ] **Step 2: ปุ่ม action ท้ายแถวตาราง**

```css
/* ---- ปุ่มท้ายแถวตาราง — 40×40 radius 8 ไอคอน 20px ✅ runtime ---- */
.tbl .dt-action{display:flex;justify-content:center;gap:4px}
.tbl .dt-action .btn{width:40px;min-width:40px;height:40px;padding:0;border-radius:var(--rounded-md)}
.tbl .dt-action .btn .ms{font-size:20px;font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24}
```

- [ ] **Step 3: pagination**

```css
/* ---- Pagination — ปุ่มติดกันเป็นแถบ ✅ runtime ---- */
.pager{display:flex;align-items:center}
.pager .pg{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:39px;
  padding:0 12px;margin-left:-1px;background:#fff;border:1px solid var(--gray-300);border-radius:0;
  font-size:var(--fs-text-sm);color:var(--gray-600);cursor:pointer}
.pager .pg:first-child{border-radius:var(--rounded-md) 0 0 var(--rounded-md);margin-left:0}
.pager .pg:last-child{border-radius:0 var(--rounded-md) var(--rounded-md) 0}
.pager .pg.on{background:var(--gray-300)}
.pager .pg:disabled{color:var(--gray-400);cursor:not-allowed}
```

- [ ] **Step 4: เพิ่มตัวอย่างใน style guide**

ใน `design-system/index.html` เพิ่มหัวข้อ "Pagination" และ "ปุ่มไอคอน" พร้อมตัวอย่าง markup:

```html
<div class="pager">
  <button class="pg"><span class="ms">chevron_left</span></button>
  <button class="pg on">1</button><button class="pg">2</button><button class="pg">3</button>
  <button class="pg">…</button><button class="pg">30</button>
  <button class="pg"><span class="ms">chevron_right</span></button>
</div>
```

- [ ] **Step 5: เปิดดูจริง**

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &
# เปิด http://127.0.0.1:8123/design-system/index.html แล้วเทียบกับ .vms-runtime/request-list.png
```

- [ ] **Step 6: คอมมิต**

```bash
git add design-system/components.css design-system/index.html design-system/buttons.html
git commit -m "feat(design-system): เพิ่มคอมโพเนนต์ที่ระบบจริงมีแต่เรายังไม่มี — ปุ่ม tertiary/icon/circle · pagination · action ในตาราง"
```

---

### Task 6: บั๊ม `?v=` ทุกหน้า + ไล่ตรวจหน้าเป็นกลุ่ม

**Files:**
- Modify: 24 ไฟล์ `.html` ที่ `<link>` tokens/components (ยกเว้น admin ตาม Global Constraints)

- [ ] **Step 1: บั๊มเวอร์ชัน**

```bash
cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form
grep -rl 'design-system/\(tokens\|components\).css' --include='*.html' . | grep -v backup \
  | xargs sed -i '' 's/?v=20260813-ds15/?v=20260814-ds16/g'
grep -rn '?v=20260813-ds15' --include='*.html' . | grep -v backup
```

คาดหวัง: คำสั่งที่สองไม่คืนอะไรเลย

- [ ] **Step 2: รันตรวจสีหลุด/emoji ทั้งโปรเจกต์**

```bash
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'

grep -rnP '[\x{1F300}-\x{1FAFF}]' --include='*.html' --include='*.js' \
  maintainance-yearly/ mock/ daily-record/ *.html | grep -v '/test/' | grep -v backup | grep -vE ':\s*(//|\*|/\*)'
```

คาดหวัง: ทั้งสองคำสั่งได้ผลว่าง

- [ ] **Step 3: ตรวจการใช้งานทีละเฟส**

```bash
for p in 1 2 3 4 5 6; do echo "=== เฟส $p ==="; node design-system/audit-usage.js $p; done
```

แก้ทุกรายการที่ฟ้องว่า "นิยาม component ซ้ำในหน้า" / "ปุ่มไม่ใช้ .btn" / "ไอคอนไม่ใช่ .ms"

- [ ] **Step 4: วัดระยะจริงในเบราว์เซอร์**

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &
NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node design-system/check-spacing.js
```

- [ ] **Step 5: เทสข้อมูล**

```bash
node maintainance-yearly/test/skeleton-data.test.js
```

- [ ] **Step 6: คอมมิต**

```bash
git add -A
git commit -m "fix(design): บั๊ม ?v= เป็น ds16 + ไล่แก้ทุกหน้าให้ใช้คอมโพเนนต์กลาง"
```

---

### Task 7: `design-mock/kbk-self-repair-*.html` — ใส่ shell จริง

**Files:**
- Modify: `design-mock/kbk-self-repair-appointment.html`, `design-mock/kbk-self-repair-parts.html`, `design-mock/index.html`

**เหตุผล:** ทั้งสองหน้าจงใจทำเป็นหน้าจอเดี่ยว ⇒ ไม่มี sidebar/topbar/breadcrumb เลยดูไม่เหมือนภาพอ้างอิง

- [ ] **Step 1: ห่อเนื้อหาเดิมด้วย shell**

```html
<body>
<div class="shell">
  <aside class="side">
    <div class="vlogo">VMS<em>+</em></div>
    <a class="nv" href="#" title="หน้าหลัก"><span class="ms">home</span></a>
    <a class="nv on" href="#" title="งานซ่อมและบำรุงรักษา"><span class="ms">build</span></a>
  </aside>
  <div class="work">
    <div class="topbar">
      <button class="btn btn-t btn-icon"><span class="ms">light_mode</span></button>
      <button class="btn btn-t btn-icon"><span class="ms">notifications</span></button>
    </div>
    <main class="content">
      <div class="crumbs"><span class="ms">home</span><span class="sep"></span><span class="cur">งานซ่อม</span></div>
      <h1 class="page-title">กบค. ซ่อมเอง</h1>
      <!-- เนื้อหาเดิมทั้งหมดวางต่อจากนี้ -->
```

- [ ] **Step 2: แก้คอมเมนต์บนหัวไฟล์ให้ตรงความจริง**

เปลี่ยนจาก `แบบหน้าจอเดี่ยว แยกจากส่วนอื่น — ไม่มีเมนู ไม่มีลิงก์เข้า/ออก` เป็น
`หน้าจอเต็มพร้อม shell (side/topbar/crumbs) ตามระบบจริง — ลิงก์ในเมนูเป็น # เพราะเป็น mock หน้าเดียว`

- [ ] **Step 3: แก้ iframe ในแกลเลอรีให้สูงพอ**

`design-mock/index.html` — `.gframe` เดิมตัดหัวเรื่องออก ตรวจว่ายังเห็นครบหลังใส่ shell

- [ ] **Step 4: เปิดดูเทียบกับของจริง**

เปิด `http://127.0.0.1:8123/design-mock/kbk-self-repair-appointment.html` เทียบกับ `.vms-runtime/repair.png`

- [ ] **Step 5: คอมมิต**

```bash
git add design-mock/
git commit -m "fix(design-mock): ใส่ shell จริง (sidebar/topbar/breadcrumb/หัวเรื่อง) ให้ 2 หน้าเส้นซ่อมเอง"
```

---

### Task 8: เอกสาร — README · SOURCES · CLAUDE.md · plan.md

**Files:**
- Modify: `design-system/README.md` (ตารางหัวข้อ 4 + Changelog หัวข้อ 8 + กฎข้อ 0)
- Modify: `design-system/SOURCES.md` (ตารางความครอบคลุม ก–ง)
- Modify: `CLAUDE.md` (ลำดับแหล่งอ้างอิงใหม่)
- Modify: `plan.md` (บันทึกงาน + ปิดรายการค้าง)

- [ ] **Step 1: `CLAUDE.md` — เปลี่ยนลำดับแหล่งอ้างอิง**

เพิ่มใต้หัวข้อ "🔴 งาน UI ทุกชิ้น":

```markdown
> 🔴 **เจ้าของงานเคาะ 14 ส.ค. 2569:** ระบบที่รันอยู่จริงมาก่อน Figma library
> ⇒ ลำดับคือ **`design-system/.vms-runtime/` → `.figma-extract/` → ถาม** (ห้ามเดา)
> `.vms-runtime/` อยู่นอก git (มีชื่อพนักงาน/เลขคำขอจริง · repo นี้ public)
> เก็บใหม่ได้ด้วย: ต่อ VPN กฟภ. → ล็อกอิน 700001 ช่อง "พนักงาน กฟภ." → รันสคริปต์ใน `docs/superpowers/specs/2026-08-14-vmsplus-runtime-alignment.md` ข้อ 2
```

เพิ่มใน "ตรวจ 3 ตัวก่อนบอกว่าเสร็จ" ให้เป็น 4 ตัว โดยใส่ `node design-system/verify-runtime.js` เป็นตัวแรก

- [ ] **Step 1.5: 🔴 แก้คำสั่ง grep ที่ทำให้บั๊กพื้นหลังหลุดมาได้**

คำสั่งเดิมใน `CLAUDE.md` **ยกเว้นโฟลเดอร์ `design-system/` ทั้งก้อน** ⇒ hex ฮาร์ดโค้ดใน `components.css` ไม่เคยถูกจับ
(นี่คือเหตุที่ `body{background:#E9EAEC}` อยู่มาได้จนเจ้าของงานเห็นเอง) เปลี่ยนเป็นแยกเป็น 2 คำสั่ง:

```bash
# 1) หน้าจอ — ห้ามมี hex เลย
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'

# 2) design-system เอง — มีได้เฉพาะที่กำกับเหตุผลไว้ (ตอนนี้คือ #E4E7EC ตัวเดียว)
grep -nE '#[0-9a-fA-F]{6}' design-system/components.css | grep -viE '#ffffff|#000000'
```

> `tokens.css` เป็นที่เดียวที่ประกาศ hex ได้อิสระ — เป็นนิยาม token

- [ ] **Step 2: `design-system/SOURCES.md` — เพิ่มคอลัมน์ runtime**

ในตารางความครอบคลุม ก–ง เพิ่มคอลัมน์ "runtime จริง" ระบุว่าคอมโพเนนต์ไหนวัดจาก `.vms-runtime/` แล้ว
(`page-title` · `crumbs` · `tabs` · `badge` · `tbl` · `search` · `btn` · `pager` · `side` · `topbar`)
และย้าย `.shell/.side/.page-title` ออกจาก "ข้อยกเว้นถาวร (ไลบรารีไม่มีของเทียบ)" เพราะตอนนี้มีของเทียบแล้ว

- [ ] **Step 3: `design-system/README.md`**

- หัวข้อ 4: อัปเดตแถวของทุกคลาสที่แก้ + เพิ่มแถวใหม่ `.b-info` `.b-neutral` `.badge .dot` `.btn-tb` `.btn-td` `.btn-icon` `.btn-circle` `.pager` `.tbl .dt-action`
- หัวข้อ 8 Changelog: เพิ่ม `v0.13 — 14 ส.ค. 2569 ยึด runtime จริง` พร้อมสรุปว่าเปลี่ยนอะไรบ้าง
- หัวข้อ 0: เพิ่มขั้น "เช็ค `.vms-runtime/` ก่อน `.figma-extract/`"

- [ ] **Step 4: `plan.md` — บันทึกงานรอบนี้**

เพิ่มหัวข้อ `### 🔴 ยึด design จากระบบจริง (14 ส.ค. 2569)` เล่าตั้งแต่ปัญหา → วิธีเก็บค่า → สิ่งที่เปลี่ยน → ของที่ยังไม่มีหลักฐาน (`gray-800/900/950`)

- [ ] **Step 5: ตรวจว่าเอกสารไม่โชว์ค่าเก่า**

```bash
grep -rn '#717680\|#535862\|#D5D7DA\|#E9EAEB\|#F5F5F5\|#067647\|#ABEFC6\|#FDEEFC\|#F8BFF4' \
  design-system/README.md design-system/SOURCES.md design-system/index.html
```

คาดหวัง: ว่าง หรือมีเฉพาะที่เขียนกำกับว่า "ค่าเดิมก่อน v0.13"

- [ ] **Step 6: คอมมิต**

```bash
git add -A
git commit -m "docs(design-system): v0.13 — ยึด runtime จริงเหนือ Figma + บันทึกที่มาและวิธีเก็บค่าซ้ำ"
```

---

## ของที่ยังไม่มีหลักฐาน — ต้องถามหรือเก็บเพิ่ม

| รายการ | สถานะ |
|---|---|
| `--gray-800` `--gray-900` `--gray-950` | ไม่พบใน 5 หน้าที่เก็บ · ระบบจริงใช้ `#000` เป็นตัวอักษรหลัก → **คงค่า Figma ไว้ กำกับ `⚠`** |
| ฟอร์ม/โมดัลเต็มรูปแบบ | เก็บมาแค่บางส่วน (`form-card-body` พื้น `#F9FAFB`, `form-card` พื้น `#EAECF0`) → **ถ้าจะทำหน้าฟอร์มต้องเก็บเพิ่ม** |
| chevron stepper | ระบบจริงในหน้าที่เก็บมายังไม่เจอ → ยังอิง screenshot เดิมของเจ้าของงาน |
| dark mode | ระบบจริง**มี** ปุ่มสลับธีม แต่ต้นแบบเราตกลงเป็น light-only → ไม่ทำ |
