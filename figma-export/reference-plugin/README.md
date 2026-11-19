# Component reference for AI

## เลือก component จากปลั๊กอิน

- กด **เลือก component / layer…** เพื่อแสดง layer ข้างในสิ่งที่เลือกอยู่ ถ้ายังไม่ได้เลือกอะไรจะแสดงจากหน้าปัจจุบัน
- ค้นหาด้วยชื่อ component, ชื่อ layer หรือข้อความ เช่น `Table`, `Column`, `ทะเบียน` แล้วคลิกรายการ Figma จะเลือกและซูมไปที่ชิ้นนั้น รวมถึง component ลูกและ text layer
- รายการยังคงอยู่เมื่อคลิกเลือก จึงเลือกชิ้นข้างเคียงต่อได้ กดปุ่มโหลดรายการอีกครั้งเพื่ออ่านจาก selection ปัจจุบัน
- จากนั้นกด **อ่านฉบับแก้แล้ว** หรือ **บันทึกก่อนแก้** ตามต้องการ
- กด **เลือก frame ก่อนแก้ที่บันทึกไว้** เพื่อกลับไปเลือก root เดิมก่อนเทียบหลังรีวิว
- รายการจำกัด 2,500 layer และแสดงผลค้นหา 150 รายการแรก หากไม่พบให้เลือก frame ที่เล็กลงแล้วโหลดใหม่ Layer ที่ลบไปแล้วจะมีข้อความแจ้งให้โหลดใหม่

## เรียนรู้จากคนรีวิว (ก่อน–หลัง)

1. หลัง AI generate เลือก frame ที่จะรีวิว กด **1. บันทึกก่อนแก้**
2. คนรีวิวและแก้ข้อความ คอลัมน์ component ลูก ลำดับ หรือ layout ใน frame เดิม
3. เลือก frame เดิม กด **2. เทียบหลังคนแก้** จะได้ baseline, reviewed และ changes เช่น text เปลี่ยนจากอะไรเป็นอะไร, layer เพิ่ม/ลบ/ย้าย, component หรือ variant เปลี่ยน
4. ใส่เหตุผลและขอบเขตที่อยากให้นำไปใช้ แล้วกด **Copy ให้ AI เรียนรู้** หรือดาวน์โหลด JSON / บันทึก `.md`
5. ส่งให้ AI ในโปรเจกต์วิเคราะห์และบันทึกกติกาที่ตรวจทานแล้วใน `docs/design-review/` เชื่อมลิงก์ในคำแนะนำที่ agent อ่าน และแก้ generator/template ที่สร้างงานนั้นด้วย เพื่อให้การ generate ครั้งต่อไปใช้ผลรีวิวจริง

ถ้าคนแก้เสร็จแล้วโดยไม่ได้เก็บ baseline ให้กด **อ่านฉบับแก้แล้ว** ได้ AI จะศึกษาผลลัพธ์ที่ถูกต้อง แต่ไม่สามารถยืนยันสิ่งที่เปลี่ยนจากฉบับเดิมได้

baseline เก็บด้วย Figma clientStorage ในเครื่อง หนึ่งชุดต่อไฟล์ บันทึกครั้งใหม่ทับชุดเดิม ไม่แชร์ข้ามคน/เครื่อง ควรดาวน์โหลดหลักฐานก่อนเปลี่ยนชุดรีวิว การเทียบต้องเลือก root node เดิมและลำดับเดิม ใช้ node ID จับคู่; การลบแล้วสร้างใหม่แสดงเป็นลบ+เพิ่ม ไม่จับคู่ด้วยการเดาชื่อ

การ export หรือดาวน์โหลดไม่ได้ทำให้ AI จำถาวรอัตโนมัติ ต้องนำบันทึกเข้าโปรเจกต์และเชื่อมให้ agent อ่านในรอบต่อไป กติกาที่สรุปจากความต่างยังต้องแยกจากข้อมูลตัวอย่างและการแก้เฉพาะหน้า อย่าขยายใช้กับทุกหน้าโดยอัตโนมัติ

