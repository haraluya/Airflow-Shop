import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/login-form';

export const metadata: Metadata = {
  title: '登入 - Airflow B2B Shop',
  description: '登入您的 Airflow B2B 電商帳號',
};

export default function LoginPage() {
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