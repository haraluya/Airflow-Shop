'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import RegisterPage from '../../register/page';

export default function SubdomainRegisterPage() {
  const params = useParams();
  const subdomain = params.referralCode as string;

  useEffect(() => {
    // 將子網域儲存到 localStorage
    if (subdomain) {
      localStorage.setItem('subdomain', subdomain.toLowerCase());
      localStorage.setItem('referralCode', subdomain.toUpperCase()); // 保持向後相容
    }
  }, [subdomain]);

  // 重用原本的註冊頁面元件
  return <RegisterPage />;
}