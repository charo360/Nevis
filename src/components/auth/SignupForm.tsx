"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';

type Props = {
  signUpData: { name?: string; email: string; password: string; confirmPassword?: string };
  setSignUpData: React.Dispatch<React.SetStateAction<{ name?: string; email: string; password: string; confirmPassword?: string }>>;
  loading: boolean;
  handleSignUp: (e: React.FormEvent) => Promise<void> | void;
};

export default function SignupForm({ signUpData, setSignUpData, loading, handleSignUp }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-fullname">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-fullname"
            type="text"
            placeholder="Your full name"
            className="pl-10"
            value={signUpData.name || ''}
            onChange={(e) => setSignUpData((prev: any) => ({ ...prev, name: e.target.value }))}
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
            onChange={(e) => setSignUpData((prev: any) => ({ ...prev, email: e.target.value }))}
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
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            className="pl-10"
            value={signUpData.password}
            onChange={(e) => setSignUpData((prev: any) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-2 text-gray-500"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            className="pl-10"
            value={signUpData.confirmPassword || ''}
            onChange={(e) => setSignUpData((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-2 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {signUpData.confirmPassword && signUpData.confirmPassword !== signUpData.password && (
          <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || (signUpData.confirmPassword !== undefined && signUpData.confirmPassword !== signUpData.password)}
      >
        {loading ? 'Sending code...' : 'Create account'}
      </Button>
    </form>
  );
}
