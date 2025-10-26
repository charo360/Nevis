"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth-supabase";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import {
  Loader2,
  User,
  Shield,
  Bell,
  Database,
  Trash2,
  Mail,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    setName(user?.displayName || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ displayName: name });
      toast({ 
        title: "Profile updated", 
        description: "Your account information has been successfully updated." 
      });
      } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Update failed", 
        description: String(err) 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match."
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    setLoading(true);
    try {
      // Add your password change API call here
      toast({ 
        title: "Password updated", 
        description: "Your password has been successfully changed." 
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Password change failed", 
        description: String(err) 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion."
      });
      return;
    }

    if (!deleteReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please provide a reason for deleting your account."
      });
      return;
    }

    setLoading(true);
    try {
      // Add your account deletion API call here
      // Include the deleteReason in the API call for feedback
      toast({ 
        title: "Account deleted", 
        description: "Your account has been permanently deleted. We're sorry to see you go." 
      });
      
      // Clear the form
      setDeleteConfirmText("");
      setDeleteReason("");
      
      // Sign out and redirect
      await signOut();
      router.push("/");
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Deletion failed", 
        description: String(err) 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SidebarInset fullWidth>
        <div className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-[300px]" />
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset fullWidth>
      <MobileSidebarTrigger />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          {/* Profile Card - Sidebar */}
          <aside className="md:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24 border-4 border-primary/10">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1 w-full">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {user.displayName || "User"}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <Badge variant="secondary" className="mt-2">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <Separator />

                  <div className="w-full space-y-2 text-sm text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account Type:</span>
                      <span className="text-gray-900 font-medium">
                        {user.isAnonymous ? "Demo" : "Standard"}
                      </span>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your account details and personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="h-11"
                            disabled
                          />
                          <p className="text-xs text-gray-500">
                            Email cannot be changed for security reasons
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setName(user?.displayName || "");
                            setEmail(user?.email || "");
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || (name === user?.displayName && email === user?.email)}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Keep your account secure by using a strong password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-11"
                          />
                          <p className="text-xs text-gray-500">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Account Data
                    </CardTitle>
                    <CardDescription>
                      View and manage your account data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Display Name</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {user.displayName || "Not set"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Account Type</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {user.isAnonymous ? "Demo Account" : "Standard Account"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Account Status</p>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Active & Verified
                        </p>
                </div>
              </div>
            </CardContent>
          </Card>

                {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible actions that will permanently affect your account
                    </CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                            <h4 className="font-semibold text-gray-900">Delete Account</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Once deleted, all your data will be permanently removed. This action cannot be undone.
                            </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="shrink-0">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                              </Button>
                  </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                  <Trash2 className="w-5 h-5" />
                                  Delete Account Permanently?
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                  <div className="text-left space-y-2 pt-2 text-sm text-muted-foreground">
                                    <div className="font-semibold text-gray-900">
                                      This will permanently delete your account and remove all associated data.
                                    </div>
                                    <div>This action cannot be undone. All your:</div>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                      <li>Profile information</li>
                                      <li>Brand data and content</li>
                                      <li>Generated posts and designs</li>
                                      <li>Credits and purchase history</li>
                                    </ul>
                                    <div className="text-sm text-gray-600 pt-2">
                                      will be permanently removed from our servers.
                                    </div>
                                  </div>
                                </AlertDialogDescription>
                    </AlertDialogHeader>

                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="delete-reason" className="text-sm font-semibold">
                                    Why are you leaving? (Required)
                                  </Label>
                                  <textarea
                                    id="delete-reason"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Please tell us why you're deleting your account..."
                                    className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Your feedback helps us improve our service
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="confirm-delete" className="text-sm font-semibold">
                                    Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                                  </Label>
                                  <Input
                                    id="confirm-delete"
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    className="font-mono"
                                  />
                                </div>
                              </div>

                              <AlertDialogFooter className="mt-6">
                                <AlertDialogCancel 
                                  onClick={() => {
                                    setDeleteConfirmText("");
                                    setDeleteReason("");
                                  }}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                  disabled={deleteConfirmText !== "DELETE" || !deleteReason.trim() || loading}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Delete Account Permanently
                                </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarInset>
  );
}

