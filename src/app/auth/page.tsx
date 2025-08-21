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
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, signInAnonymous, loading } = useFirebaseAuth();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(signInData.email, signInData.password);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      router.push('/dashboard');
    } catch (error) {
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
      await signUp(signUpData.email, signUpData.password, signUpData.name);
      console.log('signed up (raw firebase.currentUser):', auth.currentUser);
        console.log('signed up (fields):', {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName,
          isAnonymous: auth.currentUser?.isAnonymous,
        });
      toast({
        title: "Account created!",
        description: "Welcome to Crevo! Explore your dashboard to get started.",
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDemoMode = async () => {
    try {
      await signInAnonymous();
      toast({
        title: "Demo mode activated!",
        description: "Welcome to your dashboard! Explore all features without creating an account.",
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Demo mode failed",
        description: "Please try again.",
      });
    }
  };

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

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crevo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Crevo
          </h1>
          <p className="text-gray-600">
            Sign in to your account or create a new one to get started
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <Button
                onClick={handleDemoMode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Try Demo Mode (No Account Needed)
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pl-10"
                          value={signInData.password}
                          onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowSignInPassword(s => !s)}
                          className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                        >
                          {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="pl-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowSignUpPassword(s => !s)}
                        className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-confirm"
                        type={showSignUpConfirm ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSignUpConfirm ? 'Hide password' : 'Show password'}
                        onClick={() => setShowSignUpConfirm(s => !s)}
                        className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
                      >
                        {showSignUpConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Create Account
                  </Button>
                </form>
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
