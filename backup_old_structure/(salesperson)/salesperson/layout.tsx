'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { USER_ROLES } from '@/lib/utils/constants';

interface SalespersonLayoutProps {
  children: React.ReactNode;
}

export default function SalespersonLayout({ children }: SalespersonLayoutProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
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
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== USER_ROLES.SALESPERSON) {
    return null;
  }

  return <>{children}</>;
}