'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 登入 Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 檢查使用者是否為管理員
      const adminDocRef = doc(db, 'admins', user.uid)
      const adminDoc = await getDoc(adminDocRef)

      if (!adminDoc.exists()) {
        setError('您沒有管理員權限，無法存取後台系統')
        await auth.signOut()
        return
      }

      const adminData = adminDoc.data()
      if (!adminData?.isActive) {
        setError('您的管理員帳號已被停用，請聯絡系統管理員')
        await auth.signOut()
        return
      }

      // 登入成功，導向後台儀表板
      router.push('/vp-admin/dashboard')
    } catch (error: any) {
      console.error('管理員登入失敗:', error)
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('帳號或密碼錯誤')
          break
        case 'auth/too-many-requests':
          setError('登入嘗試次數過多，請稍後再試')
          break
        default:
          setError('登入失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Airflow 管理後台</CardTitle>
          <CardDescription>
            請使用管理員帳號登入後台系統
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">管理員信箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@airflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="請輸入管理員密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登入中...
                </>
              ) : (
                '登入管理後台'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>此為 Airflow 管理後台系統</p>
            <p>僅限授權管理員使用</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}