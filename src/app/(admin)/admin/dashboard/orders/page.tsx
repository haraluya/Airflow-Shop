'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/providers/auth-provider';
import { Order, OrderStatus, PaymentStatus, OrderSearchParams } from '@/lib/types/order';
import { ordersService } from '@/lib/firebase/orders';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, statusFilter, paymentStatusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: OrderSearchParams = {
        query: searchQuery,
        pageSize: 50
      };
      
      if (statusFilter !== 'all') {
        params.status = [statusFilter];
      }
      
      if (paymentStatusFilter !== 'all') {
        params.paymentStatus = [paymentStatusFilter];
      }

      const result = await ordersService.searchOrders(params);
      setOrders(result.orders);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('載入訂單失敗:', error);
      setError('載入訂單資料失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadOrders();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const result = await ordersService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        await loadOrders(); // 重新載入資料
      } else {
        alert(result.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      alert('更新失敗，請重試');
    }
  };

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
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!user) {
    return <div>請先登入</div>;
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">訂單管理</h1>
          <p className="text-muted-foreground">管理所有客戶訂單與訂單狀態</p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            代客下單
          </Link>
        </Button>
      </div>

      {/* 搜尋與篩選 */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜尋訂單編號、客戶名稱或電子郵件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="訂單狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有狀態</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>待確認</SelectItem>
              <SelectItem value={OrderStatus.CONFIRMED}>已確認</SelectItem>
              <SelectItem value={OrderStatus.PROCESSING}>處理中</SelectItem>
              <SelectItem value={OrderStatus.SHIPPED}>已出貨</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>已送達</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>已取消</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="付款狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有狀態</SelectItem>
              <SelectItem value={PaymentStatus.PENDING}>待付款</SelectItem>
              <SelectItem value={PaymentStatus.PAID}>已付款</SelectItem>
              <SelectItem value={PaymentStatus.OVERDUE}>逾期</SelectItem>
              <SelectItem value={PaymentStatus.CANCELLED}>已取消</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            搜尋
          </Button>
        </div>
      </Card>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">總訂單數</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">待處理</p>
              <p className="text-2xl font-bold">
                {orders.filter(order => order.status === OrderStatus.PENDING).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">已完成</p>
              <p className="text-2xl font-bold">
                {orders.filter(order => order.status === OrderStatus.DELIVERED).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">本月營收</p>
              <p className="text-2xl font-bold">
                {formatPrice(
                  orders
                    .filter(order => {
                      const orderDate = new Date(order.orderDate);
                      const now = new Date();
                      return orderDate.getMonth() === now.getMonth() && 
                             orderDate.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, order) => sum + order.pricing.totalAmount, 0)
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadOrders}>
            重試
          </Button>
        </Card>
      )}

      {/* 訂單列表 */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">訂單列表</h3>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              匯出
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">載入中...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">沒有找到訂單</p>
              <p className="text-muted-foreground">調整搜尋條件或建立新訂單</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">訂單編號</th>
                    <th className="text-left py-3 px-4 font-semibold">客戶</th>
                    <th className="text-left py-3 px-4 font-semibold">下單時間</th>
                    <th className="text-left py-3 px-4 font-semibold">訂單狀態</th>
                    <th className="text-left py-3 px-4 font-semibold">付款狀態</th>
                    <th className="text-right py-3 px-4 font-semibold">金額</th>
                    <th className="text-center py-3 px-4 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} 項商品
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">{formatDate(order.orderDate)}</div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-4">
                        {getPaymentStatusBadge(order.payment.status)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatPrice(order.pricing.totalAmount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/dashboard/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                查看詳情
                              </Link>
                            </DropdownMenuItem>
                            
                            {order.status === OrderStatus.PENDING && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, OrderStatus.CONFIRMED)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                確認訂單
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === OrderStatus.CONFIRMED && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, OrderStatus.PROCESSING)}>
                                <Package className="mr-2 h-4 w-4" />
                                開始處理
                              </DropdownMenuItem>
                            )}
                            
                            {order.status === OrderStatus.PROCESSING && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, OrderStatus.SHIPPED)}>
                                <Truck className="mr-2 h-4 w-4" />
                                標記出貨
                              </DropdownMenuItem>
                            )}
                            
                            {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                取消訂單
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 載入更多 */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={loadOrders}>
            載入更多訂單
          </Button>
        </div>
      )}
    </div>
  );
}