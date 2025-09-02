'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsService } from '@/lib/firebase/products';
import { pricingEngine } from '@/lib/firebase/pricing';
import { useAuth } from '@/lib/providers/auth-provider';
import { Product } from '@/lib/types/product';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  Package,
  Star,
  ShoppingCart,
  Eye,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductWithPrice extends Product {
  calculatedPrice?: {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
  };
}

interface ProductsPageState {
  products: ProductWithPrice[];
  isLoading: boolean;
  searchTerm: string;
  selectedCategory: string;
  selectedBrand: string;
  sortBy: 'name' | 'price' | 'created' | 'popular';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  currentPage: number;
  totalPages: number;
  error: string | null;
}

export default function ProductsPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  
  const [state, setState] = useState<ProductsPageState>({
    products: [],
    isLoading: true,
    searchTerm: searchParams?.get('search') || '',
    selectedCategory: searchParams?.get('category') || '',
    selectedBrand: searchParams?.get('brand') || '',
    sortBy: 'name',
    sortOrder: 'asc',
    viewMode: 'grid',
    currentPage: 1,
    totalPages: 1,
    error: null
  });

  useEffect(() => {
    loadProducts();
  }, [state.searchTerm, state.selectedCategory, state.selectedBrand, state.sortBy, state.sortOrder, state.currentPage]);

  const loadProducts = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await productsService.getProducts({
        limit: 12,
        page: state.currentPage,
        filters: {
          search: state.searchTerm || undefined,
          categoryId: state.selectedCategory || undefined,
          brandId: state.selectedBrand || undefined,
          status: 'active'
        },
        sortBy: state.sortOrder === 'desc' && state.sortBy === 'price' 
          ? 'price-desc' 
          : state.sortOrder === 'asc' && state.sortBy === 'price'
          ? 'price-asc'
          : state.sortBy === 'name'
          ? 'name'
          : 'created-desc'
      });

      // 計算每個商品的價格
      const productsWithPrices = await Promise.all(
        result.products.map(async (product) => {
          try {
            const priceResult = await pricingEngine.calculatePrice({
              productId: product.id,
              customerId: profile?.id,
              quantity: 1,
              basePrice: product.basePrice
            });

            return {
              ...product,
              calculatedPrice: priceResult
            };
          } catch (error) {
            console.error('計算商品價格失敗:', product.id, error);
            return {
              ...product,
              calculatedPrice: {
                price: product.basePrice,
                originalPrice: product.basePrice,
                discountAmount: 0,
                discountPercentage: 0
              }
            };
          }
        })
      );

      setState(prev => ({
        ...prev,
        products: productsWithPrices,
        totalPages: Math.ceil(result.total / 12),
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

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy: sortBy as any, sortOrder, currentPage: 1 }));
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
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
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標頭 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">商品目錄</h1>
          <p className="text-muted-foreground">
            發現優質的電子煙產品，享受專屬價格優惠
          </p>
        </div>

        {/* 搜尋與篩選列 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* 搜尋框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋商品..."
              value={state.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 排序選項 */}
          <div className="flex gap-2">
            <Button
              variant={state.sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('name', state.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              名稱 {state.sortBy === 'name' && (state.sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={state.sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('price', state.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              價格 {state.sortBy === 'price' && (state.sortOrder === 'asc' ? '↑' : '↓')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {state.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* List 檢視 */}
            {state.viewMode === 'list' && (
              <div className="space-y-4 mb-8">
                {state.products.map((product) => (
                  <ProductListItem key={product.id} product={product} />
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
  );
}

// 商品卡片元件 (Grid 模式)
function ProductCard({ product }: { product: ProductWithPrice }) {
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
          
          {/* 折扣標籤 */}
          {product.calculatedPrice?.discountPercentage && product.calculatedPrice.discountPercentage > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              -{product.calculatedPrice.discountPercentage.toFixed(0)}%
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

          {/* 價格區域 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {product.calculatedPrice ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      ${product.calculatedPrice.price.toFixed(2)}
                    </span>
                    {product.calculatedPrice.discountAmount > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${product.calculatedPrice.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.calculatedPrice.appliedRule && (
                    <p className="text-xs text-green-600">
                      {product.calculatedPrice.appliedRule}
                    </p>
                  )}
                </>
              ) : (
                <span className="font-bold text-primary">
                  ${product.basePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* 快速操作 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>

      {/* 購物車按鈕 */}
      <div className="px-4 pb-4">
        <Button size="sm" className="w-full">
          <ShoppingCart className="mr-2 h-4 w-4" />
          加入購物車
        </Button>
      </div>
    </Card>
  );
}

// 商品列表項目元件 (List 模式)
function ProductListItem({ product }: { product: ProductWithPrice }) {
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
            {product.calculatedPrice ? (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-primary">
                    ${product.calculatedPrice.price.toFixed(2)}
                  </span>
                  {product.calculatedPrice.discountAmount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.calculatedPrice.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.calculatedPrice.appliedRule && (
                  <p className="text-xs text-green-600">
                    {product.calculatedPrice.appliedRule}
                  </p>
                )}
              </div>
            ) : (
              <span className="font-bold text-lg text-primary">
                ${product.basePrice.toFixed(2)}
              </span>
            )}

            <Button size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              加入購物車
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}