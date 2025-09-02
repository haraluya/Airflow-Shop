import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp, 
  startAfter, 
  endBefore,
  QueryDocumentSnapshot,
  DocumentData,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from './config';
import { BaseFirebaseService } from './base';
import {
  ReportType,
  ReportPeriod,
  BaseReportParams,
  ReportData,
  ReportResult,
  DashboardStats,
  KPIMetrics,
  SalesSummaryReport,
  RevenueAnalysisReport,
  CustomerInsightsReport,
  ProductPerformanceReport,
  SalespersonPerformanceReport,
  OrderAnalyticsReport,
  ReferralTrackingReport
} from '../types/reports';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types/order';
import { User, UserRole } from '../types/auth';
import { ReferralCode } from '../types/referral';
import { COLLECTIONS } from '@/lib/utils/constants';

export class ReportsService extends BaseFirebaseService<any> {
  constructor() {
    super('reports');
  }

  // 生成銷售摘要報表
  async generateSalesSummaryReport(params: BaseReportParams): Promise<SalesSummaryReport> {
    const { startDate, endDate } = params;
    
    // 獲取指定期間的訂單
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate)),
      where('status', 'in', [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    // 計算基本統計
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // 統計客戶
    const customerIds = [...new Set(orders.map(order => order.customerId))];
    const newCustomers = await this.countNewCustomersInPeriod(startDate, endDate);
    const returningCustomers = customerIds.length - newCustomers;
    
    // 計算轉換率 (這裡需要實際的訪問數據，暫時使用模擬數據)
    const conversionRate = 0.025; // 2.5% 轉換率
    
    // 計算熱銷商品
    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId;
        const current = productStats.get(key) || { name: item.productName, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.totalPrice;
        productStats.set(key, current);
      });
    });
    
    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // 按日期統計營收
    const revenueByDay = this.groupOrdersByDay(orders, startDate, endDate);
    
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      newCustomers,
      returningCustomers,
      conversionRate,
      topProducts,
      revenueByDay
    };
  }

  // 生成營收分析報表
  async generateRevenueAnalysisReport(params: BaseReportParams): Promise<RevenueAnalysisReport> {
    const { startDate, endDate } = params;
    
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate)),
      where('status', 'in', [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    const grossProfit = totalRevenue * 0.3; // 假設30%毛利率
    const netProfit = grossProfit * 0.8; // 假設80%淨利率
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // 計算成長率（需要上一期的資料進行比較）
    const revenueGrowth = 0.15; // 15% 成長（模擬數據）
    
    // 按付款方式統計
    const revenueByPaymentMethod = this.groupOrdersByPaymentMethod(orders);
    
    // 月度趨勢（模擬數據）
    const monthlyTrend = this.generateMonthlyTrend(startDate, endDate, totalRevenue);
    
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalRevenue,
      grossProfit,
      netProfit,
      profitMargin,
      revenueGrowth,
      revenueByCategory: [], // 需要商品分類數據
      revenueByPaymentMethod,
      monthlyTrend
    };
  }

  // 生成客戶洞察報表
  async generateCustomerInsightsReport(params: BaseReportParams): Promise<CustomerInsightsReport> {
    const { startDate, endDate } = params;
    
    // 獲取客戶資料
    const customersQuery = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'customer'));
    const customersSnapshot = await getDocs(customersQuery);
    const customers = customersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as User);
    
    // 獲取期間內的訂單
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate))
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(customer => {
      if (!customer.createdAt) return false;
      const createdDate = customer.createdAt instanceof Date ? customer.createdAt : new Date(customer.createdAt.toDate());
      return createdDate >= startDate && createdDate <= endDate;
    }).length;
    
    // 活躍客戶（有下單的客戶）
    const activeCustomerIds = [...new Set(orders.map(order => order.customerId))];
    const activeCustomers = activeCustomerIds.length;
    
    // 計算客戶終身價值
    const customerRevenue = new Map<string, number>();
    orders.forEach(order => {
      const current = customerRevenue.get(order.customerId) || 0;
      customerRevenue.set(order.customerId, current + order.pricing.totalAmount);
    });
    
    const averageCustomerValue = customerRevenue.size > 0 
      ? Array.from(customerRevenue.values()).reduce((a, b) => a + b, 0) / customerRevenue.size 
      : 0;
    
    // 頂級客戶
    const topCustomers = Array.from(customerRevenue.entries())
      .map(([customerId, revenue]) => {
        const customer = customers.find(c => c.id === customerId);
        const customerOrders = orders.filter(o => o.customerId === customerId);
        return {
          customerId,
          customerName: customer?.displayName || 'Unknown',
          totalOrders: customerOrders.length,
          totalRevenue: revenue
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalCustomers,
      newCustomers,
      activeCustomers,
      customerRetentionRate: 0.85, // 85% 保留率（模擬數據）
      averageCustomerValue,
      customerSegments: [], // 需要客戶分群邏輯
      topCustomers,
      customersByRegion: [] // 需要地區數據
    };
  }

  // 生成業務員績效報表
  async generateSalespersonPerformanceReport(params: BaseReportParams & { salespersonId: string }): Promise<SalespersonPerformanceReport> {
    const { startDate, endDate, salespersonId } = params;
    
    // 獲取業務員資料
    const salespersonDoc = await getDoc(doc(db, 'users', salespersonId));
    const salesperson = salespersonDoc.exists() ? this.convertTimestamps(salespersonDoc.data()) as User : null;
    
    if (!salesperson) {
      throw new Error('業務員不存在');
    }
    
    // 獲取業務員的訂單
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('salespersonId', '==', salespersonId),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate))
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // 獲取新客戶數量
    const customerIds = [...new Set(orders.map(order => order.customerId))];
    const newCustomersAcquired = await this.countNewCustomersBySalesperson(salespersonId, startDate, endDate);
    
    // 獲取推薦碼績效
    const referralPerformance = await this.getReferralPerformance(salespersonId, startDate, endDate);
    
    // 頂級客戶
    const customerRevenue = new Map<string, { orders: number; revenue: number }>();
    orders.forEach(order => {
      const current = customerRevenue.get(order.customerId) || { orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += order.pricing.totalAmount;
      customerRevenue.set(order.customerId, current);
    });
    
    const topCustomers = Array.from(customerRevenue.entries())
      .map(([customerId, stats]) => {
        const order = orders.find(o => o.customerId === customerId);
        return {
          customerId,
          customerName: order?.customerName || 'Unknown',
          orders: stats.orders,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      salespersonId,
      salespersonName: salesperson.displayName || 'Unknown',
      totalOrders,
      totalRevenue,
      averageOrderValue,
      newCustomersAcquired,
      conversionRate: 0.035, // 3.5% 轉換率（模擬數據）
      commissionEarned: totalRevenue * 0.05, // 假設5%佣金率
      performanceRanking: 1, // 需要與其他業務員比較
      monthlyTargets: [], // 需要目標設定功能
      topCustomers,
      referralPerformance
    };
  }

  // 生成儀表板統計資料
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 今日統計
    const todayStats = await this.getStatsForPeriod(today, now);
    
    // 本月統計
    const monthStats = await this.getStatsForPeriod(startOfMonth, now);
    
    // 總計統計
    const totalStats = await this.getTotalStats();
    
    // 趨勢資料（最近30天）
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trends = await this.getTrendsData(thirtyDaysAgo, now);
    
    return {
      today: todayStats,
      thisMonth: monthStats,
      total: totalStats,
      trends,
      recentActivities: [] // 需要活動記錄功能
    };
  }

  // 獲取KPI指標
  async getKPIMetrics(): Promise<KPIMetrics> {
    // 這裡應該根據實際的目標設定來計算KPI
    // 目前提供模擬數據
    
    return {
      revenue: {
        current: 125000,
        target: 150000,
        growth: 0.15,
        trend: 'up'
      },
      orders: {
        current: 450,
        target: 500,
        growth: 0.12,
        averageValue: 278
      },
      customers: {
        total: 1250,
        new: 45,
        retention: 0.85,
        satisfaction: 4.6
      },
      conversion: {
        visitToLead: 0.08,
        leadToCustomer: 0.35,
        overallConversion: 0.028
      }
    };
  }

  // 輔助方法：計算新客戶數量
  private async countNewCustomersInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const customersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'customer'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(customersQuery);
    return snapshot.size;
  }

  // 輔助方法：按天分組訂單
  private groupOrdersByDay(orders: Order[], startDate: Date, endDate: Date): Array<{ date: string; revenue: number; orders: number }> {
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    
    // 初始化所有日期
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      dayMap.set(dateStr, { revenue: 0, orders: 0 });
      current.setDate(current.getDate() + 1);
    }
    
    // 統計訂單
    orders.forEach(order => {
      const dateStr = order.orderDate.toISOString().split('T')[0];
      const current = dayMap.get(dateStr);
      if (current) {
        current.revenue += order.pricing.totalAmount;
        current.orders += 1;
      }
    });
    
    return Array.from(dayMap.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      orders: stats.orders
    }));
  }

  // 輔助方法：按付款方式分組
  private groupOrdersByPaymentMethod(orders: Order[]): Array<{ method: string; revenue: number; count: number }> {
    const methodMap = new Map<PaymentMethod, { revenue: number; count: number }>();
    
    orders.forEach(order => {
      const method = order.payment.method;
      const current = methodMap.get(method) || { revenue: 0, count: 0 };
      current.revenue += order.pricing.totalAmount;
      current.count += 1;
      methodMap.set(method, current);
    });
    
    return Array.from(methodMap.entries()).map(([method, stats]) => ({
      method,
      revenue: stats.revenue,
      count: stats.count
    }));
  }

  // 輔助方法：生成月度趨勢
  private generateMonthlyTrend(startDate: Date, endDate: Date, totalRevenue: number): Array<{ month: string; revenue: number; growth: number }> {
    // 這裡需要實際的歷史數據來計算趨勢
    // 目前提供模擬數據
    const months = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      months.push({
        month: current.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        growth: (Math.random() - 0.5) * 0.4 // -20% 到 +20%
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }

  // 輔助方法：計算業務員新客戶數量
  private async countNewCustomersBySalesperson(salespersonId: string, startDate: Date, endDate: Date): Promise<number> {
    // 這裡需要追蹤客戶與業務員的首次關聯時間
    // 目前提供模擬數據
    return Math.floor(Math.random() * 10) + 1;
  }

  // 輔助方法：獲取推薦碼績效
  private async getReferralPerformance(salespersonId: string, startDate: Date, endDate: Date) {
    // 獲取業務員的推薦碼
    const referralCodesQuery = query(
      collection(db, COLLECTIONS.REFERRAL_CODES),
      where('salespersonId', '==', salespersonId),
      where('isActive', '==', true)
    );
    const referralCodesSnapshot = await getDocs(referralCodesQuery);
    const referralCodes = referralCodesSnapshot.docs.map(doc => doc.data() as ReferralCode);
    
    let totalClicks = 0;
    let totalRegistrations = 0;
    let totalOrders = 0;
    let revenue = 0;
    
    for (const code of referralCodes) {
      // 獲取點擊數據
      const clicksQuery = query(
        collection(db, 'referralClicks'),
        where('referralCode', '==', code.code),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );
      const clicksSnapshot = await getDocs(clicksQuery);
      totalClicks += clicksSnapshot.size;
      
      // 獲取註冊和訂單數據需要從用戶和訂單集合中查詢
      // 這裡提供模擬計算
      const registrations = Math.floor(clicksSnapshot.size * 0.15); // 15% 轉換率
      const orders = Math.floor(registrations * 0.3); // 30% 下單率
      
      totalRegistrations += registrations;
      totalOrders += orders;
      revenue += orders * 1000; // 假設平均訂單金額1000元
    }
    
    const conversionRate = totalClicks > 0 ? totalRegistrations / totalClicks : 0;
    
    return {
      totalClicks,
      totalRegistrations,
      totalOrders,
      conversionRate,
      revenue
    };
  }

  // 輔助方法：獲取期間統計
  private async getStatsForPeriod(startDate: Date, endDate: Date) {
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate))
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    const customerIds = [...new Set(orders.map(order => order.customerId))];
    
    return {
      orders: totalOrders,
      revenue: totalRevenue,
      customers: customerIds.length,
      conversion: 0.025, // 模擬轉換率
      growth: Math.random() * 0.2 - 0.1 // 模擬成長率 -10% 到 +10%
    };
  }

  // 輔助方法：獲取總計統計
  private async getTotalStats() {
    const [customersSnapshot, productsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', 'customer'))),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, COLLECTIONS.ORDERS))
    ]);
    
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
    
    return {
      customers: customersSnapshot.size,
      products: productsSnapshot.size,
      orders: ordersSnapshot.size,
      revenue: totalRevenue
    };
  }

  // 輔助方法：獲取趨勢資料
  private async getTrendsData(startDate: Date, endDate: Date) {
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate))
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Order);
    
    // 按日統計
    const dailyStats = this.groupOrdersByDay(orders, startDate, endDate);
    
    return {
      revenue: dailyStats.map(day => ({
        date: day.date,
        value: day.revenue
      })),
      orders: dailyStats.map(day => ({
        date: day.date,
        value: day.orders
      }))
    };
  }
}

export const reportsService = new ReportsService();