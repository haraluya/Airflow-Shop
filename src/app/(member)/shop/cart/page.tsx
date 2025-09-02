'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartItemComponent } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { 
  ShoppingCart, 
  ArrowLeft,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuth } from '@/lib/providers/auth-provider';
import Link from 'next/link';
import { useState } from 'react';

export default function CartPage() {
  const { user } = useAuth();
  const { cart, clearCart, isEmpty, isLoading, error, loadCart } = useCart();
  const [isClearingCart, setIsClearingCart] = useState(false);

  // 未登入提示
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">請先登入</h1>
            <p className="text-muted-foreground mb-6">
              您需要登入帳戶才能查看購物車
            </p>
            <div className="space-x-4">
              <Button asChild>
                <Link href="/login" className="flex items-center justify-center">
                  登入帳戶
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products" className="flex items-center justify-center">
                  繼續瀏覽商品
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-4 bg-muted rounded w-48"></div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
              <div className="h-80 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 清空購物車
  const handleClearCart = async () => {
    try {
      setIsClearingCart(true);
      await clearCart();
    } catch (error) {
      console.error('清空購物車失敗:', error);
    } finally {
      setIsClearingCart(false);
    }
  };

  // 重新載入購物車
  const handleReload = async () => {
    await loadCart();
  };

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
              <h1 className="text-3xl font-bold tracking-tight mb-2">購物車</h1>
              <p className="text-muted-foreground">
                {isEmpty ? '您的購物車是空的' : `共 ${cart?.totalItems || 0} 件商品`}
              </p>
            </div>

            {/* 操作按鈕 */}
            {!isEmpty && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReload}
                  disabled={isLoading}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  重新載入
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCart}
                  disabled={isClearingCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  清空購物車
                </Button>
              </div>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {/* 購物車內容 */}
          {isEmpty ? (
            <CartSummary showTitle={false} />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* 購物車項目列表 */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">購物車商品</h2>
                    <div className="text-sm text-muted-foreground">
                      {cart?.items.length} 種商品
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cart?.items.map((item, index) => (
                      <div key={item.id}>
                        <CartItemComponent item={item} />
                        {index < cart.items.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* 訂單摘要 */}
              <div>
                <CartSummary />
              </div>
            </div>
          )}

          {/* 推薦商品區塊 */}
          {!isEmpty && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">您可能還喜歡</h2>
              <div className="text-center py-8 text-muted-foreground">
                推薦商品功能開發中...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}