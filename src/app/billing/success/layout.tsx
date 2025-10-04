import React from 'react';

export const dynamic = 'force-dynamic';

export default function BillingSuccessLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout to ensure billing success page does not render the global/dashboard sidebar.
  // Keep it intentionally small and server-rendered so client page can hydrate normally.
  return (
    <div className="min-h-screen bg-transparent">
      {children}
    </div>
  );
}
