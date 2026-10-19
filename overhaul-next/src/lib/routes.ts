/* ตัวสร้างลิงก์ของทุกหน้า — หน้าอื่นลิงก์ผ่านนี้เท่านั้น (ส่งเข้า next/link หรือ router.push ซึ่งเติม basePath ให้เอง)
   static export ไม่มี dynamic segment ⇒ ใช้ query (?id= ?plan= ?po= ?car=) อ่านด้วย useSearchParams ใน <Suspense>
   trailingSlash: true ⇒ ทุก path ลงท้าย "/" */

const q = (params: Record<string, string | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") s.set(k, v);
  const t = s.toString();
  return t ? "?" + t : "";
};

/** ข้อความแจ้งผลที่หน้ารายการแผนอ่านจาก ?saved= (S1 สร้าง · S2 แก้ไข · S3 ลบ) */
export type PlanSavedFlag = "create" | "edit" | "delete";
/** PO แก้ไขแล้วกลับไปหน้าไหน */
export type PoEditFrom = "plan" | "po";

export const routes = {
  /** หน้าแรกของแอป = รายการแผน */
  home: () => "/plans/",
  /** S1–S3 รายการแผน "จัดการงาน Overhaul" */
  plans: (saved?: PlanSavedFlag) => "/plans/" + q({ saved }),
  /** S1 สร้างแผน */
  planNew: () => "/plans/new/",
  /** S2 แก้ไขแผน */
  planEdit: (id: string, from?: "detail") => "/plans/edit/" + q({ id, from }),   // from=detail ⇒ กลับ/บันทึกแล้วไปหน้ารายละเอียดแผน
  /** รายละเอียดแผน (รายการ PO · S4–S6 จุดเข้า) */
  planView: (id: string, saved?: string) => "/plans/view/" + q({ id, saved }),
  /** S4 เพิ่ม PO ในแผน */
  poNew: (planId: string) => "/po/new/" + q({ plan: planId }),
  /** S5 แก้ไข PO · from = กลับไปหน้าแผน (plan) หรือหน้า PO (po) */
  poEdit: (planId: string, poId: string, from?: PoEditFrom) => "/po/edit/" + q({ plan: planId, po: poId, from }),
  /** รายละเอียด PO (รายการรถ → งานรายคัน) */
  poView: (planId: string, poId: string, saved?: string) => "/po/view/" + q({ plan: planId, po: poId, saved }),
  /** S7–S14 งานรายคัน 6 ขั้น · po = PO ที่เข้ามา (ใช้ทำ breadcrumb) */
  job: (planId: string, carId: string, poId?: string) => "/job/" + q({ plan: planId, car: carId, po: poId }),
  /** แกลเลอรีคอมโพเนนต์ (ตรวจความตรงกับ Figma) */
  kit: () => "/kit/",
} as const;
