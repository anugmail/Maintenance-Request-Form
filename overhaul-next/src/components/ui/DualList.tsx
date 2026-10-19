"use client";
/** Figma: `List with checkbox` × 2 = `List header item` (หัวข้อ + `Badge outline` นับ + `Checkbox` เลือกทั้งหมด/Indeterminate)
 *  + `List with checkbox item` (Avatar=ปิด) · ช่องค้นหา `Text input` · ปุ่มย้ายกลาง `Secondary button` sm
 *  + `Contract vehicle list` ของ UI Release#2 (5.1)
 *  ค่าเทียบ components.css .dual .dual-mid .lchk .lchk-hd .lchk-body .lchk-item(.sel) .lchk-tx .lchk-empty
 *  ⚠ เจ้าของงานจะออกแบบตัวเลือกรถ ("เลือกรถ") ใหม่ — ตัวนี้ทำแค่ให้ใช้งานได้ ยังไม่ขัดเกลา (19 ต.ค. 2569) */
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { SearchInput } from "./SearchInput";
import { cx } from "./cx";

export interface DualListItem {
  id: string;
  label: string;
  /** บรรทัดรอง คั่นด้วยขีดสั้น เช่น ["HINO FM2P · รถเครน", "เลขไมล์ 182,400 กม.", "อายุ 12 ปี"] */
  details?: string[];
}

export interface DualListProps {
  items: DualListItem[];
  /** id ที่เลือกแล้ว (ฝั่งขวา) */
  value: string[];
  onChange: (ids: string[]) => void;
  leftTitle?: string;
  rightTitle?: string;
  searchPlaceholder?: string;
  error?: ReactNode;
  className?: string;
}

function Box({ title, list, tick, setTick, empty }: { title: string; list: DualListItem[]; tick: Set<string>; setTick: (s: Set<string>) => void; empty: string }) {
  const n = list.filter((v) => tick.has(v.id)).length;
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="flex min-h-10 items-center gap-4 rounded-xs bg-gray-200 px-4">
        <b className="flex min-w-0 flex-1 items-center gap-3 text-md font-semibold text-black">
          {title} <Badge square>{list.length}</Badge>
        </b>
        <Checkbox
          aria-label="เลือกทั้งหมด"
          checked={!!list.length && n === list.length}
          indeterminate={n > 0 && n < list.length}
          disabled={!list.length}
          onChange={(c) => setTick(new Set(c ? list.map((v) => v.id) : []))}
        />
      </div>
      <div className="max-h-[348px] overflow-y-auto">
        {list.length ? (
          list.map((v) => {
            const on = tick.has(v.id);
            return (
              <div key={v.id} className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-2 hover:bg-gray-50">
                <span className="flex min-w-0 flex-1 flex-col">
                  <b className={cx("text-md font-normal", on ? "text-brand-900" : "text-black")}>{v.label}</b>
                  {v.details && (
                    <small className="flex flex-wrap items-center gap-1 text-xs text-gray-600">
                      {v.details.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          {i > 0 && <i aria-hidden className="inline-block h-px w-2 bg-gray-300" />}
                          {d}
                        </span>
                      ))}
                    </small>
                  )}
                </span>
                <Checkbox
                  aria-label={"เลือก " + v.label}
                  checked={on}
                  onChange={(c) => {
                    const s = new Set(tick);
                    if (c) s.add(v.id);
                    else s.delete(v.id);
                    setTick(s);
                  }}
                />
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">{empty}</div>
        )}
      </div>
    </div>
  );
}

export function DualList({
  items, value, onChange, leftTitle = "รายการรถทั้งหมด", rightTitle = "เลือกแล้ว", searchPlaceholder = "ค้นหาทะเบียน, รุ่น/ยี่ห้อ", error, className,
}: DualListProps) {
  const [q, setQ] = useState("");
  const [tl, setTl] = useState<Set<string>>(new Set());
  const [tr, setTr] = useState<Set<string>>(new Set());
  const sel = useMemo(() => new Set(value), [value]);
  const qq = q.trim().toLowerCase();
  const left = items.filter((v) => !sel.has(v.id) && (!qq || [v.label, ...(v.details ?? [])].some((x) => x.toLowerCase().includes(qq))));
  const right = items.filter((v) => sel.has(v.id));

  return (
    <div className={className}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-3">
          <SearchInput value={q} onChange={setQ} placeholder={searchPlaceholder} aria-label="ค้นหารถ" className="w-full" />
          <Box title={leftTitle} list={left} tick={tl} setTick={setTl} empty={qq ? "ไม่พบรถที่ตรงกับคำค้น" : "เลือกครบทุกคันแล้ว"} />
        </div>
        <div className="flex flex-col gap-3 self-center max-[900px]:flex-row max-[900px]:justify-center">
          <Button
            variant="secondary"
            size="sm"
            iconRight="chevron_right"
            disabled={!tl.size}
            onClick={() => {
              onChange([...value, ...items.filter((v) => tl.has(v.id) && !sel.has(v.id)).map((v) => v.id)]);
              setTl(new Set());
            }}
          >
            เพิ่ม
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft="chevron_left"
            disabled={!tr.size}
            onClick={() => {
              onChange(value.filter((id) => !tr.has(id)));
              setTr(new Set());
            }}
          >
            นำออก
          </Button>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="hidden h-10 min-[901px]:block" />
          <Box title={rightTitle} list={right} tick={tr} setTick={setTr} empty="ยังไม่ได้เลือกรถ" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-error-600" role="alert">{error}</p>}
    </div>
  );
}
