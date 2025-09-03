// 初始化測試資料腳本
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'airflow-ddb4f'
});

const db = admin.firestore();
const auth = admin.auth();

async function initTestData() {
  console.log('🚀 開始初始化測試資料...');

  try {
    // 1. 創建測試用戶
    await createTestUsers();
    
    // 2. 創建測試商品分類
    await createTestCategories();
    
    // 3. 創建測試品牌
    await createTestBrands();
    
    // 4. 創建測試商品
    await createTestProducts();
    
    // 5. 創建業務員資料
    await createTestSalespersons();
    
    console.log('✅ 測試資料初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  console.log('📝 創建測試用戶...');
  
  const users = [
    {
      uid: 'admin_test',
      email: 'admin@airflow-shop.com',
      password: 'admin123',
      displayName: '系統管理員',
      role: 'admin',
      status: 'active'
    },
    {
      uid: 'customer_test',
      email: 'customer@test.com',
      password: 'test123',
      displayName: '測試客戶',
      role: 'customer',
      status: 'active'
    },
    {
      uid: 'salesperson_test',
      email: 'salesperson@test.com', 
      password: 'test123',
      displayName: '測試業務員',
      role: 'salesperson',
      status: 'active'
    }
  ];

  for (const user of users) {
    try {
      // 創建 Firebase Auth 用戶
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });

      // 創建 Firestore 用戶檔案
      await db.collection('users').doc(user.uid).set({
        id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ 創建用戶: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  用戶已存在: ${user.email}`);
      } else {
        console.error(`❌ 創建用戶失敗 ${user.email}:`, error);
      }
    }
  }
}

async function createTestCategories() {
  console.log('📂 創建測試分類...');
  
  const categories = [
    {
      id: 'cat_vapes',
      name: '電子煙設備',
      description: '各式電子煙設備',
      slug: 'vapes',
      isActive: true,
      order: 1
    },
    {
      id: 'cat_liquids',
      name: '煙油',
      description: '各種口味煙油',
      slug: 'liquids',
      isActive: true,
      order: 2
    },
    {
      id: 'cat_accessories',
      name: '配件',
      description: '電子煙相關配件',
      slug: 'accessories',
      isActive: true,
      order: 3
    }
  ];

  for (const category of categories) {
    await db.collection('categories').doc(category.id).set({
      ...category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 創建分類: ${category.name}`);
  }
}

async function createTestBrands() {
  console.log('🏷️ 創建測試品牌...');
  
  const brands = [
    {
      id: 'brand_juul',
      name: 'JUUL',
      description: 'JUUL 電子煙品牌',
      slug: 'juul',
      isActive: true
    },
    {
      id: 'brand_vuse',
      name: 'VUSE',
      description: 'VUSE 電子煙品牌',
      slug: 'vuse',
      isActive: true
    }
  ];

  for (const brand of brands) {
    await db.collection('brands').doc(brand.id).set({
      ...brand,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 創建品牌: ${brand.name}`);
  }
}

async function createTestProducts() {
  console.log('📦 創建測試商品...');
  
  const products = [
    {
      id: 'prod_juul_classic',
      name: 'JUUL 經典電子煙',
      slug: 'juul-classic-vape',
      description: '經典 JUUL 電子煙設備，簡單易用',
      shortDescription: '經典電子煙設備',
      sku: 'JUUL-001',
      categoryId: 'cat_vapes',
      brandId: 'brand_juul',
      basePrice: 1200,
      costPrice: 800,
      compareAtPrice: 1500,
      stock: 100,
      lowStockThreshold: 10,
      trackStock: true,
      allowBackorder: false,
      status: 'active',
      isVisible: true,
      isFeatured: true,
      tags: ['電子煙', '經典', 'JUUL'],
      images: [
        {
          id: 'img1',
          url: 'https://via.placeholder.com/400x400?text=JUUL+Classic',
          alt: 'JUUL 經典電子煙',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 50,
      averageRating: 4.5,
      reviewCount: 20
    },
    {
      id: 'prod_vuse_alto',
      name: 'VUSE Alto 電子煙',
      slug: 'vuse-alto-vape',
      description: 'VUSE Alto 高品質電子煙設備',
      shortDescription: '高品質電子煙設備',
      sku: 'VUSE-001',
      categoryId: 'cat_vapes',
      brandId: 'brand_vuse',
      basePrice: 1000,
      costPrice: 650,
      compareAtPrice: 1300,
      stock: 80,
      lowStockThreshold: 10,
      trackStock: true,
      allowBackorder: false,
      status: 'active',
      isVisible: true,
      isFeatured: false,
      tags: ['電子煙', 'VUSE', 'Alto'],
      images: [
        {
          id: 'img2',
          url: 'https://via.placeholder.com/400x400?text=VUSE+Alto',
          alt: 'VUSE Alto 電子煙',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 30,
      averageRating: 4.2,
      reviewCount: 15
    },
    {
      id: 'prod_mint_liquid',
      name: '薄荷煙油',
      slug: 'mint-liquid',
      description: '清新薄荷口味煙油，口感清涼',
      shortDescription: '清新薄荷口味',
      sku: 'LIQ-MINT-001',
      categoryId: 'cat_liquids',
      basePrice: 300,
      costPrice: 180,
      compareAtPrice: 400,
      stock: 200,
      lowStockThreshold: 20,
      trackStock: true,
      allowBackorder: true,
      status: 'active',
      isVisible: true,
      isFeatured: true,
      tags: ['煙油', '薄荷', '清涼'],
      images: [
        {
          id: 'img3',
          url: 'https://via.placeholder.com/400x400?text=Mint+Liquid',
          alt: '薄荷煙油',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 80,
      averageRating: 4.7,
      reviewCount: 35
    }
  ];

  for (const product of products) {
    await db.collection('products').doc(product.id).set({
      ...product,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 創建商品: ${product.name}`);
  }
}

async function createTestSalespersons() {
  console.log('👨‍💼 創建測試業務員資料...');
  
  const salespersons = [
    {
      id: 'salesperson_1',
      uid: 'salesperson_test',
      name: '王小明',
      email: 'salesperson@test.com',
      phone: '0912-345-678',
      lineId: 'wang_airflow',
      region: '台北地區',
      status: 'active',
      isActive: true
    }
  ];

  for (const salesperson of salespersons) {
    await db.collection('salespersons').doc(salesperson.id).set({
      ...salesperson,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 創建業務員: ${salesperson.name}`);
  }

  // 創建推薦碼
  const referralCodes = [
    {
      id: 'ABC',
      code: 'ABC',
      salespersonId: 'salesperson_1',
      salespersonName: '王小明',
      isActive: true,
      clickCount: 0,
      registrationCount: 0,
      orderCount: 0,
      totalSales: 0
    },
    {
      id: 'XYZ',
      code: 'XYZ',
      salespersonId: 'salesperson_2',
      salespersonName: '李小華',
      isActive: true,
      clickCount: 0,
      registrationCount: 0,
      orderCount: 0,
      totalSales: 0
    }
  ];

  for (const code of referralCodes) {
    await db.collection('referralCodes').doc(code.id).set({
      ...code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ 創建推薦碼: ${code.code}`);
  }
}

// 執行初始化
initTestData();