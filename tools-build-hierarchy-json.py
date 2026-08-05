# -*- coding: utf-8 -*-
"""รวม CSV ขนาด + แมปเขต→จังหวัด จากหน้าภาพรวม -> hierarchy-data.json"""
import json, io, csv, re, collections

SP = '/private/tmp/claude-501/-Users-anu-p-PEA-Maintain-D/21bcf244-eaa1-4556-b87a-fc25bfaa25ab/scratchpad/'
DEST = '/Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form/hierarchy-data.json'

pages = json.load(io.open(SP + 'pdfpos.json', encoding='utf-8'))

# ---- 1) เขต -> จังหวัด จากหน้าภาพรวม ----
prov_region = {}
for objn in (3, 50):
    pg = next(p for p in pages if p['obj'] == objn)
    bands = collections.defaultdict(list)
    for i in pg['items']:
        if i['x'] < 80: bands[round(i['y'])].append(i)
    regions = []
    for y, items in bands.items():
        s = ''.join(x['t'] for x in sorted(items, key=lambda i: i['x']))
        if re.match(r'^กฟ[นฉกต]\.\d$', s): regions.append((y, s))
    regions.sort(reverse=True)
    for i in pg['items']:
        if 'จังหวัด' not in i['t']: continue
        name = re.sub(r'^.*?จังหวัด', '', i['t']).strip()
        if not name: continue
        above = [r for r in regions if r[0] > i['y']]
        if not above: continue
        prov_region[name] = min(above, key=lambda r: r[0] - i['y'])[1]
print('เขต→จังหวัด:', len(prov_region), 'จังหวัด |', len(set(prov_region.values())), 'เขต')

# ---- 2) ขนาด จาก CSV (เฉพาะโครงสร้างใหม่) ----
rows = [r for r in csv.DictReader(io.open(SP + 'pea-org-size.csv', encoding='utf-8-sig'))
        if r['โครงสร้าง'].startswith('ใหม่')]
prov = {}
for r in rows:
    p = prov.setdefault(r['จังหวัด'], {'name': r['จังหวัด'], 'size': '', 'branches': []})
    if r['ระดับ'] == 'กฟจ':
        p['size'] = r['ขนาด']
    else:
        p['branches'].append({'n': re.sub(r'^กฟ[สอ]\.', '', r['หน่วยงาน']), 's': r['ขนาด'],
                              'lv': r['ระดับ']})

# ---- 3) จับคู่ชื่อจังหวัด (ชื่อจาก 2 แหล่ง สระอาจเพี้ยนคนละแบบ) ----
def norm(s):
    s = re.sub(r'[\s\.]', '', s)
    return s.replace('ำ', 'า').replace('ํา', 'า').replace('ั', '')

reg_by_norm = {norm(k): v for k, v in prov_region.items()}
# 2 จังหวัดที่ชื่อในหน้าภาพรวมกับหน้าจังหวัดเขียนไม่ตรงกัน — ยืนยันจากตำแหน่งใน PDF แล้ว
reg_by_norm.setdefault(norm('บึงกำฬ'), 'กฟฉ.1')
reg_by_norm[norm('เมืองสมุทรสำคร')] = 'กฟก.3'
matched = unmatched = 0
for p in prov.values():
    r = reg_by_norm.get(norm(p['name']))
    if r: matched += 1
    else:
        unmatched += 1
        # เทียบแบบ substring กันชื่อเพี้ยนเล็กน้อย
        for k, v in reg_by_norm.items():
            if norm(p['name'])[:6] and norm(p['name'])[:6] in k:
                r = v; matched += 1; unmatched -= 1; break
    p['region'] = r or '?'

print('จับคู่เขตได้:', matched, '| ไม่ได้:', unmatched)
print('เขตที่พบ:', sorted(set(p['region'] for p in prov.values())))

out = {
    'source': 'โครงสร้างหน้างาน 74 จังหวัด_new_MASTER V2.pdf — โครงสร้างใหม่ เริ่มใช้ 1 ม.ค. 2569',
    'note': 'ชื่อมีสระ า/ำ เพี้ยนจาก font subset ของ PDF — ต้อง match กับ mas_department ก่อนใช้จริง',
    'provinces': sorted(prov.values(), key=lambda p: (p['region'], p['name']))
}
json.dump(out, io.open(DEST, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
import os
print('เขียน %s (%.0f KB)' % (DEST, os.path.getsize(DEST) / 1024))
print('จังหวัด:', len(out['provinces']), '| กฟส. รวม:', sum(len(p['branches']) for p in out['provinces']))
print('ตัวอย่าง:', {k: v for k, v in out['provinces'][0].items() if k != 'branches'},
      '| สาขา', len(out['provinces'][0]['branches']))
