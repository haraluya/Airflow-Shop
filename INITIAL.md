# Airflow B2B 電商平台與CRM系統開發需求

## 功能需求:

建立一個專為電子煙批發產業量身打造的整合性B2B電商與客戶關係管理(CRM)平台「Airflow」。

**核心功能模組：**

### 1. 前台系統 (Frontend)
- **客戶註冊申請系統**：包含審核流程，需填寫來源說明
- **個人化登入系統**：基於Firebase Authentication
- **商品瀏覽系統**：支援分類、系列篩選，未登入狀態隱藏價格
- **個人化價格引擎**：根據客戶群組和專屬定價顯示不同價格
- **購物車與結帳流程**：完整的B2B採購流程
- **多地址管理**：客戶可管理多個送貨地址
- **訂單查詢系統**：完整的訂單歷史與狀態追蹤
- **通知中心**：接收系統通知與訂單更新

### 2. 後台管理系統 (Backend)
- **管理員儀表板**：營運數據總覽
- **客戶管理 (CRM)**：完整的客戶資料管理與審核系統
- **產品管理**：商品CRUD，支援富文本編輯器(Tiptap)
- **訂單管理**：訂單處理、代客下單、報表匯出
- **定價管理**：群組定價與個人專屬定價設定
- **內容管理**：橫幅圖片管理
- **推薦碼系統**：業務員推薦碼與績效追蹤
- **業務員門戶**：限制權限的業務員專屬後台

### 3. 推薦碼分銷系統
- **URL結構**：domain.com/[推薦碼] 格式
- **自動綁定機制**：新客戶自動綁定推薦碼
- **個人化內容**：根據推薦碼顯示對應業務員LINE資訊
- **強制導向**：登入客戶自動導向其綁定的推薦碼URL

### 4. Notion雙向同步 (過渡模組)
- **事件驅動同步**：Airflow→Notion 使用Cloud Tasks佇列
- **Webhook+輪詢混合**：Notion→Airflow 的可靠同步
- **模組化設計**：可獨立開關的功能模組

## 技術架構範例:

參考 `examples/` 資料夾中的架構範例：

### 前端架構
- **Next.js 14 (App Router)**：React 18, TypeScript
- **UI函式庫**：Radix UI + Tailwind CSS
- **主題系統**：next-themes支援暗色模式
- **響應式設計**：Mobile-First設計原則

### 後端架構
- **Firebase生態系**：Functions, Firestore, Authentication, Storage
- **Serverless架構**：完全無伺服器部署
- **API設計**：RESTful API使用Firebase Functions

### 資料庫設計
- **Firestore NoSQL**：文件集合結構
- **安全規則**：嚴格的資料隔離與權限控制
- **索引優化**：根據查詢模式建立複合索引

## 文件資源:

### 核心需求文件
- `商城規劃軟體需求規格生成.md`：完整的SRS文件，包含詳細的功能需求、資料模型、UI/UX設計
- Firebase官方文件：Next.js整合、Firestore、Authentication
- Next.js 14文件：App Router、SSR功能
- Notion API文件：Webhook、速率限制、雙向同步

### UI/UX設計規範
- 全域色彩系統：橘藍漸層主題色 (clr-primary-start: #FFA500, clr-primary-end: #0000FF)
- 字體排版系統：Inter字體族，響應式排版尺度
- 元件庫規範：基於Radix UI的標準化元件

### 資料模型
- **users集合**：使用者基本資料與角色權限
- **customers子集合**：客戶CRM資料與定價資訊
- **products集合**：商品資料與富文本描述
- **orders集合**：訂單資料與Notion同步狀態
- **pricingGroups集合**：價格群組管理
- **referralCodes集合**：推薦碼與業務員資料

## 其他考量事項:

### 安全性需求
- **資料隔離**：客戶只能存取自己的資料
- **角色權限**：嚴格的三層權限控制 (admin/customer/salesperson)
- **輸入驗證**：所有API端點使用Zod驗證
- **Firestore安全規則**：資料庫層級的安全控制

### 效能考量
- **價格引擎快取**：登入時快取定價資訊
- **圖片最佳化**：Firebase Storage整合
- **冷啟動延遲**：Firebase Functions的啟動時間考量

### 模組化設計
- **Notion同步獨立性**：NOTION_SYNC_ENABLED環境變數控制
- **元件可重用性**：統一的設計系統與元件庫
- **程式碼分離**：清楚的前後端界限與API設計

### 常見陷阱與注意事項
- **Firebase Functions冷啟動**：首次調用可能有數秒延遲
- **Notion API限制**：每秒3次請求限制，需使用佇列機制
- **Firestore查詢限制**：需預先建立複合索引
- **權限邊界檢查**：業務員不能查看其他業務員的資料
- **價格引擎優先級**：客戶專屬 > 群組價格 > 標準價格

### Windows 11 開發環境
- **Node.js版本**：18.x 或更高版本
- **Firebase CLI**：12.1.0或更新版本
- **Git設定**：確保正確的換行符號設定
- **PowerShell支援**：使用PowerShell進行部署指令