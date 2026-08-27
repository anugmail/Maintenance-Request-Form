# -*- coding: utf-8 -*-
"""สร้างตารางสะพาน PDF โครงสร้างหน้างาน <-> vms_mas_department (เว้น dept_sap ไว้ join ทีหลัง)"""
import csv, io, json, re, os

SRC = '/Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form/pea-org-74provinces-size.csv'
DEST = '/Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form/pea-dept-size-bridge.csv'

# ชื่อจังหวัดที่ถูกต้อง: ชื่อที่แกะจาก PDF -> ชื่อจริง (สระ า ถูก render เป็น ำ บางตำแหน่ง)
PROV_FIX = {
    'กำญจนบุรี': 'กาญจนบุรี', 'ฉะเชิงเทรำ': 'ฉะเชิงเทรา', 'ชัยนำท': 'ชัยนาท',
    'ตรำด': 'ตราด', 'ตำก': 'ตาก', 'นครนำยก': 'นครนายก',
    'นครรำชสีมำ': 'นครราชสีมา', 'นครศรีธรรมรำช': 'นครศรีธรรมราช', 'นรำธิวำส': 'นราธิวาส',
    'บึงกำฬ': 'บึงกาฬ', 'ปทุมธำนี': 'ปทุมธานี', 'ปรำจีนบุรี': 'ปราจีนบุรี',
    'พระนครศรีอยุธยำ': 'พระนครศรีอยุธยา', 'พะเยำ': 'พะเยา', 'พังงำ': 'พังงา',
    'มหำสำรคำม': 'มหาสารคาม', 'มุกดำหำร': 'มุกดาหาร', 'ยะลำ': 'ยะลา',
    'รำชบุรี': 'ราชบุรี', 'ลำปำง': 'ลำปาง', 'สงขลำ': 'สงขลา',
    'สมุทรสงครำม': 'สมุทรสงคราม', 'หนองคำย': 'หนองคาย', 'อำนำจเจริญ': 'อำนาจเจริญ',
    'อุดรธำนี': 'อุดรธานี', 'อุทัยธำนี': 'อุทัยธานี', 'อุบลรำชธำนี': 'อุบลราชธานี',
    'เชียงรำย': 'เชียงราย', 'เมืองสมุทรสำคร': 'สมุทรสาคร',
}

def fix_prov(s):
    return PROV_FIX.get(s, s)

def fold(s):
    """กุญแจ join แบบ lossy ที่ใช้ได้สองฝั่ง — ตัดคำนำหน้า/จุด/ช่องว่าง แล้วยุบ ำ เป็น า
    ทั้งสองฝั่ง fold เหมือนกัน จึง match ได้แม้ชื่อฝั่ง PDF จะเพี้ยน"""
    s = re.sub(r'^กฟ[จสอ]\.?', '', s.strip())
    s = re.sub(r'[\s.]', '', s)
    return s.replace('ำ', 'า')

VER = {'เดิม': ('2568-10-01', '2568-10-01'), 'ใหม่': ('2569-01-01', '2569-01-01')}

# รหัสประเภทหน่วยงานทางการ (resource_code) — จาก data dictionary ของ mas_department
# ขนาด L/M/S/XS ของ กฟฟ. เข้ารหัสอยู่ในตัว resource_code อยู่แล้ว
#   กฟจ. มีแค่ 2 ขนาด: 104 = จังหวัด(L) · 105 = จังหวัด(S)   ← ไม่มี M และไม่มี XS
#   กฟส. มี 4 ขนาด:   111 = สาขา(L) · 112 = สาขา(M) · 113 = สาขา(S) · 114 = สาขา(XS)
# แถวที่แมปไม่ได้ = ขนาดที่ผังต้นทางอ่านมาขัดกับโครงสร้างทางการ -> ติดธง size_conflict
RESOURCE_CODE = {
    ('กฟจ.', 'L'): '104', ('กฟจ.', 'S'): '105',
    ('กฟส.', 'L'): '111', ('กฟส.', 'M'): '112',
    ('กฟส.', 'S'): '113', ('กฟส.', 'XS'): '114',
}

rows = list(csv.DictReader(io.open(SRC, encoding='utf-8-sig')))

