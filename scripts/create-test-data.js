// 建立測試資料腳本
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCOFeD1GRbNBGWJApoesWIDgi5rSFOvvSM",
  authDomain: "airflow-ddb4f.firebaseapp.com",
  projectId: "airflow-ddb4f",
  storageBucket: "airflow-ddb4f.firebasestorage.app",
  messagingSenderId: "1024248082490",
  appId: "1:1024248082490:web:eff1170d891b3642a80503"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 測試帳戶資料
const testAccounts = [
  {
    email: 'admin@airflow-shop.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      displayName: '系統管理員',
      firstName: '系統',
      lastName: '管理員',
      phoneNumber: '0912345678',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    email: 'customer@test.com',
    password: 'test123',
    role: 'customer',
    profile: {
      displayName: '測試客戶',
      firstName: '測試',
      lastName: '客戶',
      phoneNumber: '0987654321',
      role: 'customer',
      status: 'active',
      // 客戶特定資料
      companyName: '測試公司',
      taxId: '12345678',
      businessType: '批發零售',
      referralSource: '網路搜尋',
      addresses: [
        {
          id: 'addr1',
          type: 'billing',
          isDefault: true,
          contactName: '測試客戶',
          phoneNumber: '0987654321',
          address: '台北市信義區信義路五段7號',
          city: '台北市',
          postalCode: '11049',
          country: '台灣'
        }
      ],
      businessSettings: {
        creditLimit: 100000,
        paymentTerms: 30,
        discountTier: 'standard'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// 測試分類資料
const testCategories = [
  {
    name: '電子煙設備',
    slug: 'devices',
    description: '各種電子煙設備與配件',
    isActive: true,
    order: 1,
    parentId: null
  },
  {
    name: '煙液/煙彈',
    slug: 'e-liquids',
    description: '各種口味的煙液與煙彈',
    isActive: true,
    order: 2,
    parentId: null
  },
  {
    name: '配件',
    slug: 'accessories',
    description: '電子煙相關配件',
    isActive: true,
    order: 3,
    parentId: null
  }
];

// 測試品牌資料
const testBrands = [
  {
    name: 'JUUL',
    slug: 'juul',
    description: '知名電子煙品牌',
    isActive: true
  },
  {
    name: 'IQOS',
    slug: 'iqos',
    description: '加熱不燃燒產品',
    isActive: true
  },
  {
    name: 'RELX',
    slug: 'relx',
    description: '悅刻電子煙品牌',
    isActive: true
  }
];

// 測試商品資料
const testProducts = [
  {
    name: 'JUUL 經典套組',
    slug: 'juul-classic-starter-kit',
    description: '包含 JUUL 設備和經典口味煙彈的完整套組',
    shortDescription: 'JUUL 經典入門套組，適合新手使用',
    sku: 'JUUL-CLASSIC-001',
    categoryId: '', // 稍後填入
    categoryName: '電子煙設備',
    brandId: '', // 稍後填入
    brandName: 'JUUL',
    basePrice: 1200,
    costPrice: 800,
    stock: 50,
    lowStockThreshold: 10,
    trackStock: true,
    allowBackorder: false,
    hasVariants: false,
    images: [
      {
        id: 'img1',
        url: 'https://via.placeholder.com/400x400/333/fff?text=JUUL+Classic',
        alt: 'JUUL 經典套組',
        order: 1,
        isMain: true
      }
    ],
    specifications: {
      '電池容量': '200mAh',
      '充電時間': '約1小時',
      '煙彈容量': '0.7ml',
      '尼古丁含量': '5%'
    },
    features: [
      '簡單易用的設計',
      '快速充電功能',
      '口感純正',
      '便攜輕巧'
    ],
    tags: ['入門', '經典', '套組'],
    status: 'active',
    isVisible: true,
    isFeatured: true,
    seoTitle: 'JUUL 經典套組 - 電子煙入門首選',
    seoDescription: 'JUUL 經典套組，包含設備和煙彈，是電子煙入門的最佳選擇',
    viewCount: 0,
    orderCount: 0,
    reviewCount: 0,
    averageRating: 0
  },
  {
    name: 'RELX 悅刻阿爾法套組',
    slug: 'relx-alpha-starter-kit',
    description: 'RELX 悅刻阿爾法電子煙套組，包含多種口味煙彈',
    shortDescription: 'RELX 阿爾法套組，口味豐富',
    sku: 'RELX-ALPHA-001',
    categoryId: '', // 稍後填入
    categoryName: '電子煙設備',
    brandId: '', // 稍後填入
    brandName: 'RELX',
    basePrice: 890,
    costPrice: 590,
    stock: 30,
    lowStockThreshold: 5,
    trackStock: true,
    allowBackorder: false,
    hasVariants: false,
    images: [
      {
        id: 'img1',
        url: 'https://via.placeholder.com/400x400/007bff/fff?text=RELX+Alpha',
        alt: 'RELX 悅刻阿爾法套組',
        order: 1,
        isMain: true
      }
    ],
    specifications: {
      '電池容量': '350mAh',
      '充電時間': '約45分鐘',
      '煙彈容量': '2ml',
      '尼古丁含量': '3%'
    },
    features: [
      '長效電池',
      '快速充電',
      '多種口味',
      '人體工學設計'
    ],
    tags: ['熱門', '多口味', '長效'],
    status: 'active',
    isVisible: true,
    isFeatured: true,
    seoTitle: 'RELX 悅刻阿爾法套組 - 多口味電子煙',
    seoDescription: 'RELX 悅刻阿爾法電子煙套組，提供多種口味選擇，長效電池設計',
    viewCount: 0,
    orderCount: 0,
    reviewCount: 0,
    averageRating: 0
  }
];

// 建立帳戶函數
async function createTestAccounts() {
  console.log('🔧 開始建立測試帳戶...');
  
  for (const account of testAccounts) {
    try {
      // 建立 Firebase Auth 帳戶
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        account.email, 
        account.password
      );
      
      console.log(`✅ 建立 Auth 帳戶: ${account.email}`);
      
      // 建立用戶 Profile 文件
      const profileData = {
        ...account.profile,
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email: account.email
      };

      if (account.role === 'admin') {
        // 管理員只存在 users 集合
        await setDoc(doc(db, 'users', userCredential.user.uid), profileData);
        console.log(`✅ 建立管理員 Profile: ${account.email}`);
      } else {
        // 客戶同時存在 users 和 customers 集合
        await setDoc(doc(db, 'users', userCredential.user.uid), profileData);
        await setDoc(doc(db, 'customers', userCredential.user.uid), profileData);
        console.log(`✅ 建立客戶 Profile: ${account.email}`);
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  帳戶已存在: ${account.email}`);
      } else {
        console.error(`❌ 建立帳戶失敗: ${account.email}`, error);
      }
    }
  }
}

// 建立分類函數
async function createTestCategories() {
  console.log('🔧 開始建立測試分類...');
  
  const categoryIds = {};
  
  for (const category of testCategories) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      categoryIds[category.slug] = docRef.id;
      console.log(`✅ 建立分類: ${category.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ 建立分類失敗: ${category.name}`, error);
    }
  }
  
  return categoryIds;
}

// 建立品牌函數
async function createTestBrands() {
  console.log('🔧 開始建立測試品牌...');
  
  const brandIds = {};
  
  for (const brand of testBrands) {
    try {
      const docRef = await addDoc(collection(db, 'brands'), {
        ...brand,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      brandIds[brand.slug] = docRef.id;
      console.log(`✅ 建立品牌: ${brand.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ 建立品牌失敗: ${brand.name}`, error);
    }
  }
  
  return brandIds;
}

// 建立商品函數
async function createTestProducts(categoryIds, brandIds) {
  console.log('🔧 開始建立測試商品...');
  
  for (const product of testProducts) {
    try {
      // 填入分類和品牌 ID
      let finalProduct = { ...product };
      
      if (product.categoryName === '電子煙設備') {
        finalProduct.categoryId = categoryIds['devices'];
      }
      
      if (product.brandName === 'JUUL') {
        finalProduct.brandId = brandIds['juul'];
      } else if (product.brandName === 'RELX') {
        finalProduct.brandId = brandIds['relx'];
      }
      
      const docRef = await addDoc(collection(db, 'products'), {
        ...finalProduct,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ 建立商品: ${product.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ 建立商品失敗: ${product.name}`, error);
    }
  }
}

// 主要執行函數
async function main() {
  console.log('🚀 開始建立測試資料...\n');
  
  try {
    // 建立測試帳戶
    await createTestAccounts();
    console.log('');
    
    // 建立分類
    const categoryIds = await createTestCategories();
    console.log('');
    
    // 建立品牌
    const brandIds = await createTestBrands();
    console.log('');
    
    // 建立商品
    await createTestProducts(categoryIds, brandIds);
    console.log('');
    
    console.log('🎉 測試資料建立完成！');
    console.log('\n📋 測試帳戶資訊：');
    console.log('管理員帳戶:');
    console.log('  Email: admin@airflow-shop.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('客戶帳戶:');
    console.log('  Email: customer@test.com');
    console.log('  Password: test123');
    
  } catch (error) {
    console.error('❌ 建立測試資料失敗:', error);
  } finally {
    process.exit(0);
  }
}

// 執行
main();