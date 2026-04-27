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
        <main className="relative flex-1 overflow-auto p-4 md:p-6">
          {/* Futuristic library-themed background (same as login) */}
          <div
            className="absolute inset-0 -z-10"
            aria-hidden
          >
            <div className="absolute inset-0 login-futuristic-bg" />
            <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full opacity-20 blur-3xl login-futuristic-orb-1" />
            <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl login-futuristic-orb-2" />
            <div className="absolute inset-0 opacity-[0.12] login-futuristic-grid" />
            <div className="absolute inset-0 pointer-events-none login-futuristic-vignette" />
          </div>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
      <Chatbot />
    </SidebarProvider>
  );
}
