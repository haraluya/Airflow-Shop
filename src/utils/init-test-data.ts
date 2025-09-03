// 瀏覽器控制台初始化測試資料工具
import { db, auth } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  collection,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut 
} from 'firebase/auth';

export async function initTestData() {
  console.log('🚀 開始初始化測試資料...');

  try {
    // 1. 創建測試商品分類
    await createTestCategories();
    
    // 2. 創建測試品牌
    await createTestBrands();
    
    // 3. 創建測試商品
    await createTestProducts();
    
    // 4. 創建業務員資料
    await createTestSalespersons();
    
    console.log('✅ 測試資料初始化完成！');
    alert('測試資料初始化完成！您現在可以測試系統功能。');
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    alert('初始化失敗，請檢查控制台錯誤訊息。');
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

  const batch = writeBatch(db);
  
  for (const category of categories) {
    const docRef = doc(db, 'categories', category.id);
    batch.set(docRef, {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log('✅ 分類創建完成');
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

  const batch = writeBatch(db);
  
  for (const brand of brands) {
    const docRef = doc(db, 'brands', brand.id);
    batch.set(docRef, {
      ...brand,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log('✅ 品牌創建完成');
}

async function createTestProducts() {
  console.log('📦 創建測試商品...');
  
  const products = [
    {
      id: 'prod_juul_classic',
      name: 'JUUL 經典電子煙',
      slug: 'juul-classic-vape',
      description: '經典 JUUL 電子煙設備，簡單易用，適合初學者和有經驗的用戶。採用磁吸式煙彈設計，更換方便。',
      shortDescription: '經典電子煙設備，簡單易用',
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
      tags: ['電子煙', '經典', 'JUUL', '磁吸'],
      specifications: {
        '電池容量': '200mAh',
        '充電時間': '45分鐘',
        '尺寸': '94.8 x 15.3 x 8.5 mm',
        '重量': '8.5g'
      },
      features: ['磁吸式煙彈', 'LED充電指示', '溫度保護', '短路保護'],
      images: [
        {
          id: 'img1',
          url: 'https://via.placeholder.com/400x400/FF6B35/FFFFFF?text=JUUL+Classic',
          alt: 'JUUL 經典電子煙',
          order: 1,
          isMain: true
        },
        {
          id: 'img1_2',
          url: 'https://via.placeholder.com/400x400/FF6B35/FFFFFF?text=JUUL+Side',
          alt: 'JUUL 經典電子煙側面',
          order: 2,
          isMain: false
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
      description: 'VUSE Alto 高品質電子煙設備，提供卓越的蒸氣體驗。具有長效電池和優質口感。',
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
      tags: ['電子煙', 'VUSE', 'Alto', '長效'],
      specifications: {
        '電池容量': '350mAh',
        '充電時間': '70分鐘',
        '尺寸': '92.4 x 20.7 x 13.1 mm',
        '重量': '13g'
      },
      features: ['磁吸煙彈', '快充技術', '洩漏保護', '優質口感'],
      images: [
        {
          id: 'img2',
          url: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=VUSE+Alto',
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
      name: '薄荷煙油 30ml',
      slug: 'mint-liquid-30ml',
      description: '清新薄荷口味煙油，口感清涼舒適，適合炎熱天氣使用。採用優質原料製作，安全可靠。',
      shortDescription: '清新薄荷口味，口感清涼',
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
      tags: ['煙油', '薄荷', '清涼', '30ml'],
      specifications: {
        '容量': '30ml',
        '尼古丁濃度': '6mg/ml',
        'VG/PG比例': '70/30',
        '產地': '台灣'
      },
      features: ['清新薄荷', '清涼口感', '台灣製造', '安全認證'],
      images: [
        {
          id: 'img3',
          url: 'https://via.placeholder.com/400x400/95E1D3/FFFFFF?text=Mint+Liquid',
          alt: '薄荷煙油',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 80,
      averageRating: 4.7,
      reviewCount: 35
    },
    {
      id: 'prod_strawberry_liquid',
      name: '草莓煙油 30ml',
      slug: 'strawberry-liquid-30ml',
      description: '香甜草莓口味煙油，濃郁果香，甜而不膩。精選草莓香精，帶來自然的果香體驗。',
      shortDescription: '香甜草莓口味，濃郁果香',
      sku: 'LIQ-STRAW-001',
      categoryId: 'cat_liquids',
      basePrice: 320,
      costPrice: 200,
      compareAtPrice: 420,
      stock: 150,
      lowStockThreshold: 15,
      trackStock: true,
      allowBackorder: true,
      status: 'active',
      isVisible: true,
      isFeatured: false,
      tags: ['煙油', '草莓', '水果', '香甜'],
      specifications: {
        '容量': '30ml',
        '尼古丁濃度': '3mg/ml',
        'VG/PG比例': '80/20',
        '產地': '台灣'
      },
      features: ['天然草莓香', '香甜口感', '大煙霧', '台灣製造'],
      images: [
        {
          id: 'img4',
          url: 'https://via.placeholder.com/400x400/FF6B9D/FFFFFF?text=Strawberry',
          alt: '草莓煙油',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 45,
      averageRating: 4.3,
      reviewCount: 22
    },
    {
      id: 'prod_usb_charger',
      name: 'USB 充電器',
      slug: 'usb-charger',
      description: '通用型 USB 充電器，適用於大多數電子煙設備。具有過充保護和短路保護功能。',
      shortDescription: '通用型 USB 充電器',
      sku: 'ACC-USB-001',
      categoryId: 'cat_accessories',
      basePrice: 150,
      costPrice: 80,
      compareAtPrice: 200,
      stock: 300,
      lowStockThreshold: 30,
      trackStock: true,
      allowBackorder: false,
      status: 'active',
      isVisible: true,
      isFeatured: false,
      tags: ['配件', '充電器', 'USB', '通用'],
      specifications: {
        '輸入': '5V 1A',
        '輸出': '4.2V 420mA',
        '線長': '80cm',
        '材質': 'ABS'
      },
      features: ['過充保護', '短路保護', '通用接口', '耐用材質'],
      images: [
        {
          id: 'img5',
          url: 'https://via.placeholder.com/400x400/FFA07A/FFFFFF?text=USB+Charger',
          alt: 'USB 充電器',
          order: 1,
          isMain: true
        }
      ],
      orderCount: 120,
      averageRating: 4.1,
      reviewCount: 28
    }
  ];

  const batch = writeBatch(db);
  
  for (const product of products) {
    const docRef = doc(db, 'products', product.id);
    batch.set(docRef, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log('✅ 商品創建完成');
}

async function createTestSalespersons() {
  console.log('👨‍💼 創建測試業務員資料...');
  
  const batch = writeBatch(db);
  
  // 創建業務員資料
  const salespersons = [
    {
      id: 'salesperson_1',
      name: '王小明',
      email: 'wang@airflow-shop.com',
      phone: '0912-345-678',
      lineId: 'wang_airflow',
      region: '台北地區',
      status: 'active',
      isActive: true
    },
    {
      id: 'salesperson_2',
      name: '李小華',
      email: 'lee@airflow-shop.com',
      phone: '0923-456-789',
      lineId: 'lee_airflow',
      region: '台中地區',
      status: 'active',
      isActive: true
    }
  ];

  for (const salesperson of salespersons) {
    const docRef = doc(db, 'salespersons', salesperson.id);
    batch.set(docRef, {
      ...salesperson,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
    const docRef = doc(db, 'referralCodes', code.id);
    batch.set(docRef, {
      ...code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log('✅ 業務員資料創建完成');
}

// 用戶註冊輔助函數
export async function createTestUser(email: string, password: string, displayName: string, role: string = 'customer') {
  try {
    // 創建 Firebase Auth 用戶
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 更新顯示名稱
    await updateProfile(user, { displayName });

    // 創建 Firestore 用戶檔案
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      uid: user.uid,
      email: email,
      displayName: displayName,
      role: role,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 如果是客戶，也創建 customers 集合記錄
    if (role === 'customer') {
      await setDoc(doc(db, 'customers', user.uid), {
        id: user.uid,
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: role,
        status: 'active',
        companyName: '測試公司',
        contactPerson: displayName,
        phoneNumber: '0912-345-678',
        addresses: [{
          id: 'default',
          label: '公司地址',
          recipient: displayName,
          phone: '0912-345-678',
          address: '台北市信義區信義路五段7號',
          isDefault: true
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ 用戶創建成功: ${email}`);
    
    // 登出以便測試登入
    await signOut(auth);
    
    return user;
  } catch (error: any) {
    console.error(`❌ 創建用戶失敗 ${email}:`, error);
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  用戶已存在: ${email}`);
    }
    throw error;
  }
}

// 將函數暴露到全域以便在控制台使用
if (typeof window !== 'undefined') {
  (window as any).initTestData = initTestData;
  (window as any).createTestUser = createTestUser;
}