'use client';

import { useEffect, useState } from 'react';
import { customersService, CustomerFilters } from '@/lib/firebase/customers';
import { CustomerProfile } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  Plus,
  Phone, 
  Building, 
  Mail,
  MapPin,
  Calendar,
  Settings,
  Eye,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { USER_STATUS } from '@/lib/utils/constants';

interface CustomersPageState {
  customers: CustomerProfile[];
  isLoading: boolean;
  searchQuery: string;
  filters: CustomerFilters;
  stats: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
  } | null;
  error: string | null;
}

const statusConfig = {
  [USER_STATUS.ACTIVE]: {
    label: '已啟用',
    icon: UserCheck,
    className: 'bg-green-100 text-green-800'
  },
  [USER_STATUS.PENDING]: {
    label: '待審核',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800'
  },
  [USER_STATUS.SUSPENDED]: {
    label: '已停用',
    icon: UserX,
    className: 'bg-red-100 text-red-800'
  }
};

export default function CustomersPage() {
  const [state, setState] = useState<CustomersPageState>({
    customers: [],
    isLoading: true,
    searchQuery: '',
    filters: {},
    stats: null,
    error: null
  });

  const loadCustomers = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [customersResult, stats] = await Promise.all([
        customersService.getCustomers({ 
          limit: 50,
          filters: {
            ...state.filters,
            search: state.searchQuery || undefined
          }
        }),
        customersService.getCustomerStats()
      ]);
      
      setState(prev => ({
        ...prev,
        customers: customersResult.customers,
        stats,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入客戶失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入客戶失敗'
      }));
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [state.filters]);

  const handleSearch = () => {
    loadCustomers();
  };

  const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {},
      searchQuery: ''
    }));
  };

  if (state.isLoading && !state.customers.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">客戶管理</h1>
          <p className="text-muted-foreground">
            管理和查看所有客戶資料
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/customers/pending">
              <UserCheck className="mr-2 h-4 w-4" />
              待審核客戶
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              新增客戶
            </Link>
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      {state.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">總客戶數</p>
                <p className="text-xl font-bold">{state.stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">已啟用</p>
                <p className="text-xl font-bold">{state.stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">待審核</p>
                <p className="text-xl font-bold">{state.stats.pending}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">已停用</p>
                <p className="text-xl font-bold">{state.stats.suspended}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋公司名稱、聯絡人或信箱..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <select
            className="px-3 py-2 border border-input rounded-md text-sm"
            value={state.filters.status || ''}
            onChange={(e) => handleFilterChange({ status: e.target.value as keyof typeof USER_STATUS || undefined })}
          >
            <option value="">所有狀態</option>
            <option value={USER_STATUS.ACTIVE}>已啟用</option>
            <option value={USER_STATUS.PENDING}>待審核</option>
            <option value={USER_STATUS.SUSPENDED}>已停用</option>
          </select>

          <Button onClick={handleSearch} disabled={state.isLoading}>
            搜尋
          </Button>
          
          {(state.searchQuery || Object.keys(state.filters).length > 0) && (
            <Button variant="outline" onClick={clearFilters}>
              清除篩選
            </Button>
          )}
        </div>
      </Card>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      {/* 客戶列表 */}
      {state.customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">沒有找到客戶</h3>
          <p className="text-muted-foreground mb-4">
            {state.searchQuery || Object.keys(state.filters).length > 0 
              ? '請嘗試調整搜尋條件' 
              : '目前還沒有註冊的客戶'
            }
          </p>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              新增第一個客戶
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}

      {state.isLoading && state.customers.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

interface CustomerCardProps {
  customer: CustomerProfile;
}

function CustomerCard({ customer }: CustomerCardProps) {
  const statusInfo = statusConfig[customer.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {customer.companyName?.charAt(0) || customer.displayName?.charAt(0) || 'U'}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">
                {customer.companyName || customer.displayName}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3" />
                <span>{customer.phoneNumber}</span>
              </div>
              {customer.taxId && (
                <div className="flex items-center space-x-2">
                  <Building className="h-3 w-3" />
                  <span>統編：{customer.taxId}</span>
                </div>
              )}
              {customer.addresses?.[0]?.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-md">{customer.addresses[0].address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {customer.createdAt && (
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>加入</span>
              </div>
              <span>{format(customer.createdAt instanceof Timestamp ? customer.createdAt.toDate() : customer.createdAt, 'yyyy/MM/dd', { locale: zhTW })}</span>
            </div>
          )}
          
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/customers/${customer.id}`}>
              <Eye className="mr-1 h-3 w-3" />
              查看
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Settings className="mr-1 h-3 w-3" />
              編輯
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}