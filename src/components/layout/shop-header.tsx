'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';
import { useCart } from '@/lib/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  Package,
  Settings,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

export function ShopHeader() {
  const { profile, logout } = useAuth();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 導航到搜尋結果頁面
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* 左側：Logo 和導航 */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-bold text-xl bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent"
          >
            <Package className="h-8 w-8 text-primary" />
            Airflow
          </Link>

          {/* 桌面導航 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/products" 
              className="text-foreground hover:text-primary transition-colors"
            >
              商品目錄
            </Link>
            <Link 
              href="/categories" 
              className="text-foreground hover:text-primary transition-colors"
            >
              分類瀏覽
            </Link>
            <Link 
              href="/brands" 
              className="text-foreground hover:text-primary transition-colors"
            >
              品牌專區
            </Link>
            <Link 
              href="/about" 
              className="text-foreground hover:text-primary transition-colors"
            >
              關於我們
            </Link>
          </nav>
        </div>

        {/* 中間：搜尋框 */}
        <form 
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm mx-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜尋商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* 右側：用戶功能 */}
        <div className="flex items-center space-x-2">
          {/* 手機版搜尋按鈕 */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* 購物車 */}
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* 收藏 */}
          {profile && (
            <Link href="/wishlist">
              <Button variant="ghost" size="sm">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* 用戶選單 */}
          {profile ? (
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block text-sm">
                {profile.displayName || profile.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  登入
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  註冊
                </Link>
              </Button>
            </div>
          )}

          {/* 手機版選單 */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}