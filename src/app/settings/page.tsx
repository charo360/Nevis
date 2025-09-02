"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { userService } from '@/lib/firebase/database';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useFirebaseAuth();
  const { toast } = useToast();
  const [billingPlan, setBillingPlan] = useState<'free'|'starter'|'growth'|'pro'|'power'>('free');
  const [loading, setLoading] = useState(false);

  // Load user's current subscription from Firestore (client SDK)
  React.useEffect(() => {
    let mounted = true;
    async function loadUserPlan() {
      try {
        if (!user) return;
        // userService.getById expects the document id (uid)
        const doc = await userService.getById(user.uid);
        if (!mounted || !doc) return;

        // subscription.plan may be stored under subscription.plan or plan
        const planFromDoc = (doc as any)?.subscription?.plan || (doc as any)?.plan || null;
        if (planFromDoc && ['free', 'starter', 'growth', 'pro', 'power'].includes(planFromDoc)) {
          setBillingPlan(planFromDoc as typeof billingPlan);
        } else if (planFromDoc && planFromDoc === 'enterprise') {
          // map legacy 'enterprise' to 'power'
          setBillingPlan('power');
        }
      } catch (err) {
      }
    }

    loadUserPlan();
    return () => { mounted = false; };
  }, [user]);

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
              <Button variant={billingPlan === 'starter' ? 'default' : 'outline'} onClick={() => handleChangePlan('starter')}>Starter</Button>
              <Button variant={billingPlan === 'growth' ? 'default' : 'outline'} onClick={() => handleChangePlan('growth')}>Growth</Button>
              <Button variant={billingPlan === 'pro' ? 'default' : 'outline'} onClick={() => handleChangePlan('pro')}>Pro</Button>
              <Button variant={billingPlan === 'power' ? 'default' : 'outline'} onClick={() => handleChangePlan('power')}>Power</Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Pricing overview and plans - shows details for currently selected plan */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Simple, credit-based pricing — credits never expire.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="font-medium">Credits & Models</h3>
                <p className="text-sm text-gray-600">Choose the AI quality that fits your needs. Credits never expire and there's no monthly commitment for one-time packs.</p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 border rounded">
                    <div className="font-semibold">Revo 1.0</div>
                    <div className="text-sm text-gray-600">Basic AI</div>
                    <div className="mt-2 text-lg font-bold">1 credit</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-semibold">Revo 1.5</div>
                    <div className="text-sm text-gray-600">Enhanced AI</div>
                    <div className="mt-2 text-lg font-bold">1.5 credits</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="font-semibold">Revo 2.0</div>
                    <div className="text-sm text-gray-600">Premium AI</div>
                    <div className="mt-2 text-lg font-bold">2 credits</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium">Selected Plan</h4>
                <div className="mt-4">
                  {/* Render only currently selected plan details */}
                  {billingPlan === 'free' && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Free Plan</div>
                          <div className="text-sm text-gray-500">Perfect for trying out Crevo AI</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$0</div>
                          <div className="text-sm text-gray-500">10 credits (one-time)</div>
                        </div>
                      </div>
                      <ul className="mt-3 text-sm space-y-1 text-gray-600">
                        <li>Basic AI generation</li>
                        <li>Manual approval</li>
                        <li>Limited support</li>
                        <li>Images include watermark</li>
                      </ul>
                      <div className="mt-4">
                        <Button onClick={() => handleChangePlan('free')} className="w-full">Selected</Button>
                      </div>
                    </div>
                  )}

                  {billingPlan === 'starter' && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Starter Pack</div>
                          <div className="text-sm text-gray-500">Ideal for occasional users</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$10</div>
                          <div className="text-sm text-gray-500">50 credits • $0.20/credit</div>
                        </div>
                      </div>
                      <ul className="mt-3 text-sm space-y-1 text-gray-600">
                        <li>HD image generation</li>
                        <li>No watermark on images</li>
                        <li>Basic templates</li>
                        <li>Email support</li>
                      </ul>
                      <div className="mt-4">
                        <Button onClick={() => handleChangePlan('starter')} className="w-full">Selected</Button>
                      </div>
                    </div>
                  )}

                  {billingPlan === 'growth' && (
                    <div className="border rounded-lg p-4 ring-2 ring-indigo-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Growth Pack</div>
                          <div className="text-sm text-gray-500">Most popular for growing businesses</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$29</div>
                          <div className="text-sm text-gray-500">150 credits • $0.19/credit</div>
                        </div>
                      </div>
                      <ul className="mt-3 text-sm space-y-1 text-gray-600">
                        <li>Priority generation speed</li>
                        <li>Advanced AI models</li>
                        <li>Brand consistency tools</li>
                        <li>Priority support</li>
                      </ul>
                      <div className="mt-4">
                        <Button onClick={() => handleChangePlan('growth')} className="w-full">Selected</Button>
                      </div>
                    </div>
                  )}

                  {billingPlan === 'pro' && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Pro Pack</div>
                          <div className="text-sm text-gray-500">For professional creators</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$49</div>
                          <div className="text-sm text-gray-500">250 credits • $0.196/credit</div>
                        </div>
                      </div>
                      <ul className="mt-3 text-sm space-y-1 text-gray-600">
                        <li>Early access to new features</li>
                        <li>Advanced customization</li>
                        <li>Bulk generation</li>
                        <li>API access</li>
                      </ul>
                      <div className="mt-4">
                        <Button onClick={() => handleChangePlan('pro')} className="w-full">Selected</Button>
                      </div>
                    </div>
                  )}

                  {billingPlan === 'power' && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">Power Users</div>
                          <div className="text-sm text-gray-500">For agencies & power users</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$99</div>
                          <div className="text-sm text-gray-500">550 credits • $0.18/credit</div>
                        </div>
                      </div>
                      <ul className="mt-3 text-sm space-y-1 text-gray-600">
                        <li>Dedicated support + Custom styles</li>
                        <li>White-label options</li>
                        <li>Team collaboration</li>
                        <li>Custom integrations</li>
                      </ul>
                      <div className="mt-4">
                        <Button onClick={() => handleChangePlan('power')} className="w-full">Selected</Button>
                      </div>
                    </div>
                  )}
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
