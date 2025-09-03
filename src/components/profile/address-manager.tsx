'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { customersService } from '@/lib/firebase/customers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddressForm } from '@/components/forms/address-form';
import { Address } from '@/lib/types/common';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';

export function AddressManager() {
  const { profile, refreshProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile && 'addresses' in profile && profile.addresses) {
      setAddresses(profile.addresses);
    }
  }, [profile]);

  const handleAddAddress = async (addressData: Omit<Address, 'id'>) => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const newAddress: Address = {
        ...addressData,
        id: Math.random().toString(36).substr(2, 9),
        isDefault: addresses.length === 0, // 如果是第一個地址，設為預設
      };

      const updatedAddresses = [...addresses, newAddress];
      
      await customersService.updateCustomer(profile.id, {
        addresses: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await refreshProfile();
      setShowAddDialog(false);
      setMessage({ type: 'success', text: '地址已成功新增' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('新增地址失敗:', error);
      setMessage({ type: 'error', text: '新增地址失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = async (addressData: Omit<Address, 'id'>) => {
    if (!profile?.id || !editingAddress) return;

    setIsLoading(true);
    try {
      const updatedAddresses = addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addressData, id: editingAddress.id }
          : addr
      );

      await customersService.updateCustomer(profile.id, {
        addresses: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await refreshProfile();
      setShowEditDialog(false);
      setEditingAddress(null);
      setMessage({ type: 'success', text: '地址已成功更新' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('更新地址失敗:', error);
      setMessage({ type: 'error', text: '更新地址失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!profile?.id) return;

    if (!confirm('確定要刪除此地址嗎？')) return;

    setIsLoading(true);
    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // 如果刪除的是預設地址，設定第一個地址為預設
      if (updatedAddresses.length > 0) {
        const deletedAddress = addresses.find(addr => addr.id === addressId);
        if (deletedAddress?.isDefault) {
          updatedAddresses[0].isDefault = true;
        }
      }

      await customersService.updateCustomer(profile.id, {
        addresses: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await refreshProfile();
      setMessage({ type: 'success', text: '地址已成功刪除' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('刪除地址失敗:', error);
      setMessage({ type: 'error', text: '刪除地址失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));

      await customersService.updateCustomer(profile.id, {
        addresses: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await refreshProfile();
      setMessage({ type: 'success', text: '預設地址已成功更新' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('設定預設地址失敗:', error);
      setMessage({ type: 'error', text: '設定預設地址失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAllAddresses = async (newAddresses: Address[]) => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      await customersService.updateCustomer(profile.id, {
        addresses: newAddresses,
      });

      setAddresses(newAddresses);
      await refreshProfile();
      setMessage({ type: 'success', text: '地址已成功更新' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('更新地址失敗:', error);
      setMessage({ type: 'error', text: '更新地址失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">無法載入地址資料</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>送貨地址管理</span>
            </CardTitle>
            <CardDescription>
              管理您的送貨地址，方便快速結帳
            </CardDescription>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新增地址
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增送貨地址</DialogTitle>
              </DialogHeader>
              <AddressForm
                addresses={addresses}
                onSave={async (newAddresses) => {
                  await handleSaveAllAddresses(newAddresses);
                  setShowAddDialog(false);
                }}
                onCancel={() => setShowAddDialog(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {/* 狀態訊息 */}
          {message && (
            <div className={`p-3 text-sm rounded-md flex items-center space-x-2 mb-6 ${
              message.type === 'success' 
                ? 'text-green-800 bg-green-100 border border-green-200' 
                : 'text-red-800 bg-red-100 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span>{message.text}</span>
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">您還沒有新增任何送貨地址</p>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新增第一個地址
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增送貨地址</DialogTitle>
                  </DialogHeader>
                  <AddressForm
                    addresses={addresses}
                    onSave={async (newAddresses) => {
                      await handleSaveAllAddresses(newAddresses);
                      setShowEditDialog(false);
                    }}
                    onCancel={() => setShowEditDialog(false)}
                    isLoading={isLoading}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <Card key={address.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{address.label}</h3>
                        {address.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            預設
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAddress(address);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{address.recipient}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{address.phone}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="flex-1">{address.address}</span>
                      </div>
                    </div>

                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleSetDefaultAddress(address.id)}
                        disabled={isLoading}
                      >
                        設為預設地址
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編輯地址對話框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>編輯送貨地址</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <AddressForm
              addresses={addresses}
              onSave={async (newAddresses) => {
                await handleSaveAllAddresses(newAddresses);
                setShowEditDialog(false);
                setEditingAddress(null);
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingAddress(null);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}