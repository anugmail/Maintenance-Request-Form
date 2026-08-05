# -*- coding: utf-8 -*-
"""แกะ 'ขนาดหน่วยงาน' จากสีกล่องในผังโครงสร้าง PEA 74 จังหวัด -> CSV"""
import re, zlib, io, csv, math

PDF = '/Users/anu.p/PEA/Maintain-D/โครงสร้างหน้างาน 74 จังหวัด_new_MASTER V2.pdf'
OUT = '/private/tmp/claude-501/-Users-anu-p-PEA-Maintain-D/21bcf244-eaa1-4556-b87a-fc25bfaa25ab/scratchpad/'
data = open(PDF, 'rb').read()
objs = {int(m.group(1)): m.group(3) for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)endobj', data, re.S)}

def stream_of(b):
    m = re.search(rb'stream\r?\n(.*?)\r?\nendstream', b, re.S)
    if not m: return None
    if b'FlateDecode' in b:
        try: return zlib.decompress(m.group(1))
        except Exception: return None
    return m.group(1)

def parse_cmap(txt):
    m = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', txt, re.S):
        for a, b in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            m[int(a,16)] = bytes.fromhex(b.decode()).decode('utf-16-be','ignore')
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', txt, re.S):
        for lo,hi,dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            lo,hi,base = int(lo,16), int(hi,16), int(dst,16)
            for i in range(lo, min(hi, lo+4096)+1): m[i] = chr(base+(i-lo))
    return m

font_cmap = {}
for n, b in objs.items():
    mt = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', b)
    if mt:
        cm = stream_of(objs.get(int(mt.group(1)), b''))
        if cm: font_cmap[n] = parse_cmap(cm)

NUM = r'-?\d*\.?\d+'
TOKEN = re.compile((
    r'(?P<num>%s)|(?P<name>/[^\s/\[\]<>()]+)|(?P<hex><[0-9A-Fa-f\s]*>)'
    r'|(?P<str>\((?:\\.|[^\\()])*\))|(?P<arr>\[)|(?P<arrend>\])|(?P<op>[A-Za-z\'"*]+)') % NUM).match

def tokenize(s):
    i, n, out = 0, len(s), []
    while i < n:
        ch = s[i]
        if ch in ' \t\r\n': i += 1; continue
        if ch == '%':
            j = s.find('\n', i); i = n if j < 0 else j+1; continue
        m = TOKEN(s, i)
        if not m: i += 1; continue
        out.append(m); i = m.end()
    return out

def run_page(content, fonts):
    txt, shapes = [], []
    st = []            # operand stack
    fill = (1,1,1)
    stack = []         # q/Q colour stack
    path = []          # current path points
    cm_cur = {}
    tx = ty = 0.0
    s = content.decode('latin-1')
    for m in tokenize(s):
        g = m.lastgroup; v = m.group()
        if g == 'num': st.append(float(v)); continue
        if g in ('name','hex','str','arr','arrend'): st.append(v); continue
        op = v
        try:
            if op == 'q': stack.append(fill)
            elif op == 'Q': fill = stack.pop() if stack else fill
            elif op == 'rg' and len(st) >= 3: fill = tuple(round(float(x),3) for x in st[-3:])
            elif op == 'g'  and len(st) >= 1: gg = round(float(st[-1]),3); fill = (gg,gg,gg)
            elif op == 'k'  and len(st) >= 4:
                c,mm,y,k = [float(x) for x in st[-4:]]
                fill = tuple(round((1-min(1,ch+k)),3) for ch in (c,mm,y))
            elif op == 're' and len(st) >= 4:
                x,y,w,h = [float(x) for x in st[-4:]]
                path += [(x,y),(x+w,y+h)]
            elif op in ('m','l') and len(st) >= 2: path.append((float(st[-2]), float(st[-1])))
            elif op == 'c' and len(st) >= 6:
                path += [(float(st[-6]),float(st[-5])),(float(st[-2]),float(st[-1]))]
            elif op in ('f','f*','b','b*','B','B*'):
                if path:
                    xs = [p[0] for p in path]; ys = [p[1] for p in path]
                    shapes.append({'x0':min(xs),'y0':min(ys),'x1':max(xs),'y1':max(ys),'c':fill})
                path = []
            elif op in ('n','S','s'): path = []
            elif op == 'Tf' and len(st) >= 2: cm_cur = fonts.get(str(st[-2])[1:], {})
            elif op == 'Tm' and len(st) >= 6: tx, ty = float(st[-2]), float(st[-1])
            elif op in ('Td','TD') and len(st) >= 2: tx += float(st[-2]); ty += float(st[-1])
            elif op in ('Tj','TJ',"'",'"'):
                raw = ''.join(str(x) for x in st if isinstance(x,str))
                out = ''
                for h in re.findall(r'<([0-9A-Fa-f\s]*)>', raw):
                    hh = re.sub(r'\s','',h)
                    if cm_cur and len(hh) % 4 == 0:
                        out += ''.join(cm_cur.get(int(hh[i:i+4],16),'') for i in range(0,len(hh),4))
                    else:
                        out += ''.join(cm_cur.get(int(hh[i:i+2],16),'') for i in range(0,len(hh),2))
                for lit in re.findall(r'\(((?:\\.|[^\\()])*)\)', raw):
                    bs = lit.encode('latin-1','ignore').replace(b'\\(',b'(').replace(b'\\)',b')')
                    out += ''.join(cm_cur.get(c,'') for c in bs) if cm_cur else bs.decode('latin-1')
                if out.strip(): txt.append({'x':round(tx,1),'y':round(ty,1),'t':out.strip()})
        finally:
            if op not in ('q','Q'): st = []
    return txt, shapes

