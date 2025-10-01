'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Zap,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useToast } from '@/hooks/use-toast';
import { useBrandActions } from '@/contexts/unified-brand-context';
import { useEffect } from 'react';

export default function AuthPage() {
  const router = useRouter();
  // Temporarily commenting out Google OAuth
  // const { signIn, signUp, signInWithGoogle, signOut, loading, user } = useAuth();
  const { signIn, signUp, signOut, loading, user } = useAuth();
  const { toast } = useToast();
  const { refreshBrands } = useBrandActions();
  
  // Check if there's an existing session when component mounts
  useEffect(() => {
    if (user) {
      console.log('👤 Existing user detected on auth page:', user.email);
    }
  }, [user]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState<{
    name?: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Remove Firebase verification flow - MongoDB auth is direct

  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔐 Starting login process...');
      await signIn(signInData.email, signInData.password);
      console.log('✅ Login successful, auth state should be updated');

      // Don't call refreshBrands immediately - let the brand context react to auth state changes
      // The brand context useEffect will handle loading brands when user state updates

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      // Small delay to ensure auth state is fully settled before navigation
      setTimeout(() => {
        console.log('🚀 Navigating to dashboard...');
        router.push('/dashboard');
      }, 100);

    } catch (error) {
      console.error('❌ Login failed:', error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    try {
      // Direct signup with MongoDB - no email verification needed
      await signUp(signUpData.email, signUpData.password, signUpData.name);
      toast({
        title: 'Account created!',
        description: 'Welcome — your account is ready.'
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    }
  };

  // Demo mode removed - users must create accounts

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Button
        onClick={() => router.push('/')}
        variant="ghost"
        className="absolute top-6 left-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
      
      {/* Switch Account Button - only show if user is logged in */}
      {user && (
        <div className="absolute top-6 right-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border">
            <div className="text-xs text-gray-600 mb-2">Currently logged in as:</div>
            <div className="text-sm font-medium mb-2">{user.email}</div>
            <Button
              onClick={async () => {
                try {
                  await signOut();
                  toast({
                    title: "Signed out",
                    description: "You can now sign in with a different account.",
                  });
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              Switch Account
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Welcome to Crevo</h1>
              <p className="text-muted-foreground mt-2">Sign in to your account or create a new one</p>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        disabled={loading}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSignIn}
                    className="w-full"
                    disabled={loading || !signInData.email || !signInData.password}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword || ''}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {signUpData.password && signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
                      <p className="text-sm text-red-600">Passwords don't match</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSignUp}
                    className="w-full"
                    disabled={loading || !signUpData.email || !signUpData.password || !signUpData.name || !signUpData.confirmPassword || signUpData.password !== signUpData.confirmPassword}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
