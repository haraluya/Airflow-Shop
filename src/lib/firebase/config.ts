// Firebase 配置 - 基於範例程式碼優化
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase 配置介面
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 延遲初始化變數
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;
let storageInstance: FirebaseStorage | null = null;

// 獲取 Firebase 配置
function getFirebaseConfig(): FirebaseConfig {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  // 驗證配置完整性
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey', 
    'authDomain', 
    'projectId', 
    'storageBucket', 
    'messagingSenderId', 
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    const errorMsg = `Firebase 配置缺失以下環境變數: ${missingFields.map(f => `NEXT_PUBLIC_FIREBASE_${f.toUpperCase()}`).join(', ')}`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  return config;
}

// 初始化 Firebase
function initializeFirebase() {
  // 如果已經初始化，直接返回現有實例
  const existingApp = getApps().find(app => app.name === '[DEFAULT]');
  if (existingApp) {
    app = existingApp;
  } else {
    try {
      const firebaseConfig = getFirebaseConfig();
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase App 初始化成功');
    } catch (error) {
      console.error('❌ Firebase App 初始化失敗:', error);
      throw error;
    }
  }

  // 初始化各項服務
  try {
    // Auth
    if (!authInstance) {
      authInstance = getAuth(app);
    }

    // Firestore
    if (!dbInstance) {
      dbInstance = getFirestore(app);
      
      // 開發環境連接 Emulator
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
        try {
          connectFirestoreEmulator(dbInstance, 'localhost', 8080);
          console.log('🔧 Connected to Firestore Emulator');
        } catch (error) {
          // Emulator 可能已經連接，忽略錯誤
        }
      }
    }

    // Functions
    if (!functionsInstance) {
      functionsInstance = getFunctions(app);
      
      // 開發環境連接 Functions Emulator
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
        try {
          connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
          console.log('🔧 Connected to Functions Emulator');
        } catch (error) {
          // Emulator 可能已經連接，忽略錯誤
        }
      }
    }

    // Storage
    if (!storageInstance) {
      storageInstance = getStorage(app);
    }

    return {
      app,
      auth: authInstance,
      db: dbInstance,
      functions: functionsInstance,
      storage: storageInstance
    };

  } catch (error) {
    console.error('❌ Firebase 服務初始化失敗:', error);
    throw error;
  }
}

// 獲取 Firebase 服務實例
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    initializeFirebase();
  }
  return app!;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    initializeFirebase();
  }
  return authInstance!;
}

export function getFirebaseFirestore(): Firestore {
  if (!dbInstance) {
    initializeFirebase();
  }
  return dbInstance!;
}

export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    initializeFirebase();
  }
  return functionsInstance!;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    initializeFirebase();
  }
  return storageInstance!;
}

// 檢查 Firebase 是否已正確初始化
export function isFirebaseInitialized(): boolean {
  return !!(app && authInstance && dbInstance);
}

// 為了向後兼容和便利性，直接導出實例
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const functions = getFirebaseFunctions();
export const storage = getFirebaseStorage();
export const firebaseApp = getFirebaseApp();

// 預設導出
export default firebaseApp;