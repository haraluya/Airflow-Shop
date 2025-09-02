// Firebase 配置範例 - 基於 deer-lab 專案的最佳實踐
import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getFunctions, Functions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// 延遲初始化變數
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;
let storageInstance: any = null;
let isInitialized = false;

// 獲取 Firebase 配置
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // 驗證配置完整性
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    console.error('Firebase 配置缺失:', missingFields);
  }

  return config;
}

// 初始化 Firebase
function initializeFirebase() {
  if (isInitialized) {
    return { app, auth: authInstance, db: dbInstance, functions: functionsInstance, storage: storageInstance };
  }

  try {
    const firebaseConfig = getFirebaseConfig();

    // 檢查必要的環境變數
    if (!firebaseConfig.apiKey) {
      throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY environment variable');
    }

    if (!firebaseConfig.authDomain) {
      throw new Error('Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN environment variable');
    }

    if (!firebaseConfig.projectId) {
      throw new Error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
    }

    // 初始化 Firebase 服務
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    functionsInstance = getFunctions(app);
    storageInstance = getStorage(app);

    isInitialized = true;
    console.log('✅ Firebase 初始化成功');
    
    return { app, auth: authInstance, db: dbInstance, functions: functionsInstance, storage: storageInstance };
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
    return { app: null, auth: null, db: null, functions: null, storage: null };
  }
}

// 獲取 Firebase 實例的函數
function getFirebaseInstances() {
  if (!isInitialized) {
    return initializeFirebase();
  }
  return { app, auth: authInstance, db: dbInstance, functions: functionsInstance, storage: storageInstance };
}

// 導出函數
export function getAuthInstance(): Auth | null {
  return getFirebaseInstances().auth;
}

export function getFirestoreInstance(): Firestore | null {
  return getFirebaseInstances().db;
}

export function getFunctionsInstance(): Functions | null {
  return getFirebaseInstances().functions;
}

export function getStorageInstance(): any {
  return getFirebaseInstances().storage;
}

// 為了向後兼容，導出函數調用的結果
export const auth = getAuthInstance();
export const db = getFirestoreInstance();
export const functions = getFunctionsInstance();
export const storage = getStorageInstance();

export default app;