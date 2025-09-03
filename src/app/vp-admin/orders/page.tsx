'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, MoreVertical, Eye, Edit, Download, Package, Truck, CheckCircle } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerId: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod: 'bank_transfer' | 'cash_on_delivery'
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  total: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    postalCode: string
  }
}

export default function OrdersPage() {
  const [user, loading, error] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        
        if (!adminDoc.exists()) {
          router.push('/vp-admin')
          return
        }
        
        setIsAdmin(true)
        await loadOrders()
      } catch (error) {
        console.error('檢查管理員狀態失敗:', error)
        router.push('/vp-admin')
      }
    }

    if (!loading && user) {
      checkAdminStatus()
    } else if (!loading && !user) {
      router.push('/vp-admin')
    }
  }, [user, loading, router])

  const loadOrders = async () => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      
      const snapshot = await getDocs(ordersQuery)
      const orderData: Order[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        orderData.push({
          id: doc.id,
          orderNumber: data.orderNumber || `ORD-${doc.id.slice(-6).toUpperCase()}`,
          customerName: data.customerName || '未知客戶',
          customerEmail: data.customerEmail || '',
          customerId: data.customerId || '',
          status: data.status || 'pending',
          paymentStatus: data.paymentStatus || 'pending',
          paymentMethod: data.paymentMethod || 'bank_transfer',
          items: data.items || [],
          subtotal: data.subtotal || 0,
          shippingFee: data.shippingFee || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          shippingAddress: data.shippingAddress || {
            name: '',
            phone: '',
            address: '',
            city: '',
            postalCode: ''
          }
        })
      })
      
      setOrders(orderData)
      setFilteredOrders(orderData)
    } catch (error) {
      console.error('載入訂單資料失敗:', error)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, paymentFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">待確認</Badge>
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">已確認</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">處理中</Badge>
      case 'shipped':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">已出貨</Badge>
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已送達</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">已取消</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'pending':
        return <Badge variant="outline">待付款</Badge>
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已付款</Badge>
      case 'overdue':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">逾期</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">已取消</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂單管理</h1>
          <p className="text-muted-foreground">管理所有訂單與配送狀態</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            匯出訂單
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待處理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">處理中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已出貨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'shipped').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本月營收</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NT${orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋與篩選 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋訂單編號、客戶姓名或信箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">所有狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="processing">處理中</option>
            <option value="shipped">已出貨</option>
            <option value="delivered">已送達</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">所有付款狀態</option>
            <option value="pending">待付款</option>
            <option value="paid">已付款</option>
            <option value="overdue">逾期</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            進階篩選
          </Button>
        </div>
      </div>

      {/* 訂單列表 */}
      <Card>
        <CardHeader>
          <CardTitle>訂單清單</CardTitle>
          <CardDescription>
            顯示 {filteredOrders.length} 筆訂單
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? '沒有找到符合條件的訂單'
                : '尚無訂單資料'
              }
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      {/* 訂單基本資訊 */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <h3 className="font-medium">{order.orderNumber}</h3>
                        </div>
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.paymentStatus)}
                      </div>

                      {/* 客戶與金額資訊 */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{order.customerName}</span>
                        <span>{order.customerEmail}</span>
                        <span>• 總金額: <span className="font-medium text-foreground">NT${order.total.toLocaleString()}</span></span>
                        <span>• 訂購時間: {order.createdAt.toLocaleString('zh-TW')}</span>
                      </div>

                      {/* 商品摘要 */}
                      <div className="text-sm text-muted-foreground">
                        <span>共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品：</span>
                        <span className="ml-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <span key={index}>
                              {item.name} x{item.quantity}
                              {index < Math.min(order.items.length - 1, 1) && ', '}
                            </span>
                          ))}
                          {order.items.length > 2 && ` 等${order.items.length}項商品`}
                        </span>
                      </div>

                      {/* 配送地址（簡化顯示） */}
                      {order.shippingAddress.address && (
                        <div className="text-xs text-muted-foreground">
                          配送至：{order.shippingAddress.city} {order.shippingAddress.address}
                        </div>
                      )}
                    </div>

                    {/* 操作按鈕 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          查看詳情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          編輯訂單
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" />
                          更新狀態
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          列印訂單
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}