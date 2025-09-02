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
  // 公開頁面
  HOME: '/',
  PUBLIC_PRODUCTS: '/products',
  PUBLIC_PRODUCT_DETAIL: '/products/[id]',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // 認證頁面
  LOGIN: '/login',
  REGISTER: '/register',
  
  // 會員專區
  MEMBER_PRODUCTS: '/shop/products',
  MEMBER_PRODUCT_DETAIL: '/shop/products/[id]',
  CART: '/shop/cart',
  CHECKOUT: '/shop/checkout',
  ORDERS: '/shop/orders',
  ORDER_DETAIL: '/shop/orders/[id]',
  
  // 後台管理
  ADMIN_LOGIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CUSTOMERS: '/admin/dashboard/customers',
  ADMIN_PRODUCTS: '/admin/dashboard/products',
  ADMIN_ORDERS: '/admin/dashboard/orders',
  ADMIN_PRICING: '/admin/dashboard/pricing',
} as const;

// 公開路由（不需要認證）
export const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/products/[id]',
  '/about',
  '/contact',
  '/login',
  '/register',
];

// 會員路由（需要客戶認證）
export const MEMBER_ROUTES = [
  '/shop',
  '/shop/products',
  '/shop/products/[id]',
  '/shop/cart',
  '/shop/checkout',
  '/shop/orders',
  '/shop/orders/[id]',
];

// 後台路由（需要管理員認證）
export const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/dashboard/customers',
  '/admin/dashboard/products',
  '/admin/dashboard/orders',
  '/admin/dashboard/pricing',
  '/admin/dashboard/media',
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
  CARTS: 'carts',
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