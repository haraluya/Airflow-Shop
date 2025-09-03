'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle,
  Clock,
  Truck,
  Package,
  X,
  Search,
  Filter,
  Calendar,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types/order';
import { ordersService } from '@/lib/firebase/orders';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, statusFilter]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const filters = statusFilter !== 'all' ? { status: [statusFilter] } : {};
      const result = await ordersService.getCustomerOrders(user.uid, filters);
      setOrders(result.orders);
    } catch (error) {
      console.error('載入訂單失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 篩選訂單
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some(item => 
        item.productName.toLowerCase().includes(query)
      )
    );
  });

  // 取得狀態樣式
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          待確認
        </Badge>;
      case OrderStatus.CONFIRMED:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          已確認
        </Badge>;
      case OrderStatus.PROCESSING:
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Package className="w-3 h-3 mr-1" />
          處理中
        </Badge>;
      case OrderStatus.SHIPPED:
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
          <Truck className="w-3 h-3 mr-1" />
          已出貨
        </Badge>;
      case OrderStatus.DELIVERED:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          已送達
        </Badge>;
      case OrderStatus.CANCELLED:
        return <Badge variant="destructive">
          <X className="w-3 h-3 mr-1" />
          已取消
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">待付款</Badge>;
      case PaymentStatus.PAID:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已付款</Badge>;
      case PaymentStatus.OVERDUE:
        return <Badge variant="destructive">逾期</Badge>;
      case PaymentStatus.CANCELLED:
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">請先登入</h2>
          <Button asChild>
            <Link href="/login">前往登入</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 頁面標頭 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                繼續購物
              </Link>
            </Button>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">我的訂單</h1>
              <p className="text-muted-foreground">
                查看和追蹤您的所有訂單
              </p>
            </div>
          </div>

          {/* 搜尋與篩選 */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋訂單編號或商品名稱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">全部狀態</option>
                  <option value={OrderStatus.PENDING}>待確認</option>
                  <option value={OrderStatus.CONFIRMED}>已確認</option>
                  <option value={OrderStatus.PROCESSING}>處理中</option>
                  <option value={OrderStatus.SHIPPED}>已出貨</option>
                  <option value={OrderStatus.DELIVERED}>已送達</option>
                  <option value={OrderStatus.CANCELLED}>已取消</option>
                </select>
              </div>
            </div>
          </Card>

          {/* 訂單統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">全部訂單</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">待確認</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === OrderStatus.PENDING).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-muted-foreground">已出貨</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === OrderStatus.SHIPPED).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">已完成</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === OrderStatus.DELIVERED).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* 訂單列表 */}
          {isLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {orders.length === 0 ? '還沒有訂單' : '找不到符合條件的訂單'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {orders.length === 0 
                  ? '快去挑選一些商品下訂單吧！'
                  : '試試調整搜尋條件或篩選器'
                }
              </p>
              {orders.length === 0 && (
                <Button asChild>
                  <Link href="/products">開始購物</Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                        {getStatusBadge(order.status as OrderStatus)}
                        {order.payment && getPaymentStatusBadge(order.payment.status as PaymentStatus)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.orderDate)}
                        </div>
                        <div>
                          共 {order.items.length} 項商品
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {order.pricing?.totalAmount && formatPrice(order.pricing.totalAmount)}
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href={`/orders/${order.id}`} className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          查看詳情
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {/* 商品預覽 */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              數量：{item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {order.items.length > 3 && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                          還有 {order.items.length - 3} 項商品...
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 載入更多按鈕 */}
          {filteredOrders.length >= 10 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                載入更多訂單
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}