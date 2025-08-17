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
  LayoutDashboard,
  Building2,
  Palette,
} from "lucide-react";
import { UnifiedBrandSelector } from '@/components/brand/unified-brand-selector';
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
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground font-headline">
            Crevo
          </h1>
        </Link>

        {/* Unified Brand Selector */}
        <div className="px-2 py-2">
          <UnifiedBrandSelector />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/dashboard")}
              tooltip="Dashboard"
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/brands")}
              tooltip="Manage Brands"
            >
              <Link href="/brands">
                <Building2 />
                <span>Manage Brands</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

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
              isActive={isActive("/creative-studio")}
              tooltip="Creative Studio"
            >
              <Link href="/creative-studio">
                <Palette />
                <span>Creative Studio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/artifacts-brand-scoped")}
              tooltip="Artifacts"
            >
              <Link href="/artifacts-brand-scoped">
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
