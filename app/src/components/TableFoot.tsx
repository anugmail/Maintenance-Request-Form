// แถบท้ายตาราง .tblfoot — "แสดง x ถึง y จาก n รายการ" + จำนวนแถวต่อหน้า + .pager (README หัวข้อ 4.2)
// ใช้ร่วมกันทุกหน้ารายการ (แผน Overhaul · จัดการงาน Overhaul)
export const PAGE_SIZES = [10, 25, 50];

export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * size, cur * size);
  return { pages, cur, slice, from: rows.length ? (cur - 1) * size + 1 : 0, to: (cur - 1) * size + slice.length };
}

interface Props {
  total: number;
  from: number;
  to: number;
  cur: number;
  pages: number;
  size: number;
  onPage: (n: number) => void;
  onSize: (n: number) => void;
}

export function TableFoot({ total, from, to, cur, pages, size, onPage, onSize }: Props) {
  return (
    <div className="tblfoot">
      <div className="tf-left">
        <span>
          แสดง {from} ถึง {to} จาก {total} รายการ
        </span>
        <select
          className="select-inline"
          aria-label="จำนวนแถวต่อหน้า"
          value={size}
          onChange={(e) => onSize(+e.target.value)}
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="pager">
        <button className="pg" disabled={cur <= 1} onClick={() => onPage(cur - 1)} aria-label="หน้าก่อนหน้า">
          <span className="ms">chevron_left</span>
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button key={n} className={`pg${n === cur ? " on" : ""}`} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
        <button className="pg" disabled={cur >= pages} onClick={() => onPage(cur + 1)} aria-label="หน้าถัดไป">
          <span className="ms">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
