// src/app/social-connect/page.tsx
"use client";

// NOTE: Original Social Connect implementation has been intentionally disabled
// and replaced with a professional Coming Soon page as requested.

import React from "react";
import { Sparkles, Hourglass, Shield, LinkIcon, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { DesktopSidebarTrigger } from "@/components/layout/desktop-sidebar-trigger";
import Link from "next/link";

export default function SocialConnectComingSoon() {
  return (
    <SidebarInset fullWidth>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="w-full h-full">
          <div className="flex-1 p-6 w-full px-4">
            <div className="mx-auto max-w-4xl">
              <header className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Social Connect</h1>
                  <p className="text-gray-600">Securely connect your social accounts for seamless publishing</p>
                </div>
              </header>

              <Card className="border border-indigo-100 shadow-sm">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-medium">
                        <Hourglass className="w-4 h-4" />
                        Coming Soon
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                        Streamlined social publishing is on the way
                      </h2>
                      <p className="mt-2 text-gray-600">
                        We’re finalizing our secure integrations for Twitter/X, Facebook and LinkedIn.
                        You’ll be able to connect accounts, schedule content, and post automatically
                        — all from one place.
                      </p>

                      <ul className="mt-6 space-y-3">
                        <li className="flex items-start gap-3 text-gray-700">
                          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                          One-click connect for supported platforms
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                          OAuth 2.0 with encrypted token storage
                        </li>
                        <li className="flex items-start gap-3 text-gray-700">
                          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
                          Post instantly or schedule from your dashboard
                        </li>
                      </ul>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/dashboard">
                          <Button variant="outline" className="gap-2 hover:text-black">
                            <ArrowLeft className="w-4 h-4" />
                            Back to dashboard
                          </Button>
                        </Link>
                        <Link href="/pricing">
                          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            View pricing
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-sm font-medium">Twitter / X</div>
                            <div className="mt-1 inline-flex rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-xs">
                              Coming soon
                            </div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-sm font-medium">Facebook</div>
                            <div className="mt-1 inline-flex rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-xs">
                              Coming soon
                            </div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-sm font-medium">LinkedIn</div>
                            <div className="mt-1 inline-flex rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-xs">
                              Coming soon
                            </div>
                          </div>
                          <div className="rounded-lg border p-4 text-center">
                            <div className="text-sm font-medium">Instagram</div>
                            <div className="mt-1 inline-flex rounded-full bg-yellow-50 text-yellow-800 px-2 py-0.5 text-xs">
                              Researching API
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="mt-6 text-sm text-gray-500">
                Need help or early access? Contact support and we’ll get you set up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
