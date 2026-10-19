"use client";
/** แถบ "Prototype (Mock)" — ของต้นแบบเท่านั้น ไม่มีในไลบรารี (component map ข้อ 3: "ไม่ใส่" ใน Figma)
 *  ค่าเทียบ components.css .draft (พื้น warning-50 · เส้นล่าง warning-200 · ตัวอักษร warning-800 12 · pad 6/16)
 *  มีช่อง "จำลองบันทึกไม่สำเร็จ" (store.simulateFailure — บันทึกทุกจุดคืน general error) + ปุ่มรีเซ็ตข้อมูลจำลอง + ลิงก์แกลเลอรีคอมโพเนนต์ */
import Link from "next/link";
import { useMockStore } from "@/lib/mock/store";
import { routes } from "@/lib/routes";
import { Icon } from "./Icon";
import { useToast } from "./Toast";

export function DraftBanner() {
  const store = useMockStore();
  const toast = useToast();
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning-200 bg-warning-50 px-4 py-1.5 text-xs text-warning-800">
      <span className="mr-auto">Prototype (Mock) · ข้อมูลจำลองทั้งหมด</span>
      <Link href={routes.kit()} className="text-warning-800 underline">ชุดคอมโพเนนต์</Link>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="size-4 accent-brand-900"
          checked={store.simulateFailure}
          disabled={!store.ready}
          onChange={(e) => store.setSimulateFailure(e.target.checked)}
        />
        จำลองบันทึกไม่สำเร็จ
      </label>
      {/* ปุ่มแบบ .btn-t.btn-sm แต่ใช้สีของแถบ draft */}
      <button
        type="button"
        disabled={!store.ready}
        onClick={() => {
          store.resetAll();
          toast.success("รีเซ็ตข้อมูลจำลองแล้ว");
        }}
        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 font-semibold hover:bg-warning-200/50 focus-visible:shadow-ring focus-visible:outline-none disabled:cursor-not-allowed"
      >
        <Icon name="restart_alt" size={16} />
        รีเซ็ตข้อมูลจำลอง
      </button>
    </div>
  );
}
