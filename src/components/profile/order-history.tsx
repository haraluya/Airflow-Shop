'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';
import { ordersService } from '@/lib/firebase/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/lib/types/order';
import { ORDER_STATUS, ORDER_STATUS_LABELS, PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '@/lib/types/order';
import { 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  Package, 
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function OrderHistory() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [profile]);

  const loadOrders = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await ordersService.getCustomerOrders(profile.id);
      setOrders(result.orders);
    } catch (err) {
      console.error('載入訂單記錄失敗:', err);
      setError('載入訂單記錄失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.PROCESSING:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PAYMENT_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PAYMENT_STATUS.PAID:
        return 'bg-green-100 text-green-800';
      case PAYMENT_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800';
      case PAYMENT_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">無法載入訂單記錄</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>訂單記錄</span>
          </CardTitle>
          <CardDescription>
            查看您的訂單歷史記錄和狀態
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          重新載入
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center space-x-2 mb-6">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">您還沒有任何訂單記錄</p>
            <Link href="/products">
              <Button>
                開始購物
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* 左側：訂單資訊 */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-lg">#{order.orderNumber}</h3>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {PAYMENT_STATUS_LABELS[order.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS]}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {order.createdAt && (typeof order.createdAt === 'object' && 'toDate' in order.createdAt 
                              ? (order.createdAt as any).toDate().toLocaleDateString('zh-TW')
                              : new Date(order.createdAt as any).toLocaleDateString('zh-TW')
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{order.items.length} 項商品</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-medium">NT$ {order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* 商品清單預覽 */}
                      <div className="text-sm text-muted-foreground">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index}>
                            {item.productName} x {item.quantity}
                            {index < Math.min(order.items.length, 3) - 1 && ', '}
                          </span>
                        ))}
                        {order.items.length > 3 && ` 等 ${order.items.length} 項商品`}
                      </div>
                    </div>

                    {/* 右側：操作按鈕 */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="w-4 h-4 mr-2" />
                          查看詳情
                        </Button>
                      </Link>

                      {/* 可以根據訂單狀態顯示不同操作 */}
                      {order.status === ORDER_STATUS.PENDING && (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled>
                          等待確認
                        </Button>
                      )}

                      {order.status === ORDER_STATUS.DELIVERED && order.paymentStatus === PAYMENT_STATUS.PAID && (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled>
                          已完成
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* 查看更多連結 */}
            <div className="text-center pt-4">
              <Link href="/orders">
                <Button variant="outline">
                  查看所有訂單
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}