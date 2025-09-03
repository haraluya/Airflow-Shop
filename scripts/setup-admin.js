// 建立初始管理員帳號的腳本
// 執行方式: node scripts/setup-admin.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCOFeD1GRbNBGWJApoesWIDgi5rSFOvvSM',
  authDomain: 'airflow-ddb4f.firebaseapp.com',
  projectId: 'airflow-ddb4f',
  storageBucket: 'airflow-ddb4f.firebasestorage.app',
  messagingSenderId: '1024248082490',
  appId: '1:1024248082490:web:eff1170d891b3642a80503'
};

async function createAdminAccount() {
  try {
    console.log('初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 管理員帳號資訊
    const adminEmail = 'admin@devape.me';
    const adminPassword = 'admin123456';
    const adminName = '系統管理員';

    console.log('建立管理員帳號...');
    
    // 創建 Firebase Auth 使用者
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    console.log(`✅ Firebase Auth 使用者已建立: ${user.uid}`);

    // 建立管理員文件
    const adminData = {
      name: adminName,
      email: adminEmail,
      role: 'super_admin',
      permissions: [
        'customers.read', 'customers.write', 'customers.approve', 'customers.delete',
        'products.read', 'products.write', 'products.delete',
        'orders.read', 'orders.write', 'orders.process', 'orders.delete',
        'salesperson.read', 'salesperson.write', 'salesperson.delete',
        'subdomains.read', 'subdomains.write', 'subdomains.delete',
        'members.read', 'members.write', 'members.delete',
        'system.settings', 'system.reports'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'admins', user.uid), adminData);

    console.log('✅ 管理員資料已儲存到 Firestore');
    console.log('');
    console.log('🎉 管理員帳號建立成功！');
    console.log('');
    console.log('📋 登入資訊：');
    console.log(`   信箱: ${adminEmail}`);
    console.log(`   密碼: ${adminPassword}`);
    console.log(`   權限: 超級管理員`);
    console.log('');
    console.log('🌐 請訪問: http://localhost:3000/vp-admin');
    console.log('');

  } catch (error) {
    console.error('❌ 建立管理員帳號失敗:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('');
      console.log('ℹ️  管理員帳號已存在，請使用以下資訊登入：');
      console.log(`   信箱: admin@devape.me`);
      console.log(`   密碼: admin123456`);
      console.log('   網址: http://localhost:3000/vp-admin');
    }
  }

  process.exit(0);
}

createAdminAccount();