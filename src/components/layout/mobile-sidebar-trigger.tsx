"use client";

import React from "react";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileSidebarTrigger() {
  const { setOpenMobile } = useSidebar();

  return (
    <button
      onClick={() => {
        console.log('Mobile trigger clicked');
        setOpenMobile(true);
      }}
      className="fixed top-4 left-4 z-[9999] p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 md:hidden"
      aria-label="Open menu"
      type="button"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}


