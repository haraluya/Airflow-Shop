'use client';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/providers/auth-provider';
import { USER_ROLES } from '@/lib/utils/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Home,
  FileText,
  DollarSign,
  Target,
  TrendingUp
} from 'lucide-react';

const salespersonNavigationItems = [
  {
    title: '績效總覽',
    href: '/salesperson/dashboard',
    icon: Home,
    description: '檢視我的業績統計'
  },
  {
    title: '客戶管理',
    href: '/salesperson/customers',
    icon: Users,
    description: '管理我的客戶'
  },
  {
    title: '訂單查詢',
    href: '/salesperson/orders',
    icon: ShoppingCart,
    description: '查看客戶訂單'
  },
  {
    title: '業績分析',
    href: '/salesperson/performance',
    icon: BarChart3,
    description: '詳細業績分析'
  },
  {
    title: '佣金報告',
    href: '/salesperson/commission',
    icon: DollarSign,
    description: '查看佣金記錄'
  },
  {
    title: '推薦碼管理',
    href: '/salesperson/referrals',
    icon: Target,
    description: '管理推薦碼與成效追蹤'
  },
  {
    title: '銷售報表',
    href: '/salesperson/reports',
    icon: FileText,
    description: '生成銷售報表'
  }
];

export function SalespersonSidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">業務員專區</h2>
            <p className="text-xs text-muted-foreground">Airflow B2B</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {salespersonNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/salesperson/dashboard' && pathname.startsWith(item.href));

          return (
            <div key={item.href} className="group">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div>{item.title}</div>
                </div>
              </Link>
              {/* 顯示描述在 hover 時 */}
              <div className="hidden group-hover:block px-6 py-1">
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </nav>

      {/* 業務員資訊卡片 */}
      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.displayName || '業務員'}
              </p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>業務專員</span>
                {(profile as any)?.employeeId && (
                  <span>• ID: {(profile as any).employeeId}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* 快速統計 */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-background rounded border">
              <div className="font-medium text-blue-600">0</div>
              <div className="text-muted-foreground">本月訂單</div>
            </div>
            <div className="text-center p-2 bg-background rounded border">
              <div className="font-medium text-green-600">$0</div>
              <div className="text-muted-foreground">本月業績</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}