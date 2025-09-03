import { BaseDocument } from './common';

// 通知類型
export const NOTIFICATION_TYPE = {
  ORDER_CREATED: 'order_created',
  ORDER_CONFIRMED: 'order_confirmed', 
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_OVERDUE: 'payment_overdue',
  LOW_STOCK: 'low_stock',
  SYSTEM_ALERT: 'system_alert'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

// 通知狀態
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read'
} as const;

export type NotificationStatus = typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];

// 通知頻道
export const NOTIFICATION_CHANNEL = {
  EMAIL: 'email',
  SMS: 'sms',
  LINE: 'line',
  IN_APP: 'in_app'
} as const;

export type NotificationChannel = typeof NOTIFICATION_CHANNEL[keyof typeof NOTIFICATION_CHANNEL];

// 通知內容
export interface NotificationContent {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

// 通知收件人
export interface NotificationRecipient {
  type: 'customer' | 'admin' | 'salesperson';
  id: string;
  name: string;
  email?: string;
  phone?: string;
  lineId?: string;
}

// 通知記錄
export interface Notification extends BaseDocument {
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: NotificationRecipient;
  content: NotificationContent;
  
  // 相關資源
  resourceType?: 'order' | 'product' | 'customer';
  resourceId?: string;
  
  // 發送記錄
  sentAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  
  // 系統資訊
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

// 通知範本
export interface NotificationTemplate extends BaseDocument {
  name: string;
  type: NotificationType;
  category: string;
  subject?: string;
  emailTemplate?: string;
  smsTemplate?: string;
  lineTemplate?: string;
  inAppTemplate?: string;
  variables: string[];
  isActive: boolean;
  
  // 本地化（選填）
  locale?: string;
}

// 通知設定
export interface NotificationSettings extends BaseDocument {
  userId: string;
  userType: 'customer' | 'admin' | 'salesperson';
  
  // 頻道開關
  emailEnabled: boolean;
  smsEnabled: boolean;
  lineEnabled: boolean;
  inAppEnabled: boolean;
  
  // 類型開關
  orderNotifications: boolean;
  paymentNotifications: boolean;
  stockNotifications: boolean;
  systemNotifications: boolean;
  marketingNotifications: boolean;
  
  // 聯絡資訊
  email?: string;
  phone?: string;
  lineId?: string;
  
  // 偏好設定
  quietHours?: {
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
}

// 發送通知請求
export interface SendNotificationRequest {
  type: NotificationType;
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  content: NotificationContent;
  resourceType?: string;
  resourceId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

// 批量發送通知請求
export interface BatchNotificationRequest {
  notifications: SendNotificationRequest[];
}

// 通知統計
export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  totalRead: number;
  
  byChannel: Record<NotificationChannel, {
    sent: number;
    failed: number;
    pending: number;
  }>;
  
  byType: Record<NotificationType, {
    sent: number;
    failed: number; 
    pending: number;
  }>;
}

// 通知查詢參數
export interface NotificationQueryParams {
  userId?: string;
  userType?: 'customer' | 'admin' | 'salesperson';
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  resourceType?: string;
  resourceId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// 通知操作結果
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  message?: string;
  error?: string;
}