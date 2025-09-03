'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { customersService } from '@/lib/firebase/customers';
import { CustomerProfile } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Phone, 
  Building, 
  Mail,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  User,
  Settings,
  Save,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { USER_STATUS } from '@/lib/utils/constants';
import { UserStatus } from '@/lib/types/auth';

interface CustomerDetailPageState {
  customer: CustomerProfile | null;
  isLoading: boolean;
  isEditing: boolean;
  editData: Partial<CustomerProfile>;
  isSaving: boolean;
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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [state, setState] = useState<CustomerDetailPageState>({
    customer: null,
    isLoading: true,
    isEditing: false,
    editData: {},
    isSaving: false,
    error: null
  });

  const loadCustomer = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const customer = await customersService.getCustomerById(customerId);
      
      if (!customer) {
        router.push('/dashboard/customers');
        return;
      }
      
      setState(prev => ({
        ...prev,
        customer,
        editData: customer,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入客戶詳情失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入客戶詳情失敗'
      }));
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const handleEdit = () => {
    setState(prev => ({
      ...prev,
      isEditing: true,
      editData: { ...prev.customer }
    }));
  };

  const handleCancelEdit = () => {
    setState(prev => ({
      ...prev,
      isEditing: false,
      editData: { ...prev.customer }
    }));
  };

  const handleSave = async () => {
    if (!state.customer) return;

    try {
      setState(prev => ({ ...prev, isSaving: true }));

      const updateData = {
        notes: state.editData.notes,
        creditLimit: state.editData.creditLimit,
        paymentTerms: state.editData.paymentTerms,
        status: state.editData.status as keyof typeof USER_STATUS
      };

      await customersService.updateCustomer(customerId, updateData);
      
      await loadCustomer(); // 重新載入最新資料
      
      setState(prev => ({
        ...prev,
        isEditing: false,
        isSaving: false
      }));

    } catch (error) {
      console.error('更新客戶資料失敗:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: '更新客戶資料失敗'
      }));
    }
  };

  const handleInputChange = (field: keyof CustomerProfile, value: any) => {
    setState(prev => ({
      ...prev,
      editData: {
        ...prev.editData,
        [field]: value
      }
    }));
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">找不到客戶</h2>
        <Button asChild>
          <Link href="/dashboard/customers">返回客戶列表</Link>
        </Button>
      </div>
    );
  }

  const { customer } = state;
  const statusInfo = statusConfig[customer.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {customer.companyName || customer.displayName}
            </h1>
            <p className="text-muted-foreground">
              客戶詳細資料與設定
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {state.isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={state.isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={state.isSaving}
              >
                {state.isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                儲存
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              編輯
            </Button>
          )}
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左欄：基本資料 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資訊 */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-semibold">基本資訊</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">電子郵件</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">聯絡電話</p>
                    <p className="font-medium">{customer.phoneNumber}</p>
                  </div>
                </div>
                
                {customer.taxId && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">統一編號</p>
                      <p className="font-medium">{customer.taxId}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">帳號狀態</p>
                    {state.isEditing ? (
                      <select
                        className="px-2 py-1 border border-input rounded text-sm"
                        value={state.editData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as UserStatus)}
                      >
                        <option value={USER_STATUS.ACTIVE}>已啟用</option>
                        <option value={USER_STATUS.PENDING}>待審核</option>
                        <option value={USER_STATUS.SUSPENDED}>已停用</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                
                {customer.createdAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">註冊時間</p>
                      <p className="font-medium">
                        {customer.createdAt ? format(customer.createdAt instanceof Timestamp ? customer.createdAt.toDate() : customer.createdAt, 'yyyy/MM/dd HH:mm', { locale: zhTW }) : '未知'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 送貨地址 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">送貨地址</h3>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新增地址
              </Button>
            </div>
            
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map((address, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{address.label}</h4>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                              預設
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          收件人：{address.recipient}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          電話：{address.phone}
                        </p>
                        <p className="text-sm">{address.address}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                尚未設定送貨地址
              </p>
            )}
          </Card>
        </div>

        {/* 右欄：設定與備註 */}
        <div className="space-y-6">
          {/* 商務設定 */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">商務設定</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">信用額度</label>
                {state.isEditing ? (
                  <Input
                    type="number"
                    value={state.editData.creditLimit || 0}
                    onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                    placeholder="輸入信用額度"
                  />
                ) : (
                  <p className="text-sm py-2">
                    {customer.creditLimit ? `NT$ ${customer.creditLimit.toLocaleString()}` : '未設定'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">付款條件</label>
                {state.isEditing ? (
                  <Input
                    value={state.editData.paymentTerms || ''}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    placeholder="例如：月結30天"
                  />
                ) : (
                  <p className="text-sm py-2">
                    {customer.paymentTerms || '未設定'}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 備註 */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-semibold">管理員備註</h3>
            </div>
            
            {state.isEditing ? (
              <textarea
                className="w-full p-3 border border-input rounded-md resize-none"
                rows={6}
                value={state.editData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="輸入客戶相關備註..."
              />
            ) : (
              <div className="min-h-[120px]">
                {customer.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">尚無備註</p>
                )}
              </div>
            )}
          </Card>

          {/* 其他資訊 */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">其他資訊</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              {customer.source && (
                <div>
                  <span className="text-muted-foreground">客戶來源：</span>
                  <span className="font-medium">{customer.source}</span>
                </div>
              )}
              
              {customer.salespersonId && (
                <div>
                  <span className="text-muted-foreground">負責業務：</span>
                  <span className="font-medium">{customer.salespersonId}</span>
                </div>
              )}
              
              {customer.pricingGroupId && (
                <div>
                  <span className="text-muted-foreground">價格群組：</span>
                  <span className="font-medium">{customer.pricingGroupId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}