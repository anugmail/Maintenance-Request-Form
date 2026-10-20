#!/usr/bin/env node
/* ============================================================
   ประกอบ out/board.json — สเปกบอร์ด FigJam จาก manifest ของ capture ทุกชุด
   ------------------------------------------------------------
   ค่าเริ่มต้น = เฉพาะโฟลว์สร้างแผน/ออกเลขงาน ตามที่เจ้าของงานสั่ง 12 ส.ค. 2569
   ("ทำแค่ flow ที่บอก ไม่ใช่ทั้งหมด") — ชุดอื่นเป็นตัวเลือกเมื่อถูกขอเท่านั้น:

     node figma-export/3-figjam-board.js            ผังโฟลว์สร้างแผน + capture 8 หน้าจอ
     node figma-export/3-figjam-board.js --after    + โฟลว์หลังออกเลขงาน (พัสดุ/ยืนยันรถ)
     node figma-export/3-figjam-board.js --maint    + เฟส 2 ดำเนินการบำรุงรักษา (ผัง + capture ถ้ามี)
     node figma-export/3-figjam-board.js --swimlane + swimlane โฟลว์แจ้งซ่อมทั้งเส้น 19 สถานะ (ผังล้วน)
     node figma-export/3-figjam-board.js --state    + ผังสถานะ/เงื่อนไขการเปลี่ยนสถานะ (ผังล้วน)
     node figma-export/3-figjam-board.js --disposal + flow จำหน่ายยานพาหนะ (ผังล้วน · ตาม Template บอร์ด Planning 1-2)
     node figma-export/3-figjam-board.js --inventory + flow เบิกวัสดุผ่าน Smart Inventory (swimlane 5 เลน · Template เดียวกัน)
     node figma-export/3-figjam-board.js --swimlane --only   เอาเฉพาะ swimlane อย่างเดียว (ไม่เอาชุดตั้งต้น)
     node figma-export/3-figjam-board.js --overhaul2 --only --out=board-overhaul2.json
                                                    Overhaul v2 ครบ 14 scenario (section ละ scenario · capture จาก flow-overhaul2-capture.js)
                                                    --out= เขียนไฟล์ชื่ออื่น ไม่ทับ board.json (ปลั๊กอินใส่ชื่อไฟล์ในช่องที่อยู่ได้)
     node figma-export/3-figjam-board.js --maintainance --only --out=board-maintainance.json
                                                    userflow บำรุงรักษาตามวาระ 17 scenario (section ละ scenario · ผังรูปทรง Template
                                                    จาก Diagram/01-…/14-บำรุงรักษา-userflow.md ผ่าน 8-flow-userflow.js — ไม่มีรูป capture)
     node figma-export/3-figjam-board.js --pages    + หน้ารวมทุกหน้าจัดหมวด
     node figma-export/3-figjam-board.js --all      ทุกชุด

   ส่วนผัง (kind:diagram) อ่านจาก out/diagram-plan.json — สร้างด้วย 4-figjam-diagram.js ก่อน

   ปลั๊กอิน figjam-plugin/ เป็นคนอ่าน board.json นี้แล้วสร้างของจริง
   (รันซ้ำ: ปลั๊กอินล้างเฉพาะ section ที่ชื่ออยู่ใน board.json ปัจจุบัน)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const FJ = path.join(OUT, 'figjam');

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/* palette section ของ FigJam (ค่าอนุญาตตายตัวของ FigJam ไม่ใช่สีแบรนด์เรา) */
const COLORS = {
  violet: [248, 245, 255], blue: [245, 251, 255], teal: [241, 254, 253],
  gray: [249, 249, 249], yellow: [255, 251, 240], pink: [255, 240, 250],
  green: [235, 255, 238]
};

