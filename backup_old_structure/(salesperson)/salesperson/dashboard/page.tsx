'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Clock,
  MapPin
} from 'lucide-react';
import { salespersonService } from '@/lib/firebase/salesperson';
import { SalespersonProfile } from '@/lib/types/auth';

interface PerformanceStats {
  totalCustomers: number;
  totalOrders: number;
  totalSales: number;
  thisMonthSales: number;
  activeCustomers: number;
  thisMonthOrders: number;
  conversionRate: number;
  avgOrderValue: number;
}

export default function SalespersonDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [salespersonData, setSalespersonData] = useState<SalespersonProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // 載入業務員詳細資料
        const salesperson = await salespersonService.getSalespersonByUid(user.uid);
        setSalespersonData(salesperson);

        // 載入績效統計（目前使用模擬數據）
        const performanceStats: PerformanceStats = {
          totalCustomers: 45,
          totalOrders: 128,
          totalSales: 256800,
          thisMonthSales: 45600,
          activeCustomers: 38,
          thisMonthOrders: 23,
          conversionRate: 65.8,
          avgOrderValue: 2006
        };

        setStats(performanceStats);
      } catch (error) {
        console.error('載入儀表板資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.uid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和歡迎訊息 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            歡迎回來，{profile?.displayName || '業務員'}
          </h1>
          <p className="text-muted-foreground">
            這是您的績效總覽儀表板
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString('zh-TW')}
          </Badge>
        </div>
      </div>

      {/* 業務員資訊卡片 */}
      {salespersonData && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {salespersonData.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{salespersonData.name}</h3>
                <p className="text-muted-foreground">員工編號: {salespersonData.employeeId}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {salespersonData.phoneNumber && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>📞 {salespersonData.phoneNumber}</span>
                    </div>
                  )}
                  {salespersonData.lineId && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>💬 {salespersonData.lineId}</span>
                    </div>
                  )}
                  {salespersonData.territory && salespersonData.territory.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {salespersonData.territory.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={salespersonData.isActive ? "default" : "secondary"}
                  className="mb-2"
                >
                  {salespersonData.isActive ? "在職中" : "暫停"}
                </Badge>
                {salespersonData.commissionRate && (
                  <p className="text-sm text-muted-foreground">
                    佣金比例: {(salespersonData.commissionRate * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 績效統計卡片 */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                活躍客戶: {stats.activeCustomers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                本月: {stats.thisMonthOrders} 筆
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總業績</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                本月: ${stats.thisMonthSales.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">轉換率</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                平均訂單: ${stats.avgOrderValue}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 快速動作和最新活動 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 快速動作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              快速動作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              查看我的客戶
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              查看最新訂單
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Award className="h-4 w-4 mr-2" />
              查看佣金記錄
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              生成月度報表
            </Button>
          </CardContent>
        </Card>

        {/* 本月目標 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              本月目標
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>銷售目標</span>
                  <span>76%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  $45,600 / $60,000
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>新客戶目標</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  6 / 10 位新客戶
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>訂單目標</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  23 / 25 筆訂單
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}