# Maintain-D prototype — กติกาบังคับ

## 🔴 งาน UI ทุกชิ้น: ต้องทำตาม design system ห้ามคิดเอง

> เจ้าของงานกำหนด **8 ส.ค. 2569:** *"การออกแบบให้อิงจาก design system ด้วย"*
> ย้ำอีกครั้ง **9 ส.ค. 2569:** *"ทำตาม design system ทั้งหมด ห้ามคิดเอง"*

**ก่อนแตะ HTML/CSS ใดๆ ต้องอ่าน 2 ไฟล์นี้ก่อนเสมอ — ห้ามเดาจากแพตเทิร์นของหน้าที่มีอยู่**

1. [`design-system/README.md`](design-system/README.md) — กฎบังคับ 6 ข้ออยู่ที่ **หัวข้อ 0** · รายการคอมโพเนนต์อยู่ **หัวข้อ 4**
2. [`design-system/components.css`](design-system/components.css) — คลาสจริงที่มีให้ใช้

**สรุปกฎที่พลาดกันบ่อย**

| ต้อง | ห้าม |
|---|---|
| ใช้คลาสที่มีอยู่แล้วใน `components.css` ก่อนเสมอ | เขียน CSS คอมโพเนนต์ใน `<style>` ของหน้า |
| ของใหม่ → เพิ่มใน `components.css` แล้วค่อยเรียกใช้ | ทำ component เฉพาะหน้าแล้วปล่อยไว้ |
| สีใช้ `var(--…)` · ไม่มี token ให้เพิ่มใน `tokens.css` ก่อน | hardcode hex ในหน้าจอ |
| ไอคอนใช้ `<span class="ms">ชื่อ</span>` (Material Symbols) | emoji แทนไอคอน UI · inline `<svg>` |
| ปุ่มใช้ `.btn` + `.btn-p/.btn-s/.btn-t/...` | เขียนสไตล์ปุ่มเอง |
| light เท่านั้น | `prefers-color-scheme:dark` รายหน้า |

`<style>` ในหน้าเก็บได้เฉพาะสิ่งที่**เป็นของหน้านั้นจริงๆ ใช้ที่อื่นไม่ได้** และต้องมีคอมเมนต์บอกเหตุผล

**แก้ `components.css` หรือ `tokens.css` เมื่อไหร่ → บั๊ม `?v=` ทุกหน้าที่ลิงก์ไฟล์นั้น** แล้วอัปเดตตารางหัวข้อ 4 + Changelog หัวข้อ 8 ของ `design-system/README.md`

**ตรวจก่อนบอกว่าเสร็จ** (ทั้งสองคำสั่งต้องได้ผลว่าง)

```bash
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'

grep -rnP '[\x{1F300}-\x{1FAFF}]' --include='*.html' --include='*.js' \
  maintainance-yearly/ mock/ daily-record/ *.html | grep -v '/test/' | grep -v backup | grep -vE ':\s*(//|\*|/\*)'
```

## 🔴 แก้ flow ในต้นแบบ → อัปเดตผังในคอมมิตเดียวกัน

`Diagram/01-บำรุงรักษาตามวาระ/` คือ**เจ้าของความจริงของ flow** — หน้าจอห้ามเขียนคำอธิบาย flow ซ้ำ
เปลี่ยนลำดับขั้น/ผู้รับผิดชอบ/เงื่อนไขเมื่อไหร่ ต้องแก้ผัง mermaid + `Diagram/README.md` ในคอมมิตเดียวกัน

ผังต้อง parse ผ่านจริง ไม่ใช่แค่ตาดู:

```bash
# ดู scratchpad ของเซสชัน — โหลด mermaid 11 บน headless Chromium แล้วเรียก parse() + render()
```

## 🔴 push เสร็จ → ไล่อัปเดต `plan.md` ให้ตรงทันที

`plan.md` (รากโปรเจกต์) = บันทึกงานสะสม · `maintainance-yearly/plan.md` = ของโฟลว์บำรุงรักษา
ทั้งคู่มีหัวข้อ **"ค้างอยู่"** ที่ต้องติ๊กปิด/เพิ่มให้ตรงกับของจริงเสมอ

## เทสก่อนบอกว่าเสร็จ

```bash
python3 -m http.server 8123 --bind 127.0.0.1        # ห้ามใช้ file://
node maintainance-yearly/test/skeleton-data.test.js  # โครงข้อมูล skeleton
```

ขับเบราว์เซอร์ตาม `.claude/skills/verify/SKILL.md` (playwright-core + Chromium ที่ติดเครื่องอยู่แล้ว)
เกณฑ์ขั้นต่ำ: **ไม่มี `pageerror`** · แก้แล้วรีโหลดค่าต้องอยู่ · ลิงก์ทุกอันไม่ 404

## บริบทที่ควรรู้

- static HTML ล้วน ไม่มี build step · state อยู่ใน `localStorage` (คนละ key ต่อโหมด)
- deploy ด้วย GitHub Actions → Pages (`.github/workflows/pages.yml`) ทุก push บน `main`
- โฟลว์บำรุงรักษา = **ออกเลขงาน (หน้าแยก) + stepper 5 เฟส** ไม่ใช่ "6 ช่วง" แบบเอกสารเก่า
