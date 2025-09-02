'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productsService } from '@/lib/firebase/products';
import { Product } from '@/lib/types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Package,
  Lock,
  User,
  Star,
  Truck,
  Shield,
  Info
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      setIsLoading(true);
      const productData = await productsService.getProduct(id);
      
      if (!productData || productData.status !== 'active' || !productData.isVisible) {
        setError('商品不存在或已下架');
        return;
      }
      
      setProduct(productData);
      setError(null);
    } catch (error) {
      console.error('載入商品詳情失敗:', error);
      setError('載入商品詳情失敗');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{error || '商品不存在'}</h3>
            <Link href="/products">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回商品列表
              </Button>
            </Link>
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
                會員專享價格與購買功能 - 註冊即可享受批發優惠
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
        {/* 返回按鈕 */}
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回商品列表
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左側 - 商品圖片 */}
          <div className="space-y-4">
            {/* 主要圖片 */}
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImageIndex]?.url || product.images[0].url}
                  alt={product.images[selectedImageIndex]?.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              {/* 特色標籤 */}
              {product.isFeatured && (
                <Badge className="absolute top-4 left-4 bg-primary">
                  精選商品
                </Badge>
              )}
            </div>

            {/* 縮圖列表 */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 relative overflow-hidden rounded border-2 flex-shrink-0 ${
                      selectedImageIndex === index 
                        ? 'border-primary' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右側 - 商品資訊 */}
          <div className="space-y-6">
            {/* 基本資訊 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <Badge variant="outline">SKU: {product.sku}</Badge>
              </div>
              
              {product.shortDescription && (
                <p className="text-lg text-muted-foreground">
                  {product.shortDescription}
                </p>
              )}

              {/* 標籤 */}
              {product.tags.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 價格區域 - 會員限定 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">會員專屬價格</CardTitle>
                </div>
                <CardDescription>
                  註冊成為會員即可查看批發優惠價格
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/login" className="flex-1">
                    <Button className="w-full" size="lg">
                      <User className="mr-2 h-5 w-5" />
                      登入查看價格
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      立即註冊會員
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 商品特點 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  商品特點
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm">正品保證</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">快速配送</span>
                  </div>
                  {product.stock > 0 ? (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-green-600" />
                      <span className="text-sm">現貨供應</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-red-600" />
                      <span className="text-sm">暫時缺貨</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-primary" />
                    <span className="text-sm">專業服務</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 詳細描述 */}
        {product.description && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">商品詳情</h2>
              <div 
                className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        )}

        {/* 規格資訊 */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">產品規格</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CTA 區域 */}
        <div className="mt-16 text-center">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>開始您的批發之旅</CardTitle>
              <CardDescription>
                註冊成為會員，享受專屬批發價格與服務
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register" className="flex-1">
                  <Button className="w-full" size="lg">
                    免費註冊會員
                  </Button>
                </Link>
                <Link href="/contact" className="flex-1">
                  <Button variant="outline" className="w-full" size="lg">
                    聯絡客服
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}