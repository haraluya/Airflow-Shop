name: "Airflow B2B電商平台 - 第一階段：基礎架構與認證系統"
description: |
  建立 Airflow B2B 電商平台的核心基礎架構，包含 Next.js 14 專案建立、Firebase 服務整合、
  基礎認證功能實作，以及核心資料模型設計。此階段為整個平台的基石。

---

## Goal
建立完整的 Airflow B2B 電商平台基礎架構與認證系統，讓使用者能夠成功註冊、登入，並建立完整的開發環境。

## Why
- **專案基礎**：為後續所有功能模組提供穩固的技術基礎
- **使用者認證**：建立安全的多角色使用者系統（admin/customer/salesperson）
- **資料架構**：設計符合 B2B 電商需求的 Firestore 資料庫結構
- **開發效率**：建立標準化的開發環境與工具鏈

## What
### 功能需求
1. **專案架構**：Next.js 14 (App Router) + TypeScript + Tailwind CSS
2. **Firebase 整合**：Authentication、Firestore、Functions、Storage
3. **認證系統**：註冊、登入、角色權限、路由保護
4. **UI 系統**：基於 Radix UI 的設計系統與核心元件
5. **資料模型**：核心集合結構與安全規則

### Success Criteria
- [ ] Next.js 14 專案成功建立並可本地運行
- [ ] Firebase 服務完整配置並正常連線
- [ ] 使用者可以成功註冊並登入
- [ ] 基礎資料庫寫入讀取功能正常
- [ ] 專案可以正常 build 並部署
- [ ] 路由保護功能正常運作
- [ ] 基礎 UI 元件庫建立完成

## All Needed Context

### Documentation & References
```yaml
# MUST READ - 核心技術文件
- url: https://nextjs.org/docs/app
  why: Next.js 14 App Router 架構與最佳實踐
  
- url: https://firebase.google.com/docs/auth/web/start
  why: Firebase Authentication 整合方法
  
- url: https://firebase.google.com/docs/firestore/quickstart
  why: Firestore 資料庫基礎操作與安全規則
  
- url: https://www.radix-ui.com/primitives/docs/overview/getting-started
  why: Radix UI 元件庫使用方法

- file: examples/firebase-config.ts
  why: Firebase 配置範例與最佳實踐
  
- file: examples/business-types.ts
  why: B2B 電商核心資料類型定義
  
- file: examples/utils.ts
  why: 專案通用工具函數範例

- file: 商城規劃軟體需求規格生成.md
  why: 完整的系統需求規格與資料模型設計

- docfile: INITIAL.md
  why: 專案核心需求與技術架構說明
```

### Current Codebase tree
```bash
Airflow-shop/
├── .claude/
├── .git/
├── examples/                   # 程式碼範例與參考
│   ├── business-types.ts
│   ├── firebase-config.ts
│   ├── utils.ts
│   └── README.md
├── PRPs/                       # PRP 文件
├── use-cases/                  # 使用案例範例
├── CLAUDE.md                   # 開發規範指南
├── INITIAL.md                  # 專案需求說明
├── README.md                   # 專案說明
├── firebase.json               # Firebase 配置
├── firestore.indexes.json     # Firestore 索引
├── firestore.rules            # Firestore 安全規則
└── 商城規劃軟體需求規格生成.md    # 系統需求規格
```

