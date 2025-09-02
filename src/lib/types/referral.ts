import { BaseDocument } from './common';

// 推薦碼資料介面
export interface ReferralCode extends BaseDocument {
  code: string;                      // 推薦碼（唯一）
  salespersonId: string;            // 業務員ID
  salespersonName: string;          // 業務員姓名
  isActive: boolean;                // 是否啟用
  description?: string;             // 描述
  expiryDate?: Date;               // 到期日期（可選）
  
  // 統計資料
  totalClicks: number;             // 總點擊數
  totalRegistrations: number;      // 總註冊數
  totalOrders: number;             // 總訂單數
  totalSales: number;              // 總銷售額
  
  // 設定
  landingPageUrl?: string;         // 自定義著陸頁面
  welcomeMessage?: string;         // 歡迎訊息
  
  // 地域限制
  allowedRegions?: string[];       // 允許的地區
  
  // 元數據
  notes?: string;                  // 內部備註
  lastUsedAt?: Date;              // 最後使用時間
}

// 推薦碼追蹤記錄
export interface ReferralTracking extends BaseDocument {
  referralCode: string;            // 推薦碼
  salespersonId: string;          // 業務員ID
  customerId?: string;            // 客戶ID（如果已註冊）
  sessionId: string;              // 會話ID
  
  // 追蹤事件類型
  eventType: 'click' | 'registration' | 'order' | 'conversion';
  
  // 事件詳情
  eventData: {
    // 點擊事件
    clickData?: {
      ipAddress: string;
      userAgent: string;
      referer?: string;
    };
    
    // 註冊事件
    registrationData?: {
      customerId: string;
      customerEmail: string;
      customerName: string;
    };
    
    // 訂單事件
    orderData?: {
      orderId: string;
      orderAmount: number;
      orderItems: number;
    };
    
    // 轉換事件
    conversionData?: {
      conversionType: string;
      conversionValue: number;
    };
  };
  
  // 地理位置（如果可用）
  location?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  
  // 裝置資訊
  deviceInfo?: {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
}

// 推薦碼統計資料
export interface ReferralStats {
  referralCode: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  
  // 基本統計
  clicks: number;
  registrations: number;
  orders: number;
  sales: number;
  
  // 轉換率
  clickToRegistrationRate: number;  // 點擊到註冊轉換率
  registrationToOrderRate: number;  // 註冊到下單轉換率
  overallConversionRate: number;    // 整體轉換率
  
  // 平均值
  avgOrderValue: number;            // 平均訂單金額
  avgOrdersPerCustomer: number;     // 平均每客戶訂單數
  
  // 比較數據
  previousPeriodComparison?: {
    clicksChange: number;           // 點擊數變化百分比
    registrationsChange: number;    // 註冊數變化百分比
    ordersChange: number;           // 訂單數變化百分比
    salesChange: number;            // 銷售額變化百分比
  };
}

// 推薦碼效果報告
export interface ReferralReport {
  salespersonId: string;
  salespersonName: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  
  // 總體統計
  totalCodes: number;              // 總推薦碼數
  activeCodes: number;             // 活躍推薦碼數
  totalClicks: number;             // 總點擊數
  totalRegistrations: number;      // 總註冊數
  totalOrders: number;             // 總訂單數
  totalSales: number;              // 總銷售額
  
  // 最佳推薦碼
  topReferralsByClicks: Array<{
    code: string;
    clicks: number;
  }>;
  
  topReferralsBySales: Array<{
    code: string;
    sales: number;
  }>;
  
  // 趨勢數據
  dailyStats?: Array<{
    date: Date;
    clicks: number;
    registrations: number;
    orders: number;
    sales: number;
  }>;
  
  // 地理分布
  regionStats?: Array<{
    region: string;
    clicks: number;
    registrations: number;
    orders: number;
    sales: number;
  }>;
}

// 推薦碼建立資料
export interface CreateReferralCodeData {
  code: string;
  salespersonId: string;
  description?: string;
  expiryDate?: Date;
  landingPageUrl?: string;
  welcomeMessage?: string;
  allowedRegions?: string[];
}

// 推薦碼更新資料
export interface UpdateReferralCodeData {
  description?: string;
  isActive?: boolean;
  expiryDate?: Date;
  landingPageUrl?: string;
  welcomeMessage?: string;
  allowedRegions?: string[];
  notes?: string;
}