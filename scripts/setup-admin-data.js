// 為現有管理員帳號建立 Firestore 資料
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCOFeD1GRbNBGWJApoesWIDgi5rSFOvvSM',
  authDomain: 'airflow-ddb4f.firebaseapp.com',
  projectId: 'airflow-ddb4f',
  storageBucket: 'airflow-ddb4f.firebasestorage.app',
  messagingSenderId: '1024248082490',
  appId: '1:1024248082490:web:eff1170d891b3642a80503'
};

async function setupAdminData() {
  try {
    console.log('初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 管理員帳號資訊
    const adminEmail = 'admin@devape.me';
    const adminPassword = 'admin123456';

    console.log('登入管理員帳號...');
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    console.log(`✅ 登入成功: ${user.uid}`);

    // 檢查是否已有管理員資料
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists()) {
      console.log('✅ 管理員資料已存在');
      console.log('📋 現有資料:', adminDoc.data());
    } else {
      console.log('建立管理員資料...');
      
      // 建立管理員文件
      const adminData = {
        name: '系統管理員',
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

      await setDoc(adminDocRef, adminData);
      console.log('✅ 管理員資料已建立');
    }

    console.log('');
    console.log('🎉 管理員系統設定完成！');
    console.log('');
    console.log('📋 登入資訊：');
    console.log(`   信箱: ${adminEmail}`);
    console.log(`   密碼: ${adminPassword}`);
    console.log(`   權限: 超級管理員`);
    console.log('');
    console.log('🌐 請訪問: http://localhost:3000/vp-admin');
    console.log('');

  } catch (error) {
    console.error('❌ 設定管理員資料失敗:', error);
  }

  process.exit(0);
}

setupAdminData();