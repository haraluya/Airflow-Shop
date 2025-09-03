'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { productsOptimizedService, ProductsQuery } from '@/lib/services/products-optimized';
import { pricingCacheService } from '@/lib/services/pricing-cache';
import { useAuth } from '@/lib/providers/auth-provider';
import { Product } from '@/lib/types/product';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/hooks/use-cart';
import { 
  Package,
  ShoppingCart,
  Eye,
  Heart,
  Lock,
  LogIn,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ProductImage } from '@/components/ui/optimized-image';

interface ProductWithPrice extends Product {
  calculatedPrice?: {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
  };
}

interface VirtualizedProductListProps {
  query: ProductsQuery;
  viewMode: 'grid' | 'list';
  onProductsLoaded?: (count: number) => void;
}

export function VirtualizedProductList({ 
  query, 
  viewMode, 
  onProductsLoaded 
}: VirtualizedProductListProps) {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDocument, setLastDocument] = useState<DocumentSnapshot>();
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();
  const priceCalculationQueue = useRef(new Set<string>());

  // 載入初始商品
  const loadInitialProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await productsOptimizedService.getProductsPaginated({
        ...query,
        limit: 12
      });

      const productsWithoutPrices = result.products.map(product => ({
        ...product,
        calculatedPrice: undefined
      }));

      setProducts(productsWithoutPrices);
      setHasMore(result.hasMore);
      setLastDocument(result.lastDocument);
      onProductsLoaded?.(result.products.length);

      // 背景計算價格 (僅對已登入用戶)
      if (user && profile) {
        calculatePricesInBackground(result.products);
      }
    } catch (err) {
      console.error('載入商品失敗:', err);
      setError('載入商品失敗，請重試');
    } finally {
      setLoading(false);
    }
  }, [query, user, profile, onProductsLoaded]);

  // 載入更多商品
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocument) return;

    try {
      setLoadingMore(true);
      
      const result = await productsOptimizedService.getProductsPaginated({
        ...query,
        startAfter: lastDocument,
        limit: 12
      });

      const newProductsWithoutPrices = result.products.map(product => ({
        ...product,
        calculatedPrice: undefined
      }));

      setProducts(prev => [...prev, ...newProductsWithoutPrices]);
      setHasMore(result.hasMore);
      setLastDocument(result.lastDocument);

      // 背景計算新商品的價格
      if (user && profile) {
        calculatePricesInBackground(result.products);
      }

      // 預載入下一頁
      if (result.hasMore && result.lastDocument) {
        productsOptimizedService.preloadNextPage(query, result.lastDocument);
      }
    } catch (err) {
      console.error('載入更多商品失敗:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [query, loadingMore, hasMore, lastDocument, user, profile]);

  // 背景計算價格
  const calculatePricesInBackground = useCallback(async (newProducts: Product[]) => {
    if (!user || !profile) return;

    for (const product of newProducts) {
      if (priceCalculationQueue.current.has(product.id)) continue;
      
      priceCalculationQueue.current.add(product.id);
      
      try {
        const priceResult = await pricingCacheService.calculatePrice({
          productId: product.id,
          customerId: profile.id,
          quantity: 1,
          basePrice: product.basePrice
        });

        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, calculatedPrice: priceResult }
            : p
        ));
      } catch (error) {
        console.error('計算商品價格失敗:', product.id, error);
        
        // 設置預設價格
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { 
                ...p, 
                calculatedPrice: {
                  price: product.basePrice,
                  originalPrice: product.basePrice,
                  discountAmount: 0,
                  discountPercentage: 0
                }
              }
            : p
        ));
      } finally {
        priceCalculationQueue.current.delete(product.id);
      }
    }
  }, [user, profile]);

  // 設置 Intersection Observer
  const lastProductRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreProducts();
      }
    }, { threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadingMore, loadMoreProducts]);

  // 初始載入
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  // 錯誤狀態
  if (error && products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadInitialProducts}>重新載入</Button>
      </div>
    );
  }

  // 載入狀態
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 空狀態
  if (products.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">沒有找到商品</h3>
        <p className="text-muted-foreground">
          請嘗試調整搜尋條件或瀏覽其他分類
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Grid 檢視 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              ref={index === products.length - 1 ? lastProductRef : null}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* List 檢視 */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              ref={index === products.length - 1 ? lastProductRef : null}
            >
              <ProductListItem product={product} />
            </div>
          ))}
        </div>
      )}

      {/* 載入更多指示器 */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* 載入完成指示器 */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          已顯示所有商品
        </div>
      )}
    </>
  );
}

