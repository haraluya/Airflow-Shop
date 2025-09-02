'use client';

import { useAuth } from '@/lib/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Search, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { profile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋客戶、訂單、商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
          <span className="sr-only">通知</span>
        </Button>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium">
              {profile?.displayName || '使用者'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.role === 'admin' ? '管理員' : '業務員'}
            </p>
          </div>
          
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">登出</span>
          </Button>
        </div>
      </div>
    </header>
  );
}