// B2B 電商業務邏輯類型定義 - 基於 deer-lab 專案適配
import { Timestamp } from 'firebase/firestore';

// ==================== 基礎產品和服務 ====================

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  description?: string;
  specifications?: ProductSpecification[];
  images?: string[];
  
  // 價格資訊
  unitPrice: number;
  bulkPricing?: PriceTier[];
  currency: string;
  
  // 庫存資訊
  currentStock: number;
  unit: string;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  
  // 狀態
  isActive: boolean;
  isAvailable: boolean;
  
  // 元數據
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 客戶管理 ====================

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  
  // 聯絡資訊
  phone: string;
  email: string;
  address: string;
  
  // 商業資訊
  taxId?: string;
  businessLicense?: string;
  industry?: string;
  
  // 客戶等級與信用
  customerTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  creditLimit: number;
  paymentTerms: number; // 付款天數
  
  // 狀態
  isActive: boolean;
  isApproved: boolean;
  
  // 統計資訊
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Timestamp;
  
  // 元數據
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 訂單管理 ====================

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerInfo: CustomerInfo;
  
  // 訂單項目
  items: OrderItem[];
  
  // 金額計算
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  
  // 狀態追蹤
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  // 日期記錄
  orderDate: Timestamp;
  confirmedAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  
  // 配送資訊
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: string;
  trackingNumber?: string;
  
  // 備註
  customerNotes?: string;
  internalNotes?: string;
  
  // 元數據
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  
  // 數量與價格
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // 折扣
  discountPercent?: number;
  discountAmount?: number;
  
  // 產品快照
  productSnapshot?: {
    specifications?: ProductSpecification[];
    images?: string[];
  };
}

export interface CustomerInfo {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// ==================== 報價單管理 ====================

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerInfo: CustomerInfo;
  
  // 報價項目
  items: QuotationItem[];
  
  // 金額
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  // 有效期
  validUntil: Timestamp;
  
  // 狀態
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  
  // 條款
  terms?: string;
  notes?: string;
  
  // 轉換為訂單
  convertedToOrderId?: string;
  
  // 元數據
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// ==================== 供應商管理 ====================

export interface Supplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson: string;
  
  // 聯絡資訊
  phone: string;
  email: string;
  address: string;
  
  // 商業資訊
  taxId?: string;
  bankAccount?: string;
  
  // 供應商等級
  supplierTier: 'standard' | 'preferred' | 'strategic';
  
  // 供應產品分類
  categories: string[];
  
  // 狀態
  isActive: boolean;
  isApproved: boolean;
  
  // 元數據
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 庫存管理 ====================

export interface InventoryRecord {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  
  // 庫存變動
  action: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer' | 'sale' | 'return';
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  unit: string;
  
  // 原因與備註
  reason: string;
  notes?: string;
  
  // 關聯單據
  relatedOrderId?: string;
  relatedOrderNumber?: string;
  
  // 操作者
  operatorId: string;
  operatorName: string;
  createdAt: Timestamp;
}

// ==================== 購物車 ====================

export interface CartItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // 產品快照
  productSnapshot?: {
    images?: string[];
    specifications?: ProductSpecification[];
  };
}

// ==================== 統計報表 ====================

export interface SalesStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  topProducts: ProductSalesStats[];
  topCustomers: CustomerSalesStats[];
  salesByCategory: CategorySalesStats[];
  salesTrend: SalesTrendData[];
}

export interface ProductSalesStats {
  productId: string;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface CustomerSalesStats {
  customerId: string;
  customerCode: string;
  companyName: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

export interface CategorySalesStats {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  orderCount: number;
  productCount: number;
}

export interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}