# เขต -> จังหวัด เอาจาก hierarchy-data.json ที่ทำไว้แล้ว (โครงสร้างใหม่) แล้วใช้กับทั้งสองเวอร์ชัน
hj = json.load(io.open(os.path.join(os.path.dirname(DEST), 'hierarchy-data.json'), encoding='utf-8'))
region_by_prov = {fold(p['name']): p['region'] for p in hj['provinces']}

# หา กฟส.เมืองX (เดิม) ที่กลายเป็น กฟจ.X (ใหม่) เพื่อใส่หมายเหตุการยกระดับ
old_by_key = {}
for r in rows:
    if r['โครงสร้าง'].startswith('เดิม'):
        old_by_key[(fold(r['จังหวัด']), fold(r['หน่วยงาน']))] = r

out = []
for r in rows:
    ver = 'เดิม' if r['โครงสร้าง'].startswith('เดิม') else 'ใหม่'
    sv, eff = VER[ver]
    prov_raw = r['จังหวัด']
    prov = fix_prov(prov_raw)
    lv = r['ระดับ'] + '.'
    name_raw = r['หน่วยงาน']

    if r['ระดับ'] == 'กฟจ':                      # ชื่อ = ชื่อจังหวัด ซึ่งแก้ให้ถูกแล้ว
        display, verified = 'กฟจ.' + prov, 'Y'
    else:                                        # ชื่อสาขา = ชื่ออำเภอ ยังยืนยันสระไม่ได้
        display, verified = name_raw, 'N'

    res_code = RESOURCE_CODE.get((lv, r['ขนาด']), '')
    conflict = '' if res_code else 'Y'

    note = ''
    if conflict:
        note = 'ไม่มี resource_code ทางการสำหรับ %s ขนาด %s' % (lv, r['ขนาด'])
    if ver == 'ใหม่' and r['ระดับ'] == 'กฟจ':
        prev = old_by_key.get((fold(prov_raw), fold('กฟส.เมือง' + prov_raw)))
        if prev:
            up = 'ยกระดับจาก %s (ขนาดเดิม %s)' % (prev['หน่วยงาน'], prev['ขนาด'])
            note = (note + ' · ' + up) if note else up

    out.append({
        'dept_sap': '',
        'structure_version': sv,
        'effective_date': eff,
        'dept_level': lv,
        'region': region_by_prov.get(fold(prov_raw), ''),
        'province': prov,
        'dept_name_display': display,
        'dept_name_raw': name_raw,
        'match_key': fold(name_raw),
        'dept_size': r['ขนาด'],
        'name_verified': verified,
        'resource_code': res_code,
        'size_conflict': conflict,
        'note': note,
    })

LV_ORDER = {'กฟจ.': 0, 'กฟอ.': 1, 'กฟส.': 2}
out.sort(key=lambda d: (d['structure_version'], d['region'], d['province'],
                        LV_ORDER.get(d['dept_level'], 9), d['match_key']))

cols = ['dept_sap', 'structure_version', 'effective_date', 'dept_level', 'region',
        'province', 'dept_name_display', 'dept_name_raw', 'match_key', 'dept_size',
        'name_verified', 'resource_code', 'size_conflict', 'note']
with io.open(DEST, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    w.writerows(out)

# ---- ตรวจงาน ----
import collections
print('เขียน %s (%.0f KB) — %d แถว' % (os.path.basename(DEST), os.path.getsize(DEST) / 1024, len(out)))
print('เวอร์ชัน :', collections.Counter(d['structure_version'] for d in out))
print('ระดับ    :', collections.Counter(d['dept_level'] for d in out))
print('เขตว่าง  :', sum(1 for d in out if not d['region']))
print('ยกระดับ  :', sum(1 for d in out if 'ยกระดับจาก' in d['note']))
print('มี resource_code:', sum(1 for d in out if d['resource_code']),
      '· ติดธง size_conflict:', sum(1 for d in out if d['size_conflict']))
for d in out:
    if d['size_conflict']:
        print('   ขัดกับโครงสร้างทางการ:', d['dept_level'], d['dept_size'], d['dept_name_display'], '|', d['province'])
dup = [k for k, c in collections.Counter(
    (d['structure_version'], d['province'], d['match_key']) for d in out).items() if c > 1]
print('match_key ซ้ำในจังหวัดเดียวกัน:', len(dup), dup[:3])
print('จังหวัดที่ยังมี ำ ค้าง (ควรเป็น 6 ชื่อที่มี ำ จริง):',
      sorted(set(d['province'] for d in out if 'ำ' in d['province'])))
