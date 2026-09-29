> ⛔ **เอกสารเก่าเก็บเป็นประวัติ (2 ก.ย. 2569)** — สเปกนี้อิงเว็บ vmsplus-dev · ปัจจุบันยึด Figma 2 ไฟล์เท่านั้น

# สเปก — ปรับ design-system ให้ตรง VMS Plus ตัวจริง (runtime)

**วันที่:** 14 ส.ค. 2569 · **ที่มา:** เจ้าของงานทักว่าดีไซน์ที่ทำ "แสดงไม่เหมือนรูปที่ส่งให้"
แล้วสั่งให้ *"ไปอ่านเว็บเดิมก่อน แล้วค่อยเอามาดีไซน์"* พร้อมให้บัญชีเข้า `https://vmsplus-dev.pea.co.th`

## 0. สรุปสาเหตุที่ไม่เหมือน

1. **เราไม่เคยเห็นหน้าจอ in-app จริงมาก่อน** — `assets/` มีแต่ภาพหน้า login/landing 3 รูป
   (บัญชี 700001 เคย 401 เมื่อ 17 ก.ค. 2569 · **14 ส.ค. 2569 เข้าได้แล้ว**)
   design-system ทั้งชุดจึงอ้างอิง **Figma component library + สกรีนช็อตที่เจ้าของงานส่งเป็นครั้งๆ**
2. **Figma library กับระบบที่รันอยู่จริง ใช้ชุดสีเทาคนละเวอร์ชัน** — เรา verify token กับ Figma
   (`verify-tokens.js` ผ่าน 66 ค่า) แต่ระบบจริงเป็น Untitled UI **v1** ⇒ ทุกเส้นขอบ/ตัวอักษรจางเพี้ยนทั้งโปรเจกต์
3. หน้า `design-mock/kbk-self-repair-*.html` จงใจทำเป็น **หน้าจอเดี่ยว ไม่มี shell** (เขียนคอมเมนต์ไว้ในไฟล์)
   จึงไม่มี sidebar / topbar / breadcrumb / หัวเรื่อง อย่างในภาพอ้างอิง

## 1. การตัดสินใจของเจ้าของงาน (14 ส.ค. 2569)

| ประเด็น | คำตอบ |
|---|---|
| Figma library (v2) vs ระบบจริง (v1) ขัดกัน | **ยึดระบบจริง (v1)** |
| ขอบเขต | **แก้ `design-system/` ก่อน แล้วไล่ทุกหน้า** |

⇒ นับจากนี้ **ลำดับแหล่งอ้างอิงเปลี่ยนเป็น: runtime จริง → Figma library → ถาม** (เดิม Figma มาก่อน)

## 2. วิธีเก็บค่า

Playwright (playwright-core + Chrome ติดเครื่อง) · persistent context เก็บ session SSO ·
ล็อกอินช่อง **"พนักงาน กฟภ."** → PEA SSO Keycloak (`realms/pea-users`, client `pea-VMS-Plus`)
→ อ่าน `getComputedStyle` ของ element จริงในหน้า ไม่ใช่เดาจากภาพ

**เก็บไว้ที่ `design-system/.vms-runtime/`** (อยู่ใน `.gitignore` — repo นี้ public และภาพมีชื่อพนักงาน/เลขคำขอจริง)

| ไฟล์ | เนื้อหา |
|---|---|
| `request-list.png` · `repair.png` · `maint-schedule.png` · `maint-list.png` · `maint-summary.png` · `breakdown.png` · `carpool.png` · `vehicle.png` | สกรีนช็อตเต็มหน้า 1600px |
| `real-request-list.json` · `real-2.json` | ค่า computed ของคอมโพเนนต์รายตัว |
| `probe.json` | ค่า computed 7 หน้า (title/th/td/search/buttons/badges) |
| `palette.json` | สีที่เรนเดอร์จริง 5 หน้า แยก text/bg/border + pill ทุกแบบ |

## 3. เส้นทางจริงที่เกี่ยวกับโปรเจกต์เรา 🔴

ระบบจริง**มีหน้างานซ่อม/บำรุงรักษาอยู่แล้ว** — ต้นแบบของเราต้องเทียบกับของพวกนี้ ไม่ใช่ออกแบบลอย