pages = []
for n, body in objs.items():
    if re.search(rb'/Type\s*/Page[^s]', body) is None: continue
    fonts = {}
    fr = re.search(rb'/Font\s*<<(.*?)>>', body, re.S)
    if fr:
        for nm, ref in re.findall(rb'/(\w+)\s+(\d+)\s+0\s+R', fr.group(1)):
            fonts[nm.decode()] = font_cmap.get(int(ref), {})
    c = b''
    for cn in re.findall(rb'/Contents\s+(\d+)\s+0\s+R', body):
        s = stream_of(objs.get(int(cn), b''));  c += s or b''
    if not c: continue
    t, sh = run_page(c, fonts)
    pages.append({'obj': n, 'txt': t, 'sh': sh})

print('pages:', len(pages), '| shapes:', sum(len(p['sh']) for p in pages))

def merge_rows(items, ytol=2.5):
    rows = []
    for i in sorted(items, key=lambda i: (-i['y'], i['x'])):
        if rows and abs(rows[-1]['y'] - i['y']) <= ytol: rows[-1]['items'].append(i)
        else: rows.append({'y': i['y'], 'items': [i]})
    out = []
    for r in rows:
        r['items'].sort(key=lambda i: i['x'])
        # แยกเป็นชิ้นตามช่องว่างแนวนอนที่กว้างผิดปกติ
        chunks, cur = [], [r['items'][0]]
        for a, b in zip(r['items'], r['items'][1:]):
            if b['x'] - a['x'] > 26: chunks.append(cur); cur = [b]
            else: cur.append(b)
        chunks.append(cur)
        for ch in chunks:
            out.append({'x': ch[0]['x'], 'y': r['y'], 't': ''.join(i['t'] for i in ch)})
    return out

def area(s): return max(0.1, (s['x1']-s['x0']) * (s['y1']-s['y0']))
def contains(s, x, y, pad=3):
    return s['x0']-pad <= x <= s['x1']+pad and s['y0']-pad <= y <= s['y1']+pad

def box_for(shapes, x, y):
    """กล่องที่เล็กที่สุดที่ครอบจุดข้อความ (ข้ามพื้นหลังทั้งหน้า)"""
    cand = [s for s in shapes if contains(s, x, y) and area(s) < 60000]
    if not cand: return None
    return min(cand, key=area)

# ---- รอบที่ 1: เก็บ legend จากทุกหน้า แล้วโหวตเป็นแมปสีกลาง ----
import collections
votes = collections.defaultdict(collections.Counter)
for p in pages:
    for it in p['txt']:
        if it['t'] in ('L', 'M', 'S', 'XS'):
            b = box_for(p['sh'], it['x'], it['y'])
            if b and area(b) < 900:                 # swatch เล็กๆ เท่านั้น
                votes[b['c']][it['t']] += 1
