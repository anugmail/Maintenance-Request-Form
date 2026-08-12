#!/usr/bin/env node
/* ============================================================
   ประกอบ out/board.json — สเปกบอร์ด FigJam จาก manifest ของ capture ทุกชุด
   ------------------------------------------------------------
   รวม 3 แหล่ง:
     out/figjam/flow-plan/manifest.json        โฟลว์สร้างแผน (มีลูกศรตามลำดับ)
     out/figjam/flow-after-issue/manifest.json โฟลว์หลังออกเลขงาน (มีลูกศร)
     out/figjam/manifest.json                  หน้ารวมทุกหน้า จัดกลุ่มตามหมวด

   ปลั๊กอิน figjam-plugin/ เป็นคนอ่าน board.json นี้แล้วสร้างของจริง
   รันซ้ำได้ทุกเมื่อหลัง capture ใหม่:  node figma-export/3-figjam-board.js
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
  const flowPlan = read(path.join(FJ, 'flow-plan', 'manifest.json'));
  const flowAfter = read(path.join(FJ, 'flow-after-issue', 'manifest.json'));
  const pages = read(path.join(FJ, 'manifest.json'));

  const groupColor = {
    'โฟลว์บำรุงรักษาประจำปี': COLORS.violet, 'Insight / Outcome': COLORS.blue,
    'โฟลว์นัดหมายรับรถ': COLORS.teal, 'Admin / โครงสร้าง': COLORS.gray,
    'ฟอร์มแจ้งซ่อม (mock)': COLORS.yellow, 'ฮับ + Design system': COLORS.pink
  };

  const sections = [
    flowSection('โฟลว์สร้างแผน / ออกเลขงาน — ทีละหน้าจอ', COLORS.green, 'flow-plan', flowPlan),
    flowSection('โฟลว์หลังออกเลขงาน — พัสดุรับทราบ + ยืนยันรถ', COLORS.teal, 'flow-after-issue', flowAfter),
    ...pages.groups.map(g => ({
      name: g.group + ' — ทั้งหน้า',
      color: groupColor[g.group] || COLORS.gray,
      connect: 'none',
      cols: g.pages.map(p => ({
        label: p.name + '   ·   ' + p.path,
        note: '',
        images: p.slices.map(s => ({ src: 'figjam/' + s.file, w: s.w, h: s.h }))
      }))
    }))
  ];

  const board = {
    version: 1,
    generatedAt: new Date().toISOString(),
    font: { family: 'IBM Plex Sans Thai', style: 'Medium' },
    fallbackFont: { family: 'Inter', style: 'Medium' },
    sections
  };

  fs.writeFileSync(path.join(OUT, 'board.json'), JSON.stringify(board));
  const nImg = sections.reduce((a, s) => a + s.cols.reduce((b, c) => b + c.images.length, 0), 0);
  console.log('board.json: ' + sections.length + ' section · ' +
    sections.reduce((a, s) => a + s.cols.length, 0) + ' หน้าจอ · ' + nImg + ' รูป');
}

main();
