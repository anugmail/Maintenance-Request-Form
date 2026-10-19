import path from "node:path";
import type { NextConfig } from "next";

/* ส่งออกเป็นไฟล์ static (GitHub Pages) — ไม่มีเซิร์ฟเวอร์
   basePath มาจาก env ตอน build: NEXT_PUBLIC_BASE_PATH=/Maintenance-Request-Form/overhaul-v2-app
   ลิงก์ทุกอันต้องผ่าน next/link หรือ router (เติม basePath ให้เอง) · URL ไฟล์ดิบใช้ asset() ใน src/lib/basePath.ts */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // มี package-lock.json อีกไฟล์ที่ home — ตรึง root ไว้ที่โฟลเดอร์นี้ (ไม่ให้ Turbopack เดา workspace ผิด)
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
