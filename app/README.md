# VMS Plus — Next.js app (ต้นแบบ)

Next.js 16 (App Router) + React 19 + Tailwind 4 — ตาม stack ใน `../JO1-Tech-Data-Spec.md` หัวข้อ 1

```bash
npm i
npm run dev        # http://localhost:3000 → /overhaul
npm run build
```

## เมนูที่มี

| เส้นทาง | หน้าจอ | อิงสเปก |
|---|---|---|
| `/overhaul` | รายการแผน Overhaul (ค้นหา · กรองสถานะ · ดู · แก้ไข · สร้างแผน) | 6.1 |
| `/overhaul/[id]` | รายละเอียดแผน + รถที่เข้าแผน | 6.1, 6.2 |
| `/overhaul/new` · `/overhaul/[id]/edit` | สร้าง/แก้ไขแผน · เลือกรถ + เกณฑ์คัดเลือก · ยกเลิกแผน (ต้องมีเหตุผล) | 6.1, 6.2 |
| `/overhaul-jobs` | **จัดการงาน Overhaul** — คิวงานรายคันของทุกแผนที่อนุมัติแล้ว (ค้นหา · ตัวกรอง · เรียงคอลัมน์) ยกโครงจากคิวงานซ่อม กบค. | 7.4.2-12 |
| `/overhaul/[id]/vehicles/[vehicleId]` | ดำเนินการ Overhaul รายคัน — โครงเดียวกับงานซ่อมระบบจริง (`../flow/repair`): 4 แท็บ + 7 ขั้น ① เบิกอะไหล่ ② นัดหมายวันซ่อม ③ ตรวจสภาพก่อน ④ ดำเนินการ ⑤ นัดหมายวันคืนรถ ⑥ ตรวจสภาพหลัง + ใบรับรอง ⑦ รายงานปิดงาน + ส่งอนุมัติ | 7.4.2-01–10 · 7.4.1-05 |

## กติกา

- **หน้าตามาจาก design system ของรีโปเท่านั้น** — `src/app/globals.css` import
  `../design-system/tokens.css` + `components.css` ตรงๆ (ไม่ก๊อป) แล้วใช้คลาสเดิม
  (`.shell` `.tbl` `.btn` `.f` …) · Tailwind ใช้แค่ layout · กติกาเต็มดู `../CLAUDE.md`
- **components.css เข้า `layer(components)`** ใน `globals.css` (แก้ 1 ต.ค. 2569) — เดิม import แบบไม่มี layer
  ทำให้ `*{margin:0;padding:0}` ของ design system ชนะ utility ของ Tailwind v4 (ซึ่งอยู่ใน `@layer utilities`)
  ⇒ `mt-*` `mb-*` `p*-*` ทุกตัวในแอปหายเงียบ · ตอนนี้ utility ทับได้ ไม่ต้องใส่ `!` เพื่อเว้นระยะอีก
- **ระยะห่างหน้าดำเนินการ Overhaul ยึดภาพระบบจริง `../flow/repair`** (วัดพิกเซล): หัวข้อส่วน ↔ เนื้อหา 24 ·
  แท็บ → stepper 24 · stepper → เนื้อหา 32 · breadcrumb → ชื่อหน้า `mb-6`
- ข้อมูลเป็น mock (`src/lib/overhaul.ts`) เก็บใน `localStorage` key `vms-overhaul-plans-v3` — ปุ่ม "เริ่มเดโมใหม่" ล้างกลับค่าเริ่มต้น
