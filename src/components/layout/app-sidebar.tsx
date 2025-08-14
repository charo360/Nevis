// src/components/layout/app-sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Sparkles,
  Link as LinkIcon,
  Wand,
  Settings,
  Zap,
  Calendar,
  Archive,
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

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

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
              isActive={isActive("/brand-profile")}
              tooltip="Brand Profile"
            >
              <Link href="/brand-profile">
                <Sparkles />
                <span>Brand Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/quick-content")}
              tooltip="Quick Content"
            >
              <Link href="/quick-content">
                <Zap />
                <span>Quick Content</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/artifacts")}
              tooltip="Artifacts"
            >
              <Link href="/artifacts">
                <Archive />
                <span>Artifacts</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/content-calendar")}
              tooltip="Content Calendar"
            >
              <Link href="/content-calendar">
                <Calendar />
                <span>Content Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/creative-studio")}
              tooltip="Creative Studio"
            >
              <Link href="/creative-studio">
                <Wand />
                <span>Creative Studio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/social-connect")}
              tooltip="Social Media Connect"
            >
              <Link href="/social-connect">
                <LinkIcon />
                <span>Social Media Connect</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  );
}
