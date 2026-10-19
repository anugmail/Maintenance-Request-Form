"use client";
/* "/" → "/plans/" (static export ไม่มี redirect ฝั่งเซิร์ฟเวอร์ ⇒ replace บน client) */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/lib/routes";

export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace(routes.home()), [router]);
  return (
    <p className="text-sm text-gray-600">
      กำลังไปหน้า <Link href={routes.home()} className="text-brand-900 underline">จัดการงาน Overhaul</Link>
    </p>
  );
}
