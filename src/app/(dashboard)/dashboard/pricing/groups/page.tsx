'use client';

import { useState, useEffect } from 'react';
import { pricingGroupsService } from '@/lib/firebase/pricing';
import { PricingGroup } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Settings,
  DollarSign,
  Percent,
  BarChart3
} from 'lucide-react';

interface PricingGroupsState {
  groups: PricingGroup[];
  isLoading: boolean;
  searchTerm: string;
  isModalOpen: boolean;
  editingGroup: PricingGroup | null;
  error: string | null;
}

export default function PricingGroupsPage() {
  const [state, setState] = useState<PricingGroupsState>({
    groups: [],
    isLoading: true,
    searchTerm: '',
    isModalOpen: false,
    editingGroup: null,
    error: null
  });

  useEffect(() => {
    loadPricingGroups();
  }, []);

  const loadPricingGroups = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const groups = await pricingGroupsService.getPricingGroups();
      setState(prev => ({
        ...prev,
        groups,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入價格群組失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入價格群組失敗'
      }));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('確定要刪除這個價格群組嗎？此操作不可復原。')) {
      return;
    }

    try {
      await pricingGroupsService.deletePricingGroup(groupId);
      await loadPricingGroups();
    } catch (error) {
      console.error('刪除價格群組失敗:', error);
      alert('刪除價格群組失敗');
    }
  };

  const filteredGroups = state.groups.filter(group =>
    group.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return '百分比折扣';
      case 'fixed':
        return '固定金額折扣';
      case 'tiered':
        return '階層式折扣';
      default:
        return type;
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      case 'tiered':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">價格群組管理</h1>
          <p className="text-muted-foreground">
            管理客戶價格群組與折扣設定
          </p>
        </div>
        
        <Button onClick={() => setState(prev => ({ ...prev, isModalOpen: true, editingGroup: null }))}>
          <Plus className="mr-2 h-4 w-4" />
          新增價格群組
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-bold">{state.groups.length}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            總價格群組數
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {state.groups.filter(g => g.isActive).length}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            啟用群組數
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {state.groups.filter(g => g.discountType === 'fixed').length}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            固定折扣群組
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {state.groups.filter(g => g.discountType === 'percentage').length}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            百分比折扣群組
          </p>
        </Card>
      </div>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      {/* 搜尋列 */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋價格群組..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>

      {/* 價格群組列表 */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">沒有找到價格群組</h3>
          <p className="text-muted-foreground mb-4">
            {state.searchTerm ? '請嘗試其他搜尋條件' : '還沒有建立任何價格群組'}
          </p>
          {!state.searchTerm && (
            <Button onClick={() => setState(prev => ({ ...prev, isModalOpen: true, editingGroup: null }))}>
              <Plus className="mr-2 h-4 w-4" />
              新增第一個價格群組
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getDiscountIcon(group.discountType)}
                  <h3 className="font-semibold">{group.name}</h3>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      isModalOpen: true, 
                      editingGroup: group 
                    }))}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">折扣類型</span>
                  <span className="font-medium">
                    {getDiscountTypeLabel(group.discountType)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">折扣值</span>
                  <span className="font-medium">
                    {group.discountType === 'percentage' 
                      ? `${group.discountValue}%` 
                      : `$${group.discountValue}`}
                  </span>
                </div>

                {group.minOrderAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">最低訂單金額</span>
                    <span className="font-medium">${group.minOrderAmount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">客戶數量</span>
                  <span className="font-medium">{group.customerIds.length} 位</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">狀態</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.isActive ? '啟用' : '停用'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/編輯價格群組模態框 - 後續實作 */}
      {state.isModalOpen && (
        <PricingGroupModal
          group={state.editingGroup}
          isOpen={state.isModalOpen}
          onClose={() => setState(prev => ({ 
            ...prev, 
            isModalOpen: false, 
            editingGroup: null 
          }))}
          onSave={() => {
            setState(prev => ({ 
              ...prev, 
              isModalOpen: false, 
              editingGroup: null 
            }));
            loadPricingGroups();
          }}
        />
      )}
    </div>
  );
}

// 暫時的模態框元件佔位符
function PricingGroupModal({
  group,
  isOpen,
  onClose,
  onSave
}: {
  group: PricingGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {group ? '編輯價格群組' : '新增價格群組'}
        </h2>
        <p className="text-muted-foreground mb-4">
          價格群組編輯功能即將完成...
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onSave}>
            儲存
          </Button>
        </div>
      </div>
    </div>
  );
}