// Firebase 認證相關函數
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  writeBatch,
  collection,
} from 'firebase/firestore';

import { auth, db } from './config';
import { User, CustomerProfile, RegisterData, LoginData } from '@/lib/types/auth';
import { USER_ROLES, USER_STATUS, COLLECTIONS } from '@/lib/utils/constants';

// 使用者註冊
export async function registerWithEmail(data: RegisterData): Promise<{
  user: FirebaseUser;
  profile: CustomerProfile;
}> {
  try {
    // 1. 建立 Firebase Auth 使用者
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    const firebaseUser = userCredential.user;

    // 2. 更新 Firebase Auth 使用者資料
    await updateProfile(firebaseUser, {
      displayName: data.displayName,
    });

    // 3. 發送驗證郵件
    await sendEmailVerification(firebaseUser);

    // 4. 建立使用者檔案文件
    const userProfile: CustomerProfile = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: data.email,
      displayName: data.displayName,
      role: USER_ROLES.CUSTOMER,
      status: USER_STATUS.PENDING, // 需要管理員審核
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phoneNumber: data.phoneNumber,
      taxId: data.taxId,
      addresses: data.address ? [{
        id: 'default',
        label: '公司地址',
        recipient: data.contactPerson,
        phone: data.phoneNumber,
        address: data.address,
        isDefault: true
      }] : [],
      source: data.source,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // 5. 批次寫入 Firestore
    const batch = writeBatch(db);
    
    // 寫入 users 集合
    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    batch.set(userRef, userProfile);
    
    // 寫入 customers 子集合（便於管理員查詢）
    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, firebaseUser.uid);
    batch.set(customerRef, userProfile);
    
    await batch.commit();

    console.log('✅ 使用者註冊成功:', firebaseUser.uid);
    return { user: firebaseUser, profile: userProfile };

  } catch (error: any) {
    console.error('❌ 使用者註冊失敗:', error);
    
    // 處理常見錯誤
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('此電子郵件已被註冊');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('密碼強度不足，請使用至少 6 個字元');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('電子郵件格式無效');
    }
    
    throw new Error('註冊失敗，請稍後再試');
  }
}

// 使用者登入
export async function signInWithEmail(data: LoginData): Promise<{
  user: FirebaseUser;
  profile: User;
}> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    const firebaseUser = userCredential.user;

    // 從 Firestore 取得使用者檔案
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('使用者檔案不存在');
    }

    const userProfile = userDoc.data() as User;

    // 檢查帳號狀態
    if (userProfile.status === USER_STATUS.SUSPENDED) {
      throw new Error('您的帳號已被停用，請聯繫管理員');
    }
    
    if (userProfile.status === USER_STATUS.PENDING) {
      throw new Error('您的帳號尚未通過審核，請等待管理員審核');
    }

    // 更新最後登入時間
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userProfile,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ 使用者登入成功:', firebaseUser.uid);
    return { user: firebaseUser, profile: userProfile };

  } catch (error: any) {
    console.error('❌ 使用者登入失敗:', error);
    
    // 處理常見錯誤
    if (error.code === 'auth/user-not-found') {
      throw new Error('找不到此電子郵件對應的帳號');
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error('密碼錯誤');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('電子郵件格式無效');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('登入嘗試次數過多，請稍後再試');
    }
    
    // 如果是自定義錯誤（如帳號狀態），直接拋出
    if (error.message.includes('帳號') || error.message.includes('審核')) {
      throw error;
    }
    
    throw new Error('登入失敗，請檢查您的帳號密碼');
  }
}

// 使用者登出
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('✅ 使用者登出成功');
  } catch (error) {
    console.error('❌ 使用者登出失敗:', error);
    throw new Error('登出失敗');
  }
}

// 重設密碼
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ 密碼重設郵件已發送');
  } catch (error: any) {
    console.error('❌ 發送密碼重設郵件失敗:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('找不到此電子郵件對應的帳號');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('電子郵件格式無效');
    }
    
    throw new Error('發送失敗，請稍後再試');
  }
}

// 監聽認證狀態變化
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// 取得目前使用者的檔案資料
export async function getCurrentUserProfile(): Promise<User | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
    
    if (!userDoc.exists()) {
      console.warn('使用者檔案不存在:', currentUser.uid);
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('❌ 取得使用者檔案失敗:', error);
    return null;
  }
}

// 檢查使用者是否有特定權限
export function hasPermission(user: User, permission: string): boolean {
  if (!user) return false;
  
  // 管理員有所有權限
  if (user.role === USER_ROLES.ADMIN) return true;
  
  // 基於角色的權限檢查
  switch (user.role) {
    case USER_ROLES.CUSTOMER:
      return ['profile.read', 'profile.write', 'orders.read'].includes(permission);
    case USER_ROLES.SALESPERSON:
      return ['customers.read', 'orders.read', 'products.read'].includes(permission);
    default:
      return false;
  }
}