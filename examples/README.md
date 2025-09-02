# Airflow B2B 電商平台 - 程式碼範例

本資料夾包含從 deer-lab 專案移植和適配的核心程式碼模組，專為 B2B 電商平台開發而設計。

## 📁 檔案結構

```
examples/
├── firebase-config.ts      # Firebase 配置範例
├── business-types.ts       # B2B 電商業務類型定義
├── utils.ts                # 工具函數庫
├── components/             # UI 組件範例
│   ├── Button.tsx          # 按鈕組件
│   └── Card.tsx            # 卡片組件（含產品卡、訂單卡）
└── README.md               # 本說明檔案
```

## 🔧 核心模組說明

### Firebase 配置 (firebase-config.ts)
- 基於 deer-lab 專案的最佳實踐
- 包含完整的 Firebase 服務初始化
- 支援延遲載入和錯誤處理
- 適用於 Next.js 專案

**使用方式：**
```typescript
import { auth, db, functions, storage } from './firebase-config';
```

### 業務類型定義 (business-types.ts)
從生產管理系統適配為 B2B 電商系統，包含：

**核心業務實體：**
- `Product` - 產品管理
- `Category` - 分類管理
- `Brand` - 品牌管理
- `Customer` - 客戶管理
- `Supplier` - 供應商管理

**交易流程：**
- `Order` - 訂單管理
- `Quotation` - 報價單管理
- `OrderItem` - 訂單項目
- `CartItem` - 購物車項目

**支援功能：**
- `InventoryRecord` - 庫存記錄
- `SalesStats` - 銷售統計
- 價格層級管理
- 地址管理

### 工具函數庫 (utils.ts)
專為 B2B 電商開發的工具函數：

**代碼生成：**
- `generateCustomerCode()` - 客戶編號
- `generateProductCode()` - 產品編號
- `generateOrderNumber()` - 訂單編號
- `generateQuotationNumber()` - 報價單編號

**驗證功能：**
- `validateEmail()` - 電子郵件驗證
- `validatePhoneNumber()` - 電話號碼驗證（支援台灣格式）
- `validateTaxId()` - 統一編號驗證

**價格計算：**
- `calculateBulkPrice()` - 批量價格計算
- `calculateDiscountAmount()` - 折扣計算
- `calculateTaxAmount()` - 稅額計算

**格式化工具：**
- `formatCurrency()` - 貨幣格式化
- `formatDate()` - 日期格式化
- `formatNumber()` - 數字格式化

### UI 組件範例 (components/)

#### Button 組件
- 基於 Radix UI + Tailwind CSS
- 支援多種變體：default, destructive, outline, secondary, ghost, link, success, warning
- 支援載入狀態、圖示、不同尺寸
- 響應式設計（手機友善）

#### Card 組件
- 基礎卡片組件 + 專用業務卡片
- `ProductCard` - 產品展示卡片
- `OrderCard` - 訂單展示卡片
- 內建狀態顯示、動作按鈕

## 🚀 如何使用

### 1. 安裝依賴
```bash
npm install firebase @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 2. 環境變數設定
建立 `.env.local` 檔案並設定 Firebase 配置：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Tailwind CSS 設定
確保你的 `tailwind.config.js` 包含必要的類別：
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. 在專案中使用
```typescript
// 匯入類型定義
import type { Product, Order, Customer } from './examples/business-types';

// 匯入工具函數
import { generateOrderNumber, formatCurrency } from './examples/utils';

// 匯入組件
import { Button, ProductCard } from './examples/components';

// 匯入 Firebase 配置
import { db, auth } from './examples/firebase-config';
```

## 📊 Notion 資料庫整合

本專案設定為與 Notion 資料庫整合，Notion ID：`262d43f1a90b815983f5d4c2392cd155`

**預計匯出的資料表：**
- 產品資料表
- 客戶資料表
- 訂單資料表
- 分類資料表

## 🔄 後續開發建議

1. **優先實作模組：**
   - Firebase 配置和初始化
   - 基礎類型定義
   - 核心 UI 組件庫

2. **業務邏輯開發：**
   - 產品管理系統
   - 客戶管理系統
   - 訂單管理系統
   - 購物車功能

3. **進階功能：**
   - 報價單系統
   - 庫存管理
   - 銷售統計
   - 客戶分級管理

## 📝 注意事項

- 所有組件都支援 TypeScript
- UI 組件採用響應式設計
- 價格計算支援多種貨幣
- 狀態管理已考慮 i18n 需求
- 所有日期格式預設為繁體中文

## 🤝 貢獻指南

在新增或修改程式碼時：
1. 遵循現有的程式碼風格
2. 確保 TypeScript 類型安全
3. 添加必要的註釋說明
4. 測試響應式設計
5. 更新相關文件