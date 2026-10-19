"use client";
/* S5 แก้ไข Purchase Order (?plan=&po=&from=plan|po) — HTML ต้นทาง design-mock/overhaul-v2-04-po-form.html?plan=&po=
   เนื้อหาอยู่ใน src/components/po/PoForm.tsx */
import { Suspense } from "react";
import { PoForm } from "@/components/po/PoForm";

export default function PoEditPage() {
  return (
    <Suspense>
      <PoForm mode="edit" />
    </Suspense>
  );
}
