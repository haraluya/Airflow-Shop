'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsService } from '@/lib/firebase/products';
import { pricingEngine } from '@/lib/firebase/pricing';
import { useAuth } from '@/lib/providers/auth-provider';
import { Product } from '@/lib/types/product';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductDetailState {
  product: Product | null;
  isLoading: boolean;
  selectedImageIndex: number;
  quantity: number;
  calculatedPrice: {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
  } | null;
  error: string | null;
  isAddingToCart: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const productId = params?.id as string;

  const [state, setState] = useState<ProductDetailState>({
    product: null,
    isLoading: true,
    selectedImageIndex: 0,
    quantity: 1,
    calculatedPrice: null,
    error: null,
    isAddingToCart: false
  });

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (state.product) {
      calculatePrice();
    }
  }, [state.product, state.quantity, profile]);

  const loadProduct = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const product = await productsService.getProductById(productId);
      if (!product) {
        setState(prev => ({ ...prev, error: '找不到此商品', isLoading: false }));
        return;
      }

      if (product.status !== 'active' || !product.isVisible) {
        setState(prev => ({ ...prev, error: '此商品目前不可購買', isLoading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        product,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('載入商品失敗:', error);
      setState(prev => ({
        ...prev,
        error: '載入商品失敗',
        isLoading: false
      }));
    }
  };

  const calculatePrice = async () => {
    if (!state.product) return;

    try {
      const priceResult = await pricingEngine.calculatePrice({
        productId: state.product.id,
        customerId: profile?.id,
        quantity: state.quantity,
        basePrice: state.product.basePrice
      });

      setState(prev => ({ ...prev, calculatedPrice: priceResult }));
    } catch (error) {
      console.error('計算價格失敗:', error);
      setState(prev => ({
        ...prev,
        calculatedPrice: {
          price: state.product!.basePrice,
          originalPrice: state.product!.basePrice,
          discountAmount: 0,
          discountPercentage: 0
        }
      }));
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 999) {
      setState(prev => ({ ...prev, quantity: newQuantity }));
    }
  };

  const handleAddToCart = async () => {
    if (!state.product || !profile) {
      // 處理未登入用戶
      router.push('/login');
      return;
    }

    setState(prev => ({ ...prev, isAddingToCart: true }));
    
    try {
      // 這裡應該調用購物車 API
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 調用
      
      // 顯示成功訊息
      alert('商品已加入購物車！');
    } catch (error) {
      console.error('加入購物車失敗:', error);
      alert('加入購物車失敗，請稍後再試');
    } finally {
      setState(prev => ({ ...prev, isAddingToCart: false }));
    }
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!state.product?.images.length) return;

    setState(prev => {
      const maxIndex = prev.product!.images.length - 1;
      let newIndex = prev.selectedImageIndex;

      if (direction === 'prev') {
        newIndex = newIndex === 0 ? maxIndex : newIndex - 1;
      } else {
        newIndex = newIndex === maxIndex ? 0 : newIndex + 1;
      }

      return { ...prev, selectedImageIndex: newIndex };
    });
  };

  if (state.isLoading) {
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

  if (state.error || !state.product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">
              {state.error || '找不到商品'}
            </h1>
            <p className="text-muted-foreground mb-4">
              請檢查商品連結是否正確，或回到商品列表瀏覽其他商品
            </p>
            <Button asChild>
              <Link href="/products" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                回到商品列表
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { product } = state;
  const currentImage = product.images[state.selectedImageIndex];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 商品圖片區域 */}
          <div className="space-y-4">
            {/* 主圖片 */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
              {currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* 圖片導航按鈕 */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageNavigation('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleImageNavigation('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* 特色標籤 */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isFeatured && (
                  <Badge className="bg-primary">精選</Badge>
                )}
                {state.calculatedPrice?.discountPercentage && state.calculatedPrice.discountPercentage > 0 && (
                  <Badge variant="destructive">
                    -{state.calculatedPrice.discountPercentage.toFixed(0)}%
                  </Badge>
                )}
                {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                  <Badge variant="secondary">庫存不多</Badge>
                )}
              </div>
            </div>

            {/* 縮圖 */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setState(prev => ({ ...prev, selectedImageIndex: index }))}
                    className={`relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      index === state.selectedImageIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 商品資訊區域 */}
          <div className="space-y-6">
            {/* 商品基本資訊 */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>SKU: {product.sku}</span>
                {product.brandName && (
                  <>
                    <span>•</span>
                    <span>{product.brandName}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-4">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
              )}
            </div>

            {/* 標籤 */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            {/* 價格資訊 */}
            <div className="bg-muted/50 p-4 rounded-lg">
              {state.calculatedPrice ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">
                      ${state.calculatedPrice.price.toFixed(2)}
                    </span>
                    {state.calculatedPrice.discountAmount > 0 && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${state.calculatedPrice.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {state.calculatedPrice.appliedRule && (
                    <p className="text-sm text-green-600 font-medium">
                      🎉 {state.calculatedPrice.appliedRule}
                    </p>
                  )}
                  {state.calculatedPrice.discountAmount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      您節省了 ${state.calculatedPrice.discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  ${product.basePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* 庫存狀態 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">現貨供應</span>
                    {product.stock <= product.lowStockThreshold && (
                      <span className="text-orange-600">
                        (僅剩 {product.stock} 件)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">暫時缺貨</span>
                  </>
                )}
              </div>
              {product.trackStock && product.stock > 0 && (
                <p className="text-sm text-muted-foreground">
                  庫存：{product.stock} 件
                </p>
              )}
            </div>

            {/* 數量選擇與購買按鈕 */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">數量：</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(state.quantity - 1)}
                      disabled={state.quantity <= 1}
                      className="h-10 px-3"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={state.quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border-0 border-x"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(state.quantity + 1)}
                      disabled={state.quantity >= product.stock}
                      className="h-10 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={state.isAddingToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {state.isAddingToCart ? '加入中...' : '加入購物車'}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* 服務保證 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">快速配送</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">品質保證</p>
              </div>
              <div className="text-center">
                <Package className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">安全包裝</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品詳細資訊 */}
        <div className="mt-12 space-y-8">
          {/* 商品描述 */}
          {product.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">商品描述</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </Card>
          )}

          {/* 商品規格 */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">商品規格</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 商品特色 */}
          {product.features && product.features.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">商品特色</h2>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}