| route | หัวเรื่องจริง | ตรงกับของเรา |
|---|---|---|
| `/repair-management` | งานซ่อม | flow แจ้งซ่อม–กบค. |
| `/maintenance-management/maintenance-schedule` | นัดหมายบำรุงรักษา | `maintainance-yearly/` |
| `/maintenance-management/maintenance-list` | ตารางบำรุงรักษา | `maintainance-yearly/` |
| `/maintenance-management/maintenance-summary` | ภาพรวมการซ่อมบำรุง | `outcome-dashboard.html` |
| `/maintenance-management/replacement-vehicle-list` | รถทดแทน | — |
| `/vehicle-breakdown` | จัดการเหตุรถเสีย | — |
| `/carpool-management` | กลุ่มยานพาหนะ | ภาพอ้างอิงที่เจ้าของงานส่ง |

## 4. ค่าที่วัดได้ — ชุดสี

### 4.1 เทา — Untitled UI **v1** (ยืนยันจากการเรนเดอร์จริง)

| token | ค่าใหม่ (จริง) | ค่าเดิมของเรา (v2) | เห็นที่ไหน |
|---|---|---|---|
| `--gray-25` | `#FCFCFD` | `#FDFDFD` | พื้น pill "ยกเลิก" |
| `--gray-50` | `#F9FAFB` | `#FAFAFA` | พื้น `form-card-body` (276 ครั้ง) |
| `--gray-100` | `#F2F4F7` | `#F5F5F5` | พื้นหัวตาราง · พื้นปุ่ม disabled (98 ครั้ง) |
| `--gray-200` | `#EAECF0` | `#E9EAEB` | เส้นใต้แถวตาราง · เส้นขอบ sidebar (495 ครั้ง) |
| `--gray-300` | `#D0D5DD` | `#D5D7DA` | ขอบ input/ปุ่มรอง/pagination (222 ครั้ง) |
| `--gray-400` | `#98A2B3` | `#A4A7AE` | ตัวอักษร disabled |
| `--gray-500` | `#667085` | `#717680` | ไอคอน sidebar · แท็บที่ไม่ได้เลือก (210 ครั้ง) |
| `--gray-600` | `#475467` | `#535862` | ตัวอักษรปุ่มรอง · ไอคอน topbar (370 ครั้ง) |
| `--gray-700` | `#344054` | `#414651` | ตัวอักษร pill "ยกเลิก" |
| `--gray-800` | ⚠️ ไม่พบในหน้าที่เก็บ | `#252B37` | — |
| `--gray-900` | ⚠️ ไม่พบ — **ระบบจริงใช้ `#000000` เป็นสีตัวอักษรหลัก** (745 ครั้ง) | `#181D27` | หัวเรื่อง · เนื้อตาราง |

> `--gray-800/900` ไม่มีหลักฐานจาก runtime → **ห้ามเดา** ให้คงค่าเดิมไว้แล้วกำกับ `⚠` (ดูข้อ 7)

### 4.2 สถานะ

| บทบาท | ตัวอักษร | พื้น | ขอบ | หมายเหตุ |
|---|---|---|---|---|
| success | `#027A48` | `#F6FEF9` | `#A6F4C5` | ของเราเดิม `#067647` / `#ECFDF3` / `#ABEFC6` — **ต่าง** |
| warning | `#B54708` | `#FFFAEB` (อีกแบบ `#FFFCF5`) | `#FEDF89` | ✅ ตรงของเราแล้ว |
| error | `#B42318` | `#FEF3F2` (อีกแบบ `#FFFBFA`) | `#FECDCA` | ✅ ตรงของเราแล้ว |
| error (ตัวอักษรปุ่ม) | `#D92D20` | — | — | `btn-tertiary-danger` |
| info 🆕 | `#3538CD` | `#EEF4FF` | `#C7D7FE` | **ของเรายังไม่มี** |
| brand (badge) | `#A80689` | `#FFF5FD` | `#FED8F6` | ของเราเดิม `#CF07AA` / `#FDEEFC` / `#F8BFF4` — **ต่าง** |
| ยกเลิก/เป็นกลาง | `#344054` | `#FCFCFD` | `#E4E7EC` | **ของเรายังไม่มี** |

**สีจุดสถานะ** (`w-[6px] h-[6px] rounded-full`): `#12B76A` เขียว · `#6172F3` น้ำเงิน · `#667085` เทา · `#FA6BDF` ชมพู · `#D92D20` แดง

