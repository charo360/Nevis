"use client";

import React from "react";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function DesktopSidebarTrigger() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  
  // Only show on desktop when sidebar is collapsed
  if (isMobile || state !== "collapsed") return null;

  return (
    <button
      onClick={() => {
        console.log('Desktop trigger clicked');
        toggleSidebar();
      }}
      className="fixed top-4 left-4 z-[9999] p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-200 hidden md:block"
      title="Open sidebar"
      aria-label="Open sidebar"
      type="button"
    >
      <PanelLeft className="h-5 w-5 text-gray-700" />
    </button>
  );
}

