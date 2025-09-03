'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore'
import { customersService, CreateCustomerData } from '@/lib/firebase/customers'
import { adminService } from '@/lib/firebase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
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

interface NewCustomerForm {
  email: string
  contactPerson: string
  phoneNumber: string
  companyName: string
  taxId: string
  address: string
  source: string
  salespersonId: string
  notes: string
  creditLimit: number
  paymentTerms: string
}

export default function CustomersPage() {
  const [user, loading, error] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dataLoading, setDataLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    email: '',
    contactPerson: '',
    phoneNumber: '',
    companyName: '',
    taxId: '',
    address: '',
    source: '',
    salespersonId: '',
    notes: '',
    creditLimit: 0,
    paymentTerms: '月結30天'
  })
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

  const handleCreateCustomer = async () => {
    if (!newCustomer.email || !newCustomer.contactPerson || !newCustomer.phoneNumber) {
      toast.error('請填寫必填欄位')
      return
    }

    // 簡單的 email 驗證
    if (!newCustomer.email.includes('@')) {
      toast.error('請輸入有效的電子郵件')
      return
    }

    setCreating(true)
    try {
      const customerData: CreateCustomerData = {
        email: newCustomer.email,
        contactPerson: newCustomer.contactPerson,
        phoneNumber: newCustomer.phoneNumber,
        companyName: newCustomer.companyName || undefined,
        taxId: newCustomer.taxId || undefined,
        address: newCustomer.address,
        source: newCustomer.source || '管理員創建',
        salespersonId: newCustomer.salespersonId || undefined,
        notes: newCustomer.notes || undefined,
        creditLimit: newCustomer.creditLimit,
        paymentTerms: newCustomer.paymentTerms
      }

      await customersService.createCustomer(customerData)
      toast.success('客戶創建成功')
      setShowCreateDialog(false)
      setNewCustomer({
        email: '',
        contactPerson: '',
        phoneNumber: '',
        companyName: '',
        taxId: '',
        address: '',
        source: '',
        salespersonId: '',
        notes: '',
        creditLimit: 0,
        paymentTerms: '月結30天'
      })
      loadCustomers() // 重新載入列表
    } catch (error) {
      console.error('創建客戶失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '創建客戶失敗'
      toast.error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增客戶
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增客戶</DialogTitle>
              <DialogDescription>
                建立新的客戶資料，系統將自動設為啟用狀態
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-email">電子郵件 *</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="customer-contact">聯絡人姓名 *</Label>
                <Input
                  id="customer-contact"
                  value={newCustomer.contactPerson}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                  placeholder="張三"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone">電話號碼 *</Label>
                <Input
                  id="customer-phone"
                  value={newCustomer.phoneNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                  placeholder="0912-345-678"
                />
              </div>

              <div>
                <Label htmlFor="customer-company">公司名稱</Label>
                <Input
                  id="customer-company"
                  value={newCustomer.companyName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                  placeholder="ABC 公司"
                />
              </div>

              <div>
                <Label htmlFor="customer-tax">統一編號</Label>
                <Input
                  id="customer-tax"
                  value={newCustomer.taxId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                  placeholder="12345678"
                />
              </div>

              <div>
                <Label htmlFor="customer-source">客戶來源</Label>
                <Input
                  id="customer-source"
                  value={newCustomer.source}
                  onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
                  placeholder="網站、推薦、電話等"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="customer-address">地址</Label>
                <Input
                  id="customer-address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="台北市信義區..."
                />
              </div>

              <div>
                <Label htmlFor="customer-credit">信用額度 (NT$)</Label>
                <Input
                  id="customer-credit"
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: parseInt(e.target.value) || 0 })}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label htmlFor="customer-payment">付款條件</Label>
                <Select 
                  value={newCustomer.paymentTerms} 
                  onValueChange={(value) => setNewCustomer({ ...newCustomer, paymentTerms: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇付款條件" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="即期付款">即期付款</SelectItem>
                    <SelectItem value="月結30天">月結30天</SelectItem>
                    <SelectItem value="月結60天">月結60天</SelectItem>
                    <SelectItem value="季結90天">季結90天</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="customer-notes">管理備註</Label>
                <Textarea
                  id="customer-notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="內部備註..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateCustomer} disabled={creating}>
                {creating ? '創建中...' : '創建客戶'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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