function flowSection(name, color, dir, manifest) {
  return {
    name, color, connect: 'sequence',
    cols: manifest.shots.map(s => ({
      label: s.file.slice(0, 2) + ' · ' + s.name,
      note: s.note || '',
      images: [{ src: 'figjam/' + dir + '/' + s.file, w: s.w, h: s.h }]
    }))
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const all = args.has('--all');
  // --only = เอาเฉพาะ section ที่สั่งมาเท่านั้น ไม่เอาชุดตั้งต้น (ผัง+3 โฟลว์ทีละหน้าจอ)
  // ใช้ตอนอยากขึ้นบอร์ดทีละผัง เช่น  node figma-export/3-figjam-board.js --swimlane --only
  const only = args.has('--only');

  const sections = [];

  if (!only) {
  const diagFile = path.join(OUT, 'diagram-plan.json');
  if (!fs.existsSync(diagFile)) {
    console.error('ไม่พบ out/diagram-plan.json — รัน 4-figjam-diagram.js ก่อน');
    process.exit(1);
  }
  const diag = read(diagFile);
  sections.push({
    name: 'แผนผังโฟลว์สร้างแผน / ออกเลขงาน',
    color: COLORS.violet,
    kind: 'diagram',
    diagram: diag
  });

  sections.push(flowSection('โฟลว์สร้างแผน / ออกเลขงาน — ทีละหน้าจอ', COLORS.green, 'flow-plan',
    read(path.join(FJ, 'flow-plan', 'manifest.json'))));

  sections.push(flowSection('โฟลว์วางแผนการเดินทาง — ทีละหน้าจอ', COLORS.blue, 'flow-trips',
    read(path.join(FJ, 'flow-trips', 'manifest.json'))));

  sections.push(flowSection('โฟลว์แจ้งซ่อม — ฝั่งผู้แจ้ง ทีละหน้าจอ', COLORS.yellow, 'flow-report',
    read(path.join(FJ, 'flow-report', 'manifest.json'))));
  }

  if (all || args.has('--after')) {
    sections.push(flowSection('โฟลว์หลังออกเลขงาน — พัสดุรับทราบ + ยืนยันรถ', COLORS.teal,
      'flow-after-issue', read(path.join(FJ, 'flow-after-issue', 'manifest.json'))));
  }

  // เฟส 2 — ผังมาก่อน capture เพราะหน้าจอจริงยังทยอยทำ · ไม่มี capture ก็ลงผังอย่างเดียวได้
  if (all || args.has('--maint')) {
    const maintDiag = path.join(OUT, 'diagram-maint.json');
    if (!fs.existsSync(maintDiag)) {
      console.error('ไม่พบ out/diagram-maint.json — รัน 4-figjam-diagram.js --src=…03-เฟส2-… --out=diagram-maint.json ก่อน');
      process.exit(1);
    }
    sections.push({
      name: 'แผนผังเฟส 2 — ดำเนินการบำรุงรักษา',
      color: COLORS.pink,
      kind: 'diagram',
      diagram: read(maintDiag)
    });

    const maintShots = path.join(FJ, 'flow-maint', 'manifest.json');
    if (fs.existsSync(maintShots)) {
      sections.push(flowSection('โฟลว์เฟส 2 ดำเนินการบำรุงรักษา — ทีละหน้าจอ', COLORS.pink,
        'flow-maint', read(maintShots)));
    } else {
      console.log('— ยังไม่มี capture เฟส 2 (out/figjam/flow-maint/) ลงเฉพาะผัง');
    }
  }

  // Swimlane โฟลว์แจ้งซ่อมทั้งเส้น 19 สถานะ (15 ก.ย. 2569) — ผังล้วน ไม่มี capture คู่
  // ต้นทาง: Diagram/02-แจ้งซ่อม-กบค/06-swimlane-โฟลว์ซ่อมทั้งเส้น.md
  if (all || args.has('--swimlane')) {
    const swimFile = path.join(OUT, 'diagram-repair-swimlane.json');
    if (!fs.existsSync(swimFile)) {
      console.error('ไม่พบ out/diagram-repair-swimlane.json — รัน  node figma-export/5-swimlane.js');
      process.exit(1);
    }
    sections.push({
      name: 'Swimlane — โฟลว์แจ้งซ่อมทั้งเส้น (21 สถานะ)',
      color: COLORS.teal,
      kind: 'diagram',
      diagram: read(swimFile)
    });
  }

  // ผังสถานะ + เงื่อนไขการเปลี่ยนสถานะ (15 ก.ย. 2569) — คู่กับ swimlane
  // swimlane บอก "ใบอยู่ในมือใคร" · ผังนี้บอก "อะไรทำให้สถานะเปลี่ยน"
  if (all || args.has('--state')) {
    const stFile = path.join(OUT, 'diagram-repair-state.json');
    if (!fs.existsSync(stFile)) {
      console.error('ไม่พบ out/diagram-repair-state.json — รัน\n' +
        '  node figma-export/4-figjam-diagram.js --src="Diagram/02-แจ้งซ่อม-กบค/07-state-เงื่อนไขเปลี่ยนสถานะ.md" --out=diagram-repair-state.json');
      process.exit(1);
    }
    sections.push({
      name: 'ผังสถานะ + เงื่อนไขการเปลี่ยนสถานะ — ใบแจ้งซ่อม',
      color: COLORS.violet,
      kind: 'diagram',
      diagram: read(stFile)
    });
  }

  // Flow จำหน่ายยานพาหนะ (5 ต.ค. 2569) — หน้าตาตาม Template ของบอร์ด Planning 1-2 หน้า "โอนย้าย--จำหน่าย"
  // ต้นทาง: Diagram/06-จำหน่ายทรัพย์สิน/01-จำหน่ายยานพาหนะ.md · สเปกจาก 6-flow-disposal.js
  // บอร์ดนั้นมีงานคนอื่นอยู่แล้ว ⇒ ตั้ง anchor = below ให้ปลั๊กอินวางต่อใต้ของเดิม ไม่ทับ
  if (all || args.has('--disposal')) {
    const dispFile = path.join(OUT, 'diagram-disposal.json');
    if (!fs.existsSync(dispFile)) {
      console.error('ไม่พบ out/diagram-disposal.json — รัน  node figma-export/6-flow-disposal.js');
      process.exit(1);
    }
    sections.push({
      name: 'จำหน่ายยานพาหนะ — ร่าง 5 ต.ค. 2569 (หลักเกณฑ์ยานพาหนะ 2569 หมวด 8 ข้อ 24–25 · ❓/เส้นประ = ยังไม่ยืนยัน)',
      color: [255, 255, 255],
      kind: 'diagram',
      diagram: read(dispFile)
    });
  }

  // Flow เบิกวัสดุผ่าน Smart Inventory (9 ต.ค. 2569) — ต้นทาง "flow-smart inventory.pdf" (sequence diagram)
  // สเปกจาก 7-flow-smart-inventory.js · หน้าตาตาม Template เดียวกับ flow จำหน่าย
  if (all || args.has('--inventory')) {
    const invFile = path.join(OUT, 'diagram-smart-inventory.json');
    if (!fs.existsSync(invFile)) {
      console.error('ไม่พบ out/diagram-smart-inventory.json — รัน  node figma-export/7-flow-smart-inventory.js');
      process.exit(1);
    }
    sections.push({
      name: 'เบิกวัสดุผ่าน Smart Inventory — 9 ต.ค. 2569 (เลือกวัสดุ → จอง → คลังเบิก → SAP ตัด Stock → Callback)',
      color: [255, 255, 255],
      kind: 'diagram',
      diagram: read(invFile)
    });
  }

  // Overhaul v2 ครบ 14 scenario (19 ต.ค. 2569) — 1 section ต่อ scenario เรียงตาม userflow · ลูกศรต่อจอในแต่ละ section
  // ไฟล์ Figma design ทำด้วย component จริงที่ overhaul2-plugin/ · บอร์ดนี้ใช้รีวิว flow (ภาพ capture จาก HTML)
  if (all || args.has('--overhaul2')) {
    const mf = path.join(FJ, 'flow-overhaul2', 'manifest.json');
    if (!fs.existsSync(mf)) { console.error('ไม่พบ ' + mf + ' — รัน flow-overhaul2-capture.js ก่อน'); process.exit(1); }
    const m = read(mf);
    const order = [...new Set(m.shots.map(s => s.scenario))];
    const tint = [COLORS.violet, COLORS.blue, COLORS.teal, COLORS.yellow, COLORS.pink, COLORS.green, COLORS.gray];
    order.forEach((sc, i) => {
      const shots = m.shots.filter(s => s.scenario === sc);
      sections.push({
        name: 'Overhaul v2 · ' + sc, color: tint[i % tint.length], connect: 'sequence',
        cols: shots.map((s, j) => ({ label: (j + 1) + ' · ' + s.name, note: '', images: [{ src: 'figjam/flow-overhaul2/' + s.file, w: s.w, h: s.h }] }))
      });
    });
  }

  // userflow บำรุงรักษาตามวาระ (19 ต.ค. 2569) — 17 scenario ที่เขียนตามบอร์ดเจ้าของงาน · ผังล้วน ไม่มีรูป capture
  // ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md → 8-flow-userflow.js → out/diagram-userflow-maintainance.json
  // แยกไฟล์จากชุดซ่อม (board.json) และ Overhaul (board-overhaul2.json) ตามคำสั่ง "ซ่อมอันนึง บำรุงอันนึง"
  if (all || args.has('--maintainance')) {
    const uf = path.join(OUT, 'diagram-userflow-maintainance.json');
    if (!fs.existsSync(uf)) {
      console.error('ไม่พบ ' + uf + ' — รัน  node figma-export/8-flow-userflow.js  ก่อน');
      process.exit(1);
    }
    const u = read(uf);
    const tint = [COLORS.violet, COLORS.blue, COLORS.teal, COLORS.yellow, COLORS.pink, COLORS.green, COLORS.gray];
    u.sections.forEach((sec, i) => sections.push({
      name: sec.name, color: i === 0 ? [255, 255, 255] : tint[(i - 1) % tint.length], kind: 'diagram', diagram: sec.diagram
    }));
  }

  if (all || args.has('--pages')) {
    const pages = read(path.join(FJ, 'manifest.json'));
    const groupColor = {
      'โฟลว์บำรุงรักษาประจำปี': COLORS.violet, 'Insight / Outcome': COLORS.blue,
      'โฟลว์นัดหมายรับรถ': COLORS.teal, 'Admin / โครงสร้าง': COLORS.gray,
      'ฟอร์มแจ้งซ่อม (mock)': COLORS.yellow, 'ฮับ + Design system': COLORS.pink
    };
    sections.push(...pages.groups.map(g => ({
      name: g.group + ' — ทั้งหน้า',
      color: groupColor[g.group] || COLORS.gray,
      connect: 'none',
      cols: g.pages.map(p => ({
        label: p.name + '   ·   ' + p.path,
        note: '',
        images: p.slices.map(s => ({ src: 'figjam/' + s.file, w: s.w, h: s.h }))
      }))
    })));
  }

  const board = {
    version: 1,
    anchor: (args.has('--disposal') || args.has('--inventory') || args.has('--overhaul2') || args.has('--maintainance')) ? 'below' : undefined,   // วางต่อใต้ของเดิมบนบอร์ด ไม่ทับ
    generatedAt: new Date().toISOString(),
    font: { family: 'IBM Plex Sans Thai', style: 'Medium' },
    fallbackFont: { family: 'Inter', style: 'Medium' },
    sections
  };

  const outArg = [...args].find(a => a.indexOf('--out=') === 0);
  const outFile = outArg ? outArg.slice(6) : 'board.json';
  fs.writeFileSync(path.join(OUT, outFile), JSON.stringify(board));
  const nImg = sections.reduce((a, s) => a + (s.cols || []).reduce((b, c) => b + c.images.length, 0), 0);
  const nDiag = sections.filter(s => s.kind === 'diagram').length;
  console.log(outFile + ': ' + sections.length + ' section (ผัง ' + nDiag + ') · ' +
    sections.reduce((a, s) => a + (s.cols || []).length, 0) + ' หน้าจอ · ' + nImg + ' รูป');
}

main();
