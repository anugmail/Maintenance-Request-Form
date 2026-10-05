import type { Metadata } from "next";
import "./globals.css";
import { PlanStoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "VMS Plus — Overhaul",
  // เหมือนหน้า static ในรีโป — กันเบราว์เซอร์ขอ /favicon.ico แล้วได้ 404
  icons: { icon: "data:," },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* ฟอนต์ชุดเดียวกับหน้า static ในรีโป */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0"
          rel="stylesheet"
        />
      </head>
      <body>
        <PlanStoreProvider>
          <Shell>{children}</Shell>
        </PlanStoreProvider>
      </body>
    </html>
  );
}
