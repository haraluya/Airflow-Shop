import { BaseDocument } from './common';

// 報表類型
export enum ReportType {
  SALES_SUMMARY = 'sales_summary',         // 銷售摘要
  REVENUE_ANALYSIS = 'revenue_analysis',   // 營收分析
  CUSTOMER_INSIGHTS = 'customer_insights', // 客戶洞察
  PRODUCT_PERFORMANCE = 'product_performance', // 商品表現
  SALESPERSON_PERFORMANCE = 'salesperson_performance', // 業務員績效
  ORDER_ANALYTICS = 'order_analytics',     // 訂單分析
  REFERRAL_TRACKING = 'referral_tracking', // 推薦碼追蹤
}

// 報表時間區間
export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

// 基礎報表參數
export interface BaseReportParams {
  type: ReportType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  userId?: string;           // 產生報表的使用者ID
  salespersonId?: string;    // 特定業務員ID（用於業務員專屬報表）
}

// 銷售摘要報表
export interface SalesSummaryReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

// 營收分析報表
export interface RevenueAnalysisReport {
  period: string;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  revenueByCategory: Array<{
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByPaymentMethod: Array<{
    method: string;
    revenue: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
}

// 客戶洞察報表
export interface CustomerInsightsReport {
  period: string;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalOrders: number;
    totalRevenue: number;
  }>;
  customersByRegion: Array<{
    region: string;
    count: number;
    revenue: number;
  }>;
}

// 商品表現報表
export interface ProductPerformanceReport {
  period: string;
  totalProducts: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profitMargin: number;
  }>;
  lowPerformingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    daysInInventory: number;
  }>;
  categoryPerformance: Array<{
    categoryName: string;
    productCount: number;
    totalRevenue: number;
    averagePrice: number;
  }>;
  inventoryTurnover: Array<{
    productId: string;
    productName: string;
    turnoverRate: number;
    stockLevel: number;
  }>;
}

// 業務員績效報表
export interface SalespersonPerformanceReport {
  period: string;
  salespersonId: string;
  salespersonName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  newCustomersAcquired: number;
  conversionRate: number;
  commissionEarned: number;
  performanceRanking: number;
  monthlyTargets: Array<{
    month: string;
    target: number;
    achieved: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    orders: number;
    revenue: number;
  }>;
  referralPerformance: {
    totalClicks: number;
    totalRegistrations: number;
    totalOrders: number;
    conversionRate: number;
    revenue: number;
  };
}

// 訂單分析報表
export interface OrderAnalyticsReport {
  period: string;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  ordersByPaymentMethod: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  ordersByDeliveryMethod: Array<{
    method: string;
    count: number;
    averageDeliveryTime: number;
  }>;
  hourlyOrderDistribution: Array<{
    hour: number;
    orderCount: number;
  }>;
  weeklyOrderPattern: Array<{
    dayOfWeek: string;
    orderCount: number;
    averageValue: number;
  }>;
}

// 推薦碼追蹤報表
export interface ReferralTrackingReport {
  period: string;
  totalReferrals: number;
  activeReferrals: number;
  totalClicks: number;
  totalRegistrations: number;
  totalOrders: number;
  totalRevenue: number;
  overallConversionRate: number;
  topPerformingReferrals: Array<{
    referralCode: string;
    salespersonName: string;
    clicks: number;
    registrations: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  }>;
  referralPerformanceOverTime: Array<{
    date: string;
    clicks: number;
    registrations: number;
    orders: number;
    revenue: number;
  }>;
}

// 統一的報表結果介面
export type ReportData = 
  | SalesSummaryReport 
  | RevenueAnalysisReport 
  | CustomerInsightsReport 
  | ProductPerformanceReport 
  | SalespersonPerformanceReport 
  | OrderAnalyticsReport 
  | ReferralTrackingReport;

// 報表生成請求
export interface ReportRequest extends BaseReportParams {
  format?: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
  filters?: Record<string, any>;
}

// 報表生成結果
export interface ReportResult {
  id: string;
  type: ReportType;
  period: ReportPeriod;
  generatedAt: Date;
  generatedBy: string;
  data: ReportData;
  metadata: {
    totalRecords: number;
    executionTime: number;
    dataSourceVersion: string;
  };
}

// 儀表板統計資料
export interface DashboardStats {
  // 今日統計
  today: {
    orders: number;
    revenue: number;
    customers: number;
    conversion: number;
  };
  
  // 本月統計
  thisMonth: {
    orders: number;
    revenue: number;
    customers: number;
    growth: number;
  };
  
  // 總計統計
  total: {
    customers: number;
    products: number;
    orders: number;
    revenue: number;
  };
  
  // 趨勢資料
  trends: {
    revenue: Array<{
      date: string;
      value: number;
    }>;
    orders: Array<{
      date: string;
      value: number;
    }>;
  };
  
  // 最新活動
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: Date;
    userId?: string;
    orderId?: string;
  }>;
}

// KPI 指標
export interface KPIMetrics {
  // 營收指標
  revenue: {
    current: number;
    target: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  // 訂單指標
  orders: {
    current: number;
    target: number;
    growth: number;
    averageValue: number;
  };
  
  // 客戶指標
  customers: {
    total: number;
    new: number;
    retention: number;
    satisfaction: number;
  };
  
  // 轉換率指標
  conversion: {
    visitToLead: number;
    leadToCustomer: number;
    overallConversion: number;
  };
}