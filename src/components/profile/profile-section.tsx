'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from './profile-form';
import { AddressManager } from './address-manager';
import { NotificationSettings } from './notification-settings';
import { OrderHistory } from './order-history';
import { 
  User, 
  MapPin, 
  Bell, 
  ShoppingBag, 
  Calendar,
  Mail,
  Phone,
  Building2,
  CreditCard
} from 'lucide-react';

export function ProfileSection() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">請先登入以查看個人資料</p>
            <Button>前往登入</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '已啟用';
      case 'pending': return '待審核';
      case 'suspended': return '已停用';
      default: return '未知狀態';
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本資訊卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {profile.displayName?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{profile.displayName || profile.email}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor(profile.status)}>
              {getStatusText(profile.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 聯絡人 */}
            {profile.contactPerson && (
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">聯絡人:</span>
                <span>{profile.contactPerson}</span>
              </div>
            )}

            {/* 電話 */}
            {profile.phoneNumber && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">電話:</span>
                <span>{profile.phoneNumber}</span>
              </div>
            )}

            {/* 公司名稱 */}
            {profile.companyName && (
              <div className="flex items-center space-x-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">公司:</span>
                <span>{profile.companyName}</span>
              </div>
            )}

            {/* 信用額度 */}
            {profile.creditLimit !== undefined && (
              <div className="flex items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">信用額度:</span>
                <span className="font-medium">NT$ {profile.creditLimit.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* 註冊時間 */}
          {profile.createdAt && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-4 pt-4 border-t">
              <Calendar className="w-4 h-4" />
              <span>註冊時間: {new Date(profile.createdAt).toLocaleDateString('zh-TW')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 管理選項 */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>基本資料</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>地址管理</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>通知設定</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4" />
            <span>訂單記錄</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <AddressManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}