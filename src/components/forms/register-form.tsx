'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, FormField, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema, RegisterFormData } from '@/lib/utils/validation';
import { useRegister } from '@/lib/hooks/use-auth';
import { ROUTES } from '@/lib/utils/constants';

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 多步驟表單
  const { register: registerUser, isLoading, error, clearError } = useRegister();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      companyName: '',
      contactPerson: '',
      phoneNumber: '',
      taxId: '',
      address: '',
      source: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    
    const result = await registerUser(data);
    
    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        // 註冊成功，顯示等待審核訊息
        alert('註冊成功！您的帳號已提交審核，我們將盡快處理您的申請。');
        window.location.href = ROUTES.LOGIN;
      }
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const nextStep = async () => {
    // 驗證第一步的欄位
    const isValid = await form.trigger(['email', 'password', 'confirmPassword', 'displayName']);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">註冊新帳號</CardTitle>
        <CardDescription className="text-center">
          {step === 1 ? '請填寫您的基本資料' : '請填寫您的公司資料'}
        </CardDescription>
        
        {/* 步驟指示器 */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 全域錯誤訊息 */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* 第一步：基本資料 */}
          {step === 1 && (
            <div className="space-y-4">
              {/* 電子郵件 */}
              <FormField
                label="電子郵件"
                required
                error={form.formState.errors.email?.message}
              >
                <Input
                  type="email"
                  placeholder="請輸入您的電子郵件"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={form.formState.errors.email?.message}
                  {...form.register('email')}
                />
              </FormField>

              {/* 顯示名稱 */}
              <FormField
                label="顯示名稱"
                required
                error={form.formState.errors.displayName?.message}
              >
                <Input
                  type="text"
                  placeholder="請輸入您的顯示名稱"
                  leftIcon={<User className="h-4 w-4" />}
                  error={form.formState.errors.displayName?.message}
                  {...form.register('displayName')}
                />
              </FormField>

              {/* 密碼 */}
              <FormField
                label="密碼"
                required
                error={form.formState.errors.password?.message}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="請輸入密碼（至少6個字元）"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('password')}
                      className="hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  error={form.formState.errors.password?.message}
                  {...form.register('password')}
                />
              </FormField>

              {/* 確認密碼 */}
              <FormField
                label="確認密碼"
                required
                error={form.formState.errors.confirmPassword?.message}
              >
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="請再次輸入密碼"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      className="hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  error={form.formState.errors.confirmPassword?.message}
                  {...form.register('confirmPassword')}
                />
              </FormField>

              {/* 下一步按鈕 */}
              <Button
                type="button"
                onClick={nextStep}
                variant="gradient"
                size="lg"
                className="w-full"
              >
                下一步
              </Button>
            </div>
          )}

          {/* 第二步：公司資料 */}
          {step === 2 && (
            <div className="space-y-4">
              {/* 公司名稱 */}
              <FormField
                label="公司名稱"
                error={form.formState.errors.companyName?.message}
              >
                <Input
                  type="text"
                  placeholder="請輸入您的公司名稱"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  error={form.formState.errors.companyName?.message}
                  {...form.register('companyName')}
                />
              </FormField>

              {/* 聯絡人 */}
              <FormField
                label="聯絡人"
                required
                error={form.formState.errors.contactPerson?.message}
              >
                <Input
                  type="text"
                  placeholder="請輸入聯絡人姓名"
                  leftIcon={<User className="h-4 w-4" />}
                  error={form.formState.errors.contactPerson?.message}
                  {...form.register('contactPerson')}
                />
              </FormField>

              {/* 聯絡電話 */}
              <FormField
                label="聯絡電話"
                required
                error={form.formState.errors.phoneNumber?.message}
              >
                <Input
                  type="tel"
                  placeholder="09XXXXXXXX"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={form.formState.errors.phoneNumber?.message}
                  {...form.register('phoneNumber')}
                />
              </FormField>

              {/* 統一編號 */}
              <FormField
                label="統一編號"
                error={form.formState.errors.taxId?.message}
              >
                <Input
                  type="text"
                  placeholder="請輸入8位數統一編號"
                  error={form.formState.errors.taxId?.message}
                  {...form.register('taxId')}
                />
              </FormField>

              {/* 地址 */}
              <FormField
                label="公司地址"
                required
                error={form.formState.errors.address?.message}
              >
                <Input
                  type="text"
                  placeholder="請輸入完整地址"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  error={form.formState.errors.address?.message}
                  {...form.register('address')}
                />
              </FormField>

              {/* 客戶來源 */}
              <FormField
                label="從何處得知本平台"
                required
                error={form.formState.errors.source?.message}
              >
                <Textarea
                  placeholder="請說明您是從何處得知本平台（如：朋友推薦、網路搜尋、業務介紹等）"
                  error={form.formState.errors.source?.message}
                  {...form.register('source')}
                />
              </FormField>

              {/* 按鈕組 */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  上一步
                </Button>
                
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="flex-1"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? '註冊中...' : '完成註冊'}
                </Button>
              </div>
            </div>
          )}

          {/* 登入連結 */}
          <div className="text-center text-sm text-muted-foreground">
            已經有帳號了？{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-primary hover:underline font-medium"
            >
              立即登入
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}