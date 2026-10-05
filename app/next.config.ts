import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้ Turbopack อ่านไฟล์นอกโฟลเดอร์ app/ ได้ — globals.css import
  // ../design-system/*.css ตรงๆ (แหล่งเดียวกับหน้า static ไม่ก๊อปซ้ำ)
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
