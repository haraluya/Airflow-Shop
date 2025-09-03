'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 如果已經是管理員，直接跳轉到儀表板
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
      router.replace(redirectTo);
    }
  }, [user, profile, router, searchParams]);

  // 如果已登入但不是管理員，顯示權限錯誤
  if (user && profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">存取被拒</CardTitle>
            <CardDescription>
              您沒有管理員權限存取後台系統
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                目前登入身份：{profile.role === 'customer' ? '客戶' : '業務員'}
              </p>
              <p className="text-sm text-muted-foreground">
                如需管理員權限，請聯絡系統管理員
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                返回首頁
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  auth.signOut();
                  router.refresh();
                }}
                className="w-full"
              >
                登出並重新登入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // 等待權限檢查完成後會由上面的 useEffect 處理跳轉
    } catch (error: any) {
      console.error('管理員登入失敗:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('無效的電子郵件格式');
          break;
        case 'auth/user-not-found':
          setError('找不到此管理員帳號');
          break;
        case 'auth/wrong-password':
          setError('密碼錯誤');
          break;
        case 'auth/invalid-credential':
          setError('無效的登入憑證');
          break;
        case 'auth/too-many-requests':
          setError('嘗試次數過多，請稍後再試');
          break;
        default:
          setError('登入失敗，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除錯誤訊息
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">管理員登入</CardTitle>
          <CardDescription>
            登入 Airflow 後台管理系統
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">管理員電子郵件</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="輸入管理員密碼"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.email || !formData.password}
            >
              {isLoading ? '登入中...' : '登入管理後台'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                不是管理員？
              </p>
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant="link"
                  onClick={() => router.push('/login')}
                  className="p-0 h-auto text-sm"
                >
                  會員登入
                </Button>
                <Button
                  variant="link"
                  onClick={() => router.push('/')}
                  className="p-0 h-auto text-sm"
                >
                  返回首頁
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 測試帳號提示 */}
      <div className="absolute bottom-4 left-4 p-3 bg-muted/50 backdrop-blur-sm rounded-lg text-xs text-muted-foreground max-w-xs">
        <div className="font-medium mb-1">測試帳號</div>
        <div>管理員: admin@airflow-shop.com</div>
        <div>密碼: admin123</div>
      </div>
    </div>
  );
}