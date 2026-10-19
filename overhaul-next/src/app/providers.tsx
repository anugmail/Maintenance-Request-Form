"use client";
/* ผู้ให้บริการระดับแอป: ข้อมูลจำลอง (localStorage oh2-next-v1) + Notification toast + โครงหน้า */
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";
import { ToastProvider } from "@/components/ui";
import { MockStoreProvider } from "@/lib/mock/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MockStoreProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </MockStoreProvider>
  );
}
