'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema, LoginFormData } from '@/lib/utils/validation';
import { useLogin } from '@/lib/hooks/use-auth';
import { ROUTES } from '@/lib/utils/constants';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export function LoginForm({ onSuccess, redirectTo, className }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    
    const result = await login(data);
    
    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.href = ROUTES.ADMIN_DASHBOARD;
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">登入帳號</CardTitle>
        <CardDescription className="text-center">
          請輸入您的電子郵件和密碼以登入系統
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 全域錯誤訊息 */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* 電子郵件欄位 */}
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

          {/* 密碼欄位 */}
          <FormField
            label="密碼"
            required
            error={form.formState.errors.password?.message}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="請輸入您的密碼"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
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

          {/* 忘記密碼連結 */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              忘記密碼？
            </Link>
          </div>

          {/* 提交按鈕 */}
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>

          {/* 註冊連結 */}
          <div className="text-center text-sm text-muted-foreground">
            還沒有帳號？{' '}
            <Link
              href={ROUTES.REGISTER}
              className="text-primary hover:underline font-medium"
            >
              立即註冊
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}