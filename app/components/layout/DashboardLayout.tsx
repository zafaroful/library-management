"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { Chatbot } from "@/app/components/chatbot/Chatbot";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
      {/* <Chatbot /> */}
    </SidebarProvider>
  );
}
