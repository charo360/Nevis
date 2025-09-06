"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Mail } from 'lucide-react';

interface VerifyEmailProps {
  email: string;
  onSuccess: () => void;
}

export default function VerifyEmail({ email, onSuccess }: VerifyEmailProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    try {
      // TODO: Implement email verification logic
      setMessage('Email verification functionality will be implemented soon.');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setMessage('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          Verify Your Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          We've sent a verification code to <strong>{email}</strong>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>

        {message && (
          <div className="text-center text-sm text-muted-foreground">
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