GLOBAL = {c: cnt.most_common(1)[0][0] for c, cnt in votes.items()}
print('\n--- แมปสีกลาง (โหวตจากทุกหน้า) ---')
for c, s in sorted(GLOBAL.items(), key=lambda kv: -sum(votes[kv[0]].values())):
    print('   %-26s -> %-3s (โหวต %s)' % (c, s, dict(votes[c])))

def nearest(c):
    if c in GLOBAL: return GLOBAL[c], 'exact'
    best, bd = None, 9
    for g, s in GLOBAL.items():
        d = sum((a-b)**2 for a, b in zip(c, g))
        if d < bd: bd, best = d, s
    return (best, "ใกล้เคียง (ตรวจซ้ำ)") if bd < 0.06 else ("", "")

rows_out = []
prov_missing = 0
for p in pages:
    if len(p['txt']) < 40: continue          # ข้ามหน้าภาพรวม
    merged = merge_rows(p['txt'])
    # ชื่อจังหวัด = ข้อความที่ขึ้นต้น กฟจ. ที่อยู่สูงสุด
    js = [m for m in merged if m['t'].startswith('กฟจ.')]
    if not js: prov_missing += 1; continue
    prov = max(js, key=lambda m: m['y'])['t'].replace('กฟจ.', '').strip()

    # legend: ตัวอักษรขนาดที่อยู่แถวกลางหน้า
    legend = {}
    for it in p['txt']:
        if it['t'] in ('L','M','S','XS') and 240 < it['y'] < 275:
            b = box_for(p['sh'], it['x'], it['y'])
            if b: legend.setdefault(b['c'], it['t'])
    # ---- จับคู่ด้วย "กล่อง" : ข้อความทุกชิ้นที่อยู่ในกล่องเดียวกัน = ชื่อหน่วยงานเดียวกัน ----
    boxes = [s for s in p['sh'] if 150 < area(s) < 20000]
    used = set()
    for bi, b in enumerate(boxes):
        inside = [i for k, i in enumerate(p['txt'])
                  if k not in used and contains(b, i['x'], i['y'], pad=1)]
        if not inside: continue
        inside.sort(key=lambda i: (-i['y'], i['x']))
        t = ''.join(i['t'] for i in inside).strip()
        if not re.match(r'^กฟ[สจอ]\s*\.', t): continue
        cy = (b['y0'] + b['y1']) / 2
        if 240 < cy < 275: continue                      # ข้าม legend
        for k, i in enumerate(p['txt']):
            if contains(b, i['x'], i['y'], pad=1): used.add(k)
        size = legend.get(b['c'], '')
        how = 'legend หน้านี้'
        if not size:
            size, how = nearest(b['c'])
            how = how or 'สีไม่รู้จัก'
        rows_out.append({
            'จังหวัด': prov, 'ระดับ': re.match(r'^กฟ[สจอ]', t).group(),
            'หน่วยงาน': re.sub(r'\s+', '', t),
            'ขนาด': size,
            'โครงสร้าง': 'ใหม่ (1 ม.ค. 2569)' if cy < 232 else 'เดิม (1 ต.ค. 2568)',
            'ที่มาของขนาด': how, 'สี': '%s' % (b['c'],), 'obj': p['obj']
        })

print('provinces missing header:', prov_missing)
print('rows:', len(rows_out), '| มีขนาด:', sum(1 for r in rows_out if r['ขนาด']))
with io.open(OUT+'pea-org-size.csv','w',encoding='utf-8-sig',newline='') as f:
    w = csv.DictWriter(f, fieldnames=['จังหวัด','ระดับ','หน่วยงาน','ขนาด','โครงสร้าง','ที่มาของขนาด','สี','obj'])
    w.writeheader(); w.writerows(rows_out)

# ตัวอย่างตรวจสอบ
cm = [r for r in rows_out if r['จังหวัด'].startswith('เชียงใหม่') and r['โครงสร้าง'].startswith('ใหม่')]
print('\n--- เชียงใหม่ (โครงสร้างใหม่) %d รายการ ---' % len(cm))
for r in cm[:12]: print('  %-26s %-3s %s' % (r['หน่วยงาน'], r['ขนาด'] or '?', r['สี']))
