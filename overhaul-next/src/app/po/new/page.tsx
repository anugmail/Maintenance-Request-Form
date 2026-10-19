"use client";
/* S4 เพิ่ม Purchase Order (?plan=) — HTML ต้นทาง design-mock/overhaul-v2-04-po-form.html?plan=
   เนื้อหาอยู่ใน src/components/po/PoForm.tsx */
import { Suspense } from "react";
import { PoForm } from "@/components/po/PoForm";

export default function PoNewPage() {
  return (
    <Suspense>
      <PoForm mode="new" />
    </Suspense>
  );
}
