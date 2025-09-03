// 管理員與成員相關型別定義

export interface AdminMember {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: Permission[]
  salespersonId?: string // 如果是業務員，關聯到 Salesperson
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  createdBy?: string // 創建此成員的管理員 ID
}

// 創建成員時使用的介面（包含密碼）
export interface CreateMemberData {
  email: string
  password: string
  name: string
  role: AdminRole
  isActive?: boolean
}

export type AdminRole = 'super_admin' | 'admin' | 'salesperson' | 'operations'

export type Permission = 
  // 客戶管理
  | 'customers.read'
  | 'customers.write'
  | 'customers.approve'
  | 'customers.delete'
  // 商品管理
  | 'products.read'
  | 'products.write'
  | 'products.delete'
  // 訂單管理
  | 'orders.read'
  | 'orders.write'
  | 'orders.process'
  | 'orders.delete'
  // 業務員管理
  | 'salesperson.read'
  | 'salesperson.write'
  | 'salesperson.delete'
  // 子網域管理
  | 'subdomains.read'
  | 'subdomains.write'
  | 'subdomains.delete'
  // 成員管理
  | 'members.read'
  | 'members.write'
  | 'members.delete'
  // 系統設定
  | 'system.settings'
  | 'system.reports'

// 角色權限矩陣
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'customers.read', 'customers.write', 'customers.approve', 'customers.delete',
    'products.read', 'products.write', 'products.delete',
    'orders.read', 'orders.write', 'orders.process', 'orders.delete',
    'salesperson.read', 'salesperson.write', 'salesperson.delete',
    'subdomains.read', 'subdomains.write', 'subdomains.delete',
    'members.read', 'members.write', 'members.delete',
    'system.settings', 'system.reports'
  ],
  admin: [
    'customers.read', 'customers.write', 'customers.approve', 'customers.delete',
    'products.read', 'products.write', 'products.delete',
    'orders.read', 'orders.write', 'orders.process', 'orders.delete',
    'salesperson.read', 'salesperson.write',
    'subdomains.read', 'subdomains.write',
    'system.reports'
  ],
  salesperson: [
    'customers.read', 'customers.write', // 限制為自己的客戶
    'orders.read', 'orders.write', // 限制為自己的客戶訂單
    'products.read'
  ],
  operations: [
    'customers.read',
    'products.read',
    'orders.read', 'orders.process'
  ]
}

// 子網域相關型別
export interface Subdomain {
  id: string
  subdomain: string // 子網域名稱 (如: lora)
  salespersonId: string
  salespersonName: string
  isActive: boolean
  isReserved: boolean // 是否為保留字 (如: vp-admin, api, www)
  customSettings?: {
    welcomeMessage?: string
    showContact?: boolean
    lineId?: string
    lineUrl?: string
    introduction?: string
    customStyling?: {
      primaryColor?: string
      logoUrl?: string
    }
  }
  stats?: {
    totalVisits: number
    registrations: number
    orders: number
    revenue: number
  }
  createdAt: Date
  updatedAt: Date
}

// 保留的子網域名稱
export const RESERVED_SUBDOMAINS = [
  'vp-admin',
  'admin',
  'api',
  'www',
  'app',
  'dashboard',
  'manage',
  'system',
  'auth',
  'login',
  'register',
  'support',
  'help',
  'docs',
  'dev',
  'test',
  'staging',
  'prod',
  'production'
]

// 業務員型別 (更新版)
export interface Salesperson {
  id: string
  subdomain: string // 子網域名稱
  name: string
  email: string
  phone?: string
  lineId?: string
  region?: string
  avatar?: string
  welcomeMessage?: string // 專屬歡迎訊息
  contactInfo: {
    phone?: string
    email?: string
    lineId?: string
    address?: string
  }
  isActive: boolean
  adminMemberId?: string // 關聯的管理員帳號 ID
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

// 客戶綁定關係
export interface CustomerBinding {
  customerId: string
  salespersonId: string
  subdomain: string
  boundAt: Date
  isActive: boolean
  bindingSource: 'registration' | 'manual' | 'referral_link'
}

// 用於權限檢查的工具函式
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getRoleDisplayName(role: AdminRole): string {
  const roleNames: Record<AdminRole, string> = {
    super_admin: '超級管理員',
    admin: '管理員',
    salesperson: '業務員',
    operations: '後勤人員'
  }
  return roleNames[role] || role
}