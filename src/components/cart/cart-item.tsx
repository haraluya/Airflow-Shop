'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Minus, 
  Plus, 
  Trash2, 
  Package,
  AlertTriangle 
} from 'lucide-react';
import { CartItem } from '@/lib/types/cart';
import { useCart } from '@/lib/hooks/use-cart';

interface CartItemProps {
  item: CartItem;
  showActions?: boolean;
  compact?: boolean;
}

export function CartItemComponent({ 
  item, 
  showActions = true, 
  compact = false 
}: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === item.quantity || newQuantity < 0 || isUpdating) return;
    
    try {
      setIsUpdating(true);
      setQuantity(newQuantity);
      
      await updateItemQuantity({
        itemId: item.id,
        quantity: newQuantity
      });
    } catch (error) {
      // 恢復原始數量
      setQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await removeItem(item.id);
    } catch (error) {
      // 錯誤處理已在 hook 中完成
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const currentPrice = item.calculatedPrice?.price || item.basePrice;
  const originalPrice = item.calculatedPrice?.originalPrice || item.basePrice;
  const hasDiscount = (item.calculatedPrice?.discountAmount || 0) > 0;
  const itemTotal = currentPrice * item.quantity;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2">
        {/* 商品圖片 */}
        <div className="w-12 h-12 relative bg-muted rounded flex-shrink-0">
          {item.productImage ? (
            <Image
              src={item.productImage}
              alt={item.productName}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/products/${item.productId}`}
            className="text-sm font-medium hover:text-primary line-clamp-1"
          >
            {item.productName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>數量: {item.quantity}</span>
            <span>單價: {formatPrice(currentPrice)}</span>
          </div>
        </div>

        {/* 小計 */}
        <div className="text-right">
          <div className="font-medium text-sm">{formatPrice(itemTotal)}</div>
          {hasDiscount && (
            <div className="text-xs text-green-600">
              已省 {formatPrice((originalPrice - currentPrice) * item.quantity)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex gap-4">
        {/* 商品圖片 */}
        <div className="w-20 h-20 relative bg-muted rounded flex-shrink-0">
          {item.productImage ? (
            <Image
              src={item.productImage}
              alt={item.productName}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link 
                href={`/products/${item.productId}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {item.productName}
              </Link>
              <div className="text-sm text-muted-foreground">
                SKU: {item.productSku}
              </div>
            </div>
            
            {/* 移除按鈕 */}
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveItem}
                disabled={isUpdating}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 價格資訊 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-primary">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
                <Badge variant="destructive" className="text-xs">
                  -{item.calculatedPrice!.discountPercentage.toFixed(0)}%
                </Badge>
              </>
            )}
          </div>

          {/* 優惠規則 */}
          {item.calculatedPrice?.appliedRule && (
            <div className="text-sm text-green-600 mb-3">
              {item.calculatedPrice.appliedRule}
            </div>
          )}

          {/* 數量控制和小計 */}
          <div className="flex items-center justify-between">
            {showActions ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={isUpdating || quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    setQuantity(newQuantity);
                  }}
                  onBlur={() => handleQuantityChange(quantity)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuantityChange(quantity);
                    }
                  }}
                  min="1"
                  disabled={isUpdating}
                  className="w-16 h-8 text-center"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={isUpdating}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                數量: {item.quantity}
              </div>
            )}

            {/* 小計 */}
            <div className="text-right">
              <div className="font-bold text-lg">
                {formatPrice(itemTotal)}
              </div>
              {hasDiscount && (
                <div className="text-sm text-green-600">
                  已省 {formatPrice((originalPrice - currentPrice) * item.quantity)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 更新中提示 */}
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            更新中...
          </div>
        </div>
      )}
    </div>
  );
}