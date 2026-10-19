"use client";
/* Figma: `Page header` + `Empty state/Data empty` — โครงหน้าชั่วคราวของแต่ละ route — PageHeader + "กำลังสร้าง" (EmptyState) · เอเจนต์ที่ทำหน้าจริงลบไฟล์นี้ออกจากหน้าได้เลย */
import type { ReactNode } from "react";
import { EmptyState, PageHeader, type Crumb } from "@/components/ui";

export function PageStub({ title, crumbs, backHref, scenarios, children }: { title: string; crumbs: Crumb[]; backHref?: string; scenarios: string; children?: ReactNode }) {
  return (
    <>
      <PageHeader title={title} crumbs={crumbs} backHref={backHref} />
      <EmptyState icon="construction" title="กำลังสร้าง" description={`หน้านี้ครอบ ${scenarios} — โครง route พร้อมแล้ว รอประกอบหน้าจริง`} />
      {children}
    </>
  );
}
