// ตารางประวัติการซ่อมย้อนหลังรายคัน — คอลัมน์ตาม vehHistoryTable() ใน mock/Maintenance-Request-Form.html
// (แท็บ "ประวัติการซ่อม" ตอน กบค. รับซ่อม) · JO 7.4.1-05 / 7.2.2-04
import { EmptyState } from "./EmptyState";
import { fmtNum } from "@/lib/overhaul";
import type { RepairRecord } from "@/lib/overhaulExec";

// ป้ายผู้ซ่อม — กบค./กรย. = b-brand · อู่ = b-low (ตาม byBadge ของ mock)
const byBadge = (by: string) => (/อู่/.test(by) ? "b-low" : by === "กบค." || by === "กรย." ? "b-brand" : "b-ok");

export function RepairHistoryTable({ rows }: { rows: RepairRecord[] }) {
  if (!rows.length) return <EmptyState title="ไม่พบประวัติการซ่อมย้อนหลังของรถคันนี้" />;
  return (
    <div className="tblwrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>เลขที่ใบแจ้งซ่อม · วันที่</th>
            <th>อาการเสีย</th>
            <th>อะไหล่ที่ใช้</th>
            <th>ผู้ซ่อม</th>
            <th className="text-right!">ชั่วโมงใช้งาน</th>
            <th className="text-right!">เลขไมล์</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.no}>
              <td>
                <div className="cell-key">{x.no}</div>
                <div className="cell-sub">{x.date}</div>
              </td>
              <td>
                {x.syms.join(", ")}
                {x.detail && <div className="cell-sub">{x.detail}</div>}
              </td>
              <td>
                {x.usedParts.length ? (
                  x.usedParts.map((p) => (
                    <div key={p.name}>
                      {p.name} ×{p.qty} {p.unit}
                    </div>
                  ))
                ) : (
                  <span className="cell-sub">ไม่ได้ใช้อะไหล่</span>
                )}
              </td>
              <td>
                <span className={`badge ${byBadge(x.by)}`}>{x.by}</span>
              </td>
              <td className="text-right">{x.hours ? `${fmtNum(x.hours)} ชม.` : "—"}</td>
              <td className="text-right">{x.odo ? `${fmtNum(x.odo)} กม.` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