### Desired Codebase tree with files to be added
```bash
Airflow-shop/
├── src/                        # 主要程式碼目錄
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認證相關頁面群組
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/       # 後台頁面群組（預留）
│   │   ├── (shop)/            # 前台商城頁面群組（預留）
│   │   ├── api/               # API 路由
│   │   ├── globals.css        # 全域樣式
│   │   ├── layout.tsx         # 根佈局
│   │   └── page.tsx           # 首頁
│   ├── components/            # 共用元件
│   │   ├── ui/                # 基礎 UI 元件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── form.tsx
│   │   ├── forms/             # 表單元件
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   └── layout/            # 版面元件
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       └── navigation.tsx
│   ├── lib/                   # 工具函式與設定
│   │   ├── firebase/          # Firebase 相關
│   │   │   ├── config.ts      # Firebase 配置
│   │   │   ├── auth.ts        # 認證相關函數
│   │   │   └── firestore.ts   # Firestore 操作函數
│   │   ├── utils/             # 通用工具
│   │   │   ├── cn.ts          # className 合併工具
│   │   │   ├── validation.ts  # 驗證工具
│   │   │   └── constants.ts   # 常數定義
│   │   ├── types/             # TypeScript 型別定義
│   │   │   ├── auth.ts        # 認證相關型別
│   │   │   ├── user.ts        # 使用者型別
│   │   │   └── common.ts      # 通用型別
│   │   ├── hooks/             # 自定義 Hooks
│   │   │   ├── use-auth.ts    # 認證狀態 Hook
│   │   │   └── use-user.ts    # 使用者資料 Hook
│   │   └── providers/         # Context Providers
│   │       └── auth-provider.tsx
│   └── styles/                # 樣式檔案
├── functions/                 # Firebase Functions（預留）
├── package.json               # 專案依賴
├── next.config.js             # Next.js 配置
├── tailwind.config.js         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
├── .env.local                 # 本地環境變數
└── .env.example               # 環境變數範例
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Firebase 配置
// Next.js 需要在 client 端初始化 Firebase
// 使用單例模式避免重複初始化

// CRITICAL: App Router 注意事項
// 使用 'use client' 指令標記客戶端元件
// 認證狀態需要透過 Context 在 client side 管理

// CRITICAL: Firestore 安全規則
// 嚴格的資料隔離，客戶只能存取自己的資料
// 所有寫入操作都需要驗證使用者身份

// CRITICAL: 環境變數
// Firebase 配置使用 NEXT_PUBLIC_ 前綴才能在 client 端使用
// 敏感資訊（如 private keys）只在 server side 使用

// CRITICAL: TypeScript 配置
// 啟用嚴格模式，確保型別安全
// 使用 paths mapping 簡化 import 路徑

// CRITICAL: Tailwind CSS
// 使用 clsx 和 tailwind-merge 處理條件樣式
// 響應式設計採用 Mobile-First 原則
```

## Implementation Blueprint

### Data models and structure
```typescript
// 核心認證與使用者資料模型
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName?: string;
  role: 'admin' | 'customer' | 'salesperson';
  status: 'active' | 'pending' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CustomerProfile extends User {
  role: 'customer';
  companyName?: string;
  taxId?: string;                 // 統一編號
  contactPerson: string;
  phoneNumber: string;
  addresses: Address[];
  pricingGroupId?: string;        // 價格群組
  salespersonId?: string;         // 綁定業務員
  referralCode?: string;          // 推薦碼
  notes?: string;                 // 備註
}

interface Address {
  id: string;
  label: string;                  // 地址標籤（如：公司、倉庫）
  recipient: string;              // 收件人
  phone: string;
  address: string;
  isDefault: boolean;
}
```

### List of tasks to be completed
```yaml
Task 1: 專案初始化與環境設定
CREATE package.json:
  - SETUP Next.js 14 with TypeScript
  - ADD Firebase SDK dependencies
  - ADD UI libraries (Radix UI, Tailwind CSS)
  - ADD development tools (ESLint, Prettier)

CREATE configuration files:
  - next.config.js (Next.js 設定)
  - tailwind.config.js (Tailwind CSS 設定)
  - tsconfig.json (TypeScript 設定)
  - .env.example (環境變數範例)

Task 2: Firebase 服務配置
CREATE src/lib/firebase/config.ts:
  - ADAPT from examples/firebase-config.ts
  - SETUP Firebase services initialization
  - ADD error handling and retry logic

CREATE firestore.rules:
  - DEFINE security rules for users collection
  - IMPLEMENT role-based access control
  - ADD data isolation rules

Task 3: 基礎 UI 元件系統
CREATE src/components/ui/:
  - button.tsx (按鈕元件)
  - card.tsx (卡片元件)
  - input.tsx (輸入框元件)
  - form.tsx (表單元件)
  - MIRROR patterns from examples/components/

CREATE src/lib/utils/cn.ts:
  - IMPLEMENT className utility with clsx and tailwind-merge

Task 4: 認證系統核心
CREATE src/lib/types/auth.ts:
  - DEFINE User, CustomerProfile interfaces
  - ADD authentication related types

CREATE src/lib/firebase/auth.ts:
  - IMPLEMENT signUp, signIn, signOut functions
  - ADD role-based user creation
  - HANDLE authentication state changes

CREATE src/lib/providers/auth-provider.tsx:
  - CREATE AuthContext for state management
  - IMPLEMENT authentication state persistence

Task 5: 認證頁面實作
CREATE src/app/(auth)/login/page.tsx:
  - IMPLEMENT login form with validation
  - ADD error handling and loading states
  - INTEGRATE with Firebase Auth

CREATE src/app/(auth)/register/page.tsx:
  - IMPLEMENT registration form
  - ADD customer profile fields
  - IMPLEMENT approval workflow

CREATE src/components/forms/:
  - login-form.tsx (登入表單)
  - register-form.tsx (註冊表單)

Task 6: 路由保護與佈局
CREATE src/app/layout.tsx:
  - SETUP root layout with AuthProvider
  - ADD global styles and theme configuration

CREATE src/components/layout/:
  - header.tsx (頁首導航)
  - navigation.tsx (主導航)
  - IMPLEMENT authentication-aware navigation

Task 7: Firestore 資料操作
CREATE src/lib/firebase/firestore.ts:
  - IMPLEMENT user CRUD operations
  - ADD type-safe Firestore helpers
  - IMPLEMENT role-based queries

CREATE src/lib/hooks/:
  - use-auth.ts (認證狀態 Hook)
  - use-user.ts (使用者資料 Hook)

Task 8: 首頁與基礎導航
CREATE src/app/page.tsx:
  - IMPLEMENT welcome page
  - ADD authentication-based content
  - INTEGRATE with navigation system

Task 9: 測試與驗證
CREATE basic test structure:
  - SETUP Jest and testing utilities
  - ADD authentication flow tests
  - VERIFY Firebase security rules
```

