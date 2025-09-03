'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/utils/constants';
import { ReferralRedirect } from '@/components/referral-redirect';
import { PublicHeader } from '@/components/layout/public-header';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // 動態導入初始化工具（僅在開發模式下）
    if (process.env.NODE_ENV === 'development') {
      import('@/utils/init-test-data').then(() => {
        console.log('🛠️  開發模式工具已載入');
        console.log('💡 在控制台執行以下指令來初始化測試資料：');
        console.log('   window.initTestData() - 初始化商品和業務員資料');
        console.log('   window.createTestUser("admin@airflow-shop.com", "admin123", "管理員", "admin") - 創建管理員帳號');
        console.log('   window.createTestUser("customer@test.com", "test123", "測試客戶", "customer") - 創建客戶帳號');
        console.log('   window.createTestUser("salesperson@test.com", "test123", "測試業務員", "salesperson") - 創建業務員帳號');
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <ReferralRedirect />
      <PublicHeader />
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
              Airflow B2B Shop
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              電子煙批發專業平台
            </p>
          </div>

          {/* 主要描述 */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              專為電子煙批發產業量身打造的整合性B2B電商與客戶關係管理平台，
              提供個人化價格引擎、推薦碼分銷機制，以及完整的訂單管理系統。
            </p>
          </div>

          {/* CTA 按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href={ROUTES.REGISTER}>
              <Button variant="gradient" size="xl" className="min-w-[200px]">
                立即註冊
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button variant="outline" size="xl" className="min-w-[200px]">
                會員登入
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            為什麼選擇 Airflow？
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 個人化價格引擎 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <CardTitle>個人化價格引擎</CardTitle>
                <CardDescription>
                  根據客戶群組和專屬定價顯示不同價格，提供最優惠的批發價格
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 推薦碼分銷系統 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <CardTitle>推薦碼分銷系統</CardTitle>
                <CardDescription>
                  專屬推薦碼URL，自動綁定客戶與業務員，提供個人化服務體驗
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 完整訂單管理 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <CardTitle>完整訂單管理</CardTitle>
                <CardDescription>
                  從下單到出貨的完整流程追蹤，支援代客下單與報表匯出
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 客戶關係管理 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <CardTitle>客戶關係管理</CardTitle>
                <CardDescription>
                  完整的客戶檔案管理，支援多地址、標籤分類與備忘錄功能
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 多角色權限 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <CardTitle>多角色權限控制</CardTitle>
                <CardDescription>
                  嚴格的三層權限控制，確保資料安全與操作規範
                </CardDescription>
              </CardHeader>
            </Card>

            {/* 行動優先設計 */}
            <Card hover>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle>行動優先設計</CardTitle>
                <CardDescription>
                  響應式設計，支援手機、平板與電腦，隨時隨地管理您的業務
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 申請流程 */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            簡單三步驟，開始您的批發之旅
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">填寫申請資料</h3>
                <p className="text-muted-foreground">
                  填寫完整的公司資料與聯絡資訊，確保資料真實性
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">等待審核通過</h3>
                <p className="text-muted-foreground">
                  我們會在1-2個工作日內審核您的申請，審核通過後立即通知
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">開始批發採購</h3>
                <p className="text-muted-foreground">
                  享受專屬價格與個人化服務，開始您的批發採購之旅
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href={ROUTES.REGISTER}>
              <Button variant="gradient" size="xl">
                立即開始申請
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 聯絡資訊 */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            需要協助？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            我們的專業團隊隨時為您提供服務
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg">
              📞 聯絡客服
            </Button>
            <Button variant="outline" size="lg">
              📧 電子郵件
            </Button>
            <Button variant="outline" size="lg">
              💬 線上客服
            </Button>
          </div>
        </div>
      </section>

      {/* 頁腳 */}
      <footer className="py-8 px-4 bg-background border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 Airflow B2B Shop. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <a href="/terms" className="hover:text-foreground">服務條款</a>
            <a href="/privacy" className="hover:text-foreground">隱私政策</a>
            <a href="/contact" className="hover:text-foreground">聯絡我們</a>
            <a href="/about" className="hover:text-foreground">關於我們</a>
          </div>
        </div>
      </footer>
    </div>
  );
}