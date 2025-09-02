'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  ArrowRight,
  Gift,
  Calculator
} from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import Link from 'next/link';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  showTitle?: boolean;
  className?: string;
}

export function CartSummary({ 
  showCheckoutButton = true, 
  showTitle = true,
  className = '' 
}: CartSummaryProps) {
  const { cart, getCartSummary, isEmpty, isLoading } = useCart();
  const summary = getCartSummary();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-24"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">購物車是空的</h3>
        <p className="text-sm text-muted-foreground mb-4">
          快去挑選一些商品吧！
        </p>
        <Button asChild>
          <Link href="/products">
            開始購物
          </Link>
        </Button>
      </Card>
    );
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Card className={`p-6 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5" />
          <h3 className="font-semibold">訂單摘要</h3>
        </div>
      )}

      <div className="space-y-4">
        {/* 商品統計 */}
        <div className="flex justify-between text-sm">
          <span>商品數量</span>
          <span>{summary.totalItems} 件</span>
        </div>

        {/* 小計 */}
        <div className="flex justify-between">
          <span>商品小計</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </div>

        {/* 折扣 */}
        {summary.hasDiscount && (
          <div className="flex justify-between text-green-600">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>優惠折扣</span>
            </div>
            <span>-{formatPrice(summary.discountAmount)}</span>
          </div>
        )}

        <Separator />

        {/* 總計 */}
        <div className="flex justify-between text-lg font-bold">
          <span>總計</span>
          <span className="text-primary">{formatPrice(summary.totalAmount)}</span>
        </div>

        {/* 節省金額 */}
        {summary.hasDiscount && (
          <div className="text-center">
            <Badge variant="secondary" className="text-green-600">
              您已節省 {formatPrice(summary.discountAmount)}
            </Badge>
          </div>
        )}

        {/* 結帳按鈕 */}
        {showCheckoutButton && (
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout">
                <ShoppingCart className="mr-2 h-4 w-4" />
                前往結帳
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/products">
                繼續購物
              </Link>
            </Button>
          </div>
        )}

        {/* 購物車項目列表 */}
        {cart && cart.items.length > 0 && (
          <div className="pt-4">
            <div className="text-sm font-medium mb-2">購物車內容</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-muted-foreground ml-2">
                      × {item.quantity}
                    </span>
                  </div>
                  <span>
                    {formatPrice((item.calculatedPrice?.price || item.basePrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 額外資訊 */}
        <div className="pt-4 text-xs text-muted-foreground space-y-1">
          <p>• 價格已包含所有適用的折扣</p>
          <p>• 運費將在結帳時計算</p>
          <p>• 支援多種付款方式</p>
        </div>
      </div>
    </Card>
  );
}