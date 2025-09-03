'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { USER_ROLES } from '@/lib/utils/constants';
import { SalespersonSidebar } from '@/components/layout/salesperson-sidebar';
import { SalespersonHeader } from '@/components/layout/salesperson-header';

interface SalespersonDashboardLayoutProps {
  children: React.ReactNode;
}

export default function SalespersonDashboardLayout({ children }: SalespersonDashboardLayoutProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isClient) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (profile?.role !== USER_ROLES.SALESPERSON) {
        // 如果不是業務員，重定向到適當的頁面
        if (profile?.role === USER_ROLES.ADMIN) {
          router.push('/admin/dashboard');
        } else {
          router.push('/products');
        }
        return;
      }
    }
  }, [user, profile, isLoading, router, isClient]);

  if (isLoading || !isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">載入業務員專區...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== USER_ROLES.SALESPERSON) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <SalespersonSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <SalespersonHeader />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}