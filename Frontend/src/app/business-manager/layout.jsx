import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PackManagerTabs } from "@/components/layout/PackManagerTabs";

export default function BusinessManagerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#2E6BE6] p-3 md:p-5 lg:p-7">
      {/* Floating white dashboard card (Goodle Drive style) */}
      <div className="mx-auto max-w-[1680px] h-[calc(100vh-1.5rem)] md:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3.5rem)] rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-blue-950/40 flex flex-col">
        {/* Full-width white topbar with brand + search */}
        <Topbar />

        <div className="flex flex-1 min-h-0">
          {/* Blue sidebar */}
          <Sidebar />

          {/* Light blue content zone */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F4F7FE]">
            <PackManagerTabs />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
