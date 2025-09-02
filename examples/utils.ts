// 工具函數庫 - B2B 電商專用版本，基於 deer-lab 專案適配
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==================== 代碼生成工具 ====================

// 生成客戶編號：CUS + 6位數字
export function generateCustomerCode(): string {
  const timestamp = Date.now().toString();
  const randomPart = timestamp.slice(-6);
  return `CUS${randomPart}`;
}

// 生成產品編號：PRD + 類別代碼(3位) + 序號(4位)
export function generateProductCode(categoryCode: string = 'GEN'): string {
  const category = categoryCode.substring(0, 3).toUpperCase();
  const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `PRD${category}${sequence}`;
}

// 生成訂單編號：ORD + YYYYMMDD + 序號(4位)
export function generateOrderNumber(): string {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                 (today.getMonth() + 1).toString().padStart(2, '0') + 
                 today.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ORD${dateStr}${sequence}`;
}

// 生成報價單編號：QUO + YYYYMMDD + 序號(4位)
export function generateQuotationNumber(): string {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                 (today.getMonth() + 1).toString().padStart(2, '0') + 
                 today.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `QUO${dateStr}${sequence}`;
}

// 生成供應商編號：SUP + 6位數字
export function generateSupplierCode(): string {
  const timestamp = Date.now().toString();
  const randomPart = timestamp.slice(-6);
  return `SUP${randomPart}`;
}

// ==================== 驗證函數 ====================

// 驗證電子郵件格式
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 驗證電話號碼（支援台灣格式）
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+886|0)?[2-9]\d{7,8}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// 驗證統一編號（台灣8位數統編）
export function validateTaxId(taxId: string): boolean {
  if (!/^\d{8}$/.test(taxId)) return false;
  
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    let product = parseInt(taxId[i]) * weights[i];
    sum += Math.floor(product / 10) + (product % 10);
  }
  
  return sum % 10 === 0 || (taxId[6] === '7' && (sum + 1) % 10 === 0);
}

// ==================== 價格計算工具 ====================

// 計算批量價格
export function calculateBulkPrice(
  quantity: number, 
  basePrice: number, 
  priceTiers?: Array<{minQuantity: number, maxQuantity?: number, unitPrice: number}>
): number {
  if (!priceTiers || priceTiers.length === 0) {
    return basePrice;
  }

  // 找到適用的價格層級
  const applicableTier = priceTiers
    .filter(tier => 
      quantity >= tier.minQuantity && 
      (!tier.maxQuantity || quantity <= tier.maxQuantity)
    )
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  return applicableTier ? applicableTier.unitPrice : basePrice;
}

// 計算折扣金額
export function calculateDiscountAmount(
  originalAmount: number, 
  discountPercent: number
): number {
  return Math.round(originalAmount * (discountPercent / 100) * 100) / 100;
}

// 計算稅額（5% 營業稅）
export function calculateTaxAmount(amount: number, taxRate: number = 0.05): number {
  return Math.round(amount * taxRate * 100) / 100;
}

// ==================== 格式化工具 ====================

// 格式化貨幣
export function formatCurrency(
  amount: number, 
  currency: string = 'TWD', 
  locale: string = 'zh-TW'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// 格式化數字
export function formatNumber(
  num: number, 
  locale: string = 'zh-TW'
): string {
  return new Intl.NumberFormat(locale).format(num);
}

// 格式化日期
export function formatDate(
  date: Date | string, 
  format: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'zh-TW'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  };
  
  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
}

// ==================== 狀態管理工具 ====================

// 訂單狀態中文對應
export const ORDER_STATUS_MAP = {
  'draft': '草稿',
  'pending': '待處理',
  'confirmed': '已確認',
  'processing': '處理中',
  'shipped': '已出貨',
  'delivered': '已送達',
  'cancelled': '已取消'
} as const;

// 付款狀態中文對應
export const PAYMENT_STATUS_MAP = {
  'pending': '待付款',
  'partial': '部分付款',
  'paid': '已付款',
  'refunded': '已退款'
} as const;

// 客戶等級中文對應
export const CUSTOMER_TIER_MAP = {
  'bronze': '銅級',
  'silver': '銀級',
  'gold': '金級',
  'platinum': '鉑金級'
} as const;

// 獲取狀態顯示文字
export function getStatusText(
  status: string, 
  type: 'order' | 'payment' | 'customer'
): string {
  switch (type) {
    case 'order':
      return ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP] || status;
    case 'payment':
      return PAYMENT_STATUS_MAP[status as keyof typeof PAYMENT_STATUS_MAP] || status;
    case 'customer':
      return CUSTOMER_TIER_MAP[status as keyof typeof CUSTOMER_TIER_MAP] || status;
    default:
      return status;
  }
}

// ==================== 搜尋和篩選工具 ====================

// 模糊搜尋函數
export function fuzzySearch<T>(
  items: T[], 
  searchTerm: string, 
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  const searchTermLower = searchTerm.toLowerCase();
  
  return items.filter(item => 
    searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTermLower);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchTermLower);
      }
      return false;
    })
  );
}

// 排序函數
export function sortItems<T>(
  items: T[], 
  sortBy: keyof T, 
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// ==================== 檔案處理工具 ====================

// 驗證檔案類型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// 驗證檔案大小
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// 格式化檔案大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== 資料驗證工具 ====================

// 檢查物件是否為空
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
}

// 深度複製物件
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}