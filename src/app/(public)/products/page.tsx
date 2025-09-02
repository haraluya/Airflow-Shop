'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsService } from '@/lib/firebase/products';
import { Product } from '@/lib/types/product';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Grid3X3,
  List,
  Package,
  Lock,
  User
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { debounce } from 'lodash';

interface PublicProductsPageState {
  products: Product[];
  allProducts: Product[];
  isLoading: boolean;
  searchTerm: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
  totalPages: number;
  error: string | null;
  filters: {
    categoryIds: string[];
    brandIds: string[];
    tags: string[];
    inStock: boolean;
    isFeatured: boolean;
  };
}

export default function PublicProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [state, setState] = useState<PublicProductsPageState>({
    products: [],
    allProducts: [],
    isLoading: true,
    searchTerm: searchParams?.get('search') || '',
    sortBy: 'name-asc',
    viewMode: 'grid',
    currentPage: 1,
    totalPages: 1,
    error: null,
    filters: {
      categoryIds: searchParams?.get('category') ? [searchParams.get('category')!] : [],
      brandIds: searchParams?.get('brand') ? [searchParams.get('brand')!] : [],
      tags: [],
      inStock: false,
      isFeatured: false
    }
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [state.allProducts, state.searchTerm, state.filters, state.sortBy, state.currentPage]);

  const loadProducts = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 載入所有可見商品
      const result = await productsService.getProducts({
        limit: 1000,
        filters: {
          status: 'active',
          isVisible: true
        }
      });

      setState(prev => ({
        ...prev,
        allProducts: result.products,
        products: result.products,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('載入商品失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入商品失敗'
      }));
    }
  };

  const applyFiltersAndSort = () => {
    let filteredProducts = [...state.allProducts];

    // 搜尋篩選
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 分類篩選
    if (state.filters.categoryIds.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        state.filters.categoryIds.includes(product.categoryId)
      );
    }

    // 品牌篩選
    if (state.filters.brandIds.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.brandId && state.filters.brandIds.includes(product.brandId)
      );
    }

    // 庫存篩選
    if (state.filters.inStock) {
      filteredProducts = filteredProducts.filter(product => product.stock > 0);
    }

    // 精選篩選
    if (state.filters.isFeatured) {
      filteredProducts = filteredProducts.filter(product => product.isFeatured);
    }

    // 排序
    filteredProducts.sort((a, b) => {
      switch (state.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc':
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          return dateB.getTime() - dateA.getTime();
        case 'popular':
          return b.orderCount - a.orderCount;
        default:
          return 0;
      }
    });

    // 分頁
    const itemsPerPage = 12;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (state.currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    setState(prev => ({
      ...prev,
      products: paginatedProducts,
      totalPages
    }));
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
    }, 300),
    []
  );

  const handleSortChange = (value: string) => {
    setState(prev => ({ ...prev, sortBy: value, currentPage: 1 }));
  };

  if (state.isLoading && state.products.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 會員登入提示橫幅 */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                會員專享價格與購買功能
              </span>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  會員登入
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  立即註冊
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 頁面標頭 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">商品展示</h1>
          <p className="text-muted-foreground">
            探索我們的優質電子煙產品，註冊會員即可查看專屬價格
          </p>
        </div>

        <div className="flex gap-6">
          {/* 側邊篩選欄 - 桌面版 */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-4">篩選</h3>
              <p className="text-sm text-muted-foreground">篩選功能開發中...</p>
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

              {/* 排序選項 */}
              <div className="flex gap-2">
                <Button
                  variant={state.sortBy === 'name-asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('name-asc')}
                >
                  名稱 ↑
                </Button>
                <Button
                  variant={state.sortBy === 'created-desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('created-desc')}
                >
                  最新 ↓
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
            <div className="mb-4 text-sm text-muted-foreground">
              找到 {state.allProducts.length} 個商品，目前顯示 {state.products.length} 個
            </div>

            {/* 錯誤訊息 */}
            {state.error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
                {state.error}
              </div>
            )}

            {/* 商品列表 */}
            {state.products.length === 0 && !state.isLoading ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">沒有找到商品</h3>
                <p className="text-muted-foreground">
                  請嘗試調整搜尋條件或瀏覽其他分類
                </p>
              </div>
            ) : (
              <>
                {/* Grid 檢視 */}
                {state.viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {state.products.map((product) => (
                      <PublicProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* List 檢視 */}
                {state.viewMode === 'list' && (
                  <div className="space-y-4 mb-8">
                    {state.products.map((product) => (
                      <PublicProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* 分頁 */}
                {state.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={state.currentPage === 1}
                      onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    >
                      上一頁
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {state.currentPage} 頁，共 {state.totalPages} 頁
                    </span>
                    <Button
                      variant="outline"
                      disabled={state.currentPage === state.totalPages}
                      onClick={() => setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    >
                      下一頁
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 公開商品卡片元件 (Grid 模式) - 不顯示價格
function PublicProductCard({ product }: { product: Product }) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.id}`}>
        {/* 商品圖片 */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          {product.images.length > 0 ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* 特色標籤 */}
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2 bg-primary">
              精選
            </Badge>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.shortDescription && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* 價格區域 - 顯示會員限定 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                會員限定價格
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* 登入提示按鈕 */}
      <div className="px-4 pb-4">
        <Link href="/login">
          <Button size="sm" variant="outline" className="w-full">
            <User className="mr-2 h-4 w-4" />
            登入查看價格
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// 公開商品列表項目元件 (List 模式) - 不顯示價格
function PublicProductListItem({ product }: { product: Product }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="flex items-center gap-4">
          {/* 商品圖片 */}
          <div className="w-20 h-20 relative overflow-hidden rounded bg-muted flex-shrink-0">
            {product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 商品資訊 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {product.shortDescription}
              </p>
            )}
            
            {/* 標籤 */}
            <div className="flex gap-2 mb-2">
              {product.isFeatured && (
                <Badge variant="secondary" className="text-xs">精選</Badge>
              )}
              {product.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 價格與操作 */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                會員限定價格
              </span>
            </div>

            <Link href="/login">
              <Button size="sm" variant="outline">
                <User className="mr-2 h-4 w-4" />
                登入查看
              </Button>
            </Link>
          </div>
        </div>
      </Link>
    </Card>
  );
}