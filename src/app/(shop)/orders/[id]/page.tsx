'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle,
  Clock,
  Truck,
  Package,
  X,
  ArrowLeft,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types/order';
import { OrdersService } from '@/lib/services/orders-service';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const orderId = params.id as string;
  const isSuccessPage = searchParams.get('success') === 'true';
  const ordersService = new OrdersService();

  useEffect(() => {
    if (orderId && user) {
      loadOrderDetails();
    }
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const orderData = await ordersService.getOrder(orderId);
      
      if (orderData && orderData.customerId === user?.uid) {
        setOrder(orderData);
      } else {
        setError('訂單不存在或您沒有權限查看');
      }
    } catch (error) {
      console.error('載入訂單失敗:', error);
      setError('載入訂單資料失敗');
    } finally {
      setIsLoading(false);
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
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">訂單載入失敗</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link href="/orders">回到訂單列表</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 成功訊息 */}
          {isSuccessPage && (
            <Card className="p-6 mb-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">訂單建立成功！</h3>
                  <p className="text-green-700">
                    您的訂單 #{order.orderNumber} 已成功建立，我們會盡快處理您的訂單。
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 頁面標頭 */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回訂單列表
              </Link>
            </Button>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">訂單詳情</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-muted-foreground">#{order.orderNumber}</span>
                {getStatusBadge(order.status)}
                {getPaymentStatusBadge(order.payment.status)}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 左側：詳細資訊 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 訂單商品 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">訂單商品</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productName}</h3>
                        {item.productSku && (
                          <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-muted-foreground">
                            數量：{item.quantity} × {formatPrice(item.unitPrice)}
                          </span>
                          <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 配送資訊 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">配送資訊</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{order.delivery.address.label}</p>
                      <p className="text-muted-foreground">收件人：{order.delivery.address.recipient}</p>
                      <p className="text-muted-foreground">{order.delivery.address.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{order.delivery.contactPhone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {order.delivery.method === 'standard' && '標準配送'}
                      {order.delivery.method === 'express' && '快速配送'}
                      {order.delivery.method === 'pickup' && '門市自取'}
                      {order.delivery.method === 'same_day' && '當日配送'}
                    </span>
                  </div>

                  {order.delivery.trackingNumber && (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">追蹤編號：</span>
                        <span className="font-mono">{order.delivery.trackingNumber}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 付款資訊 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">付款資訊</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {order.payment.method === 'bank_transfer' && '銀行轉帳'}
                      {order.payment.method === 'credit_card' && '信用卡'}
                      {order.payment.method === 'cod' && '貨到付款'}
                      {order.payment.method === 'net_banking' && '網路銀行'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>付款狀態</span>
                    {getPaymentStatusBadge(order.payment.status)}
                  </div>

                  <div className="flex justify-between">
                    <span>付款金額</span>
                    <span className="font-medium">{formatPrice(order.payment.amount)}</span>
                  </div>

                  {order.payment.dueDate && (
                    <div className="flex justify-between">
                      <span>到期日</span>
                      <span>{formatDate(order.payment.dueDate)}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* 右側：摘要資訊 */}
            <div className="space-y-6">
              {/* 訂單摘要 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">訂單摘要</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>商品小計</span>
                    <span>{formatPrice(order.pricing.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>運費</span>
                    <span>{order.pricing.shippingFee === 0 ? '免費' : formatPrice(order.pricing.shippingFee)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>稅額</span>
                    <span>{formatPrice(order.pricing.taxAmount)}</span>
                  </div>

                  {order.pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>優惠折扣</span>
                      <span>-{formatPrice(order.pricing.discountAmount)}</span>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>總計</span>
                    <span className="text-primary">{formatPrice(order.pricing.totalAmount)}</span>
                  </div>
                </div>
              </Card>

              {/* 重要日期 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">重要日期</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">下單時間</div>
                      <div className="text-muted-foreground">{formatDate(order.orderDate)}</div>
                    </div>
                  </div>

                  {order.confirmedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">確認時間</div>
                        <div className="text-muted-foreground">{formatDate(order.confirmedAt)}</div>
                      </div>
                    </div>
                  )}

                  {order.shippedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">出貨時間</div>
                        <div className="text-muted-foreground">{formatDate(order.shippedAt)}</div>
                      </div>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">送達時間</div>
                        <div className="text-muted-foreground">{formatDate(order.deliveredAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 訂單備註 */}
              {order.notes && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">訂單備註</h3>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </Card>
              )}

              {/* 操作按鈕 */}
              {order.status === OrderStatus.PENDING && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">訂單操作</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // 這裡可以添加取消訂單的邏輯
                        alert('取消訂單功能開發中...');
                      }}
                    >
                      申請取消訂單
                    </Button>
                    
                    <Button asChild className="w-full">
                      <Link href="/products">
                        繼續購物
                      </Link>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}