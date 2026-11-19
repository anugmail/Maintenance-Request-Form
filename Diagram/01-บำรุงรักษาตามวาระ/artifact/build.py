"""สร้างหน้า artifact สรุปงานบำรุงรักษาตามวาระ 5 Feature จากเอกสาร Feature ไฟล์ 40–44 (หัวข้อ 1 2 3 5 6)"""
import html, re, sys, pathlib

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])

FEATURES = [
    ("f1", "40-", "แผนบำรุงรักษา", "สร้างแผนรายปี จัดยานพาหนะเข้าไตรมาส กำหนดอะไหล่ ส่งอนุมัติ แก้ไข และลบแผน", 8, 8, 135, 6),
    ("f2", "41-", "แผนเดินทาง", "เริ่มเมื่อแผนอนุมัติแล้ว ทำแผนเดินทางรายไตรมาส ส่งอนุมัติ และจัดการยานพาหนะในไตรมาส", 7, 9, 56, 8),
    ("f3", "42-", "งานบำรุงรักษารายคัน", "บันทึกงานทีละคัน ตรวจสภาพ ปิดงาน ผลตรวจน้ำมันไฮดรอลิก และผู้ดูแลยานพาหนะรับทราบผล", 6, 9, 70, 8),
    ("f4", "43-", "ต้นทุนการบำรุงรักษา", "แท็บต้นทุนในหน้ารายละเอียดแผน สรุปรายไตรมาส รายคัน และส่งออก Excel", 1, 2, 5, 1),
    ("f5", "44-", "ติดตามและแดชบอร์ด", "อะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว ข้อมูลการบำรุงรักษารายคัน และเครื่องมือกล", 4, 5, 44, 2),
]

GAP = "ยังไม่มีจอ"


