/**
 * 優化版商品服務
 * 支援分頁、快取和效能最佳化
 */

import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Product } from '@/lib/types/product';

export interface ProductsQuery {
  limit?: number;
  startAfter?: DocumentSnapshot;
  filters?: {
    status?: string;
    isVisible?: boolean;
    categoryId?: string;
    brandId?: string;
    priceRange?: [number, number];
    inStock?: boolean;
    isFeatured?: boolean;
    tags?: string[];
  };
  sortBy?: 'name' | 'price' | 'created' | 'popular';
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface ProductsResult {
  products: Product[];
  hasMore: boolean;
  lastDocument?: DocumentSnapshot;
  total: number;
}

// 快取設定
interface CacheEntry {
  data: ProductsResult;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ProductsOptimizedService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5分鐘快取
  private readonly maxCacheSize = 100;

  /**
   * 分頁載入商品
   */
  async getProductsPaginated(queryParams: ProductsQuery): Promise<ProductsResult> {
    const cacheKey = this.generateCacheKey(queryParams);
    
    // 檢查快取
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const constraints: QueryConstraint[] = [];

      // 基本篩選
      if (queryParams.filters?.status) {
        constraints.push(where('status', '==', queryParams.filters.status));
      }
      if (queryParams.filters?.isVisible !== undefined) {
        constraints.push(where('isVisible', '==', queryParams.filters.isVisible));
      }
      if (queryParams.filters?.categoryId) {
        constraints.push(where('categoryId', '==', queryParams.filters.categoryId));
      }
      if (queryParams.filters?.brandId) {
        constraints.push(where('brandId', '==', queryParams.filters.brandId));
      }
      if (queryParams.filters?.isFeatured) {
        constraints.push(where('isFeatured', '==', true));
      }
      if (queryParams.filters?.inStock) {
        constraints.push(where('stock', '>', 0));
      }

      // 排序
      const sortField = queryParams.sortBy || 'createdAt';
      const sortDirection = queryParams.sortDirection || 'desc';
      constraints.push(orderBy(sortField, sortDirection));

      // 分頁
      if (queryParams.startAfter) {
        constraints.push(startAfter(queryParams.startAfter));
      }

      const itemLimit = queryParams.limit || 12;
      constraints.push(limit(itemLimit + 1)); // 多載入一個來檢查是否還有更多

      const q = query(collection(db, COLLECTIONS.PRODUCTS), ...constraints);
      const querySnapshot = await getDocs(q);

      const products: Product[] = [];
      let lastDocument: DocumentSnapshot | undefined;
      let hasMore = false;

      querySnapshot.docs.forEach((doc, index) => {
        if (index < itemLimit) {
          const data = doc.data();
          products.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Product);
          lastDocument = doc;
        } else {
          hasMore = true;
        }
      });

      // 客戶端搜尋篩選 (僅在需要時執行)
      let filteredProducts = products;
      if (queryParams.searchTerm) {
        const searchLower = queryParams.searchTerm.toLowerCase();
        filteredProducts = products.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // 價格範圍篩選 (客戶端)
      if (queryParams.filters?.priceRange) {
        const [min, max] = queryParams.filters.priceRange;
        filteredProducts = filteredProducts.filter(product =>
          product.basePrice >= min && product.basePrice <= max
        );
      }

      // 標籤篩選 (客戶端)
      if (queryParams.filters?.tags && queryParams.filters.tags.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          queryParams.filters!.tags!.some(tag => product.tags.includes(tag))
        );
      }

      const result: ProductsResult = {
        products: filteredProducts,
        hasMore: querySnapshot.docs.length > itemLimit,
        lastDocument: hasMore ? lastDocument : undefined,
        total: filteredProducts.length
      };

      // 儲存到快取
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('分頁載入商品失敗:', error);
      throw error;
    }
  }

  /**
   * 搜尋商品 (優化版)
   */
  async searchProducts(
    searchTerm: string, 
    filters?: ProductsQuery['filters'],
    limit = 20
  ): Promise<Product[]> {
    const queryParams: ProductsQuery = {
      searchTerm,
      filters,
      limit,
      sortBy: 'name',
      sortDirection: 'asc'
    };

    const result = await this.getProductsPaginated(queryParams);
    return result.products;
  }

  /**
   * 取得精選商品 (首頁用)
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const cacheKey = `featured-products-${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached.products;
    }

    const queryParams: ProductsQuery = {
      filters: {
        status: 'active',
        isVisible: true,
        isFeatured: true
      },
      limit,
      sortBy: 'popular',
      sortDirection: 'desc'
    };

    const result = await this.getProductsPaginated(queryParams);
    return result.products;
  }

  /**
   * 取得分類商品統計
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const cacheKey = 'category-stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached.data;
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('status', '==', 'active'),
        where('isVisible', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const stats: Record<string, number> = {};

      querySnapshot.docs.forEach(doc => {
        const product = doc.data() as Product;
        if (product.categoryId) {
          stats[product.categoryId] = (stats[product.categoryId] || 0) + 1;
        }
      });

      this.setCache(cacheKey, { data: stats }, 10 * 60 * 1000); // 10分鐘快取
      return stats;
    } catch (error) {
      console.error('取得分類統計失敗:', error);
      return {};
    }
  }

  /**
   * 清除快取
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 預載入下一頁
   */
  async preloadNextPage(currentQuery: ProductsQuery, lastDocument?: DocumentSnapshot): Promise<void> {
    if (!lastDocument) return;

    const nextQuery: ProductsQuery = {
      ...currentQuery,
      startAfter: lastDocument
    };

    // 在背景載入下一頁，不等待結果
    this.getProductsPaginated(nextQuery).catch(error => {
      console.warn('預載入下一頁失敗:', error);
    });
  }

  // 私有方法

  private generateCacheKey(queryParams: ProductsQuery): string {
    return JSON.stringify({
      filters: queryParams.filters,
      sortBy: queryParams.sortBy,
      sortDirection: queryParams.sortDirection,
      searchTerm: queryParams.searchTerm,
      limit: queryParams.limit,
      startAfter: queryParams.startAfter?.id || null
    });
  }

  private getFromCache(key: string): ProductsResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: ProductsResult, ttl = this.defaultTTL): void {
    // 清理舊快取以避免記憶體洩漏
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}

export const productsOptimizedService = new ProductsOptimizedService();