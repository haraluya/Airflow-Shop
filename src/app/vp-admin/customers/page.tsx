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
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  companyName?: string
  status: 'active' | 'pending' | 'suspended'
  registrationDate: Date
  lastOrderDate?: Date
  totalOrders: number
  totalSpent: number
  salespersonId?: string
  tags?: string[]
}

export default function CustomersPage() {
  const [user, loading, error] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
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
        await loadCustomers()
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

  const loadCustomers = async () => {
    try {
      const customersQuery = query(
        collection(db, 'customers'),
        orderBy('registrationDate', 'desc'),
        limit(100)
      )
      
      const snapshot = await getDocs(customersQuery)
      const customerData: Customer[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        customerData.push({
          id: doc.id,
          name: data.name || '未設定',
          email: data.email || '',
          phone: data.phone,
          companyName: data.companyName,
          status: data.status || 'pending',
          registrationDate: data.registrationDate?.toDate() || new Date(),
          lastOrderDate: data.lastOrderDate?.toDate(),
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          salespersonId: data.salespersonId,
          tags: data.tags || []
        })
      })
      
      setCustomers(customerData)
      setFilteredCustomers(customerData)
    } catch (error) {
      console.error('載入客戶資料失敗:', error)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    let filtered = customers

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">啟用中</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">待審核</Badge>
      case 'suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">已停用</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">客戶管理</h1>
          <p className="text-muted-foreground">管理所有客戶資料與狀態</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增客戶
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">啟用客戶</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待審核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已停用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋與篩選 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋客戶姓名、信箱或公司名稱..."
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
            <option value="active">啟用中</option>
            <option value="pending">待審核</option>
            <option value="suspended">已停用</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            進階篩選
          </Button>
        </div>
      </div>

      {/* 客戶列表 */}
      <Card>
        <CardHeader>
          <CardTitle>客戶清單</CardTitle>
          <CardDescription>
            顯示 {filteredCustomers.length} 位客戶
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? '沒有找到符合條件的客戶'
                : '尚無客戶資料'
              }
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{customer.name}</h3>
                        {getStatusBadge(customer.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{customer.email}</span>
                        {customer.companyName && (
                          <span>• {customer.companyName}</span>
                        )}
                        <span>• 註冊日期: {customer.registrationDate.toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>總訂單: {customer.totalOrders}</span>
                        <span>總消費: NT${customer.totalSpent.toLocaleString()}</span>
                        {customer.lastOrderDate && (
                          <span>最後訂單: {customer.lastOrderDate.toLocaleDateString('zh-TW')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        檢視詳情
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        編輯資料
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        刪除客戶
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}