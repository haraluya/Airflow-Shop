// 認證相關 Hooks
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { LoginData, RegisterData } from '@/lib/types/auth';
import { getErrorMessage } from '@/lib/utils/validation';

// 登入 Hook
export function useLogin() {
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authLogin(data);
      return { success: true };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authLogin]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}

// 註冊 Hook
export function useRegister() {
  const { register: authRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authRegister(data);
      return { success: true };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authRegister]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    register,
    isLoading,
    error,
    clearError,
  };
}

// 登出 Hook
export function useLogout() {
  const { logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await authLogout();
      return { success: true };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      console.error('登出失敗:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [authLogout]);

  return {
    logout,
    isLoading,
  };
}

// 使用者狀態 Hook
export function useUserStatus() {
  const { profile, isLoading, isAuthenticated } = useAuth();

  return {
    profile,
    isLoading,
    isAuthenticated,
    isAdmin: profile?.role === 'admin',
    isCustomer: profile?.role === 'customer',
    isSalesperson: profile?.role === 'salesperson',
    isApproved: profile?.status === 'active',
    isPending: profile?.status === 'pending',
    isSuspended: profile?.status === 'suspended',
    needsApproval: profile?.status === 'pending',
  };
}