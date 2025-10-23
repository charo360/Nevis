"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

type Props = {
  signInData: { email: string; password: string };
  // dispatcher that accepts either a new state or an updater function
  setSignInData: React.Dispatch<React.SetStateAction<{ email: string; password: string }>>;
  showSignInPassword: boolean;
  // allow passing a boolean or an updater function (prev => !prev)
  setShowSignInPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  handleSignIn: (e: React.FormEvent) => Promise<void> | void;
};

export default function LoginForm({ signInData, setSignInData, showSignInPassword, setShowSignInPassword, loading, handleSignIn }: Props) {
  const router = useRouter();
  return (
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
            onChange={(e) => setSignInData((prev: any) => ({ ...prev, email: e.target.value }))}
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
            onChange={(e) => setSignInData((prev: any) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button
            type="button"
            aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
            onClick={() => {
              // guard: some parents may accidentally pass a boolean instead of a setter
              if (typeof setShowSignInPassword === 'function') {
                // allow functional updater when supported
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (setShowSignInPassword as any)((s: any) => !s);
              }
            }}
            className="absolute right-3 top-2 text-gray-500"
          >
            {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
