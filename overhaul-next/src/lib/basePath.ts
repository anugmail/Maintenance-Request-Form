/* basePath ตอน build (GitHub Pages: /Maintenance-Request-Form/overhaul-v2-app)
   next/link และ router เติมให้เองแล้ว — ใช้ asset() เฉพาะ URL ดิบ (<img src> · <a href> ไปไฟล์ · fetch) */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** asset("/sample.pdf") → "/Maintenance-Request-Form/overhaul-v2-app/sample.pdf" */
export function asset(path: string): string {
  return BASE_PATH + (path.startsWith("/") ? path : "/" + path);
}
