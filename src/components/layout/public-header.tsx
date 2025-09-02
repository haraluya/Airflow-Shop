'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  User, 
  ShoppingBag, 
  Phone, 
  Info
} from 'lucide-react';

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-primary"></div>
              <span className="text-xl font-bold gradient-text">Airflow</span>
            </Link>
          </div>

          {/* 桌面版導航 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              首頁
            </Link>
            <Link 
              href="/products" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              商品展示
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              關於我們
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              聯絡我們
            </Link>
          </nav>

          {/* 右側按鈕 */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  會員登入
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  立即註冊
                </Button>
              </Link>
            </div>

            {/* 手機版選單按鈕 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* 手機版導航選單 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                首頁
              </Link>
              <Link 
                href="/products" 
                className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                商品展示
              </Link>
              <Link 
                href="/about" 
                className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info className="mr-2 h-4 w-4" />
                關於我們
              </Link>
              <Link 
                href="/contact" 
                className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Phone className="mr-2 h-4 w-4" />
                聯絡我們
              </Link>
              
              <div className="pt-3 border-t space-y-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    會員登入
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    立即註冊
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}