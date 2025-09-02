'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Loader2,
  Edit,
  Save,
  User,
  Mail,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types/order';
import { ordersService } from '@/lib/firebase/orders';
import Link from 'next/link';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [internalNotes, setInternalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const orderId = params.id as string;

  useEffect(() => {
    if (orderId && user) {
      loadOrderDetails();
    }
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const orderData = await ordersService.getOrderById(orderId);
      
      if (orderData) {
        setOrder(orderData);
        setEditingStatus(orderData.status);
        setInternalNotes(orderData.internalNotes || '');
      } else {
        setError('訂單不存在');
      }
    } catch (error) {
      console.error('載入訂單失敗:', error);
      setError('載入訂單資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;

    try {
      setIsSaving(true);
      const result = await ordersService.updateOrderStatus(
        order.id, 
        editingStatus,
        internalNotes !== order.internalNotes ? internalNotes : undefined
      );
      
      if (result.success) {
        await loadOrderDetails(); // 重新載入資料
        setIsEditing(false);
      } else {
        alert(result.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新訂單失敗:', error);
      alert('更新失敗，請重試');
    } finally {
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>載入訂單資料中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Button asChild>
          <Link href="/admin/dashboard/orders">返回訂單列表</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">訂單不存在</div>
        <Button asChild>
          <Link href="/admin/dashboard/orders">返回訂單列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            訂單詳情 #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            下單時間：{formatDate(order.orderDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          {getPaymentStatusBadge(order.payment.status)}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左側：訂單詳情 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 訂單商品 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">訂單商品</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    {item.productSku && (
                      <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      數量：{item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(item.totalPrice)}</div>
                    {item.discountAmount && item.discountAmount > 0 && (
                      <div className="text-sm text-green-600">
                        省 {formatPrice(item.discountAmount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 配送資訊 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5" />
              <h3 className="text-lg font-semibold">配送資訊</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">收件地址</p>
                  <p className="text-muted-foreground">
                    {order.delivery.address.recipient} - {order.delivery.address.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">聯絡電話：</span>
                  <span className="text-muted-foreground">{order.delivery.contactPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">配送方式：</span>
                  <span className="text-muted-foreground">{order.delivery.method}</span>
                </div>
              </div>
              {order.delivery.trackingNumber && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">追蹤號碼：</span>
                    <span className="text-muted-foreground">{order.delivery.trackingNumber}</span>
                  </div>
                </div>
              )}
              {order.delivery.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">配送備註</p>
                    <p className="text-muted-foreground">{order.delivery.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 付款資訊 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">付款資訊</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">付款方式</span>
                <span className="text-muted-foreground">{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">付款狀態</span>
                {getPaymentStatusBadge(order.payment.status)}
              </div>
              <div className="flex justify-between">
                <span className="font-medium">應付金額</span>
                <span className="font-bold">{formatPrice(order.payment.amount)}</span>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="font-medium">付款時間</span>
                  <span className="text-muted-foreground">{formatDate(order.payment.paidAt)}</span>
                </div>
              )}
              {order.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="font-medium">交易編號</span>
                  <span className="text-muted-foreground">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 右側：管理操作 */}
        <div className="space-y-6">
          {/* 客戶資訊 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-semibold">客戶資訊</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">客戶姓名：</span>
                  <span className="text-muted-foreground">{order.customerName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">電子郵件：</span>
                  <span className="text-muted-foreground">{order.customerEmail}</span>
                </div>
              </div>
              {order.salespersonName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">業務員：</span>
                    <span className="text-muted-foreground">{order.salespersonName}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 訂單狀態管理 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">訂單狀態</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? '取消編輯' : '編輯狀態'}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">訂單狀態</label>
                  <Select value={editingStatus} onValueChange={(value) => setEditingStatus(value as OrderStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrderStatus.PENDING}>待確認</SelectItem>
                      <SelectItem value={OrderStatus.CONFIRMED}>已確認</SelectItem>
                      <SelectItem value={OrderStatus.PROCESSING}>處理中</SelectItem>
                      <SelectItem value={OrderStatus.SHIPPED}>已出貨</SelectItem>
                      <SelectItem value={OrderStatus.DELIVERED}>已送達</SelectItem>
                      <SelectItem value={OrderStatus.CANCELLED}>已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">內部備註</label>
                  <Textarea
                    placeholder="新增內部備註..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleStatusUpdate} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        儲存變更
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditingStatus(order.status);
                    setInternalNotes(order.internalNotes || '');
                  }}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">目前狀態</span>
                  {getStatusBadge(order.status)}
                </div>
                {order.confirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">確認時間</span>
                    <span className="text-sm">{formatDate(order.confirmedAt)}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">出貨時間</span>
                    <span className="text-sm">{formatDate(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">送達時間</span>
                    <span className="text-sm">{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 訂單摘要 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">訂單摘要</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>商品小計</span>
                <span>{formatPrice(order.pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>運費</span>
                <span>{formatPrice(order.pricing.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>稅額</span>
                <span>{formatPrice(order.pricing.taxAmount)}</span>
              </div>
              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>優惠折扣</span>
                  <span>-{formatPrice(order.pricing.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>總計</span>
                <span className="text-primary">{formatPrice(order.pricing.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* 內部備註 */}
          {order.internalNotes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">內部備註</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{order.internalNotes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}