'use client';

import { useParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { LoginForm } from '@/components/forms/login-form';

export default function SubdomainLoginPage() {
  const params = useParams();
  const subdomain = params.referralCode as string;

  useEffect(() => {
    // 將子網域儲存到 localStorage
    if (subdomain) {
      localStorage.setItem('subdomain', subdomain.toLowerCase());
      localStorage.setItem('referralCode', subdomain.toUpperCase()); // 保持向後相容
    }
  }, [subdomain]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* 標誌區域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">
            Airflow B2B Shop
          </h1>
          <p className="text-muted-foreground mt-2">
            電子煙批發專業平台
          </p>
          {/* 子網域提示 */}
          {subdomain && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary font-medium">
                歡迎透過 {subdomain.toUpperCase()} 子網域登入
              </p>
            </div>
          )}
        </div>

        {/* 登入表單 */}
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* 頁腳資訊 */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 Airflow B2B Shop. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="/terms" className="hover:text-foreground">服務條款</a>
            <a href="/privacy" className="hover:text-foreground">隱私政策</a>
            <a href="/contact" className="hover:text-foreground">聯絡我們</a>
          </div>
        </div>
      </div>
    </div>
  );
}