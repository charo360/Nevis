"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useFirebaseAuth();
  const { toast } = useToast();
  const [billingPlan, setBillingPlan] = useState<'free'|'pro'|'enterprise'>('free');
  const [loading, setLoading] = useState(false);

  // Additional UI toggles to mirror advanced settings UX (local only)
  const [isPublic, setIsPublic] = useState(false);
  const [allowInvites, setAllowInvites] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  const handleChangePlan = async (plan: typeof billingPlan) => {
    setLoading(true);
    try {
      // In a real app you'd call your billing API here
      setBillingPlan(plan);
      toast({ title: 'Plan changed', description: `Switched to ${plan}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Change failed', description: String(err) });
    } finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign out failed', description: String(err) });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription, security and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Current subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{billingPlan.toUpperCase()}</div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant={billingPlan === 'free' ? 'default' : 'outline'} onClick={() => handleChangePlan('free')}>Free</Button>
              <Button variant={billingPlan === 'pro' ? 'default' : 'outline'} onClick={() => handleChangePlan('pro')}>Pro</Button>
              <Button variant={billingPlan === 'enterprise' ? 'default' : 'outline'} onClick={() => handleChangePlan('enterprise')}>Enterprise</Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Control who can see your profile and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-700">Profile visibility</h3>
                  <p className="text-sm text-gray-600 mt-1">Make your profile discoverable by others.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">Private</div>
                  <Switch checked={isPublic} onCheckedChange={(v) => setIsPublic(Boolean(v))} className="" />
                  <div className="text-sm text-gray-500">Public</div>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg border ${isPublic ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <div className="flex items-start gap-3">
                  <Info className={`${isPublic ? 'text-blue-600' : 'text-gray-600'} h-5 w-5`} />
                  <div className="text-sm">
                    {isPublic ? (
                      <><span className="font-medium">Public profile:</span> Your profile will be visible to everyone.</>
                    ) : (
                      <><span className="font-medium">Private profile:</span> Only people you approve will see your profile.</>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invites & Approval</CardTitle>
              <CardDescription>Control how members join and invite others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Allow invitations</p>
                    <p className="text-sm text-gray-600">Allow members to invite others to join.</p>
                  </div>
                  <Switch checked={allowInvites} onCheckedChange={(v) => setAllowInvites(Boolean(v))} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Require approval</p>
                    <p className="text-sm text-gray-600">Require admin approval for new members.</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={(v) => setRequireApproval(Boolean(v))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently remove your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-700">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">This will permanently delete your account and all data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut}>Sign out instead</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