### Per task pseudocode
```typescript
// Task 2: Firebase Configuration
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  // PATTERN: Use NEXT_PUBLIC_ prefix for client-side config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ... other config
};

// CRITICAL: Singleton pattern to avoid re-initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Task 4: Authentication Functions
// src/lib/firebase/auth.ts
export async function signUpWithEmail(email: string, password: string, userData: Partial<CustomerProfile>) {
  // PATTERN: Always validate input first
  const validatedData = validateUserInput(userData);
  
  // CRITICAL: Create auth user first, then Firestore document
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // PATTERN: Use batch writes for data consistency
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', userCredential.user.uid);
  
  batch.set(userRef, {
    ...validatedData,
    uid: userCredential.user.uid,
    createdAt: serverTimestamp(),
    status: 'pending' // BUSINESS RULE: Requires approval
  });
  
  await batch.commit();
}

// Task 5: Authentication Provider
// src/lib/providers/auth-provider.tsx
'use client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // PATTERN: Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // CRITICAL: Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser(userDoc.exists() ? userDoc.data() as User : null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Integration Points
```yaml
DATABASE:
  - collections: "users", "customers", "admins", "salespeople"
  - indexes: "CREATE INDEX idx_user_role ON users(role, status)"
  - security: "Role-based access rules in firestore.rules"
  
CONFIG:
  - add to: .env.local
  - pattern: "NEXT_PUBLIC_FIREBASE_* environment variables"
  
ROUTES:
  - protected: "/(dashboard)" - requires authentication
  - public: "/(auth)" - login/register pages
  - middleware: "Authentication check and role-based redirects"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript 型別檢查
npx tsc --noEmit

# ESLint 檢查
npx eslint src/ --ext .ts,.tsx

# Prettier 格式化
npx prettier --write src/

# Expected: No errors. 修復所有錯誤再繼續
```

### Level 2: Unit Tests
```typescript
// CREATE __tests__/auth.test.tsx
describe('Authentication Functions', () => {
  test('signUpWithEmail creates user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer' as const
    };
    
    const result = await signUpWithEmail('test@example.com', 'password123', userData);
    expect(result.user.email).toBe('test@example.com');
  });

  test('AuthProvider provides authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Test authentication state management
  });
});
```

```bash
# 運行測試
npm test

# 如果失敗：檢查錯誤訊息，修復程式碼，重新測試
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm run dev

# 測試基本功能
# 1. 訪問 http://localhost:3000/register
# 2. 填寫註冊表單並提交
# 3. 檢查 Firebase Console 中是否創建了用戶
# 4. 訪問 http://localhost:3000/login
# 5. 使用剛註冊的帳號登入

# Expected: 
# - 註冊成功，用戶資料寫入 Firestore
# - 登入成功，正確顯示用戶資訊
# - 路由保護正常運作
```

## Final validation Checklist
- [ ] 所有 TypeScript 錯誤已修復
- [ ] ESLint 檢查通過
- [ ] Firebase 服務正常連接
- [ ] 使用者註冊功能正常運作
- [ ] 使用者登入功能正常運作
- [ ] Firestore 安全規則測試通過
- [ ] 路由保護機制正常
- [ ] UI 元件正確渲染
- [ ] 響應式設計在行動裝置正常顯示
- [ ] 專案可以成功 build：`npm run build`

---

## Anti-Patterns to Avoid
- ❌ 不要在 client 端儲存敏感的 Firebase 配置
- ❌ 不要跳過認證狀態的載入處理
- ❌ 不要忽略 Firestore 安全規則的測試
- ❌ 不要在認證前就存取受保護的資源
- ❌ 不要忘記處理網路錯誤和 Firebase 限制
- ❌ 不要硬編碼角色權限，使用配置檔案
- ❌ 不要忽略使用者體驗，添加適當的載入狀態