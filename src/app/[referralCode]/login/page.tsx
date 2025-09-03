'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import LoginPage from '../../login/page';

export default function SubdomainLoginPage() {
  const params = useParams();
  const subdomain = params.referralCode as string;

  useEffect(() => {
    // 將子網域儲存到 localStorage
    if (subdomain) {
      localStorage.setItem('subdomain', subdomain.toLowerCase());
      localStorage.setItem('referralCode', subdomain.toUpperCase()); // 保持向後相容
    }
  }, [subdomain]);

  // 重用原本的登入頁面元件
  return <LoginPage />;
}