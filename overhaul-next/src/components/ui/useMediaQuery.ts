"use client";
/* breakpoint มือถือ (เจ้าของงานเคาะ 19 ต.ค. 2569): จอ < 768 ใช้ layout มือถือ = ต่ำกว่า md ของ Tailwind
   ใช้เฉพาะจุดที่ต้องสลับ "โครง" ด้วย JS (Modal → Bottom sheet · เมนู "…" → Bottom sheet)
   นอกนั้นสลับด้วย utility md: ล้วน · SSR/prerender คืน false (desktop) แล้วอัปเดตหลัง mount */
import { useEffect, useState } from "react";

export const MOBILE_QUERY = "(max-width: 767.98px)";

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** true เมื่อจอ < 768 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