**แบรนด์** `#A80689` ✅ ตรงอยู่แล้ว (`--brand-600` / `--btn-primary-bg`)

## 5. ค่าที่วัดได้ — คอมโพเนนต์

| คอมโพเนนต์ | ค่าจริง | ของเราตอนนี้ |
|---|---|---|
| **หัวเรื่องหน้า** `.page-title-label` | 32px / 600 / lh 48px / `#000` | `.page-title` 28px / **700** / gray-900 |
| **breadcrumb** `.breadcrumbs` | 14px / **400** · padding 8px 0 · ลิงก์ `#A80689` · ตัวคั่น = สี่เหลี่ยม 6×6 หมุน 45° (`::before`) | `.crumbs` 14px / **600** · gray-500 · ตัวคั่นเป็นไอคอน |
| **แท็บ** `.tab` | 14px / 600 · ls −0.2px · padding 12px 24px · h48 · gap 8 · active: เส้นล่าง **4px** `#A80689` + ตัวอักษร `#000` · inactive: `#667085` + เส้นล่าง 1px `#D0D5DD` | `.tab-btn` padding 10px 2px · `.tabs` gap 24 · active ตัวอักษร magenta |
| **badge** `.badge-pill-outline` | 12px / 600 · lh 18 · ls −0.2 · padding **4px 8px** · gap 4 · radius 9999 · ขอบ 1px · h28 | `.badge` **14px / 500** · padding 2px 10px |
| **หัวตาราง** `.dataTable thead th` | พื้น `#F2F4F7` · 14/600 · ls −0.2 · padding 12px 16px · **ไม่มีเส้นขอบ** · radius 8px เฉพาะ th แรก/สุดท้าย · h56 · ไอคอน 20px | `.tbl th` พื้น **ขาว** · **12px** · gray-500 · padding 12px 24px · มีเส้นล่าง |
| **เซลล์ตาราง** `.dataTable tbody td` | 14/400 · ls −0.2 · padding **8px 16px** · เส้นล่าง 1px `#EAECF0` · `vertical-align: middle` · ลิงก์ **underline** · แถวสูง 57 | padding **16px 20px** · gray-600 · `vertical-align: top` |
| **กรอบตาราง** | **ไม่มี** border / radius / shadow รอบตาราง | `.tbl` มีครบสามอย่าง |
| **ปุ่ม action ท้ายแถว** | `btn btn-icon btn-tertiary` **40×40** · radius 8 · ไอคอน 20px (`FILL 0, wght 300, opsz 24`) · โปร่งใส ไม่มีขอบ/เงา | ไม่มี |
| **ช่องค้นหา** `.input-group-search` | h40 · radius 8 · ขอบ 1px `#D0D5DD` · padding 0 12px · gap 8 · ไอคอนนำหน้า · input 16px | `.search` = wrapper relative + ไอคอน absolute left 10 · input padding-left 38 |
| **ปุ่ม** | h40 (toolbar) / **h43** (`btn-md` ในโมดัล) · radius 8 · padding 0 16 · gap 8 · 14/600 | h40 · radius 8 ✅ ใกล้เคียง |
| ↳ `btn-primary` | bg+ขอบ `#A80689` · ขาว · **disabled:** `#98A2B3` บน `#F2F4F7` | ✅ ตรง (ยกเว้น disabled) |
| ↳ `btn-secondary` | ขาว · ขอบ `#D0D5DD` · `#475467` | ✅ ตรง |
| ↳ `btn-tertiary` 🆕 | โปร่งใส ไม่มีขอบ/เงา · `#475467` | มี `.btn-t` — ต้องเทียบ |
| ↳ `btn-tertiary-brand` 🆕 | โปร่งใส · `#A80689` | ไม่มี |
| ↳ `btn-tertiary-danger` 🆕 | โปร่งใส · `#D92D20` | ไม่มี |
| ↳ `btn-icon` 🆕 | 40×40 · radius **9999** · โปร่งใส | ไม่มี |
| ↳ `btn-circle` 🆕 | 43×43 · radius 9999 · ขอบ `#D0D5DD` | ไม่มี |
| **pagination** 🆕 | `join-item btn btn-sm` h39 · padding 0 12 · ขอบ 1px `#D0D5DD` · **radius 0 ตรงกลาง / 8px หัวท้าย** · margin-left −1px · active พื้น `#D0D5DD` · `#475467` | ไม่มี |
| **sidebar** | **80px** · พื้นขาว · ขอบขวา 1px `#EAECF0` · padding 12px 0 · gap 20 · ไอคอน 24px `#667085` · active `#A80689` · **ไม่ขยายตอน hover** (มือถือยุบเป็น 0) | `.side` **96px** · gap 6 · nv 48×48 radius 12 · **hover ขยาย 280px** |
| **topbar** | ปุ่มกลม 40×40 radius 9999 · `#667085` · ขอบล่าง `#E4E7EC` | `.topbar` padding 13px 28px · gap 18 |

