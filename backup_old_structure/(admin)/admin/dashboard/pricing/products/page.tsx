'use client';

import { useState, useEffect } from 'react';
import { productPricesService, pricingGroupsService } from '@/lib/firebase/pricing';
import { productsService } from '@/lib/firebase/products';
import { customersService } from '@/lib/firebase/customers';
import { USER_STATUS } from '@/lib/utils/constants';
import { ProductPrice, PricingGroup, Product } from '@/lib/types/product';
import { CustomerProfile } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Tag
} from 'lucide-react';

interface ProductPricingState {
  products: Product[];
customers: CustomerProfile[];
  pricingGroups: PricingGroup[];
  productPrices: ProductPrice[];
  isLoading: boolean;
  searchTerm: string;
  selectedProduct: Product | null;
  error: string | null;
}

export default function ProductPricingPage() {
  const [state, setState] = useState<ProductPricingState>({
    products: [],
    customers: [],
    pricingGroups: [],
    productPrices: [],
    isLoading: true,
    searchTerm: '',
    selectedProduct: null,
    error: null
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [products, pricingGroups, customers] = await Promise.all([
        productsService.getProducts({ limit: 100 }),
        pricingGroupsService.getActivePricingGroups(),
customersService.getCustomers({ filters: { status: 'ACTIVE' } })
      ]);
      
      setState(prev => ({
        ...prev,
        products: products.products,
        pricingGroups,
customers: customers.customers || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('載入初始資料失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入初始資料失敗'
      }));
    }
  };

  const loadProductPrices = async (productId: string) => {
    try {
      const prices = await productPricesService.getProductPrices(productId);
      setState(prev => ({ ...prev, productPrices: prices }));
    } catch (error) {
      console.error('載入商品價格失敗:', error);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
    await loadProductPrices(product.id);
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('確定要刪除這個價格設定嗎？')) {
      return;
    }

    try {
      await productPricesService.deleteProductPrice(priceId);
      if (state.selectedProduct) {
        await loadProductPrices(state.selectedProduct.id);
      }
    } catch (error) {
      console.error('刪除價格設定失敗:', error);
      alert('刪除價格設定失敗');
    }
  };

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const getCustomerName = (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    return customer?.companyName || '未知客戶';
  };

  const getPricingGroupName = (groupId: string) => {
    const group = state.pricingGroups.find(g => g.id === groupId);
    return group?.name || '未知群組';
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">商品價格管理</h1>
          <p className="text-muted-foreground">
            設定商品的客戶專屬價格與群組價格
          </p>
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左側：商品列表 */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5" />
              <h3 className="font-semibold">選擇商品</h3>
            </div>
            
            {/* 搜尋框 */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋商品..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* 商品列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    state.selectedProduct?.id === product.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-center space-x-3">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                      <p className="text-xs font-medium">${product.basePrice}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-2" />
                <p>沒有找到商品</p>
              </div>
            )}
          </Card>
        </div>

        {/* 右側：價格設定 */}
        <div className="lg:col-span-2 space-y-4">
          {state.selectedProduct ? (
            <>
              {/* 商品資訊卡片 */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {state.selectedProduct.images.length > 0 ? (
                      <img
                        src={state.selectedProduct.images[0].url}
                        alt={state.selectedProduct.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{state.selectedProduct.name}</h3>
                      <p className="text-muted-foreground">SKU: {state.selectedProduct.sku}</p>
                      <p className="text-lg font-medium">基礎價格: ${state.selectedProduct.basePrice}</p>
                    </div>
                  </div>
                  
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新增價格設定
                  </Button>
                </div>
              </Card>

              {/* 價格設定列表 */}
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="h-5 w-5" />
                  <h3 className="font-semibold">價格設定</h3>
                </div>

                {state.productPrices.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">沒有特殊價格設定</h3>
                    <p className="text-muted-foreground mb-4">
                      此商品使用基礎價格 ${state.selectedProduct.basePrice}
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      新增價格設定
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.productPrices.map((price) => (
                      <div
                        key={price.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {price.customerId && (
                              <div className="flex items-center space-x-1 text-sm">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>客戶: {getCustomerName(price.customerId)}</span>
                              </div>
                            )}
                            {price.pricingGroupId && (
                              <div className="flex items-center space-x-1 text-sm">
                                <Tag className="h-4 w-4 text-green-500" />
                                <span>群組: {getPricingGroupName(price.pricingGroupId)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="font-medium text-lg">${price.price}</span>
                            {price.validFrom && (
                              <span className="text-muted-foreground">
                                生效: {price.validFrom.toLocaleDateString()}
                              </span>
                            )}
                            {price.validTo && (
                              <span className="text-muted-foreground">
                                到期: {price.validTo.toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {price.tieredPricing && price.tieredPricing.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              階層式定價: {price.tieredPricing.length} 個階層
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrice(price.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">選擇商品</h3>
              <p className="text-muted-foreground">
                請從左側選擇一個商品來管理其價格設定
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}