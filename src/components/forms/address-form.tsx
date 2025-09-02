'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card } from '@/components/ui/card';
import { MapPin, Save, X, Plus } from 'lucide-react';
import { Address } from '@/lib/types/common';

interface AddressFormProps {
  addresses: Address[];
  onSave: (addresses: Address[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AddressForm({ 
  addresses, 
  onSave, 
  onCancel, 
  isLoading = false 
}: AddressFormProps) {
  const [editingAddresses, setEditingAddresses] = useState<Address[]>(addresses);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      recipient: '',
      phone: '',
      address: '',
      isDefault: false,
    }
  });

  const handleAddAddress = async (data: AddressFormData) => {
    const newAddress: Address = {
      id: Date.now().toString(),
      ...data
    };

    const updatedAddresses = [...editingAddresses, newAddress];
    
    // 如果設為預設地址，取消其他地址的預設狀態
    if (data.isDefault) {
      updatedAddresses.forEach((addr, index) => {
        if (addr.id !== newAddress.id) {
          updatedAddresses[index] = { ...addr, isDefault: false };
        }
      });
    }

    setEditingAddresses(updatedAddresses);
    setIsAddingNew(false);
    reset();
  };

  const handleRemoveAddress = (addressId: string) => {
    const updatedAddresses = editingAddresses.filter(addr => addr.id !== addressId);
    setEditingAddresses(updatedAddresses);
  };

  const handleSetDefault = (addressId: string) => {
    const updatedAddresses = editingAddresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setEditingAddresses(updatedAddresses);
  };

  const handleSave = async () => {
    await onSave(editingAddresses);
  };

  const handleCancel = () => {
    setEditingAddresses(addresses);
    setIsAddingNew(false);
    reset();
    onCancel?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="h-5 w-5" />
          <h3 className="text-lg font-semibold">送貨地址管理</h3>
        </div>
        <div className="flex items-center space-x-3">
          {!isAddingNew && (
            <Button
              variant="outline"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              新增地址
            </Button>
          )}
        </div>
      </div>

      {/* 現有地址列表 */}
      <div className="space-y-4">
        {editingAddresses.map((address) => (
          <Card key={address.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
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
              <div className="flex items-center space-x-2 ml-4">
                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id!)}
                  >
                    設為預設
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAddress(address.id!)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {editingAddresses.length === 0 && !isAddingNew && (
          <Card className="p-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">尚未設定送貨地址</h3>
            <p className="text-muted-foreground mb-4">
              新增第一個送貨地址以完成設定
            </p>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增地址
            </Button>
          </Card>
        )}
      </div>

      {/* 新增地址表單 */}
      {isAddingNew && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Plus className="h-5 w-5" />
            <h4 className="text-lg font-semibold">新增送貨地址</h4>
          </div>

          <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="地址標籤" error={errors.label?.message} required>
                <Input
                  {...register('label')}
                  placeholder="例如：公司地址、倉庫地址"
                />
              </FormField>

              <FormField label="收件人" error={errors.recipient?.message} required>
                <Input
                  {...register('recipient')}
                  placeholder="收件人姓名"
                />
              </FormField>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="聯絡電話" error={errors.phone?.message} required>
                <Input
                  {...register('phone')}
                  placeholder="09XXXXXXXX"
                />
              </FormField>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  {...register('isDefault')}
                  id="isDefault"
                  className="rounded border-input"
                />
                <label htmlFor="isDefault" className="text-sm">
                  設為預設地址
                </label>
              </div>
            </div>

            <FormField label="詳細地址" error={errors.address?.message} required>
              <Input
                {...register('address')}
                placeholder="完整的送貨地址"
              />
            </FormField>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  reset();
                }}
              >
                取消
              </Button>
              <Button type="submit">
                新增地址
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 操作按鈕 */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          儲存變更
        </Button>
      </div>
    </div>
  );
}