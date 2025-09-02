'use client';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/providers/auth-provider';
import { USER_ROLES } from '@/lib/utils/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Settings, 
  BarChart3, 
  UserCheck,
  Home,
  Bell,
  FileText,
  Image,
  DollarSign
} from 'lucide-react';

const navigationItems = [
  {
    title: '總覽',
    href: '/admin/dashboard',
    icon: Home,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SALESPERSON]
  },
  {
    title: '客戶審核',
    href: '/admin/dashboard/customers/pending',
    icon: UserCheck,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '客戶管理',
    href: '/admin/dashboard/customers',
    icon: Users,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SALESPERSON]
  },
  {
    title: '商品管理',
    href: '/admin/dashboard/products',
    icon: Package,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '媒體管理',
    href: '/admin/dashboard/media',
    icon: Image,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '價格管理',
    href: '/admin/dashboard/pricing',
    icon: DollarSign,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '訂單管理',
    href: '/admin/dashboard/orders',
    icon: ShoppingCart,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SALESPERSON]
  },
  {
    title: '營運分析',
    href: '/admin/dashboard/analytics',
    icon: BarChart3,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '系統通知',
    href: '/admin/dashboard/notifications',
    icon: Bell,
    roles: [USER_ROLES.ADMIN]
  },
  {
    title: '報告中心',
    href: '/admin/dashboard/reports',
    icon: FileText,
    roles: [USER_ROLES.ADMIN, USER_ROLES.SALESPERSON]
  },
  {
    title: '系統設定',
    href: '/admin/dashboard/settings',
    icon: Settings,
    roles: [USER_ROLES.ADMIN]
  }
];

export function Sidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();

  const allowedItems = navigationItems.filter(item => 
    profile && item.roles.includes(profile.role as any)
  );

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
          <h2 className="text-lg font-semibold">Airflow 管理後台</h2>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            {profile?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.displayName || '使用者'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.role === USER_ROLES.ADMIN ? '管理員' : '業務員'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}