'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsOptimizedService, ProductsQuery } from '@/lib/services/products-optimized';
import { useAuth } from '@/lib/providers/auth-provider';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VirtualizedProductList } from '@/components/products/virtualized-product-list';
import { 
  Search,
  Grid3X3,
  List,
  Package,
  Loader2
} from 'lucide-react';
import { debounce } from 'lodash';

interface ProductsPageState {
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  error: string | null;
  productsCount: number;
  filters: {
    categoryIds: string[];
    brandIds: string[];
    priceRange: [number, number];
    tags: string[];
    inStock: boolean;
    isFeatured: boolean;
  };
}

function ProductsPageContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [state, setState] = useState<ProductsPageState>({
    searchTerm: searchParams?.get('search') || '',
    sortBy: 'name',
    sortDirection: 'asc',
    viewMode: 'grid',
    error: null,
    productsCount: 0,
    filters: {
      categoryIds: searchParams?.get('category') ? [searchParams.get('category')!] : [],
      brandIds: searchParams?.get('brand') ? [searchParams.get('brand')!] : [],
      priceRange: [0, 10000],
      tags: [],
      inStock: false,
      isFeatured: false
    }
  });

  // 生成查詢參數
  const query: ProductsQuery = {
    filters: {
      status: 'active',
      isVisible: true,
      categoryId: state.filters.categoryIds[0],
      brandId: state.filters.brandIds[0],
      priceRange: state.filters.priceRange,
      inStock: state.filters.inStock,
      isFeatured: state.filters.isFeatured,
      tags: state.filters.tags
    },
    sortBy: state.sortBy as any,
    sortDirection: state.sortDirection,
    searchTerm: state.searchTerm || undefined
  };

  // 防抖搜尋
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setState(prev => ({ ...prev, searchTerm: value }));
    }, 300),
    []
  );

  // 處理排序變更
  const handleSortChange = (sortBy: string) => {
    const [field, direction] = sortBy.split('-');
    setState(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: direction as 'asc' | 'desc'
    }));
  };

  // 處理商品載入完成回調
  const handleProductsLoaded = useCallback((count: number) => {
    setState(prev => ({ ...prev, productsCount: count }));
  }, []);

  // 處理篩選變更
  const handleFiltersChange = (newFilters: typeof state.filters) => {
    setState(prev => ({ ...prev, filters: newFilters }));
  };


  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標頭 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">商品目錄</h1>
          <p className="text-muted-foreground">
            發現優質的電子煙產品，享受專屬價格優惠
          </p>
        </div>

        <div className="flex gap-6">
          {/* 側邊篩選欄 - 桌面版 */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-4">篩選</h3>
              <p>篩選功能開發中...</p>
            </div>
          </aside>

          {/* 主要內容區 */}
          <div className="flex-1">
            {/* 搜尋與排序列 */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* 搜尋框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋商品名稱、SKU或標籤..."
                  defaultValue={state.searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 手機版篩選按鈕 */}
              <div className="lg:hidden">
                <Button variant="outline" size="sm">
                  篩選 (開發中)
                </Button>
              </div>

              {/* 排序選項 */}
              <div className="flex gap-2">
                <Button
                  variant={state.sortBy === 'name' && state.sortDirection === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('name-asc')}
                >
                  名稱 ↑
                </Button>
                <Button
                  variant={state.sortBy === 'price' && state.sortDirection === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('price-asc')}
                >
                  價格 ↑
                </Button>
                <Button
                  variant={state.sortBy === 'price' && state.sortDirection === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('price-desc')}
                >
                  價格 ↓
                </Button>
              </div>

              {/* 檢視模式切換 */}
              <div className="flex border rounded-lg">
                <Button
                  variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 商品數量提示 */}
            {state.productsCount > 0 && (
              <div className="mb-4 text-sm text-muted-foreground">
                目前顯示 {state.productsCount} 個商品
              </div>
            )}

            {/* 錯誤訊息 */}
            {state.error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
                {state.error}
              </div>
            )}

            {/* 虛擬化商品列表 */}
            <VirtualizedProductList
              query={query}
              viewMode={state.viewMode}
              onProductsLoaded={handleProductsLoaded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading 元件
function ProductsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}

// 主要導出元件
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}