## 6. ความไม่สม่ำเสมอในระบบจริง — ต้องเลือกให้ชัด

ระบบจริงเองก็ไม่ได้ตรงกันทุกหน้า เก็บมาแล้วเจอ 3 จุด:

| จุด | เจอแบบไหนบ้าง | **เลือกใช้** |
|---|---|---|
| พื้นหัวตาราง | `#F2F4F7` (request-list) · `#E4E7EC` (`bg-gray-200 sticky` ที่ repair / maint-schedule) | **`#F2F4F7`** — ตรงกับ `--gray-100` และใช้มากกว่า |
| badge | `badge badge-pill-outline` (12/**600** · padding 4×8 · h28) · Tailwind ดิบ `w-30 text-xs font-bold px-2 py-0.5` (12/**700** · padding 2×8 · h25) | **`badge-pill-outline`** — เป็นคลาสของ design system ไม่ใช่ utility ดิบ |
| พื้น badge อ่อน | warning `#FFFAEB` / `#FFFCF5` · error `#FEF3F2` / `#FFFBFA` | **`#FFFAEB` / `#FEF3F2`** — ตรงกับ `--warning-50` / `--error-50` ที่เรามีแล้ว |

## 7. กติกาการกำกับที่มา (ต่อจากเดิมใน `tokens.css`)

เพิ่มสัญลักษณ์ใหม่ 1 ตัว — ของเดิม `✔` (Figma) · `~` (runtime เดา) · `⚠` (ไม่มีแหล่ง)

| สัญลักษณ์ | ความหมายใหม่ |
|---|---|
| `✅` | **วัดจาก runtime จริง** (`.vms-runtime/`) — น่าเชื่อถือที่สุด |
| `✔` | จาก Figma library และ runtime ไม่ขัด |
| `⚠` | ไม่มีทั้งสองแหล่ง — ต้องเขียนเหตุผลกำกับ **ห้ามเดาเงียบๆ** |

## 7.5 ผลเทียบ element ต่อ element (15 ส.ค. 2569)

เจ้าของงานทักว่า *"พื้นหลังเว็บจริงเป็นสีขาว แต่เว็บที่เราออกแบบเป็นสีเทา"* → วัดใหม่ทั้งสองฝั่ง**ด้วยชุดวัดเดียวกัน**
สคริปต์ `.vms-runtime/cmp-elements.js` · ผลดิบ `.vms-runtime/compare-elements.json`

- ฝั่งจริง: `/vehicle-booking/request-list` + `/repair-management`
- ฝั่งเรา: `maintainance-yearly/index.html` + `design-system/index.html` + `mock/Maintenance-Request-Form.html`
- เทียบ 12 ค่าต่อ element (พื้น · ตัวอักษร · ขนาด · น้ำหนัก · lh · ls · ขอบ · สีขอบ · radius · padding · gap · เงา)
- เลือก element แบบมองเห็นจริง · ไม่ `disabled` · กรองด้วยข้อความ (กันไปโดนปุ่มในโมดัลที่ซ่อนอยู่)

### 🔴 ผล: **20 จุด — ตรง 0 · ต่าง 15 · เราไม่มี 4 · เกินมา 1**

| จุด | ผล | ต่างกี่ค่า |
|---|---|---|
| พื้นหลัง `body` | ❌ | 2 |
| พื้นที่เนื้อหา | ❌ | 2 |
| sidebar | ❌ | 4 |
| ไอคอน sidebar | ❌ | 3 |
| แถบบน (topbar) | ⬜ ของจริงไม่มี เรามีเกิน | — |
| ปุ่มไอคอนบนแถบบน | 🔴 เราไม่มี | — |
| breadcrumb | ❌ | 5 |
| หัวเรื่องหน้า | ❌ | 4 |
| แท็บ (เลือกอยู่ / ปกติ) | 🔴 เราไม่มี ทั้งคู่ | — |
| ช่องค้นหา | ❌ | 7 |
| ปุ่มหลัก | ❌ | 4 |
| ปุ่มรอง | ❌ | 6 |
| ตาราง (กล่องนอก) | ❌ | 8 |
| หัวตาราง `th` | ❌ | 9 |
| เซลล์ `td` | ❌ | 5 |
| แถว `tr` | ❌ | 3 |
| badge | ❌ | 9 |
| ปุ่ม action ท้ายแถว | ❌ (จริงๆ คือเราไม่มี component นี้) | 11 |
| pagination | 🔴 เราไม่มี | — |

### 🆕 สิ่งที่เพิ่งเจอรอบนี้ (ไม่มีในข้อ 4–5)

| # | เรื่อง | รายละเอียด |
|---|---|---|
| 1 | **`body` พื้นเทา ทั้งที่ของจริงขาว** | `components.css:11` เขียน `body{background:#E9EAEC}` — **hex ฮาร์ดโค้ดที่ไม่ใช่ token เลย** (ใกล้สุดคือ `--gray-200:#E9EAEB` ต่างกัน 1 หลัก) ของจริง `body` = `#FFFFFF` |
| 2 | **grep ตรวจสีมองไม่เห็นบั๊กนี้** | คำสั่งใน CLAUDE.md `grep … \| grep -viE '…\|design-system/\|…'` **ยกเว้นโฟลเดอร์ `design-system/` ทั้งก้อน** ⇒ hex ฮาร์ดโค้ดใน `components.css` หลุดมาตลอด |
| 3 | **พื้นที่เนื้อหาก็ไม่ขาว** | `.work{background:var(--gray-25)}` = `#FCFCFD` · ของจริง `.main-container` = `#FFFFFF` |
| 4 | ไอคอน sidebar เล็กกว่า | `.ms` base = 22px ⇒ ไอคอนเมนู 22px · ของจริง **24px** |
| 5 | เงาปุ่ม | ปุ่มจริงมี `0 1px 2px rgba(0,0,0,.05)` · ปุ่มเราไม่มีเงา |
| 6 | `line-height` ปุ่ม | จริง **14px** (เท่าขนาดตัวอักษร) · เรา 20px ⇒ ความสูงปุ่มคุมด้วย padding คนละแบบ |
| 7 | padding ปุ่ม | จริง `0 16px` + สูงคงที่ 40 · เรา `9px 13px` (คำนวณจาก space token) |
| 8 | **แท็บไม่ได้ถูกใช้จริงสักหน้า** | `.tabs/.tab-btn` มีใน `components.css` แต่ไม่มีหน้าไหนเรียกใช้ ⇒ เทียบไม่ได้ |
| 9 | ตัวอักษรหลัก | ของจริงใช้ `#000000` แทบทุกจุด · เราใช้ `--gray-700 #414651` เป็นค่าเริ่มต้นของ `body` |

> ⚠️ **หมายเหตุความเที่ยง** — แถว badge: สคริปต์หยิบ badge ตัวแรกของแต่ละฝั่ง ซึ่งคนละ variant
> (จริง = brand · เรา = success) ⇒ ค่าที่ต่างเรื่อง**สี ไม่ใช่ข้อบกพร่อง**
> ที่เป็นข้อบกพร่องจริงคือ **ขนาด 14→12 · น้ำหนัก 500→600 · ls · padding 2×10→4×8**
> เช่นเดียวกับ "ปุ่ม action ท้ายแถว" ที่ฝั่งเราไม่มี component นี้ สคริปต์เลยไปหยิบ `.btn` ธรรมดาในเซลล์มาแทน

## 8. นอกขอบเขตรอบนี้

- `admin-config.html` / `maintainance-yearly/admin.html` — หน้าปรับแต่ง ยกเว้นตามข้อตกลง 12 ส.ค.
- ไฟล์ `*backup*` และ `mock/test/`
- ไม่แตะโครง flow / เนื้อหา — รอบนี้แก้เฉพาะ **ค่าที่ตามองเห็น** (สี ขนาด ระยะ โครงคอมโพเนนต์)
- ไม่เปลี่ยนชื่อคลาสของเราให้เหมือน DaisyUI (`.btn-p` ไม่ต้องเปลี่ยนเป็น `.btn-primary`) — **ค่าต้องตรง ชื่อไม่ต้อง**
