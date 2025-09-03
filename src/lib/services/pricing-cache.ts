/**
 * 價格計算快取服務
 * 減少重複的價格計算 API 調用，提升效能
 */

import { pricingEngine } from '@/lib/firebase/pricing';

interface PriceCalculationParams {
  productId: string;
  customerId?: string;
  quantity: number;
  basePrice: number;
}

interface PriceResult {
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  appliedRule?: string;
}

interface CachedPrice {
  result: PriceResult;
  timestamp: number;
  ttl: number;
}

class PricingCacheService {
  private cache = new Map<string, CachedPrice>();
  private readonly defaultTTL = 15 * 60 * 1000; // 15分鐘快取
  private readonly maxCacheSize = 1000;
  private pendingCalculations = new Map<string, Promise<PriceResult>>();

  /**
   * 計算商品價格 (帶快取)
   */
  async calculatePrice(params: PriceCalculationParams): Promise<PriceResult> {
    const cacheKey = this.generateCacheKey(params);
    
    // 檢查快取
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 檢查是否有正在進行的計算
    const pending = this.pendingCalculations.get(cacheKey);
    if (pending) {
      return pending;
    }

    // 開始新的計算
    const calculationPromise = this.performCalculation(params);
    this.pendingCalculations.set(cacheKey, calculationPromise);

    try {
      const result = await calculationPromise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingCalculations.delete(cacheKey);
    }
  }

  /**
   * 批量計算價格
   */
  async calculatePricesBatch(requests: PriceCalculationParams[]): Promise<PriceResult[]> {
    const promises = requests.map(params => this.calculatePrice(params));
    return Promise.all(promises);
  }

  /**
   * 預計算價格 (背景執行)
   */
  async precomputePrices(requests: PriceCalculationParams[]): Promise<void> {
    // 在背景計算價格，不等待結果
    requests.forEach(params => {
      this.calculatePrice(params).catch(error => {
        console.warn('預計算價格失敗:', params.productId, error);
      });
    });
  }

  /**
   * 清除特定客戶的價格快取
   */
  clearCustomerCache(customerId: string): void {
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(`customer:${customerId}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除特定商品的價格快取
   */
  clearProductCache(productId: string): void {
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(`product:${productId}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除所有快取
   */
  clearAllCache(): void {
    this.cache.clear();
    this.pendingCalculations.clear();
  }

  /**
   * 取得快取統計
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      pendingCalculations: this.pendingCalculations.size,
      maxSize: this.maxCacheSize
    };
  }

  // 私有方法

  private async performCalculation(params: PriceCalculationParams): Promise<PriceResult> {
    try {
      return await pricingEngine.calculatePrice(params);
    } catch (error) {
      // 如果計算失敗，返回基礎價格
      console.warn('價格計算失敗，使用基礎價格:', params.productId, error);
      return {
        price: params.basePrice,
        originalPrice: params.basePrice,
        discountAmount: 0,
        discountPercentage: 0
      };
    }
  }

  private generateCacheKey(params: PriceCalculationParams): string {
    const { productId, customerId = 'anonymous', quantity, basePrice } = params;
    return `product:${productId}|customer:${customerId}|quantity:${quantity}|basePrice:${basePrice}`;
  }

  private getFromCache(key: string): PriceResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  private setCache(key: string, result: PriceResult, ttl = this.defaultTTL): void {
    // 清理舊快取以避免記憶體洩漏
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }
}

export const pricingCacheService = new PricingCacheService();

/**
 * React Hook 用於批量價格計算
 */
export function useBatchPricing() {
  return {
    calculatePricesBatch: pricingCacheService.calculatePricesBatch.bind(pricingCacheService),
    precomputePrices: pricingCacheService.precomputePrices.bind(pricingCacheService),
    clearCache: pricingCacheService.clearAllCache.bind(pricingCacheService)
  };
}

/**
 * 價格計算佇列管理
 * 防止同時計算太多價格造成效能問題
 */
class PricingQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = false;
  private concurrency = 5; // 最多同時計算5個價格

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running || this.queue.length === 0) return;

    this.running = true;
    const batch = this.queue.splice(0, this.concurrency);
    
    try {
      await Promise.all(batch.map(task => task()));
    } finally {
      this.running = false;
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }
}

export const pricingQueue = new PricingQueue();