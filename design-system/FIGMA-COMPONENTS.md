# 🧩 แมป components.css ↔ component จริงของ VMS Plus

> **สร้างอัตโนมัติจาก [`figma-map.json`](figma-map.json) — อย่าแก้ไฟล์นี้ด้วยมือ**
> รันใหม่: `node figma-export/6-validate-map.js` (ตรวจว่าอ้างของที่มีจริงก่อนเขียน)
> บัญชี component ทั้งหมด 183 ตัวอยู่ที่ [`figma-components.json`](figma-components.json)
> ที่มา: ไฟล์ Figma `PEA` · 42,510 instance
>
> 🔴 **ก่อนออกแบบหน้าจอใหม่ทุกครั้งต้องอ่านไฟล์นี้** (เจ้าของงานสั่ง 25 ส.ค. 2569) —
> ดูขั้นที่ 3 ของ "ขั้นตอนบังคับ" ใน [README.md](README.md)

## 1. คลาสที่มี component จริงให้ใช้ (31)

สร้าง instance แล้ว `setProperties` ตามคอลัมน์สุดท้าย

| คลาสของเรา | component จริง | instance | property | เงื่อนไข → ค่า |
|---|---|---|---|---|
| `.btn.btn-p` | **Primary button** | 478 | 8 | `disabled` · `.btn-lg` |
| `.btn.btn-s` | **Secondary button** | 863 | 8 | `disabled` · `.btn-lg` |
| `.btn.btn-o` | **Secondary button** | 863 | 8 | — |
| `.btn.btn-t` | **Tertiary button** | 1,348 | 8 | — |
| `.btn.btn-g` | **Tertiary button** | 1,348 | 8 | — |
| `.badge` | **Pill outline** | 795 | 2 | `.b-ok`→Success · `.b-low`→Warning · `.b-out`→Error · `.b-brand`→Brand · `.b-info`→Info · `.b-neutral`→Gray |
| `.sect` | **Section header** | 222 | 7 | `hasSub` |
| `.page-title-row` | **Page header** | 206 | 11 | `hasButton` |
| `.crumbs` | **Breadcrumbs** | 103 | 4 | — |
| `.tbl th` | **Table header cell** | 290 | 7 | `.sortable` |
| `.tbl td` | **Table cell** | 680 | 10 | `.cell-sub` · `hasBadge` · `hasButtons` |
| `.f .in input` | **Text input** | 1,076 | 14 | `hasIcon` · `.help` |
| `.f .in select` | **Input dropdown** | 824 | 15 | — |
| `.chk input` | **Checkbox** | 24 | 2 | `checked` · `disabled` |
| `.tabs .tab-btn` | **Tab item** | 483 | 4 | `.on` |
| `.wsteps .wstep` | **Horizontal step item** | 562 | 6 | `.active` · `.passed` |
| `.note` | **Alert** | 2 | 6 | `.note-info`→Info · `.note-warn`→Warning · `.note-ok`→Success |
| `.pager` | **Button groups pagination item** | 350 | 3 | — |
| `.tblfoot` | **Table pagination** | 50 | 1 | — |
| `.modal-head` | **Modal header** | 22 | 9 | — |
| `.modal-foot` | **Modal footer** | 22 | 6 | — |
| `.rads label` | **Radio button** | 2,724 | 2 | — |
| `.tile` | **Radio text card** | 80 | 5 | — |
| `.card` | **Card item base** | 116 | 8 | — |
| `.side .nv` | **Nav button** | 1,537 | 4 | — |
| `.topbar` | **Header navigation** | 206 | 1 | — |
| `.numfld` | **Number input** | 42 | 9 | — |
| `.qty` | **Number input** | 42 | 9 | — |
| `.search` | **Text input** | 1,076 | 14 | — |
| `.veh` | **Card item base** | 116 | 8 | — |
| `.job` | **_Content item base** | 2,002 | 8 | — |

## 2. คลาสที่เป็นโครง/utility — ไม่ใช่ component (12)

ใน Figma ทำเป็น **frame + auto-layout** ไม่ต้องหา component

- `.shell` — frame แนวนอน — sidebar + พื้นที่งาน
- `.work`
- `.content`
- `.stack` — auto-layout แนวตั้ง gap 12 (tight 8 · loose 20)
- `.fgrid` — grid 4 คอลัมน์ — Figma ใช้ auto-layout ซ้อน
- `.actions` — แถวปุ่มชิดขวา
- `.tblwrap`
- `.hidden`
- `.sub` — ข้อความบรรยายใต้หัวข้อ — เป็น text ธรรมดา ไม่ใช่ component
- `.list-toolbar` — แถบเหนือตาราง — ประกอบจาก .search + ปุ่ม
- `.wgrp` — หัวกลุ่มของ stepper หลายกลุ่ม
- `.vlist`

## 3. ของเราเอง — ไลบรารีไม่มีให้เทียบ (15)

วาดเองตาม `components.css` · ถ้าจะเปลี่ยนต้องแจ้งเจ้าของงานก่อน

- `.daterange` — ไลบรารีไม่มีตัวเลือกช่วงวันที่ — SOURCES.md หมวด ค
- `.cal` — แผงปฏิทินทั้งแผงเป็นของเราเอง
- `.toast` — ไลบรารีมี Notification แต่คนละแพตเทิร์น — SOURCES.md หมวด ข
- `.empty` — ไลบรารี Empty state เป็นบล็อกภาพ 512px คนละแบบ
- `.rzone` — กล่องจัดกลุ่มรายการ ภาค→จังหวัด→รถ ของเราเอง
- `.draft` — แถบ mock ของ prototype ไม่ใช่ของระบบจริง
- `.gallery`
- `.chip` — ไลบรารีไม่มี Tag/Chip — SOURCES.md เคยเทียบกับ Tag `1:1378` ของไฟล์ไลบรารี แต่ไฟล์งานนี้ไม่มี instance ให้ใช้
- `.chips` — ดู .chip
- `.seg` — ไลบรารีมีแต่ pagination item ไม่ใช่ segmented control ทั่วไป
- `.app` — ชุด mobile legacy ของ prototype เก่า ไม่ใช่ของระบบจริง
- `.steps` — ดู .app
- `.workno` — ป้ายเลขงานเฉพาะโฟลว์บำรุงรักษา ไม่มีในระบบจริง
- `.page-back` — ปุ่มย้อนกลับหัวหน้า — ของเราเอง
- `.tl` — ไทม์ไลน์ — ไลบรารีไม่มี
