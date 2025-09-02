import { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/forms/register-form';

export const metadata: Metadata = {
  title: '註冊 - Airflow B2B Shop',
  description: '註冊 Airflow B2B 電商帳號，開始您的批發採購之旅',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="container max-w-lg mx-auto py-8">
        {/* 標誌區域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">
            Airflow B2B Shop
          </h1>
          <p className="text-muted-foreground mt-2">
            加入電子煙批發專業平台
          </p>
        </div>

        {/* 註冊表單 */}
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <RegisterForm />
        </Suspense>

        {/* 申請流程說明 */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">申請流程說明</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>填寫完整的註冊資料</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>管理員審核您的申請</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>審核通過後即可開始採購</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            ⚠️ 請確保填寫資料的真實性，審核時間通常為 1-2 個工作日。
          </p>
        </div>

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