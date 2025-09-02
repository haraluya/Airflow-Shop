'use client';

import { useState, useEffect, useCallback } from 'react';
import { cartService } from '@/lib/firebase/cart';
import { Cart, CartSummary, AddToCartRequest, UpdateCartItemRequest } from '@/lib/types/cart';
import { useAuth } from '@/lib/providers/auth-provider';

export function useCart() {
  const { user, profile } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入購物車
  const loadCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userCart = await cartService.getCart(user.uid);
      setCart(userCart);
      setError(null);
    } catch (err) {
      console.error('載入購物車失敗:', err);
      setError('載入購物車失敗');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 初始化和監聽購物車變化
  useEffect(() => {
    if (!user) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    // 訂閱購物車變化
    const unsubscribe = cartService.subscribeToCart(user.uid, (updatedCart) => {
      setCart(updatedCart);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // 加入商品到購物車
  const addItem = useCallback(async (request: AddToCartRequest) => {
    if (!user) {
      setError('請先登入');
      return;
    }

    try {
      setError(null);
      await cartService.addItem(user.uid, request, profile?.id);
    } catch (err: any) {
      console.error('加入購物車失敗:', err);
      setError(err.message || '加入購物車失敗');
      throw err;
    }
  }, [user, profile]);

  // 移除購物車項目
  const removeItem = useCallback(async (itemId: string) => {
    if (!user) {
      setError('請先登入');
      return;
    }

    try {
      setError(null);
      await cartService.removeItem(user.uid, itemId);
    } catch (err: any) {
      console.error('移除購物車項目失敗:', err);
      setError(err.message || '移除購物車項目失敗');
      throw err;
    }
  }, [user]);

  // 更新商品數量
  const updateItemQuantity = useCallback(async (request: UpdateCartItemRequest) => {
    if (!user) {
      setError('請先登入');
      return;
    }

    try {
      setError(null);
      await cartService.updateItemQuantity(user.uid, request, profile?.id);
    } catch (err: any) {
      console.error('更新購物車項目失敗:', err);
      setError(err.message || '更新購物車項目失敗');
      throw err;
    }
  }, [user, profile]);

  // 清空購物車
  const clearCart = useCallback(async () => {
    if (!user) {
      setError('請先登入');
      return;
    }

    try {
      setError(null);
      await cartService.clearCart(user.uid);
    } catch (err: any) {
      console.error('清空購物車失敗:', err);
      setError(err.message || '清空購物車失敗');
      throw err;
    }
  }, [user]);

  // 取得購物車統計
  const getCartSummary = useCallback((): CartSummary => {
    if (!cart || !cart.items.length) {
      return {
        totalItems: 0,
        subtotal: 0,
        discountAmount: 0,
        totalAmount: 0,
        hasDiscount: false
      };
    }

    return {
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      totalAmount: cart.totalAmount,
      hasDiscount: cart.discountAmount > 0
    };
  }, [cart]);

  // 檢查商品是否已在購物車中
  const isInCart = useCallback((productId: string): boolean => {
    return cart?.items.some(item => item.productId === productId) || false;
  }, [cart]);

  // 取得商品在購物車中的數量
  const getItemQuantity = useCallback((productId: string): number => {
    const item = cart?.items.find(item => item.productId === productId);
    return item?.quantity || 0;
  }, [cart]);

  return {
    // 狀態
    cart,
    isLoading,
    error,
    
    // 動作
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    loadCart,
    
    // 工具函數
    getCartSummary,
    isInCart,
    getItemQuantity,
    
    // 計算屬性
    isEmpty: !cart || cart.items.length === 0,
    itemCount: cart?.totalItems || 0,
    totalAmount: cart?.totalAmount || 0
  };
}