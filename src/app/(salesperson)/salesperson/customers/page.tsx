'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingCart,
  DollarSign,
  Clock,
  Filter,
  MoreHorizontal,
  Eye,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customersService } from '@/lib/firebase/customers';
import { CustomerProfile } from '@/lib/types/auth';

export default function SalespersonCustomers() {
  const { profile, user } = useAuth();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 統計數據
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    thisMonth: 0,
    totalOrders: 0,
    totalSales: 0
  });

  useEffect(() => {
    loadMyCustomers();
  }, [user?.uid]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter]);

  const loadMyCustomers = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      
      // 載入綁定到此業務員的客戶
      const { customers: customerList } = await customersService.getCustomers({
        filters: {
          salespersonId: user.uid
        },
        limit: 100
      });

      setCustomers(customerList);

      // 計算統計數據
      const activeCustomers = customerList.filter(c => c.status === 'active');
      const thisMonthCustomers = customerList.filter(c => {
        const createdDate = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt.toDate());
        const thisMonth = new Date();
        return createdDate.getMonth() === thisMonth.getMonth() && 
               createdDate.getFullYear() === thisMonth.getFullYear();
      });

      setStats({
        total: customerList.length,
        active: activeCustomers.length,
        thisMonth: thisMonthCustomers.length,
        totalOrders: 0, // 需要與訂單服務整合
        totalSales: 0    // 需要與訂單服務整合
      });

    } catch (error) {
      console.error('載入客戶資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // 依搜尋詞篩選
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
    }

    // 依狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活躍';
      case 'pending':
        return '待審核';
      case 'suspended':
        return '暫停';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的客戶</h1>
          <p className="text-muted-foreground">
            管理您負責的客戶列表
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          推薦新客戶
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活躍客戶</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月新增</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總訂單</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總業績</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${stats.totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋和篩選 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>客戶列表</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋客戶..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    狀態篩選
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    全部狀態
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    活躍客戶
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    待審核
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
                    已暫停
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">沒有找到客戶</h3>
              <p className="text-muted-foreground">
                {searchTerm ? '請嘗試其他搜尋條件' : '您目前還沒有綁定的客戶'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {customer.displayName?.charAt(0) || customer.companyName?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {customer.displayName || customer.contactPerson}
                          </h3>
                          {customer.companyName && (
                            <p className="text-sm text-muted-foreground">
                              {customer.companyName}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phoneNumber && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {customer.phoneNumber}
                              </div>
                            )}
                            {customer.addresses?.length > 0 && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {customer.addresses[0].address}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(customer.status)}>
                          {getStatusText(customer.status)}
                        </Badge>
                        
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            註冊於 {customer.createdAt instanceof Date ? customer.createdAt.toLocaleDateString('zh-TW') : new Date(customer.createdAt.toDate()).toLocaleDateString('zh-TW')}
                          </p>
                          {customer.creditLimit && (
                            <p className="text-muted-foreground">
                              信用額度: ${customer.creditLimit.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              查看詳情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              查看訂單
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              聯絡客戶
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}