// src/app/creative-studio/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { BrandProfile, Message } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatLayout } from "@/components/studio/chat-layout";
import { getBrandProfileAction } from "@/app/actions";
import { useAuth } from "@/context/auth-context";
import withAuth from "@/context/with-auth";

function CreativeStudioPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            const profile = await getBrandProfileAction(user.uid);
            if (profile) {
                setBrandProfile(profile);
            }
        };
        fetchProfile();
    }, [user]);

  return (
    <SidebarInset>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-[60px] lg:px-6">
         <div />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src="https://placehold.co/40x40.png"
                    alt="User"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </header>
       <main className="flex-1 overflow-auto">
          <ChatLayout
              brandProfile={brandProfile}
              messages={messages}
              input={input}
              setInput={setInput}
              setMessages={setMessages}
            />
      </main>
    </SidebarInset>
  );
}


export default withAuth(CreativeStudioPage);
