import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
export default function BusinessManagerLayout({
  children
}) {
  return <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Sleek Dark Indigo Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>;
}