// 優化版商品卡片元件
function ProductCard({ product }: { product: ProductWithPrice }) {
  const { user } = useAuth();
  const { addItem, isInCart, getItemQuantity } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsAddingToCart(true);
      await addItem({ productId: product.id, quantity: 1 });
    } catch (error) {
      // 錯誤處理已在 hook 中完成
    } finally {
      setIsAddingToCart(false);
    }
  };

  const inCartQuantity = getItemQuantity(product.id);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.id}`}>
        {/* 商品圖片 - 優化版懶載入 */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          {product.images.length > 0 ? (
            <ProductImage
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              variant="card"
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
              {user ? (
                // 已登入用戶 - 顯示實際價格
                product.calculatedPrice ? (
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
                  // 價格計算中
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse bg-muted h-4 w-16 rounded" />
                  </div>
                )
              ) : (
                // 未登入用戶 - 顯示會員限定提示
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    會員限定價格
                  </span>
                </div>
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
        {user ? (
          // 已登入用戶 - 顯示購物車功能
          inCartQuantity > 0 ? (
            <div className="space-y-2">
              <Button size="sm" className="w-full" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                已在購物車 ({inCartQuantity})
              </Button>
              <Button size="sm" className="w-full" onClick={handleAddToCart} disabled={isAddingToCart}>
                {isAddingToCart ? '加入中...' : '再加一個'}
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="w-full" 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAddingToCart ? '加入中...' : '加入購物車'}
            </Button>
          )
        ) : (
          // 未登入用戶 - 顯示登入提示
          <div className="space-y-2">
            <Button size="sm" className="w-full" variant="outline" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                登入查看價格
              </Link>
            </Button>
            <Button size="sm" className="w-full" variant="ghost" asChild>
              <Link href="/register">
                註冊成為會員
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// 優化版商品列表項目元件
function ProductListItem({ product }: { product: ProductWithPrice }) {
  const { user } = useAuth();
  const { addItem, isInCart, getItemQuantity } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsAddingToCart(true);
      await addItem({ productId: product.id, quantity: 1 });
    } catch (error) {
      // 錯誤處理已在 hook 中完成
    } finally {
      setIsAddingToCart(false);
    }
  };

  const inCartQuantity = getItemQuantity(product.id);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="flex items-center gap-4">
          {/* 商品圖片 - 優化版懶載入 */}
          <div className="w-20 h-20 relative overflow-hidden rounded bg-muted flex-shrink-0">
            {product.images.length > 0 ? (
              <ProductImage
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                variant="list"
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
            {user ? (
              // 已登入用戶 - 顯示實際價格
              product.calculatedPrice ? (
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
                // 價格計算中
                <div className="animate-pulse bg-muted h-6 w-20 rounded" />
              )
            ) : (
              // 未登入用戶 - 顯示會員限定提示
              <div className="flex items-center gap-2 text-right">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  會員限定價格
                </span>
              </div>
            )}

            {user ? (
              // 已登入用戶 - 顯示購物車功能
              inCartQuantity > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground text-center">
                    購物車中: {inCartQuantity} 件
                  </div>
                  <Button size="sm" onClick={handleAddToCart} disabled={isAddingToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAddingToCart ? '加入中...' : '再加一個'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleAddToCart} disabled={isAddingToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {isAddingToCart ? '加入中...' : '加入購物車'}
                </Button>
              )
            ) : (
              // 未登入用戶 - 顯示登入按鈕
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    登入查看價格
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/register">
                    註冊成為會員
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}