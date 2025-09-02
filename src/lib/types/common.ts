import { Timestamp } from 'firebase/firestore';

// 基礎時間戳類型
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁參數
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// 分頁回應
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 搜尋參數
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: string;
}

// 表單狀態
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
}

// 載入狀態
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// 地址資料
export interface Address {
  id: string;
  label: string;          // 地址標籤（如：公司、倉庫）
  recipient: string;      // 收件人
  phone: string;         // 聯絡電話
  address: string;       // 完整地址
  isDefault: boolean;    // 是否為預設地址
}

// 檔案上傳狀態
export interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

// 通知類型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

// 選項類型
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// 統計資料
export interface Stats {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  format?: 'number' | 'currency' | 'percentage';
}