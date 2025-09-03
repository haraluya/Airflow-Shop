'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/providers/auth-provider';
import { customersService } from '@/lib/firebase/customers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Building2, Phone, Mail, FileText, Save, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(1, '顯示名稱不能為空').max(50, '顯示名稱不能超過50個字符'),
  contactPerson: z.string().min(1, '聯絡人不能為空').max(50, '聯絡人不能超過50個字符'),
  phoneNumber: z.string()
    .min(1, '電話號碼不能為空')
    .regex(/^[\d\-\+\s\(\)]+$/, '請輸入有效的電話號碼'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      contactPerson: profile?.contactPerson || '',
      phoneNumber: profile?.phoneNumber || '',
      companyName: profile?.companyName || '',
      taxId: profile?.taxId || '',
      notes: profile?.notes || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile?.id) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await customersService.updateCustomer(profile.id, {
        ...data,
      });

      // 刷新個人資料
      await refreshProfile();

      setMessage({ type: 'success', text: '個人資料已成功更新' });

      // 3秒後清除訊息
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('更新個人資料失敗:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '更新個人資料失敗'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">無法載入個人資料</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>編輯基本資料</span>
        </CardTitle>
        <CardDescription>
          更新您的個人資料和聯絡資訊
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 顯示名稱 */}
            <FormField
              label="顯示名稱"
              required
              error={form.formState.errors.displayName?.message}
            >
              <Input
                placeholder="請輸入顯示名稱"
                leftIcon={<User className="h-4 w-4" />}
                error={form.formState.errors.displayName?.message}
                {...form.register('displayName')}
              />
            </FormField>

            {/* 聯絡人 */}
            <FormField
              label="聯絡人"
              required
              error={form.formState.errors.contactPerson?.message}
            >
              <Input
                placeholder="請輸入聯絡人姓名"
                leftIcon={<User className="h-4 w-4" />}
                error={form.formState.errors.contactPerson?.message}
                {...form.register('contactPerson')}
              />
            </FormField>

            {/* 電話號碼 */}
            <FormField
              label="電話號碼"
              required
              error={form.formState.errors.phoneNumber?.message}
            >
              <Input
                placeholder="請輸入電話號碼"
                leftIcon={<Phone className="h-4 w-4" />}
                error={form.formState.errors.phoneNumber?.message}
                {...form.register('phoneNumber')}
              />
            </FormField>

            {/* 電子郵件 (唯讀) */}
            <FormField label="電子郵件" description="電子郵件無法變更">
              <Input
                value={profile.email}
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
                className="bg-muted"
              />
            </FormField>

            {/* 公司名稱 */}
            <FormField
              label="公司名稱"
              error={form.formState.errors.companyName?.message}
            >
              <Input
                placeholder="請輸入公司名稱 (選填)"
                leftIcon={<Building2 className="h-4 w-4" />}
                error={form.formState.errors.companyName?.message}
                {...form.register('companyName')}
              />
            </FormField>

            {/* 統一編號 */}
            <FormField
              label="統一編號"
              error={form.formState.errors.taxId?.message}
            >
              <Input
                placeholder="請輸入統一編號 (選填)"
                leftIcon={<FileText className="h-4 w-4" />}
                error={form.formState.errors.taxId?.message}
                {...form.register('taxId')}
              />
            </FormField>
          </div>

          {/* 備註 */}
          <FormField
            label="備註"
            description="其他補充說明或特殊需求"
            error={form.formState.errors.notes?.message}
          >
            <Textarea
              placeholder="請輸入備註 (選填)"
              error={form.formState.errors.notes?.message}
              {...form.register('notes')}
            />
          </FormField>

          {/* 提交按鈕 */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="gradient"
              loading={isLoading}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  更新中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  儲存變更
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}