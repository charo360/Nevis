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
import VerifyEmail from '@/components/auth/VerifyEmail';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, signInAnonymous, loading } = useFirebaseAuth();
  const { toast } = useToast();

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

  // Signup verification flow
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingSignUp, setPendingSignUp] = useState<typeof signUpData | null>(null);

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
      // Send verification code first. Do not create user until verified.
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signUpData.email, type: 'signup' }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
  setPendingSignUp(signUpData);
  setShowVerifyModal(true);
  toast({ title: 'Verification code sent', description: 'Check your inbox for the 5-digit code.' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to send verification', description: body.error || 'Please try again.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign up failed', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  };

  const finishSignUpAfterVerification = async () => {
    if (!pendingSignUp) return;
    try {
      await signUp(pendingSignUp.email, pendingSignUp.password, pendingSignUp.name);
      toast({ title: 'Account created!', description: 'Welcome — your account is ready.' });
      setShowVerifyModal(false);
      setPendingSignUp(null);
      router.push('/dashboard');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign up failed', description: error instanceof Error ? error.message : 'Please try again.' });
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
                <LoginForm
                  signInData={signInData}
                  setSignInData={setSignInData}
                  showSignInPassword={showSignInPassword}
                  setShowSignInPassword={setShowSignInPassword}
                  loading={loading}
                  handleSignIn={handleSignIn}
                />
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <SignupForm
                  signUpData={signUpData}
                  setSignUpData={setSignUpData}
                  loading={loading}
                  handleSignUp={handleSignUp}
                />
                {showVerifyModal && pendingSignUp && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <VerifyEmail email={pendingSignUp.email} onSuccess={finishSignUpAfterVerification} type="signup" />
                  </div>
                )}
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
