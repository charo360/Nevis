"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  LayoutDashboard,
  Settings2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => path === pathname;

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-primary-foreground font-headline">
            LocalBuzz
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/dashboard")}
              tooltip="Dashboard"
            >
              <Link href="#">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/calendar")}
              tooltip="Content Calendar"
            >
              <Link href="#">
                <CalendarDays />
                <span>Content Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/brand")}
              tooltip="Brand Profile"
            >
              <Link href="#">
                <Sparkles />
                <span>Brand Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="Settings"
            >
              <Link href="#">
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
