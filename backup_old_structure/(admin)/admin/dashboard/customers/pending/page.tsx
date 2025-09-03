'use client';

import { useEffect, useState } from 'react';
import { customersService } from '@/lib/firebase/customers';
import { CustomerProfile } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Phone, 
  Building, 
  Mail,
  MapPin,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface PendingCustomersPageState {
  customers: CustomerProfile[];
  isLoading: boolean;
  searchQuery: string;
  processingIds: Set<string>;
  error: string | null;
}

export default function PendingCustomersPage() {
  const [state, setState] = useState<PendingCustomersPageState>({
    customers: [],
    isLoading: true,
    searchQuery: '',
    processingIds: new Set(),
    error: null
  });

  const loadPendingCustomers = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await customersService.getPendingCustomers({ limit: 50 });
      
      setState(prev => ({
        ...prev,
        customers: result.customers,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入待審核客戶失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入待審核客戶失敗'
      }));
    }
  };

  useEffect(() => {
    loadPendingCustomers();
  }, []);

  const handleApprove = async (customer: CustomerProfile, notes?: string) => {
    if (state.processingIds.has(customer.id!)) return;

    try {
      setState(prev => ({
        ...prev,
        processingIds: new Set(prev.processingIds).add(customer.id!)
      }));

      await customersService.approveCustomer(customer.id!, notes);
      
      // 從列表中移除已批准的客戶
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== customer.id),
        processingIds: new Set(Array.from(prev.processingIds).filter(id => id !== customer.id))
      }));

    } catch (error) {
      console.error('批准客戶失敗:', error);
      setState(prev => ({
        ...prev,
        processingIds: new Set(Array.from(prev.processingIds).filter(id => id !== customer.id))
      }));
    }
  };

  const handleReject = async (customer: CustomerProfile, reason: string) => {
    if (state.processingIds.has(customer.id!)) return;

    try {
      setState(prev => ({
        ...prev,
        processingIds: new Set(prev.processingIds).add(customer.id!)
      }));

      await customersService.rejectCustomer(customer.id!, reason);
      
      // 從列表中移除已拒絕的客戶
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== customer.id),
        processingIds: new Set(Array.from(prev.processingIds).filter(id => id !== customer.id))
      }));

    } catch (error) {
      console.error('拒絕客戶失敗:', error);
      setState(prev => ({
        ...prev,
        processingIds: new Set(Array.from(prev.processingIds).filter(id => id !== customer.id))
      }));
    }
  };

  const filteredCustomers = state.customers.filter(customer =>
    !state.searchQuery ||
    customer.displayName?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    customer.companyName?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (state.isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">客戶審核</h1>
          <p className="text-muted-foreground">
            審核新申請的客戶帳號
          </p>
        </div>
        <Button onClick={loadPendingCustomers} variant="outline">
          重新整理
        </Button>
      </div>

      {/* 搜尋列 */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋公司名稱、聯絡人或信箱..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">沒有待審核的客戶</h3>
          <p className="text-muted-foreground">
            所有客戶申請都已處理完畢
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredCustomers.map((customer) => (
            <CustomerApprovalCard
              key={customer.id}
              customer={customer}
              isProcessing={state.processingIds.has(customer.id!)}
              onApprove={(notes) => handleApprove(customer, notes)}
              onReject={(reason) => handleReject(customer, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CustomerApprovalCardProps {
  customer: CustomerProfile;
  isProcessing: boolean;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
}

function CustomerApprovalCard({
  customer,
  isProcessing,
  onApprove,
  onReject
}: CustomerApprovalCardProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {customer.companyName?.charAt(0) || customer.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {customer.companyName || customer.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">
              申請時間：{customer.createdAt ? format(customer.createdAt instanceof Timestamp ? customer.createdAt.toDate() : customer.createdAt, 'yyyy/MM/dd HH:mm', { locale: zhTW }) : '未知'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            待審核
          </span>
        </div>
      </div>

      {/* 客戶資訊 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{customer.email}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{customer.phoneNumber}</span>
          </div>
          {customer.taxId && (
            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">統編：{customer.taxId}</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm">{customer.addresses?.[0]?.address || '未提供地址'}</span>
          </div>
          {customer.source && (
            <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">來源：{customer.source}</span>
            </div>
          )}
        </div>
      </div>

      {/* 審核備註 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">審核備註（選填）</label>
        <Input
          placeholder="輸入審核備註..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      {/* 拒絕原因輸入 */}
      {showRejectForm && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <label className="block text-sm font-medium mb-2 text-red-800">
            拒絕原因 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="請說明拒絕原因..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex items-center justify-end space-x-3">
        {showRejectForm ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectionReason.trim()) {
                  onReject(rejectionReason);
                  setShowRejectForm(false);
                  setRejectionReason('');
                }
              }}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              確認拒絕
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(true)}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" />
              拒絕
            </Button>
            <Button
              onClick={() => onApprove(notes)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              批准
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}