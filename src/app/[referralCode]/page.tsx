'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

// 模擬業務員資料 - 實際應該從 Firebase 獲取
const salespeople: Record<string, {
  id: string;
  name: string;
  phone: string;
  email: string;
  lineId: string;
  region: string;
  avatar: string;
}> = {
  'ABC': {
    id: 'salesperson_1',
    name: '王小明',
    phone: '0912-345-678',
    email: 'wang@airflow-shop.com',
    lineId: 'wang_airflow',
    region: '台北地區',
    avatar: '/avatars/wang.jpg'
  },
  'XYZ': {
    id: 'salesperson_2', 
    name: '李小華',
    phone: '0923-456-789',
    email: 'lee@airflow-shop.com',
    lineId: 'lee_airflow',
    region: '台中地區',
    avatar: '/avatars/lee.jpg'
  }
};

export default function ReferralCodePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isValidCode, setIsValidCode] = useState(false);
  const [salesperson, setSalesperson] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    lineId: string;
    region: string;
    avatar: string;
  } | null>(null);
  const [isBinding, setIsBinding] = useState(false);

  const referralCode = params.referralCode as string;

  useEffect(() => {
    // 檢查推薦碼是否有效
    if (referralCode && salespeople[referralCode.toUpperCase()]) {
      setIsValidCode(true);
      setSalesperson(salespeople[referralCode.toUpperCase()]);
      
      // 儲存推薦碼到 localStorage（用於未登入用戶）
      localStorage.setItem('referralCode', referralCode.toUpperCase());
    } else {
      setIsValidCode(false);
    }
  }, [referralCode]);

  const handleBindReferral = async () => {
    if (!user || !salesperson) return;
    
    try {
      setIsBinding(true);
      
      // TODO: 實作綁定邏輯 - 更新用戶的推薦人資訊
      // await bindUserToSalesperson(user.uid, salesperson.id);
      
      // 綁定成功後跳轉到商品頁面
      router.push('/products');
    } catch (error) {
      console.error('綁定推薦人失敗:', error);
    } finally {
      setIsBinding(false);
    }
  };

  // 無效推薦碼
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">推薦碼無效</h1>
              <p className="text-muted-foreground">
                推薦碼 "{referralCode}" 不存在或已失效
              </p>
            </div>
            
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/products">
                  直接進入商城
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  返回首頁
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 歡迎區域 */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">歡迎來到 Airflow</h1>
            <p className="text-muted-foreground">
              您已透過專屬推薦碼進入我們的商城
            </p>
          </div>

          {/* 業務員資訊卡片 */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">您的專屬業務</h3>
                <p className="text-sm text-muted-foreground">推薦碼: {referralCode}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">業務姓名</span>
                <span className="font-medium">{salesperson?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">服務地區</span>
                <Badge variant="secondary">{salesperson?.region}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">聯絡電話</span>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{salesperson?.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">電子郵件</span>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{salesperson?.email}</span>
                </div>
              </div>
              
              {salesperson?.lineId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">LINE ID</span>
                  <span className="font-medium">@{salesperson.lineId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* 行動按鈕 */}
          <div className="space-y-4">
            {user ? (
              // 已登入用戶
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={handleBindReferral}
                  disabled={isBinding}
                >
                  {isBinding ? '綁定中...' : '確認綁定並開始購物'}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/products">
                    直接進入商城（不綁定）
                  </Link>
                </Button>
              </div>
            ) : (
              // 未登入用戶
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  登入或註冊以享受專屬服務與價格
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">
                    登入帳戶
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/register">
                    註冊新帳戶
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/products">
                    先瀏覽商品
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* 說明文字 */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">專屬推薦碼優惠</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 享受個人化價格與專屬折扣</li>
              <li>• 專業業務團隊一對一服務</li>
              <li>• 優先獲得新品資訊與活動通知</li>
              <li>• LINE 快速客服支援</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}