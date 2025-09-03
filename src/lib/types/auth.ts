import { USER_ROLES, USER_STATUS } from '@/lib/utils/constants';
import { BaseDocument, Address } from './common';

// 使用者角色與狀態類型
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// 基礎使用者介面
export interface User extends BaseDocument {
  uid: string;              // Firebase Auth UID
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  profileImageUrl?: string;
}

// 客戶檔案擴充
export interface CustomerProfile extends User {
  role: 'customer';
  companyName?: string;
  taxId?: string;                    // 統一編號
  contactPerson: string;             // 聯絡人
  phoneNumber: string;
  addresses: Address[];              // 多送貨地址
  pricingGroupId?: string;           // 價格群組ID
  salespersonId?: string;            // 綁定業務員ID
  referralCode?: string;             // 推薦碼 (向後相容，實際使用子網域)
  notes?: string;                    // 管理員備註
  source?: string;                   // 客戶來源說明
  creditLimit?: number;              // 信用額度
  paymentTerms?: string;             // 付款條件
}

// 業務員檔案擴充
export interface SalespersonProfile extends User {
  role: 'salesperson';
  employeeId: string;                // 員工編號
  name: string;                      // 真實姓名
  lineId?: string;                   // LINE ID
  phoneNumber: string;
  territory?: string[];              // 負責區域
  commissionRate?: number;           // 佣金比例
  isActive: boolean;                 // 是否在職
  managerId?: string;                // 主管ID
  subdomain?: string;                // 專屬子網域名稱 (如: wang, lee)
  subdomainEnabled?: boolean;        // 子網域是否啟用
}

// 管理員檔案擴充
export interface AdminProfile extends User {
  role: 'admin';
  name: string;
  permissions: AdminPermission[];    // 權限列表
  department?: string;               // 部門
  isSuper?: boolean;                 // 是否為超級管理員
}

// 管理員權限
export type AdminPermission = 
  | 'users.read' | 'users.write' | 'users.delete'
  | 'products.read' | 'products.write' | 'products.delete'
  | 'orders.read' | 'orders.write' | 'orders.delete'
  | 'customers.read' | 'customers.write' | 'customers.delete'
  | 'reports.read' | 'settings.write'
  | 'system.admin';

// 認證上下文類型
export interface AuthContextType {
  user: User | null;
  profile: CustomerProfile | SalespersonProfile | AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 註冊資料類型
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  companyName?: string;
  contactPerson: string;
  phoneNumber: string;
  taxId?: string;
  address: string;
  source: string;                    // 從何處得知平台
}

// 登入資料類型
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 密碼重設資料類型
export interface PasswordResetData {
  email: string;
}

// 密碼更新資料類型
export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 個人資料更新資料類型
export interface ProfileUpdateData {
  displayName?: string;
  phoneNumber?: string;
  companyName?: string;
  taxId?: string;
  addresses?: Address[];
  profileImageUrl?: string;
}

// JWT Token Payload（如果使用 JWT）
export interface TokenPayload {
  uid: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}