เลือก component ที่ชอบใน Figma แล้วส่งข้อมูลจริงให้ AI ศึกษาหรือใช้เป็นต้นแบบกับ component อื่น ไม่ต้องดัมป์ทั้งไฟล์ ไม่ต้องรัน server และไม่แก้ canvas

## ติดตั้งและใช้

1. เปิด Figma Desktop → Plugins → Development → Import plugin from manifest… แล้วเลือก `figma-export/reference-plugin/manifest.json`
2. รัน **Maintain-D — Component reference for AI**
3. เลือก component, component set, instance หรือ frame ที่ต้องการ (เลือกได้หลายตัว)
4. ใส่สิ่งที่ชอบจากต้นแบบและชื่อ component/หน้าปลายทาง เช่น “ใช้โครงตารางและระยะห่างนี้กับรายการแจ้งซ่อม”
5. กด **อ่านสิ่งที่เลือก** → **Copy สำหรับ AI** แล้ววางในแชต หรือกด **ดาวน์โหลด JSON** เพื่อแนบไฟล์
6. ถ้า clipboard ถูกจำกัด ปลั๊กอินจะเลือกข้อความให้ กด Cmd+C / Ctrl+C ได้เอง

ถ้า Figma รุ่นที่ใช้ขอ plugin ID ให้สร้าง New plugin ใน Development แล้วนำ `id` ที่ Figma ออกให้มาเพิ่มใน manifest นี้ ไม่ใช้ ID ของปลั๊กอินอื่น

## ข้อมูลที่ได้

- ที่มา: ชื่อไฟล์, file key เมื่อ API เปิดเผย, หน้า, node ID
- โครง layer พร้อมชื่อ/type, ขนาด, layout, padding/gap, สี, stroke, radius, effects, visibility รวม layer ซ่อน
- ข้อความเต็มและ text segments สำหรับข้อความหลายฟอนต์
- component key, main component, component set, variant และ component properties
- variable bindings, ชื่อ variable, ค่าแต่ละ mode และชื่อ mode; style IDs พร้อมชื่อเมื่อเข้าถึงได้
- คำเตือนเมื่ออ่านข้อมูลไม่ได้หรือเกินขอบเขต

เลือก **component set** ถ้าต้องการหลาย variant; เลือก instance จะได้ subtree ของ instance นั้นและ metadata ของ main component ไม่ได้อ่านทุก variant ให้อัตโนมัติ

ข้อมูลนี้เป็น reference ไม่ใช่ไฟล์สำหรับ import เพื่อ clone canvas ไม่มี vector paths, image bytes หรือ prototype interactions จำกัด 2,500 nodes และความลึก 30 ชั้น หากมีคำเตือนว่าถูกตัด ให้เลือกชิ้นเล็กลง

ปลั๊กอินไม่ได้เรียก AI เองและไม่ได้แก้ component ปลายทาง ข้อมูลยังอยู่ในหน้าต่างปลั๊กอินจนกว่าผู้ใช้จะคัดลอกหรือดาวน์โหลด

สำหรับ Maintain-D ให้ตรวจเทียบทั้ง `(Component) VMS Plus` (`VmOC07pKEsDkHZagOgcSU2`) และ `(UI) VMS Plus – Release#2` (`fYD1yA1uzWsJSjHlcWKMNe`) ตาม `CLAUDE.md` และ `design-system/HOWTO-read-figma.md` ช่องหน้า UI อ้างอิงช่วยส่งบริบทจากไฟล์ที่สองให้ AI; การ export ไม่ถือว่าเป็นการยืนยันแหล่งต้นแบบอัตโนมัติ

ตรวจอัตโนมัติ: `node figma-export/reference-plugin/test.cjs` (mock Plugin API; ยังต้องลอง clipboard/download และข้อมูลจริงใน Figma Desktop)
