import { BaseDocument } from './common';

// 商品狀態
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

// 商品圖片
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  isMain: boolean;
}

// 商品規格/變體
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // 例如: { "顏色": "紅色", "尺寸": "M" }
  isActive: boolean;
}

// 商品分類
export interface Category extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
}

// 商品品牌
export interface Brand extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

// 商品
export interface Product extends BaseDocument {
  // 基本資訊
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  
  // 分類與品牌
  categoryId: string;
  categoryName?: string; // 冗余字段，提升查詢效能
  brandId?: string;
  brandName?: string; // 冗余字段，提升查詢效能
  
  // 價格相關
  basePrice: number; // 基礎價格
  costPrice?: number; // 成本價格
  compareAtPrice?: number; // 比較價格（劃線價）
  
  // 庫存
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  allowBackorder: boolean;
  
  // 規格/變體
  hasVariants: boolean;
  variants?: ProductVariant[];
  
  // 圖片
  images: ProductImage[];
  
  // 詳細資訊
  specifications?: Record<string, string>; // 產品規格
  features?: string[]; // 產品特色
  tags: string[]; // 標籤
  
  // 狀態與可見性
  status: ProductStatus;
  isVisible: boolean;
  isFeatured: boolean;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  
  // 統計
  viewCount: number;
  orderCount: number;
  reviewCount: number;
  averageRating: number;
  
  // 重量與尺寸（用於物流）
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
}

// 價格群組
export interface PricingGroup extends BaseDocument {
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'tiered';
  discountValue: number;
  minOrderAmount?: number;
  isActive: boolean;
  customerIds: string[];
}

// 階層式定價
export interface TieredPricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discountPercentage?: number;
}

// 商品價格（針對特定客戶或群組）
export interface ProductPrice extends BaseDocument {
  productId: string;
  customerId?: string; // 特定客戶價格
  pricingGroupId?: string; // 價格群組
  price: number;
  tieredPricing?: TieredPricing[];
  validFrom?: Date;
  validTo?: Date;
  isActive: boolean;
}

// 商品搜尋篩選
export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  search?: string;
  inStock?: boolean;
}

// 商品排序選項
export type ProductSortBy = 
  | 'name' 
  | 'price-asc' 
  | 'price-desc' 
  | 'created-desc' 
  | 'created-asc'
  | 'updated-desc' 
  | 'popularity'
  | 'rating';

// 商品列表選項
export interface ProductListOptions {
  limit?: number;
  page?: number;
  sortBy?: ProductSortBy;
  filters?: ProductFilters;
}

// 商品表單資料
export interface ProductFormData {
  // 基本資訊
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  
  // 分類與品牌
  categoryId: string;
  brandId?: string;
  
  // 價格
  basePrice: number;
  costPrice?: number;
  compareAtPrice?: number;
  
  // 庫存
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  allowBackorder: boolean;
  
  // 規格
  specifications: Record<string, string>;
  features: string[];
  tags: string[];
  
  // 狀態
  status: ProductStatus;
  isVisible: boolean;
  isFeatured: boolean;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  
  // 重量與尺寸
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
}

// 批量操作
export interface ProductBulkAction {
  action: 'delete' | 'activate' | 'deactivate' | 'update-category' | 'update-brand';
  productIds: string[];
  data?: any;
}

// 商品導入/導出
export interface ProductImportData {
  name: string;
  sku: string;
  categoryName: string;
  brandName?: string;
  basePrice: number;
  stock: number;
  description?: string;
  tags?: string;
}