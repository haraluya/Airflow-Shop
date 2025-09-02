'use client';

import { useState, useEffect } from 'react';
import { pricingGroupsService, productPricesService, pricingEngine } from '@/lib/firebase/pricing';
import { productsService } from '@/lib/firebase/products';
import { customersService } from '@/lib/firebase/customers';
import { USER_STATUS } from '@/lib/utils/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign,
  Users,
  Package,
  Settings,
  TrendingUp,
  Calculator,
  ArrowRight,
  Percent,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface PricingDashboardState {
  stats: {
    totalGroups: number;
    activeGroups: number;
    totalPrices: number;
    totalProducts: number;
    totalCustomers: number;
  };
  recentPrices: any[];
  testCalculation: {
    productId: string;
    customerId: string;
    quantity: number;
    result: any;
  };
  isLoading: boolean;
  error: string | null;
}

export default function PricingDashboardPage() {
  const [state, setState] = useState<PricingDashboardState>({
    stats: {
      totalGroups: 0,
      activeGroups: 0,
      totalPrices: 0,
      totalProducts: 0,
      totalCustomers: 0
    },
    recentPrices: [],
    testCalculation: {
      productId: '',
      customerId: '',
      quantity: 1,
      result: null
    },
    isLoading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [groups, products, customers] = await Promise.all([
        pricingGroupsService.getPricingGroups(),
        productsService.getProducts({ limit: 1 }),
customersService.getCustomers({ filters: { status: 'ACTIVE' } })
      ]);

      // 簡化統計 - 實際應該從專門的統計API獲取
      const stats = {
        totalGroups: groups.length,
        activeGroups: groups.filter(g => g.isActive).length,
        totalPrices: 0, // 需要實際查詢
        totalProducts: products.total,
totalCustomers: customers.customers?.length || 0
      };

      setState(prev => ({
        ...prev,
        stats,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入儀表板資料失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入儀表板資料失敗'
      }));
    }
  };

  const handleTestCalculation = async () => {
    if (!state.testCalculation.productId) {
      alert('請輸入商品ID');
      return;
    }

    try {
      const result = await pricingEngine.calculatePrice({
        productId: state.testCalculation.productId,
        customerId: state.testCalculation.customerId || undefined,
        quantity: state.testCalculation.quantity,
        basePrice: 100 // 示例基礎價格
      });

      setState(prev => ({
        ...prev,
        testCalculation: {
          ...prev.testCalculation,
          result
        }
      }));
    } catch (error) {
      console.error('價格計算失敗:', error);
      alert('價格計算失敗');
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">價格引擎總覽</h1>
        <p className="text-muted-foreground">
          管理商品定價、客戶群組與價格計算規則
        </p>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div className="text-2xl font-bold">{state.stats.totalGroups}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            價格群組總數
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-green-500" />
            <div className="text-2xl font-bold">{state.stats.activeGroups}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            啟用價格群組
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-yellow-500" />
            <div className="text-2xl font-bold">{state.stats.totalPrices}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            特殊價格設定
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-purple-500" />
            <div className="text-2xl font-bold">{state.stats.totalProducts}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            商品總數
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <div className="text-2xl font-bold">{state.stats.totalCustomers}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            客戶總數
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 快速操作 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="space-y-3">
            <Button asChild className="w-full justify-between">
              <Link href="/dashboard/pricing/groups">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>價格群組管理</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/pricing/products">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>商品價格設定</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/customers">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>客戶價格分析</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* 價格計算測試 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="h-5 w-5" />
            <h3 className="text-lg font-semibold">價格計算測試</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">商品ID</label>
              <Input
                placeholder="輸入商品ID"
                value={state.testCalculation.productId}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  testCalculation: {
                    ...prev.testCalculation,
                    productId: e.target.value
                  }
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">客戶ID (可選)</label>
              <Input
                placeholder="輸入客戶ID"
                value={state.testCalculation.customerId}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  testCalculation: {
                    ...prev.testCalculation,
                    customerId: e.target.value
                  }
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">數量</label>
              <Input
                type="number"
                min="1"
                value={state.testCalculation.quantity}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  testCalculation: {
                    ...prev.testCalculation,
                    quantity: parseInt(e.target.value) || 1
                  }
                }))}
              />
            </div>

            <Button onClick={handleTestCalculation} className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              計算價格
            </Button>

            {state.testCalculation.result && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">計算結果</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>最終價格:</span>
                    <span className="font-bold">${state.testCalculation.result.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>原價:</span>
                    <span>${state.testCalculation.result.originalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>折扣金額:</span>
                    <span>${state.testCalculation.result.discountAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>折扣百分比:</span>
                    <span>{state.testCalculation.result.discountPercentage.toFixed(1)}%</span>
                  </div>
                  {state.testCalculation.result.appliedRule && (
                    <div className="flex justify-between">
                      <span>套用規則:</span>
                      <span className="text-blue-600">{state.testCalculation.result.appliedRule}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 功能說明 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Percent className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">價格群組</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            建立客戶價格群組，設定不同的折扣規則，提供彈性的定價策略。
          </p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/pricing/groups">
              管理價格群組
            </Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">商品定價</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            為特定商品設定客戶專屬價格或群組價格，支援階層式定價。
          </p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/pricing/products">
              設定商品價格
            </Link>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">價格分析</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            分析價格策略效果，追蹤客戶購買行為與折扣使用情況。
          </p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/analytics">
              查看分析報告
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}