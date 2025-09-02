'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsService } from '@/lib/firebase/products';
import { categoriesService } from '@/lib/firebase/categories';
import { brandsService } from '@/lib/firebase/brands';
import { productFormSchema, type ProductFormData } from '@/lib/utils/validation';
import { Category, Brand, PRODUCT_STATUS, ProductImage } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { 
  ArrowLeft,
  Save,
  Package,
  Tag,
  DollarSign,
  BarChart3,
  Settings,
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';

interface NewProductPageState {
  categories: Category[];
  brands: Brand[];
  isLoading: boolean;
  isSaving: boolean;
  images: ProductImage[];
  error: string | null;
}

export default function NewProductPage() {
  const router = useRouter();
  const [state, setState] = useState<NewProductPageState>({
    categories: [],
    brands: [],
    isLoading: true,
    isSaving: false,
    images: [],
    error: null
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      status: PRODUCT_STATUS.DRAFT,
      isVisible: true,
      isFeatured: false,
      trackStock: true,
      allowBackorder: false,
      stock: 0,
      lowStockThreshold: 5,
      basePrice: 0,
      specifications: {},
      features: [],
      tags: [],
    }
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [categories, brands] = await Promise.all([
        categoriesService.getActiveCategories(),
        brandsService.getActiveBrands()
      ]);
      
      setState(prev => ({
        ...prev,
        categories,
        brands,
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const watchedName = watch('name');
  useEffect(() => {
    if (watchedName) {
      setValue('slug', generateSlug(watchedName));
    }
  }, [watchedName, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));

      // 找到分類和品牌名稱
      const category = state.categories.find(c => c.id === data.categoryId);
      const brand = data.brandId ? state.brands.find(b => b.id === data.brandId) : undefined;

      const productData = {
        ...data,
        categoryName: category?.name,
        brandName: brand?.name,
        images: state.images,
        hasVariants: false,
        tags: data.tags || [],
        features: data.features || [],
        specifications: data.specifications || {},
        viewCount: 0,
        orderCount: 0,
        reviewCount: 0,
        averageRating: 0,
      };

      const productId = await productsService.createProduct(productData);
      router.push(`/dashboard/products/${productId}`);
    } catch (error: any) {
      console.error('建立商品失敗:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || '建立商品失敗'
      }));
    }
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
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回商品列表
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">新增商品</h1>
            <p className="text-muted-foreground">
              建立新的商品項目
            </p>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左欄：主要資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本資訊 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Package className="h-5 w-5" />
                <h3 className="text-lg font-semibold">基本資訊</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="商品名稱" error={errors.name?.message} required>
                  <Input
                    {...register('name')}
                    placeholder="輸入商品名稱"
                  />
                </FormField>

                <FormField label="URL代號" error={errors.slug?.message} required>
                  <Input
                    {...register('slug')}
                    placeholder="商品的URL代號"
                  />
                </FormField>

                <FormField label="SKU" error={errors.sku?.message} required>
                  <Input
                    {...register('sku')}
                    placeholder="商品SKU編號"
                  />
                </FormField>

                <FormField label="簡短描述" error={errors.shortDescription?.message}>
                  <Input
                    {...register('shortDescription')}
                    placeholder="一行簡短描述"
                  />
                </FormField>

                <FormField label="詳細描述" error={errors.description?.message}>
                  <textarea
                    {...register('description')}
                    className="w-full p-3 border border-input rounded-md resize-none"
                    rows={6}
                    placeholder="詳細的商品描述"
                  />
                </FormField>
              </div>
            </Card>

            {/* 商品圖片 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <ImageIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">商品圖片</h3>
              </div>
              
              {/* 簡化的圖片上傳界面 */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  拖拽圖片到這裡或點擊上傳
                </p>
                <Button type="button" variant="outline">
                  選擇檔案
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  支援JPG、PNG格式，建議尺寸800x800px
                </p>
              </div>

              {state.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {state.images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            images: prev.images.filter(img => img.id !== image.id)
                          }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {image.isMain && (
                        <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                          主圖
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 規格與特色 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">規格與特色</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="商品標籤">
                  <Input
                    placeholder="輸入標籤，用逗號分隔"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setValue('tags', tags);
                    }}
                  />
                </FormField>

                <FormField label="商品特色">
                  <textarea
                    className="w-full p-3 border border-input rounded-md resize-none"
                    rows={4}
                    placeholder="每行一個特色，例如：&#10;• 高品質材料&#10;• 專利設計&#10;• 一年保固"
                    onChange={(e) => {
                      const features = e.target.value.split('\n').map(f => f.trim()).filter(Boolean);
                      setValue('features', features);
                    }}
                  />
                </FormField>
              </div>
            </Card>
          </div>

          {/* 右欄：設定與價格 */}
          <div className="space-y-6">
            {/* 分類與品牌 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Tag className="h-5 w-5" />
                <h3 className="text-lg font-semibold">分類與品牌</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="商品分類" error={errors.categoryId?.message} required>
                  <select
                    {...register('categoryId')}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">請選擇分類</option>
                    {state.categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="品牌" error={errors.brandId?.message}>
                  <select
                    {...register('brandId')}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">請選擇品牌</option>
                    {state.brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </Card>

            {/* 價格設定 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-lg font-semibold">價格設定</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="基礎價格" error={errors.basePrice?.message} required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('basePrice', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </FormField>

                <FormField label="成本價格" error={errors.costPrice?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('costPrice', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </FormField>

                <FormField label="比較價格" error={errors.compareAtPrice?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('compareAtPrice', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </FormField>
              </div>
            </Card>

            {/* 庫存管理 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Package className="h-5 w-5" />
                <h3 className="text-lg font-semibold">庫存管理</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="庫存數量" error={errors.stock?.message} required>
                  <Input
                    type="number"
                    min="0"
                    {...register('stock', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="低庫存閾值" error={errors.lowStockThreshold?.message}>
                  <Input
                    type="number"
                    min="0"
                    {...register('lowStockThreshold', { valueAsNumber: true })}
                    placeholder="5"
                  />
                </FormField>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('trackStock')}
                      className="rounded"
                    />
                    <span className="text-sm">追蹤庫存</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('allowBackorder')}
                      className="rounded"
                    />
                    <span className="text-sm">允許預訂</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* 商品狀態 */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-semibold">商品狀態</h3>
              </div>
              
              <div className="space-y-4">
                <FormField label="商品狀態" error={errors.status?.message}>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value={PRODUCT_STATUS.DRAFT}>草稿</option>
                    <option value={PRODUCT_STATUS.ACTIVE}>已上架</option>
                    <option value={PRODUCT_STATUS.INACTIVE}>已下架</option>
                  </select>
                </FormField>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('isVisible')}
                      className="rounded"
                    />
                    <span className="text-sm">在前台顯示</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('isFeatured')}
                      className="rounded"
                    />
                    <span className="text-sm">設為精選商品</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={state.isSaving}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={state.isSaving}
          >
            {state.isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            建立商品
          </Button>
        </div>
      </form>
    </div>
  );
}