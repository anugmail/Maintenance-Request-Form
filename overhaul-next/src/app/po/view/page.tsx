"use client";
/* รายละเอียด Purchase Order (?plan=&po=) — รายการรถ → หน้างาน · S5 (ทางที่ 2) · S6 ลบ PO — HTML ต้นทาง design-mock/overhaul-v2-05-po-detail.html
   เนื้อหาอยู่ใน src/components/po/PoDetail.tsx */
import { Suspense } from "react";
import { PoDetail } from "@/components/po/PoDetail";

export default function PoViewPage() {
  return (
    <Suspense>
      <PoDetail />
    </Suspense>
  );
}
