import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileSection } from '@/components/profile/profile-section';

export const metadata: Metadata = {
  title: '個人資料 - Airflow B2B Shop',
  description: '管理您的個人資料、地址和偏好設定',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">個人資料</h1>
          <p className="text-muted-foreground mt-2">
            管理您的個人資料、送貨地址和帳戶偏好設定
          </p>
        </div>

        {/* 個人資料區塊 */}
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <ProfileSection />
        </Suspense>
      </div>
    </div>
  );
}