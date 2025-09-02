'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';

export function ReferralRedirect() {
  const router = useRouter();
  const { user, profile } = useAuth();

  useEffect(() => {
    // 檢查用戶是否有綁定推薦碼
    if (user && profile) {
      // 如果用戶有綁定的推薦碼，自動轉跳到推薦碼首頁
      const savedReferralCode = localStorage.getItem('userReferralCode') || profile.referralCode;
      
      if (savedReferralCode) {
        router.replace(`/${savedReferralCode}`);
        return;
      }
    }

    // 檢查 localStorage 中是否有暫存的推薦碼
    const referralCode = localStorage.getItem('referralCode');
    if (referralCode) {
      router.replace(`/${referralCode}`);
      return;
    }

    // 檢查 URL 參數中是否有推薦碼
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
      // 儲存推薦碼並轉跳
      localStorage.setItem('referralCode', refParam);
      router.replace(`/${refParam}`);
      return;
    }
  }, [user, profile, router]);

  return null; // 這個元件不渲染任何內容
}