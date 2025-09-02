import { BaseDocument, Address } from './common';
import { CartItem } from './cart';

// 訂單狀態
export enum OrderStatus {
  PENDING = 'pending',           // 待確認
  CONFIRMED = 'confirmed',       // 已確認
  PROCESSING = 'processing',     // 處理中
  SHIPPED = 'shipped',          // 已出貨
  DELIVERED = 'delivered',      // 已送達
  CANCELLED = 'cancelled',      // 已取消
  RETURNED = 'returned',        // 已退貨
}

// 付款狀態
export enum PaymentStatus {
  PENDING = 'pending',          // 待付款
  PAID = 'paid',               // 已付款
  PARTIAL = 'partial',         // 部分付款
  OVERDUE = 'overdue',         // 逾期
  CANCELLED = 'cancelled',     // 已取消
  REFUNDED = 'refunded',       // 已退款
}

// 付款方式
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',  // 信用卡
  BANK_TRANSFER = 'bank_transfer', // 銀行轉帳
  CASH_ON_DELIVERY = 'cod',     // 貨到付款
  NET_BANKING = 'net_banking',  // 網路銀行
  STORE_CREDIT = 'store_credit', // 商店信用
}

// 配送方式
export enum DeliveryMethod {
  STANDARD = 'standard',        // 標準配送
  EXPRESS = 'express',          // 快速配送
  PICKUP = 'pickup',           // 自取
  SAME_DAY = 'same_day',       // 當日配送
}

// 訂單項目
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  basePrice: number;             // 原價
  unitPrice: number;             // 實際單價（含折扣）
  totalPrice: number;            // 小計
  discountAmount?: number;       // 折扣金額
  imageUrl?: string;
  specifications?: Record<string, any>; // 商品規格
}

// 價格明細
export interface OrderPricing {
  subtotal: number;              // 商品小計
  discountAmount: number;        // 折扣金額
  shippingFee: number;          // 運費
  taxAmount: number;            // 稅額
  totalAmount: number;          // 總計
}

// 配送資訊
export interface OrderDelivery {
  method: DeliveryMethod;
  address: Address;
  contactPhone: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  trackingNumber?: string;
  notes?: string;
}

// 付款資訊
export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  dueDate?: Date;
  paidAt?: Date;
  transactionId?: string;
  reference?: string;
  notes?: string;
}

// 主要訂單介面
export interface Order extends BaseDocument {
  orderNumber: string;           // 訂單編號
  customerId: string;           // 客戶ID
  customerName: string;         // 客戶名稱
  customerEmail: string;        // 客戶郵箱
  
  // 訂單狀態
  status: OrderStatus;
  
  // 訂單項目
  items: OrderItem[];
  
  // 價格計算
  pricing: OrderPricing;
  
  // 配送資訊
  delivery: OrderDelivery;
  
  // 付款資訊
  payment: OrderPayment;
  
  // 業務相關
  salespersonId?: string;       // 業務員ID
  salespersonName?: string;     // 業務員姓名
  
  // 備註與附加資訊
  notes?: string;               // 訂單備註
  internalNotes?: string;       // 內部備註（客戶不可見）
  tags?: string[];             // 標籤
  
  // 重要時間戳記
  orderDate: Date;             // 下單時間
  confirmedAt?: Date;          // 確認時間
  shippedAt?: Date;           // 出貨時間
  deliveredAt?: Date;         // 到貨時間
  
  // 系統欄位
  source?: string;            // 訂單來源（網站、電話、業務員代下等）
  version: number;            // 版本號（用於併發控制）
}

// 結帳表單資料
export interface CheckoutFormData {
  deliveryAddress: Address;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  notes?: string;
}

// 訂單統計
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// 訂單搜尋與篩選
export interface OrderSearchParams {
  query?: string;              // 搜尋關鍵字（訂單號、客戶名稱等）
  status?: OrderStatus[];      // 狀態篩選
  paymentStatus?: PaymentStatus[]; // 付款狀態篩選
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  customerId?: string;         // 特定客戶
  salespersonId?: string;      // 特定業務員
  minAmount?: number;          // 最小金額
  maxAmount?: number;          // 最大金額
  page?: number;
  pageSize?: number;
  sortBy?: 'orderDate' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// 訂單操作結果
export interface OrderActionResult {
  success: boolean;
  message: string;
  orderId?: string;
  data?: any;
}

// 從購物車轉換為訂單的輔助類型
export interface CartToOrderData {
  items: CartItem[];
  deliveryAddress: Address;
  contactPhone: string;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  notes?: string;
}