'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/lib/firebase/products';
import { categoriesService } from '@/lib/firebase/categories';
import { brandsService } from '@/lib/firebase/brands';
import { Product, Category, Brand, ProductFilters, PRODUCT_STATUS, ProductStatus } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Filter,
  Package, 
  Eye,
  Edit,
  Trash2,
  Star,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface ProductsPageState {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  isLoading: boolean;
  searchQuery: string;
  filters: ProductFilters;
  stats: {
    total: number;
    active: number;
    lowStock: number;
    draft: number;
  } | null;
  selectedProducts: Set<string>;
  error: string | null;
}

const statusConfig = {
  [PRODUCT_STATUS.ACTIVE]: {
    label: '已上架',
    className: 'bg-green-100 text-green-800'
  },
  [PRODUCT_STATUS.INACTIVE]: {
    label: '已下架',
    className: 'bg-red-100 text-red-800'
  },
  [PRODUCT_STATUS.DRAFT]: {
    label: '草稿',
    className: 'bg-gray-100 text-gray-800'
  },
  [PRODUCT_STATUS.ARCHIVED]: {
    label: '已封存',
    className: 'bg-orange-100 text-orange-800'
  }
};

export default function ProductsPage() {
  const [state, setState] = useState<ProductsPageState>({
    products: [],
    categories: [],
    brands: [],
    isLoading: true,
    searchQuery: '',
    filters: {},
    stats: null,
    selectedProducts: new Set(),
    error: null
  });

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [productsResult, categories, brands, stats] = await Promise.all([
        productsService.getProducts({
          limit: 50,
          filters: {
            ...state.filters,
            search: state.searchQuery || undefined
          }
        }),
        categoriesService.getActiveCategories(),
        brandsService.getActiveBrands(),
        productsService.getProductStats()
      ]);
      
      setState(prev => ({
        ...prev,
        products: productsResult.products,
        categories,
        brands,
        stats,
        isLoading: false
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

  useEffect(() => {
    loadData();
  }, [state.filters]);

  const handleSearch = () => {
    loadData();
  };

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {},
      searchQuery: ''
    }));
  };

  const handleSelectProduct = (productId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedProducts);
      if (selected) {
        newSelected.add(productId);
      } else {
        newSelected.delete(productId);
      }
      return { ...prev, selectedProducts: newSelected };
    });
  };

  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedProducts: selected 
        ? new Set(prev.products.map(p => p.id))
        : new Set()
    }));
  };

  if (state.isLoading && !state.products.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
          <p className="text-muted-foreground">
            管理所有商品、分類與價格設定
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/products/categories">
              <Package className="mr-2 h-4 w-4" />
              分類管理
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/products/brands">
              品牌管理
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              新增商品
            </Link>
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      {state.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">總商品數</p>
                <p className="text-xl font-bold">{state.stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">已上架</p>
                <p className="text-xl font-bold">{state.stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">低庫存</p>
                <p className="text-xl font-bold">{state.stats.lowStock}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Edit className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">草稿</p>
                <p className="text-xl font-bold">{state.stats.draft}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋商品名稱、SKU或描述..."
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            <Button onClick={handleSearch} disabled={state.isLoading}>
              搜尋
            </Button>
            
            {(state.searchQuery || Object.keys(state.filters).length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                清除篩選
              </Button>
            )}
          </div>

          {/* 篩選選項 */}
          <div className="flex items-center space-x-4">
            <select
              className="px-3 py-2 border border-input rounded-md text-sm"
              value={state.filters.status || ''}
              onChange={(e) => handleFilterChange({ 
                status: e.target.value as ProductStatus || undefined 
              })}
            >
              <option value="">所有狀態</option>
              <option value={PRODUCT_STATUS.ACTIVE}>已上架</option>
              <option value={PRODUCT_STATUS.INACTIVE}>已下架</option>
              <option value={PRODUCT_STATUS.DRAFT}>草稿</option>
              <option value={PRODUCT_STATUS.ARCHIVED}>已封存</option>
            </select>

            <select
              className="px-3 py-2 border border-input rounded-md text-sm"
              value={state.filters.categoryId || ''}
              onChange={(e) => handleFilterChange({ 
                categoryId: e.target.value || undefined 
              })}
            >
              <option value="">所有分類</option>
              {state.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-input rounded-md text-sm"
              value={state.filters.brandId || ''}
              onChange={(e) => handleFilterChange({ 
                brandId: e.target.value || undefined 
              })}
            >
              <option value="">所有品牌</option>
              {state.brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={state.filters.inStock || false}
                onChange={(e) => handleFilterChange({ 
                  inStock: e.target.checked || undefined 
                })}
                className="rounded"
              />
              <span className="text-sm">僅顯示有庫存</span>
            </label>
          </div>
        </div>
      </Card>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      {/* 批量操作 */}
      {state.selectedProducts.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              已選取 {state.selectedProducts.size} 個商品
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                批量編輯
              </Button>
              <Button variant="outline" size="sm">
                更改狀態
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 商品列表 */}
      {state.products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">沒有找到商品</h3>
          <p className="text-muted-foreground mb-4">
            {state.searchQuery || Object.keys(state.filters).length > 0 
              ? '請嘗試調整搜尋條件' 
              : '開始新增您的第一個商品'
            }
          </p>
          <Button asChild>
            <Link href="/dashboard/products/new">
              新增商品
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 表格標題 */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={state.selectedProducts.size === state.products.length && state.products.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-medium text-muted-foreground">
                <div className="col-span-4">商品資訊</div>
                <div className="col-span-2">分類/品牌</div>
                <div className="col-span-2">價格/庫存</div>
                <div className="col-span-2">狀態</div>
                <div className="col-span-1">更新時間</div>
                <div className="col-span-1 text-center">操作</div>
              </div>
            </div>
          </Card>

          {/* 商品項目 */}
          {state.products.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              isSelected={state.selectedProducts.has(product.id)}
              onSelect={(selected) => handleSelectProduct(product.id, selected)}
            />
          ))}
        </div>
      )}

      {state.isLoading && state.products.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

interface ProductItemProps {
  product: Product;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

function ProductItem({ product, isSelected, onSelect }: ProductItemProps) {
  const statusInfo = statusConfig[product.status];
  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const isLowStock = product.stock <= product.lowStockThreshold;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded"
        />
        
        <div className="grid grid-cols-12 gap-4 flex-1">
          {/* 商品資訊 */}
          <div className="col-span-4 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {mainImage ? (
                <img 
                  src={mainImage.url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{product.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>SKU: {product.sku}</span>
                {product.isFeatured && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
          </div>

          {/* 分類/品牌 */}
          <div className="col-span-2">
            <div className="text-sm">
              <div className="truncate">{product.categoryName || '未分類'}</div>
              {product.brandName && (
                <div className="text-muted-foreground truncate">{product.brandName}</div>
              )}
            </div>
          </div>

          {/* 價格/庫存 */}
          <div className="col-span-2">
            <div className="text-sm">
              <div className="font-medium">NT$ {product.basePrice.toLocaleString()}</div>
              <div className={`${isLowStock ? 'text-red-600' : 'text-muted-foreground'}`}>
                庫存: {product.stock}
                {isLowStock && (
                  <AlertTriangle className="inline h-3 w-3 ml-1" />
                )}
              </div>
            </div>
          </div>

          {/* 狀態 */}
          <div className="col-span-2">
            <div className="space-y-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              {!product.isVisible && (
                <div className="text-xs text-muted-foreground">隱藏</div>
              )}
            </div>
          </div>

          {/* 更新時間 */}
          <div className="col-span-1">
            <div className="text-xs text-muted-foreground">
              {product.updatedAt && format(
                product.updatedAt instanceof Timestamp 
                  ? product.updatedAt.toDate() 
                  : product.updatedAt, 
                'MM/dd', 
                { locale: zhTW }
              )}
            </div>
          </div>

          {/* 操作 */}
          <div className="col-span-1 flex items-center justify-center space-x-1">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/products/${product.id}`}>
                <Eye className="h-3 w-3" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}