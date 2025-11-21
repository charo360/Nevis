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
  Coins,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { CrevoLogo } from "@/components/ui/crevo-logo";
import { UnifiedBrandSelector } from '@/components/brand/unified-brand-selector';
import { usePathname } from "next/navigation";
import { CreditsIndicator } from "@/components/pricing/CreditsDisplay";
import { CreditDisplay } from "@/components/ui/credit-display";
import { useAuth } from "@/hooks/use-auth-supabase";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { state, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => pathname.startsWith(path);
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center w-full">
          <Link href="/" className="flex items-center justify-center w-full">
            {!isCollapsed ? (
              <img
                src="https://i.imgur.com/ExFP5l5.png"
                alt="Crevo Logo"
                className="h-10 w-auto flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
          </Link>
          
          {/* Mobile close button */}
          {isMobile && openMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="p-2 rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 flex-shrink-0 ml-2"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 flex-shrink-0 ml-2 group"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
              ) : (
                <PanelLeftClose className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
            </button>
          )}
        </div>

        {/* Unified Brand Selector - Hide when collapsed */}
        {!isCollapsed && (
          <div className="px-2 py-2">
            <UnifiedBrandSelector />
          </div>
        )}

        {/* Credit Display
        <div className="px-2 pb-2">
          <CreditDisplay variant="sidebar" />
        </div> */}
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
              isActive={isActive("/credits")}
              tooltip="Credit Management"
            >
              <Link href="/credits">
                <Coins />
                <span>Credit Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>


          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {user?.email && !isCollapsed && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <SidebarMenuButton
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 transition-colors w-full justify-start"
                tooltip="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && <span>Sign Out</span>}
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
