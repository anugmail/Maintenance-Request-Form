"use client";

// ตารางรถในแผน — คอลัมน์ตามสเปก 6.2 ("ข้อมูลแสดง: ทะเบียน, อายุ, ประเภท, สังกัด,
// ยี่ห้อเครื่องมือกล, หมายเลขเครน, S/N, ไมล์, ชั่วโมงสะสม") + เกณฑ์คัดเลือก
// ใช้ทั้งหน้ารายละเอียด (อ่านอย่างเดียว) และหน้าสร้าง/แก้ไข (มีช่องติ๊กเลือก + ติ๊กเกณฑ์)
import Link from "next/link";
import { EXEC_STAGE_BADGE, EXEC_STAGE_LABEL, execStage } from "@/lib/overhaulExec";
import {
  CRITERIA,
  fmtNum,
  vehicleAge,
  type CriterionKey,
  type PlanVehicle,
  type Vehicle,
} from "@/lib/overhaul";

interface Props {
  vehicles: Vehicle[];
  picked: PlanVehicle[];
  // ไม่ส่ง = อ่านอย่างเดียว
  onToggle?: (id: string) => void;
  onCriteria?: (id: string, key: CriterionKey) => void;
  // ส่ง = แผนอนุมัติแล้ว โชว์คอลัมน์ความคืบหน้า Overhaul + ปุ่มเข้าหน้าดำเนินการรายคัน (JO 7.4.2)
  execHref?: (vehicleId: string) => string;
}

export function VehicleTable({ vehicles, picked, onToggle, onCriteria, execHref }: Props) {
  const editable = !!onToggle;
  const pickOf = (id: string) => picked.find((p) => p.vehicleId === id);

  const criteriaCell = (v: Vehicle) => {
    const pv = pickOf(v.id);
    if (!pv) return <span className="cell-sub">—</span>;
    return (
      <div className="chips pick">
        {CRITERIA.filter((c) => editable || pv.criteria.includes(c.key)).map((c) => (
          <span
            key={c.key}
            role={editable ? "checkbox" : undefined}
            aria-checked={editable ? pv.criteria.includes(c.key) : undefined}
            tabIndex={editable ? 0 : undefined}
            className={`chip${pv.criteria.includes(c.key) ? " sel" : ""}${editable ? "" : " plain"}`}
            onClick={() => onCriteria?.(v.id, c.key)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onCriteria?.(v.id, c.key);
              }
            }}
          >
            {c.label}
          </span>
        ))}
      </div>
    );
  };

  const stageBadge = (id: string) => {
    const pv = pickOf(id);
    if (!pv) return null;
    const st = execStage(pv);
    return <span className={`badge ${EXEC_STAGE_BADGE[st]}`}>{EXEC_STAGE_LABEL[st]}</span>;
  };

  return (
    <>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              {editable && <th className="w-12"></th>}
              <th>ทะเบียน</th>
              <th>ประเภท</th>
              <th>สังกัด</th>
              <th className="text-right!">อายุ (ปี)</th>
              <th>ยี่ห้อเครื่องมือกล</th>
              <th>หมายเลขเครน / S/N</th>
              <th className="text-right!">เลขไมล์ (กม.)</th>
              <th className="text-right!">ชั่วโมงสะสม</th>
              <th>เกณฑ์คัดเลือก</th>
              {execHref && <th>Overhaul</th>}
              {execHref && <th></th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                {editable && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`เลือก ${v.plate}`}
                      checked={!!pickOf(v.id)}
                      onChange={() => onToggle?.(v.id)}
                    />
                  </td>
                )}
                <td>
                  <div className="cell-key">{v.plate}</div>
                </td>
                <td>
                  <div className="cell-clip" title={v.vehicleType}>
                    {v.vehicleType}
                  </div>
                </td>
                <td>{v.orgUnit}</td>
                <td className="text-right!">{vehicleAge(v)}</td>
                <td>{v.equipmentBrand}</td>
                <td>
                  <div>{v.equipmentNo}</div>
                  <div className="cell-sub">{v.serialNo}</div>
                </td>
                <td className="text-right!">{fmtNum(v.odometerKm)}</td>
                <td className="text-right!">{fmtNum(v.machineHours)}</td>
                <td>{criteriaCell(v)}</td>
                {execHref && <td>{stageBadge(v.id)}</td>}
                {execHref && (
                  <td>
                    <div className="dt-action">
                      {/* no-underline — .tbl td a ขีดเส้นใต้ลิงก์ในตาราง แต่นี่คือปุ่มไอคอน */}
                      <Link className="btn no-underline!" href={execHref(v.id)} title="ดำเนินการ Overhaul" aria-label={`ดำเนินการ Overhaul ${v.plate}`}>
                        <span className="ms">build</span>
                      </Link>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tbl-cards">
        {vehicles.map((v) => (
          <div className="tbl-card" key={v.id}>
            {editable && (
              <div className="tbl-card-row">
                <span className="tbl-card-label">เลือกเข้าแผน</span>
                <span className="tbl-card-value">
                  <input
                    type="checkbox"
                    aria-label={`เลือก ${v.plate}`}
                    checked={!!pickOf(v.id)}
                    onChange={() => onToggle?.(v.id)}
                  />
                </span>
              </div>
            )}
            <div className="tbl-card-row">
              <span className="tbl-card-label">ทะเบียน</span>
              <span className="tbl-card-value">{v.plate}</span>
            </div>
            <div className="tbl-card-row">
              <span className="tbl-card-label">ประเภท / สังกัด</span>
              <span className="tbl-card-value">
                {v.vehicleType} · {v.orgUnit}
              </span>
            </div>
            <div className="tbl-card-row">
              <span className="tbl-card-label">อายุ</span>
              <span className="tbl-card-value">{vehicleAge(v)} ปี</span>
            </div>
            <div className="tbl-card-row">
              <span className="tbl-card-label">เครื่องมือกล</span>
              <span className="tbl-card-value">
                {v.equipmentBrand} · {v.equipmentNo} · {v.serialNo}
              </span>
            </div>
            <div className="tbl-card-row">
              <span className="tbl-card-label">ไมล์ / ชั่วโมงสะสม</span>
              <span className="tbl-card-value">
                {fmtNum(v.odometerKm)} กม. · {fmtNum(v.machineHours)} ชม.
              </span>
            </div>
            {execHref && (
              <div className="tbl-card-row">
                <span className="tbl-card-label">Overhaul</span>
                <span className="tbl-card-value">{stageBadge(v.id)}</span>
              </div>
            )}
            {pickOf(v.id) && <div className="tbl-card-foot">{criteriaCell(v)}</div>}
            {execHref && (
              <div className="tbl-card-foot">
                <Link className="btn btn-s" href={execHref(v.id)}>
                  <span className="ms">build</span> ดำเนินการ Overhaul
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
