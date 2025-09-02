'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search, Plus, X } from 'lucide-react';
import { PricingGroup } from '@/lib/types/product';
import { CustomerProfile } from '@/lib/types/auth';
import { customersService } from '@/lib/firebase/customers';
import { pricingGroupsService } from '@/lib/firebase/pricing';

interface CustomerAssignmentDialogProps {
  group: PricingGroup;
  onUpdate: () => Promise<void>;
  children?: React.ReactNode;
}

interface CustomerAssignmentState {
  allCustomers: CustomerProfile[];
  assignedCustomers: CustomerProfile[];
  unassignedCustomers: CustomerProfile[];
  searchTerm: string;
  isLoading: boolean;
  selectedCustomerIds: string[];
}

export function CustomerAssignmentDialog({
  group,
  onUpdate,
  children
}: CustomerAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<CustomerAssignmentState>({
    allCustomers: [],
    assignedCustomers: [],
    unassignedCustomers: [],
    searchTerm: '',
    isLoading: true,
    selectedCustomerIds: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, group.customerIds]);

  const loadCustomers = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await customersService.getCustomers({ 
        filters: { status: 'ACTIVE' },
        limit: 100 
      });
      
      const allCustomers = result.customers || [];
      const assignedCustomers = allCustomers.filter(customer => 
        group.customerIds.includes(customer.id)
      );
      const unassignedCustomers = allCustomers.filter(customer => 
        !group.customerIds.includes(customer.id)
      );

      setState(prev => ({
        ...prev,
        allCustomers,
        assignedCustomers,
        unassignedCustomers,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入客戶資料失敗:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAddCustomers = async () => {
    if (state.selectedCustomerIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // 逐一添加客戶到群組
      for (const customerId of state.selectedCustomerIds) {
        await pricingGroupsService.addCustomerToGroup(group.id, customerId);
      }
      
      await onUpdate();
      await loadCustomers();
      setState(prev => ({ ...prev, selectedCustomerIds: [] }));
    } catch (error) {
      console.error('添加客戶到群組失敗:', error);
      alert('添加客戶失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCustomer = async (customerId: string) => {
    if (!confirm('確定要將此客戶從群組中移除嗎？')) return;

    try {
      await pricingGroupsService.removeCustomerFromGroup(group.id, customerId);
      await onUpdate();
      await loadCustomers();
    } catch (error) {
      console.error('從群組移除客戶失敗:', error);
      alert('移除客戶失敗，請稍後再試');
    }
  };

  const handleCustomerSelection = (customerId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedCustomerIds: checked
        ? [...prev.selectedCustomerIds, customerId]
        : prev.selectedCustomerIds.filter(id => id !== customerId)
    }));
  };

  const filteredUnassignedCustomers = state.unassignedCustomers.filter(customer =>
    customer.displayName?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    customer.companyName?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const filteredAssignedCustomers = state.assignedCustomers.filter(customer =>
    customer.displayName?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    customer.companyName?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            管理客戶
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            管理群組客戶 - {group.name}
          </DialogTitle>
        </DialogHeader>

        {state.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* 搜尋框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋客戶..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              {/* 未分配的客戶 */}
              <div className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">可分配客戶</h4>
                  <Badge variant="secondary">
                    {filteredUnassignedCustomers.length}
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                  {filteredUnassignedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center space-x-2 p-2 border border-border rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={state.selectedCustomerIds.includes(customer.id)}
                        onCheckedChange={(checked) => 
                          handleCustomerSelection(customer.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.displayName || customer.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUnassignedCustomers.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      沒有可分配的客戶
                    </div>
                  )}
                </div>

                {state.selectedCustomerIds.length > 0 && (
                  <Button
                    onClick={handleAddCustomers}
                    disabled={isSubmitting}
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加 {state.selectedCustomerIds.length} 個客戶
                  </Button>
                )}
              </div>

              {/* 已分配的客戶 */}
              <div className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">群組客戶</h4>
                  <Badge variant="default">
                    {filteredAssignedCustomers.length}
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                  {filteredAssignedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-2 border border-border rounded bg-primary/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.displayName || customer.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomer(customer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {filteredAssignedCustomers.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      此群組尚未分配客戶
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                關閉
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}