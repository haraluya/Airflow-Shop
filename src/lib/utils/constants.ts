// 應用程式常數
export const APP_NAME = "Airflow B2B Shop";
export const APP_DESCRIPTION = "專為電子煙批發產業設計的B2B電商平台";

// 使用者角色
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  SALESPERSON: 'salesperson',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// 使用者狀態
export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending', 
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// 路由常數
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  CUSTOMERS: '/customers',
  ADMIN: '/admin',
} as const;

// 受保護的路由
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/products',
  '/orders',
  '/customers',
  '/admin',
  '/profile',
];

// 僅限管理員的路由
export const ADMIN_ROUTES = [
  '/admin',
  '/customers',
  '/dashboard/admin',
];

// 僅限業務員的路由  
export const SALESPERSON_ROUTES = [
  '/dashboard/sales',
  '/customers/my',
];

// Firebase 集合名稱
export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers', 
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  PRICING_GROUPS: 'pricingGroups',
  PRODUCT_PRICES: 'productPrices',
  REFERRAL_CODES: 'referralCodes',
} as const;

// 驗證常數
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  COMPANY_NAME_MAX_LENGTH: 100,
  PHONE_PATTERN: /^09\d{8}$/,
  TAX_ID_PATTERN: /^\d{8}$/,
} as const;

// API 端點
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
} as const;

// 錯誤訊息
export const ERROR_MESSAGES = {
  INVALID_EMAIL: '請輸入有效的電子郵件地址',
  PASSWORD_TOO_SHORT: `密碼至少需要 ${VALIDATION.PASSWORD_MIN_LENGTH} 個字元`,
  INVALID_PHONE: '請輸入有效的手機號碼（格式：09XXXXXXXX）',
  INVALID_TAX_ID: '請輸入有效的統一編號（8位數字）',
  REQUIRED_FIELD: '此欄位為必填',
  LOGIN_FAILED: '登入失敗，請檢查您的帳號密碼',
  REGISTRATION_FAILED: '註冊失敗，請稍後再試',
  UNAUTHORIZED: '您沒有權限執行此操作',
  NETWORK_ERROR: '網路連線錯誤，請檢查您的網路狀態',
} as const;