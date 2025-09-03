'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Award,
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';

export default function SalespersonPerformance() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">業績分析</h1>
          <p className="text-muted-foreground">
            詳細的業績表現和趨勢分析
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={selectedPeriod === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            本週
          </Button>
          <Button 
            variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            本月
          </Button>
          <Button 
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('quarter')}
          >
            本季
          </Button>
        </div>
      </div>

      {/* 關鍵指標 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">銷售額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,600</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% 比上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">訂單數</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% 比上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新客戶</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-red-600 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2.1% 比上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均訂單金額</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,982</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.4% 比上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 目標達成情況 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              目標達成情況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">銷售目標</span>
                  <span className="text-sm text-muted-foreground">76%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  $45,600 / $60,000
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">新客戶目標</span>
                  <span className="text-sm text-muted-foreground">60%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  6 / 10 位新客戶
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">訂單目標</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  23 / 25 筆訂單
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              績效排名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-yellow-800">第 2 名</h3>
                <p className="text-sm text-yellow-600">本月銷售排名</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-blue-600">85%</div>
                  <div className="text-xs text-muted-foreground">目標達成率</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-green-600">4.8</div>
                  <div className="text-xs text-muted-foreground">客戶滿意度</div>
                </div>
              </div>

              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  比上月進步 3 名
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 銷售趋势图表占位符 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            銷售趨勢
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>銷售趨勢圖表</p>
              <p className="text-sm">（將來會整合圖表庫）</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}