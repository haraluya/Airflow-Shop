// Notion 同步相關型別定義

// Notion 資料庫映射類型
export enum NotionDatabase {
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  PRODUCTS = 'products',
  INVENTORY = 'inventory'
}

// 同步狀態
export enum SyncStatus {
  PENDING = 'pending',       // 待同步
  SYNCING = 'syncing',       // 同步中
  SUCCESS = 'success',       // 同步成功
  FAILED = 'failed',         // 同步失敗
  CONFLICT = 'conflict',     // 資料衝突
  SKIPPED = 'skipped'        // 跳過
}

// 同步方向
export enum SyncDirection {
  FIREBASE_TO_NOTION = 'firebase_to_notion',   // Firebase → Notion
  NOTION_TO_FIREBASE = 'notion_to_firebase',   // Notion → Firebase
  BIDIRECTIONAL = 'bidirectional'              // 雙向同步
}

// 資料變更類型
export enum ChangeType {
  CREATE = 'create',   // 新增
  UPDATE = 'update',   // 更新
  DELETE = 'delete'    // 刪除
}

// Notion 頁面屬性映射
export interface NotionPropertyMapping {
  firebaseField: string;     // Firebase 欄位名稱
  notionProperty: string;    // Notion 屬性名稱
  propertyType: NotionPropertyType; // 屬性類型
  isRequired: boolean;       // 是否必填
  transformer?: string;      // 資料轉換函數名稱
}

// Notion 屬性類型
export enum NotionPropertyType {
  TITLE = 'title',
  RICH_TEXT = 'rich_text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE = 'date',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  RELATION = 'relation',
  FORMULA = 'formula',
  ROLLUP = 'rollup',
  CREATED_TIME = 'created_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_TIME = 'last_edited_time',
  LAST_EDITED_BY = 'last_edited_by'
}

// 同步設定
export interface SyncConfiguration {
  databaseId: string;                    // Notion 資料庫 ID
  firebaseCollection: string;           // Firebase 集合名稱
  syncDirection: SyncDirection;          // 同步方向
  enabled: boolean;                      // 是否啟用同步
  syncInterval: number;                  // 同步間隔（分鐘）
  lastSyncTime?: Date;                   // 最後同步時間
  propertyMappings: NotionPropertyMapping[]; // 屬性映射
  conflictResolution: ConflictResolution; // 衝突解決策略
}

// 衝突解決策略
export enum ConflictResolution {
  FIREBASE_WINS = 'firebase_wins',       // Firebase 資料優先
  NOTION_WINS = 'notion_wins',           // Notion 資料優先
  MANUAL_RESOLVE = 'manual_resolve',     // 手動解決
  LATEST_WINS = 'latest_wins'            // 最新修改優先
}

// 同步任務
export interface SyncTask {
  id: string;
  taskType: 'full_sync' | 'incremental_sync' | 'manual_sync';
  database: NotionDatabase;
  direction: SyncDirection;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: SyncError[];
  createdBy: string;
  metadata?: Record<string, any>;
}

// 同步錯誤
export interface SyncError {
  recordId: string;
  recordType: string;
  errorType: SyncErrorType;
  errorMessage: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  resolved: boolean;
  resolution?: string;
}

// 同步錯誤類型
export enum SyncErrorType {
  VALIDATION_ERROR = 'validation_error',
  API_RATE_LIMIT = 'api_rate_limit',
  AUTHENTICATION_ERROR = 'auth_error',
  PERMISSION_ERROR = 'permission_error',
  DATA_CONFLICT = 'data_conflict',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// 資料變更記錄
export interface ChangeRecord {
  id: string;
  recordId: string;           // 記錄 ID
  recordType: string;         // 記錄類型（orders, customers, products等）
  changeType: ChangeType;     // 變更類型
  source: 'firebase' | 'notion'; // 變更來源
  beforeData?: Record<string, any>; // 變更前資料
  afterData?: Record<string, any>;  // 變更後資料
  changedFields: string[];    // 變更的欄位
  timestamp: Date;            // 變更時間
  userId?: string;            // 變更用戶
  synced: boolean;            // 是否已同步
  syncTaskId?: string;        // 同步任務 ID
}

// Notion Webhook 事件
export interface NotionWebhookEvent {
  id: string;
  type: 'page' | 'database';
  action: 'created' | 'updated' | 'deleted';
  object: any;               // Notion 物件
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

// Notion 分頁結果
export interface NotionPagedResult<T> {
  results: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

// Notion 查詢參數
export interface NotionQueryParams {
  filter?: any;              // Notion 查詢過濾器
  sorts?: any[];             // 排序條件
  startCursor?: string;      // 分頁游標
  pageSize?: number;         // 頁面大小
}

// 批次操作結果
export interface BatchSyncResult {
  taskId: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: SyncError[];
  completedAt: Date;
  duration: number;          // 執行時間（毫秒）
}

// 同步統計
export interface SyncStatistics {
  database: NotionDatabase;
  lastSyncTime?: Date;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncDuration: number;
  totalRecordsSynced: number;
  currentStatus: SyncStatus;
  nextScheduledSync?: Date;
  errorRate: number;
  uptime: number;            // 正常運行時間百分比
}

// 同步健康檢查結果
export interface SyncHealthCheck {
  overall: 'healthy' | 'warning' | 'critical';
  databases: Array<{
    database: NotionDatabase;
    status: 'healthy' | 'warning' | 'error';
    lastSync: Date;
    message: string;
  }>;
  apiConnectivity: boolean;
  authenticationValid: boolean;
  queueStatus: {
    pending: number;
    processing: number;
    failed: number;
  };
  errors: string[];
  warnings: string[];
}

// Notion API 配置
export interface NotionConfig {
  authToken: string;         // Notion API Token
  version: string;           // API 版本
  baseUrl: string;           // API 基礎 URL
  rateLimitPerSecond: number; // 每秒請求限制
  retryAttempts: number;     // 重試次數
  retryDelay: number;        // 重試延遲（毫秒）
}

// Cloud Tasks 任務配置
export interface TaskConfig {
  queueName: string;         // 任務佇列名稱
  location: string;          // 地理位置
  projectId: string;         // GCP 專案 ID
  serviceAccountEmail: string; // 服務帳戶郵箱
  maxRetries: number;        // 最大重試次數
  retryDelay: number;        // 重試延遲
}