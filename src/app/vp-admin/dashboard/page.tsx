'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  UserPlus,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminData {
  id: string
  name: string
  email: string
  role: string
  lastLoginAt: Date
}

interface DashboardStats {
  totalCustomers: number
  pendingCustomers: number
  totalOrders: number
  totalProducts: number
  totalSalespersons: number
  monthlyRevenue: number
}

export default function AdminDashboardPage() {
  const [user, loading, error] = useAuthState(auth)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/vp-admin')
      return
    }

    if (user) {
      checkAdminAccess()
      loadDashboardStats()
    }
  }, [user, loading])

  const checkAdminAccess = async () => {
    if (!user) return

    try {
      const adminDocRef = doc(db, 'admins', user.uid)
      const adminDoc = await getDoc(adminDocRef)

      if (!adminDoc.exists() || !adminDoc.data()?.isActive) {
        await auth.signOut()
        router.push('/vp-admin')
        return
      }

      const data = adminDoc.data()
      setAdminData({
        id: adminDoc.id,
        name: data.name || '管理員',
        email: data.email || user.email || '',
        role: data.role || 'admin',
        lastLoginAt: data.lastLoginAt?.toDate() || new Date()
      })
    } catch (error) {
      console.error('檢查管理員權限失敗:', error)
      await auth.signOut()
      router.push('/vp-admin')
    }
  }

  const loadDashboardStats = async () => {
    try {
      // 並行載入統計資料
      const [
        customersSnapshot,
        pendingCustomersSnapshot,
        ordersSnapshot,
        productsSnapshot,
        salespersonsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'users'), where('status', '==', 'pending'))),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'salespersons'))
      ])

      // 計算月收入（簡化版本）
      let monthlyRevenue = 0
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data()
        const orderDate = order.createdAt?.toDate()
        if (orderDate && 
            orderDate.getMonth() === currentMonth && 
            orderDate.getFullYear() === currentYear &&
            order.status === 'completed') {
          monthlyRevenue += order.total || 0
        }
      })

      setStats({
        totalCustomers: customersSnapshot.size,
        pendingCustomers: pendingCustomersSnapshot.size,
        totalOrders: ordersSnapshot.size,
        totalProducts: productsSnapshot.size,
        totalSalespersons: salespersonsSnapshot.size,
        monthlyRevenue
      })
    } catch (error) {
      console.error('載入統計資料失敗:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/vp-admin')
  }

  if (loading || !user || !adminData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600">載入管理後台中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Airflow 管理後台</h1>
              <p className="text-sm text-gray-500">歡迎回來，{adminData.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {adminData.role === 'super_admin' ? '超級管理員' : 
                 adminData.role === 'admin' ? '管理員' : '業務員'}
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 客戶統計 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {statsLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <>待審核: {stats?.pendingCustomers || 0}</>
                )}
              </p>
            </CardContent>
          </Card>

          {/* 訂單統計 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                所有訂單總數
              </p>
            </CardContent>
          </Card>

          {/* 商品統計 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">商品總數</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                上架商品數量
              </p>
            </CardContent>
          </Card>

          {/* 業務員統計 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">業務員數</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalSalespersons || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                活躍業務員
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => router.push('/vp-admin/customers')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                客戶管理
              </CardTitle>
              <CardDescription>
                管理客戶資料、審核新客戶申請
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/vp-admin/subdomains')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                子網域管理
              </CardTitle>
              <CardDescription>
                管理業務員子網域與推薦系統
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/vp-admin/products')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                商品管理
              </CardTitle>
              <CardDescription>
                管理商品資訊、價格與庫存
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/vp-admin/orders')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                訂單管理
              </CardTitle>
              <CardDescription>
                處理訂單、追蹤出貨狀態
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/vp-admin/members')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                成員管理
              </CardTitle>
              <CardDescription>
                管理管理員與業務員帳號
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/vp-admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                系統設定
              </CardTitle>
              <CardDescription>
                系統參數與網站設定
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 待處理事項 */}
        {stats && stats.pendingCustomers > 0 && (
          <Card className="mt-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                待處理事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                有 {stats.pendingCustomers} 位新客戶等待審核，
                <Button variant="link" className="p-0 h-auto text-orange-600 underline ml-1"
                        onClick={() => router.push('/vp-admin/customers?status=pending')}>
                  立即處理
                </Button>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}