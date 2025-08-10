// src/components/layout/app-sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Settings2,
  Sparkles,
  Link as LinkIcon,
  Wand,
  LogOut,
  User,
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
import { useAuth } from "@/context/auth-context";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
        {user && (
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
                isActive={isActive("/content-calendar")}
                tooltip="Quick Content"
              >
                <Link href="/content-calendar">
                  <CalendarDays />
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
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={logout}
                tooltip="Logout"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/login")}
                tooltip="Login"
              >
                <Link href="/login">
                  <User />
                  <span>Login</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
