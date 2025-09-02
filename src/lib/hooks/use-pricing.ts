import { useState, useCallback } from 'react';
import { pricingEngine } from '@/lib/firebase/pricing';

interface PricingResult {
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedRule?: string;
  tieredPricing?: any;
}

interface UsePricingReturn {
  calculatePrice: (params: {
    productId: string;
    customerId?: string;
    quantity: number;
    basePrice: number;
  }) => Promise<PricingResult>;
  calculateBulkPrices: (items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
  }>, customerId?: string) => Promise<Array<PricingResult & { productId: string }>>;
  isCalculating: boolean;
  error: string | null;
}

export function usePricing(): UsePricingReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (params: {
    productId: string;
    customerId?: string;
    quantity: number;
    basePrice: number;
  }): Promise<PricingResult> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await pricingEngine.calculatePrice(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '價格計算失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const calculateBulkPrices = useCallback(async (
    items: Array<{
      productId: string;
      quantity: number;
      basePrice: number;
    }>,
    customerId?: string
  ): Promise<Array<PricingResult & { productId: string }>> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const results = await pricingEngine.calculateBulkPrices(items, customerId);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量價格計算失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    calculatePrice,
    calculateBulkPrices,
    isCalculating,
    error
  };
}

// 格式化價格顯示的工具函數
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

// 計算折扣百分比
export const calculateDiscountPercentage = (originalPrice: number, finalPrice: number): number => {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100 * 100) / 100;
};

// 格式化折扣顯示
export const formatDiscount = (discountAmount: number, discountPercentage: number): string => {
  if (discountAmount === 0) return '';
  
  const formattedAmount = formatPrice(discountAmount);
  const formattedPercentage = `${discountPercentage.toFixed(1)}%`;
  
  return `節省 ${formattedAmount} (${formattedPercentage})`;
};