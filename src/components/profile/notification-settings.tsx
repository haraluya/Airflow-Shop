'use client';

import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  ShoppingBag, 
  CreditCard,
  Package,
  AlertTriangle,
  Save,
  AlertCircle
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { NotificationSettings as NotificationSettingsType } from '@/lib/types/notification';

export function NotificationSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadNotificationSettings();
  }, [profile]);

  const loadNotificationSettings = async () => {
    if (!profile?.id) return;

    try {
      const settingsRef = doc(db, COLLECTIONS.NOTIFICATION_SETTINGS, `${profile.id}_customer`);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as NotificationSettingsType);
      } else {
        // 建立預設設定
        const defaultSettings: NotificationSettingsType = {
          id: `${profile.id}_notification_settings`,
          userId: profile.id,
          userType: 'customer',
          emailEnabled: true,
          smsEnabled: false,
          lineEnabled: false,
          inAppEnabled: true,
          orderNotifications: true,
          paymentNotifications: true,
          stockNotifications: false,
          systemNotifications: true,
          marketingNotifications: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('載入通知設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettingsType, value: boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
      updatedAt: Timestamp.now(),
    });
  };

  const handleSaveSettings = async () => {
    if (!profile?.id || !settings) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const settingsRef = doc(db, COLLECTIONS.NOTIFICATION_SETTINGS, `${profile.id}_customer`);
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setMessage({ type: 'success', text: '通知設定已成功更新' });

      // 3秒後清除訊息
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('儲存通知設定失敗:', error);
      setMessage({ type: 'error', text: '儲存通知設定失敗' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">無法載入通知設定</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>通知設定</span>
        </CardTitle>
        <CardDescription>
          自訂您的通知偏好設定，選擇要接收的通知類型和頻道
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 狀態訊息 */}
        {message && (
          <div className={`p-3 text-sm rounded-md flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'text-green-800 bg-green-100 border border-green-200' 
              : 'text-red-800 bg-red-100 border border-red-200'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        )}

        {/* 通知頻道設定 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">通知頻道</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">電子郵件通知</Label>
                  <p className="text-sm text-muted-foreground">透過電子郵件接收重要通知</p>
                </div>
              </div>
              <Switch
                checked={settings?.emailEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">簡訊通知</Label>
                  <p className="text-sm text-muted-foreground">透過手機簡訊接收緊急通知</p>
                </div>
              </div>
              <Switch
                checked={settings?.smsEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('smsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">LINE 通知</Label>
                  <p className="text-sm text-muted-foreground">透過 LINE 接收即時通知</p>
                </div>
              </div>
              <Switch
                checked={settings?.lineEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('lineEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">應用內通知</Label>
                  <p className="text-sm text-muted-foreground">在網站上顯示通知訊息</p>
                </div>
              </div>
              <Switch
                checked={settings?.inAppEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('inAppEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* 通知類型設定 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">通知類型</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">訂單通知</Label>
                  <p className="text-sm text-muted-foreground">訂單建立、確認、出貨、送達等狀態更新</p>
                </div>
              </div>
              <Switch
                checked={settings?.orderNotifications || false}
                onCheckedChange={(checked) => handleSettingChange('orderNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">付款通知</Label>
                  <p className="text-sm text-muted-foreground">付款成功、失敗或逾期提醒</p>
                </div>
              </div>
              <Switch
                checked={settings?.paymentNotifications || false}
                onCheckedChange={(checked) => handleSettingChange('paymentNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">庫存通知</Label>
                  <p className="text-sm text-muted-foreground">商品補貨、限量商品等庫存相關通知</p>
                </div>
              </div>
              <Switch
                checked={settings?.stockNotifications || false}
                onCheckedChange={(checked) => handleSettingChange('stockNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">系統通知</Label>
                  <p className="text-sm text-muted-foreground">系統維護、政策更新等重要系統訊息</p>
                </div>
              </div>
              <Switch
                checked={settings?.systemNotifications || false}
                onCheckedChange={(checked) => handleSettingChange('systemNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">行銷通知</Label>
                  <p className="text-sm text-muted-foreground">優惠活動、新商品推薦等行銷訊息</p>
                </div>
              </div>
              <Switch
                checked={settings?.marketingNotifications || false}
                onCheckedChange={(checked) => handleSettingChange('marketingNotifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveSettings}
            variant="gradient"
            loading={isSaving}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                儲存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                儲存設定
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}