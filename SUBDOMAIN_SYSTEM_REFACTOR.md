# 子網域系統重構計劃

## 📋 更新記錄
- **建立日期**: 2025-09-03
- **最後更新**: 2025-09-03
- **狀態**: 🔄 進行中

## 🎯 系統架構重新設計

### 前台系統架構 (devape.me)
**主要概念**: 業務員子網域系統，讓每個業務員擁有專屬的客戶入口

#### 🌐 網址結構設計
```
主網站: devape.me
├── / (首頁 - 商城展示頁面)
├── /products (商品頁面)  
├── /login (前台登入頁面)
├── /register (前台註冊頁面)
├── /cart (購物車)
├── /checkout (結帳)
├── /orders (訂單查詢)
└── /[subdomain] (業務員子網域)
    ├── /lora (業務員 lora 的專屬頁面)
    ├── /lora/products (lora 客戶專屬商品頁)
    ├── /lora/login (lora 客戶登入)
    ├── /lora/register (lora 客戶註冊)
    ├── /lora/cart (lora 客戶購物車)
    └── /lora/* (所有頁面都有 lora 前綴)
```

#### 🔄 客戶綁定機制
1. **註冊綁定**: 客戶在 `devape.me/lora/register` 註冊時自動綁定 lora 業務員
2. **自動轉跳**: lora 的客戶登入後訪問 `devape.me` 會自動轉跳到 `devape.me/lora`
3. **標籤管理**: 後台可看到客戶的業務員標籤
4. **價格權限**: 業務員可為自己的客戶設定專屬價格

#### 🎨 個人化內容
- 業務員聯絡方式展示
- 業務員專屬訊息與歡迎詞
- 客製化的商品價格
- 專屬優惠券與促銷活動

### 後台系統架構 (devape.me/vp-admin)
**主要概念**: 完全獨立的後台管理系統，與前台完全分離

#### 🔧 管理功能
```
後台網址: devape.me/vp-admin
├── /vp-admin (後台登入頁面)
├── /vp-admin/dashboard (儀表板)
├── /vp-admin/members (成員管理)
├── /vp-admin/subdomains (子網域管理)
├── /vp-admin/customers (客戶管理)
├── /vp-admin/products (商品管理)
├── /vp-admin/orders (訂單管理)
└── /vp-admin/settings (系統設定)
```

#### 👥 成員權限系統
1. **系統管理員 (Super Admin)**
   - 完整系統權限
   - 成員管理
   - 子網域管理
   - 系統設定

2. **業務員 (Salesperson)**
   - 自己客戶的管理
   - 自己訂單的查看與處理
   - 自己的優惠券管理
   - 客戶價格調整權限

3. **後勤人員 (Operations)**
   - 訂單處理與出貨
   - 庫存管理
   - 客戶資料查看（唯讀）

## 🚀 實施計劃

### 第一階段：路由架構重構 (預估 2-3 天)
#### ✅ 已完成項目
- [ ] 建立新的路由群組結構
- [ ] 分離前台與後台入口
- [ ] 實作子網域動態路由解析

#### 📋 主要任務
1. **重新設計 app 目錄結構**
   ```
   app/
   ├── (frontend)/          # 前台路由群組
   │   ├── page.tsx         # 主首頁
   │   ├── products/        # 商品頁面
   │   ├── login/           # 前台登入
   │   └── [subdomain]/     # 子網域動態路由
   ├── vp-admin/           # 後台路由群組  
   │   ├── page.tsx        # 後台登入頁
   │   ├── dashboard/      # 後台儀表板
   │   └── members/        # 成員管理
   └── api/                # API 路由
   ```

2. **實作子網域路由邏輯**
   - 動態路由 `[subdomain]` 處理
   - 子網域驗證與查詢
   - 無效子網域的處理機制

3. **前後台完全分離**
   - 獨立的登入認證流程
   - 分離的權限檢查機制
   - 不同的佈局與樣式系統

### 第二階段：子網域綁定系統 (預估 2-3 天)
#### 📋 主要任務
1. **客戶綁定機制**
   - 註冊時的業務員綁定
   - 客戶-業務員關係資料模型
   - 自動轉跳邏輯實作

2. **個人化內容系統**
   - 業務員資料管理
   - 動態內容載入
   - 客製化價格引擎整合

### 第三階段：成員管理系統 (預估 3-4 天)
#### 📋 主要任務
1. **多角色權限系統**
   - 角色定義與權限矩陣
   - 權限檢查中介軟體
   - 角色切換功能

2. **成員管理介面**
   - 成員新增、編輯、刪除
   - 子網域分配管理
   - 權限設定介面

### 第四階段：Firebase 重新配置 (預估 1-2 天)
#### 📋 主要任務
1. **重新檢查 Firebase 設定**
   - 環境變數配置檢查
   - Firebase 專案設定驗證
   - 認證與資料庫連接測試

2. **安全規則更新**
   - 新的資料結構安全規則
   - 多角色權限規則
   - 子網域相關的資料存取規則

## 📊 資料模型設計

### 業務員 (Salesperson)
```typescript
interface Salesperson {
  id: string
  subdomain: string          // 子網域名稱 (如: lora)
  name: string
  email: string
  phone?: string
  lineId?: string
  welcomeMessage?: string    // 專屬歡迎訊息
  contactInfo: {
    phone?: string
    email?: string
    lineId?: string
    address?: string
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 客戶綁定關係
```typescript
interface CustomerBinding {
  customerId: string
  salespersonId: string
  subdomain: string
  boundAt: Date
  isActive: boolean
}
```

### 後台成員
```typescript
interface AdminMember {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'salesperson' | 'operations'
  permissions: string[]
  salespersonId?: string     // 如果是業務員，關聯到 Salesperson
  isActive: boolean
  createdAt: Date
  lastLoginAt?: Date
}
```

## ⚠️ 風險與注意事項

### 技術風險
1. **大規模路由重構**：可能影響現有功能
2. **Firebase 重新配置**：需要確保資料不丟失
3. **權限系統複雜度**：多角色權限管理複雜

### 緩解策略
1. **漸進式重構**：分階段實施，降低風險
2. **完整備份**：重構前備份所有資料
3. **測試覆蓋**：每個階段完成後進行完整測試

## 📈 成功指標

### 第一階段完成標準
- [ ] 前台可正常訪問 devape.me
- [ ] 後台可正常訪問 devape.me/vp-admin  
- [ ] 子網域路由可正確解析
- [ ] Firebase 連接正常

### 第二階段完成標準
- [ ] 客戶可在子網域註冊並自動綁定
- [ ] 綁定客戶登入後自動轉跳到子網域
- [ ] 個人化內容正確顯示

### 第三階段完成標準  
- [ ] 多角色登入與權限控制正常
- [ ] 業務員可管理自己的客戶與訂單
- [ ] 管理員可完整管理所有成員

### 最終驗收標準
- [ ] 完整的前後台分離運作
- [ ] 子網域系統完全正常
- [ ] 所有角色權限正確運作
- [ ] Firebase 服務穩定連接
- [ ] 系統效能符合需求

---

## 📝 更新日誌
- **2025-09-03**: 建立重構計劃文件，定義完整系統架構與實施計劃