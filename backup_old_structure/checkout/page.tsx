'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  Car,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuth } from '@/lib/providers/auth-provider';
import { Address } from '@/lib/types/common';
import { PaymentMethod, DeliveryMethod } from '@/lib/types/order';
import { ordersService } from '@/lib/firebase/orders';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { cart, getCartSummary, clearCart, isEmpty } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表單狀態
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.STANDARD);
  const [notes, setNotes] = useState('');

  const cartSummary = getCartSummary();

  // 檢查是否已登入和有商品
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">請先登入</h2>
          <p className="text-muted-foreground mb-4">您需要登入帳戶才能進行結帳</p>
          <Button asChild>
            <Link href="/login">前往登入</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">購物車是空的</h2>
          <p className="text-muted-foreground mb-4">請先添加商品到購物車</p>
          <Button asChild>
            <Link href="/products">開始購物</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // 取得客戶地址
  const customerProfile = profile as any; // CustomerProfile
  const addresses = customerProfile?.addresses || [];

  if (addresses.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <MapPin className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">請先設定送貨地址</h2>
          <p className="text-muted-foreground mb-4">您需要至少一個送貨地址才能結帳</p>
          <Button asChild>
            <Link href="/profile/addresses">設定地址</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // 處理訂單提交
  const handleSubmitOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    
    try {
      setIsSubmitting(true);
      setError(null);

      const selectedAddress = addresses[selectedAddressIndex];
      
      const result = await ordersService.createOrderFromCart(
        user.uid,
        {
          items: cart.items,
          deliveryAddress: selectedAddress,
          contactPhone: customerProfile.phoneNumber || '',
          paymentMethod,
          deliveryMethod,
          notes
        },
        profile.id // customerId
      );

      if (result.success && result.orderId) {
        // 清空購物車
        await clearCart();
        
        // 導向訂單確認頁面
        router.push(`/orders/${result.orderId}?success=true`);
      } else {
        setError(result.message || '訂單建立失敗');
      }
    } catch (error) {
      console.error('提交訂單錯誤:', error);
      setError('系統錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 計算運費
  const getShippingFee = () => {
    switch (deliveryMethod) {
      case DeliveryMethod.STANDARD:
        return cartSummary.subtotal >= 1000 ? 0 : 100;
      case DeliveryMethod.EXPRESS:
        return 200;
      case DeliveryMethod.SAME_DAY:
        return 300;
      case DeliveryMethod.PICKUP:
        return 0;
      default:
        return 100;
    }
  };

  const shippingFee = getShippingFee();
  const taxAmount = Math.round(cartSummary.subtotal * 0.05);
  const finalTotal = cartSummary.totalAmount + shippingFee + taxAmount;

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 頁面標頭 */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cart" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回購物車
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">結帳</h1>
              <p className="text-muted-foreground">確認您的訂單資訊並完成付款</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左側：結帳表單 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 配送地址選擇 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">配送地址</h2>
                </div>

                <RadioGroup 
                  value={selectedAddressIndex.toString()} 
                  onValueChange={(value) => setSelectedAddressIndex(parseInt(value))}
                  className="space-y-4"
                >
                  {addresses.map((address: Address, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`address-${index}`} 
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`address-${index}`} 
                        className="flex-1 cursor-pointer"
                      >
                        <div className="p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{address.label}</span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">預設</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            收件人：{address.recipient}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            電話：{address.phone}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/profile/addresses">
                      管理配送地址
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* 配送方式 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">配送方式</h2>
                </div>

                <RadioGroup 
                  value={deliveryMethod} 
                  onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value={DeliveryMethod.STANDARD} id="standard" className="mt-1" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">標準配送</span>
                          <span className="text-sm">
                            {cartSummary.subtotal >= 1000 ? '免費' : formatPrice(100)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">3-5個工作天到貨</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value={DeliveryMethod.EXPRESS} id="express" className="mt-1" />
                    <Label htmlFor="express" className="flex-1 cursor-pointer">
                      <div className="p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">快速配送</span>
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className="text-sm">{formatPrice(200)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">1-2個工作天到貨</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value={DeliveryMethod.PICKUP} id="pickup" className="mt-1" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">門市自取</span>
                            <Building className="h-4 w-4" />
                          </div>
                          <span className="text-sm">免費</span>
                        </div>
                        <p className="text-sm text-muted-foreground">備貨完成後通知取貨</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              {/* 付款方式 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">付款方式</h2>
                </div>

                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value={PaymentMethod.BANK_TRANSFER} id="bank" className="mt-1" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="p-3 border rounded-lg hover:bg-muted/50">
                        <span className="font-medium">銀行轉帳</span>
                        <p className="text-sm text-muted-foreground">
                          訂單確認後提供轉帳資訊
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value={PaymentMethod.CASH_ON_DELIVERY} id="cod" className="mt-1" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="p-3 border rounded-lg hover:bg-muted/50">
                        <span className="font-medium">貨到付款</span>
                        <p className="text-sm text-muted-foreground">
                          送貨時現金付款
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              {/* 訂單備註 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">訂單備註</h2>
                <Textarea
                  placeholder="如有特殊配送需求或備註事項，請在此說明..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </Card>
            </div>

            {/* 右側：訂單摘要 */}
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">訂單摘要</h3>

                {/* 商品列表 */}
                <div className="space-y-3 mb-4">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-muted-foreground">
                          數量：{item.quantity} × {formatPrice(item.calculatedPrice?.price || item.basePrice)}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatPrice((item.calculatedPrice?.price || item.basePrice) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* 價格計算 */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>商品小計</span>
                    <span>{formatPrice(cartSummary.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>運費</span>
                    <span>{shippingFee === 0 ? '免費' : formatPrice(shippingFee)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>稅額 (5%)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>

                  {cartSummary.hasDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>優惠折扣</span>
                      <span>-{formatPrice(cartSummary.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold">
                  <span>總計</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                    {error}
                  </div>
                )}

                {/* 提交按鈕 */}
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      確認下單
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  點擊「確認下單」即表示同意我們的服務條款
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}