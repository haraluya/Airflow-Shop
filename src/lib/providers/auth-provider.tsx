'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase/config';
import { User, CustomerProfile, SalespersonProfile, AdminProfile, LoginData, RegisterData } from '@/lib/types/auth';
import { registerWithEmail, signInWithEmail, signOutUser } from '@/lib/firebase/auth';
import { COLLECTIONS } from '@/lib/utils/constants';

// 認證上下文類型
interface AuthContextType {
  // 狀態
  user: FirebaseUser | null;
  profile: User | CustomerProfile | SalespersonProfile | AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 方法
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// 建立 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider 元件
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | CustomerProfile | SalespersonProfile | AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 計算認證狀態
  const isAuthenticated = !!user && !!profile;

  // 從 Firestore 載入使用者檔案
  const loadUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return userData;
      } else {
        console.warn('使用者檔案不存在:', firebaseUser.uid);
        return null;
      }
    } catch (error) {
      console.error('載入使用者檔案失敗:', error);
      return null;
    }
  };

  // 重新整理使用者檔案
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userProfile = await loadUserProfile(user);
      setProfile(userProfile);
    } catch (error) {
      console.error('重新整理檔案失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 註冊
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await registerWithEmail(data);
      setUser(result.user);
      setProfile(result.profile);
    } catch (error) {
      console.error('註冊失敗:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登入
  const login = async (data: LoginData): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signInWithEmail(data);
      setUser(result.user);
      setProfile(result.profile);
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        // 使用者已登入，載入檔案
        const userProfile = await loadUserProfile(firebaseUser);
        setUser(firebaseUser);
        setProfile(userProfile);
      } else {
        // 使用者未登入
        setUser(null);
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Context 值
  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth Hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  
  return context;
}

// 權限檢查 Hook
export function usePermission() {
  const { profile } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!profile) return false;
    
    if (Array.isArray(role)) {
      return role.includes(profile.role);
    }
    
    return profile.role === role;
  };
  
  const hasPermission = (permission: string) => {
    if (!profile) return false;
    
    // 管理員有所有權限
    if (profile.role === 'admin') return true;
    
    // 基於角色的權限檢查
    switch (profile.role) {
      case 'customer':
        return ['profile.read', 'profile.write', 'orders.read', 'cart.write'].includes(permission);
      case 'salesperson':
        return ['customers.read', 'orders.read', 'products.read', 'reports.read'].includes(permission);
      default:
        return false;
    }
  };
  
  const isAdmin = () => hasRole('admin');
  const isCustomer = () => hasRole('customer');
  const isSalesperson = () => hasRole('salesperson');
  const isApproved = () => profile?.status === 'active';
  const isPending = () => profile?.status === 'pending';
  const isSuspended = () => profile?.status === 'suspended';
  
  return {
    hasRole,
    hasPermission,
    isAdmin,
    isCustomer,
    isSalesperson,
    isApproved,
    isPending,
    isSuspended,
  };
}