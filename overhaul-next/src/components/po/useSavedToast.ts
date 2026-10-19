"use client";
/* Figma: `Notification` Type=Success (ผ่าน useToast) — ตัวช่วยของหน้ารายละเอียดแผน / รายละเอียด PO
   อ่าน ?saved=<flag> ที่หน้าก่อนส่งมา → แจ้งผลครั้งเดียว แล้วล้าง query ออกจาก URL (เทียบ history.replaceState ของ HTML mock)
   ไม่ใช่ component ไลบรารี — เป็น hook ของหน้า */
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui";

/** ข้อความตามตัวอักษรของ HTML mock (overhaul-v2-03-plan-detail.html · overhaul-v2-05-po-detail.html) */
export function useSavedToast(saved: string | null, messages: Record<string, string>, fallback: string, cleanUrl: string) {
  const toast = useToast();
  const router = useRouter();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!saved || done.current === saved) return;
    done.current = saved;
    toast.success(messages[saved] ?? fallback);
    router.replace(cleanUrl, { scroll: false });
  }, [saved, messages, fallback, cleanUrl, toast, router]);
}
