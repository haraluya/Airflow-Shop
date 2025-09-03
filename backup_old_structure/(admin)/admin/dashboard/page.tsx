'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalCustomers: number;
  pendingCustomers: number;
  totalOrders: number;
  totalProducts: number;
  todayOrders: number;
  thisMonthRevenue: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    pendingCustomers: 0,
    totalOrders: 0,
    totalProducts: 0,
    todayOrders: 0,
    thisMonthRevenue: 0
  });

  // TODO: 實際從 Firestore 載入統計資料
  useEffect(() => {
    // 模擬資料，實際開發時需要從 Firebase 載入
    setStats({
      totalCustomers: 128,
      pendingCustomers: 5,
      totalOrders: 342,
      totalProducts: 156,
      todayOrders: 8,
      thisMonthRevenue: 125600
    });
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          歡迎回來，{profile?.displayName || '使用者'}
        </h1>
        <p className="text-muted-foreground">
          以下是您的營運概況
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isAdmin && (
          <>
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    總客戶數
                  </p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    待審核客戶
                  </p>
                  <p className="text-2xl font-bold">{stats.pendingCustomers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    商品總數
                  </p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </Card>
          </>
        )}

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                {isAdmin ? '總訂單數' : '我的訂單'}
              </p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 快速操作區域 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 待辦事項 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">待辦事項</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {isAdmin && stats.pendingCustomers > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    有 {stats.pendingCustomers} 個客戶待審核
                  </span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/customers/pending">
                    處理
                  </Link>
                </Button>
              </div>
            )}
            
            {stats.todayOrders > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    今日有 {stats.todayOrders} 筆新訂單
                  </span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/orders">
                    查看
                  </Link>
                </Button>
              </div>
            )}

            {stats.pendingCustomers === 0 && stats.todayOrders === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                目前沒有待辦事項
              </p>
            )}
          </div>
        </Card>

        {/* 快速操作 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">快速操作</h3>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {isAdmin && (
              <>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/customers/pending">
                    <UserCheck className="mr-2 h-4 w-4" />
                    審核新客戶
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/products/new">
                    <Package className="mr-2 h-4 w-4" />
                    新增商品
                  </Link>
                </Button>
              </>
            )}
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/orders/new">
                <ShoppingCart className="mr-2 h-4 w-4" />
                代客下單
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/customers">
                <Users className="mr-2 h-4 w-4" />
                客戶管理
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}