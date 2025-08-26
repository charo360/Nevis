"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  deleteUser as fbDeleteUser,
} from "firebase/auth";
import { userService } from "@/lib/firebase/database";
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
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUserProfile } = useFirebaseAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPasswordForDelete, setConfirmPasswordForDelete] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    setName(user?.displayName || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({ displayName: name });
      toast({ title: "Profile updated", description: "Your display name was updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update failed", description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-5 w-[200px]" />
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        <p className="text-gray-500 mt-1 text-base">Manage your personal information and security settings.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-72 shrink-0">
          <Card className="rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{user.displayName || "User"}</h2>
                  <p className="text-sm opacity-90">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-1">
              {[
                { key: "profile", label: "Profile Information" },
                { key: "security", label: "Security" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                    activeTab === key
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {activeTab === "profile" && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your name and email address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="mt-2" />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-4">
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
                    <Button type="submit" disabled={loading || (name === user?.displayName && email === user?.email)}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Keep your account secure by updating your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={() => {}} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="mt-2" />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading || !currentPassword || !newPassword}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-destructive/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Deleting your account is permanent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h4 className="font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Once deleted, your data cannot be recovered. Please be certain.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="confirm-delete">Enter your password to confirm</Label>
                          <Input id="confirm-delete" type="password" value={confirmPasswordForDelete} onChange={(e) => setConfirmPasswordForDelete(e.target.value)} placeholder="Your password" className="mt-2" />
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {}} disabled={!confirmPasswordForDelete} className="bg-destructive hover:bg-destructive/90">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