def inline(s: str) -> str:
    s = html.escape(s, quote=False)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    s = re.sub(r"\*\*(.+?)\*\*", lambda m: ('<mark class="gap">%s</mark>' if GAP in m.group(1) or "ยังไม่เคาะ" in m.group(1) else "<strong>%s</strong>") % m.group(1), s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    # รหัสจอในวงเล็บ เช่น (A1.4) (T.19) (B.10)
    s = re.sub(r"\(([A-Z]\d{0,2}\.\d{1,2})\)", r'<span class="sc">\1</span>', s)
    return s


def table(lines):
    rows = [[c.strip() for c in ln.strip().strip("|").split("|")] for ln in lines]
    head, body = rows[0], rows[2:]
    out = ['<div class="scroll"><table><thead><tr>']
    out += ["<th>%s</th>" % inline(c) for c in head]
    out.append("</tr></thead><tbody>")
    for r in body:
        total = any("รวม" in c and "**" in c for c in r[:1])
        out.append('<tr class="total">' if total else "<tr>")
        out += ["<td>%s</td>" % inline(c) for c in r]
        out.append("</tr>")
    out.append("</tbody></table></div>")
    return "".join(out)


def lists(lines):
    """รายการ - หรือ 1. ซ้อนด้วยเยื้อง 2 ช่อง"""
    out, stack = [], []
    for ln in lines:
        m = re.match(r"^(\s*)(-|\d+\.)\s+(.*)$", ln)
        depth = len(m.group(1)) // 2
        tag = "ol" if m.group(2) != "-" else "ul"
        while len(stack) > depth + 1:
            out.append("</li></%s>" % stack.pop())
        if len(stack) == depth + 1:
            out.append("</li>")
        else:
            out.append("<%s>" % tag)
            stack.append(tag)
        out.append("<li>" + inline(m.group(3)))
    while stack:
        out.append("</li></%s>" % stack.pop())
    return "".join(out)


def blocks(lines):
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
        elif ln.lstrip().startswith("|"):
            j = i
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                j += 1
            out.append(table(lines[i:j])); i = j
        elif re.match(r"^\s*(-|\d+\.)\s+", ln):
            j = i
            while j < len(lines) and re.match(r"^\s*(-|\d+\.)\s+", lines[j]):
                j += 1
            out.append(lists(lines[i:j])); i = j
        elif ln.startswith("### "):
            out.append("<h4>%s</h4>" % inline(ln[4:])); i += 1
        else:
            m = re.fullmatch(r"\*\*(.+?)\*\*(.*)", ln.strip())
            if m and GAP not in m.group(1):
                out.append('<p class="lead"><strong>%s</strong>%s</p>' % (inline(m.group(1)), inline(m.group(2))))
            else:
                out.append("<p>%s</p>" % inline(ln.strip()))
            i += 1
    return "".join(out)


def sections(text):
    """แยก ## N. … เป็น {เลข: [บรรทัด]}"""
    sec, cur = {}, None
    for ln in text.splitlines():
        m = re.match(r"^## (\d+)\. ", ln)
        if m:
            cur = int(m.group(1)); sec[cur] = []
        elif cur is not None:
            sec[cur].append(ln)
    return sec


def split_h3(lines):
    """ส่วนก่อน ### แรก + รายการ (หัว, บรรทัด)"""
    pre, parts, cur = [], [], None
    for ln in lines:
        if ln.startswith("### "):
            cur = (ln[4:].strip(), []); parts.append(cur)
        elif cur:
            cur[1].append(ln)
        else:
            pre.append(ln)
    return pre, parts


def details(title, body, cls="", count=""):
    return '<details class="%s"><summary><span class="st">%s</span>%s</summary><div class="db">%s</div></details>' % (
        cls, inline(title), '<span class="cnt">%s</span>' % count if count else "", body)


def feature(fid, prefix, name, blurb, nj, npage, nscreen, ntoast, no):
    path = next(SRC.glob(prefix + "*feature*.md"))
    sec = sections(path.read_text(encoding="utf-8"))
    out = ['<section class="feature" id="%s">' % fid]
    out.append('<header class="fh"><p class="eyebrow">Feature %d</p><h2>%s</h2><p class="blurb">%s</p>' % (no, name, blurb))
    out.append('<dl class="facts"><div><dt>Journey</dt><dd>%d</dd></div><div><dt>หน้า</dt><dd>%d</dd></div><div><dt>จอ</dt><dd>%d</dd></div><div><dt>Toast</dt><dd>%d</dd></div></dl></header>' % (nj, npage, nscreen, ntoast))

    pre, parts = split_h3(sec[1])
    out.append('<h3>ภาพรวม</h3>' + blocks(pre))
    for title, body in parts:
        out.append("<h3>%s</h3>%s" % (inline(title), blocks(body)))

    pre, parts = split_h3(sec[2])
    out.append('<h3>Journey</h3>')
    for title, body in parts:
        n = sum(1 for ln in body if GAP in ln)
        out.append(details(title, blocks(body), "journey", "ยังไม่มีจอ %d จุด" % n if n else ""))

    out.append('<h3>เรื่องอื่นของ Feature นี้</h3>')
    out.append(details("รวม case ของแต่ละหน้า", blocks(sec[3])))
    if 5 in sec:
        out.append(details("ยังไม่มีจอ (ส่งให้เจ้าของงานตัดสิน)", blocks(sec[5]), "open"))
    if 6 in sec:
        out.append(details("ยังไม่เคาะ", blocks(sec[6]), "open"))
    out.append("</section>")
    return "".join(out)


tot = [sum(f[i] for f in FEATURES) for i in (4, 6, 7)]
nav = "".join('<a href="#%s"><b>%d</b> %s</a>' % (f[0], i + 1, f[2]) for i, f in enumerate(FEATURES))
rows = "".join(
    '<tr><td class="num">%d</td><td><a href="#%s">%s</a><span class="sub">%s</span></td><td class="num">%d</td><td class="num">%d</td><td class="num">%d</td><td class="num">%d</td></tr>'
    % (i + 1, f[0], f[2], f[3], f[4], f[5], f[6], f[7]) for i, f in enumerate(FEATURES))
body = "".join(feature(*f, no=i + 1) for i, f in enumerate(FEATURES))

page = (pathlib.Path(__file__).with_name("shell.html").read_text(encoding="utf-8")
        .replace("{{NAV}}", nav).replace("{{ROWS}}", rows).replace("{{BODY}}", body)
        .replace("{{NJ}}", str(tot[0])).replace("{{NS}}", str(tot[1])).replace("{{NT}}", str(tot[2])))
OUT.write_text(page, encoding="utf-8")
print(len(page), "bytes", page.count("<details"), "details", page.count("<table"), "tables", page.count('class="gap"'), "gap marks")
