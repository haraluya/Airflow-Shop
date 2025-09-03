'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { adminService } from '@/lib/firebase/admin'
import { Subdomain, RESERVED_SUBDOMAINS } from '@/lib/types/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

interface NewSubdomainForm {
  subdomain: string
  salespersonName: string
  salespersonEmail: string
  welcomeMessage: string
  phone: string
  lineId: string
  region: string
}

export default function SubdomainsManagePage() {
  const [user, loading] = useAuthState(auth)
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [subdomainsLoading, setSubdomainsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSubdomain, setNewSubdomain] = useState<NewSubdomainForm>({
    subdomain: '',
    salespersonName: '',
    salespersonEmail: '',
    welcomeMessage: '',
    phone: '',
    lineId: '',
    region: ''
  })
  const [creating, setCreating] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/vp-admin')
      return
    }

    if (user) {
      checkAdminAccess()
      loadSubdomains()
    }
  }, [user, loading])

  const checkAdminAccess = async () => {
    if (!user) return

    try {
      const adminData = await adminService.getMember(user.uid)
      if (!adminData || !adminData.isActive) {
        await auth.signOut()
        router.push('/vp-admin')
        return
      }
    } catch (error) {
      console.error('檢查管理員權限失敗:', error)
      await auth.signOut()
      router.push('/vp-admin')
    }
  }

  const loadSubdomains = async () => {
    try {
      setSubdomainsLoading(true)
      const subdomainsList = await adminService.getAllSubdomains()
      setSubdomains(subdomainsList)
    } catch (error) {
      console.error('載入子網域列表失敗:', error)
      toast.error('載入子網域列表失敗')
    } finally {
      setSubdomainsLoading(false)
    }
  }

  const checkSubdomainAvailability = async (subdomainName: string) => {
    if (!subdomainName || subdomainName.length < 2) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingAvailability(true)
    try {
      const available = await adminService.isSubdomainAvailable(subdomainName)
      setSubdomainAvailable(available)
    } catch (error) {
      console.error('檢查子網域可用性失敗:', error)
      setSubdomainAvailable(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setNewSubdomain({ ...newSubdomain, subdomain: cleaned })
    
    // 延遲檢查可用性
    setTimeout(() => {
      if (cleaned === newSubdomain.subdomain) {
        checkSubdomainAvailability(cleaned)
      }
    }, 500)
  }

  const handleCreateSubdomain = async () => {
    if (!newSubdomain.subdomain || !newSubdomain.salespersonName || !newSubdomain.salespersonEmail) {
      toast.error('請填寫所有必填欄位')
      return
    }

    if (!subdomainAvailable) {
      toast.error('子網域名稱不可用')
      return
    }

    setCreating(true)
    try {
      // 先創建業務員資料（簡化版本，實際應該有完整的業務員創建流程）
      const subdomainData: Omit<Subdomain, 'id' | 'createdAt' | 'updatedAt'> = {
        subdomain: newSubdomain.subdomain,
        salespersonId: `salesperson_${Date.now()}`, // 暫時ID，實際應該關聯到真實業務員
        salespersonName: newSubdomain.salespersonName,
        isActive: true,
        isReserved: false,
        customSettings: {
          welcomeMessage: newSubdomain.welcomeMessage,
          showContact: true
        },
        stats: {
          totalVisits: 0,
          registrations: 0,
          orders: 0,
          revenue: 0
        }
      }

      await adminService.createSubdomain(subdomainData)
      toast.success('子網域創建成功')
      setShowCreateDialog(false)
      setNewSubdomain({
        subdomain: '',
        salespersonName: '',
        salespersonEmail: '',
        welcomeMessage: '',
        phone: '',
        lineId: '',
        region: ''
      })
      setSubdomainAvailable(null)
      loadSubdomains()
    } catch (error) {
      console.error('創建子網域失敗:', error)
      toast.error(error instanceof Error ? error.message : '創建子網域失敗')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleSubdomainStatus = async (subdomainId: string, currentStatus: boolean) => {
    try {
      await adminService.updateSubdomain(subdomainId, { isActive: !currentStatus })
      toast.success(`子網域已${currentStatus ? '停用' : '啟用'}`)
      loadSubdomains()
    } catch (error) {
      console.error('切換子網域狀態失敗:', error)
      toast.error('切換子網域狀態失敗')
    }
  }

  const handleDeleteSubdomain = async (subdomainId: string, subdomainName: string) => {
    if (!confirm(`確定要刪除子網域 "${subdomainName}" 嗎？此操作無法復原，相關的客戶綁定關係也將失效。`)) {
      return
    }

    try {
      await adminService.deleteSubdomain(subdomainId)
      toast.success('子網域已刪除')
      loadSubdomains()
    } catch (error) {
      console.error('刪除子網域失敗:', error)
      toast.error('刪除子網域失敗')
    }
  }

  const filteredSubdomains = subdomains.filter(subdomain =>
    subdomain.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subdomain.salespersonName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubdomainUrl = (subdomain: string) => {
    return `https://devape.me/${subdomain}`
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600">載入中...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">子網域管理</h1>
              <p className="text-sm text-gray-500">管理業務員專屬子網域</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/vp-admin/dashboard')} variant="outline">
                返回儀表板
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新增子網域
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>創建新子網域</DialogTitle>
                    <DialogDescription>
                      為業務員創建專屬的子網域入口
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subdomain">子網域名稱 *</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">devape.me/</span>
                        <Input
                          id="subdomain"
                          value={newSubdomain.subdomain}
                          onChange={(e) => handleSubdomainChange(e.target.value)}
                          placeholder="例如: lora, john, mary"
                          className="flex-1"
                        />
                        {checkingAvailability && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        )}
                        {subdomainAvailable === true && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {subdomainAvailable === false && (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {subdomainAvailable === false && (
                        <p className="text-sm text-red-500 mt-1">
                          {RESERVED_SUBDOMAINS.includes(newSubdomain.subdomain.toLowerCase()) 
                            ? '此名稱為系統保留字，請使用其他名稱' 
                            : '此子網域名稱已被使用'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        只能使用英文字母、數字和連字號，長度2-20字元
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="salesperson-name">業務員姓名 *</Label>
                        <Input
                          id="salesperson-name"
                          value={newSubdomain.salespersonName}
                          onChange={(e) => setNewSubdomain({ ...newSubdomain, salespersonName: e.target.value })}
                          placeholder="請輸入業務員姓名"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="salesperson-email">聯絡信箱 *</Label>
                        <Input
                          id="salesperson-email"
                          type="email"
                          value={newSubdomain.salespersonEmail}
                          onChange={(e) => setNewSubdomain({ ...newSubdomain, salespersonEmail: e.target.value })}
                          placeholder="業務員聯絡信箱"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">聯絡電話</Label>
                        <Input
                          id="phone"
                          value={newSubdomain.phone}
                          onChange={(e) => setNewSubdomain({ ...newSubdomain, phone: e.target.value })}
                          placeholder="0912-345-678"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="line-id">LINE ID</Label>
                        <Input
                          id="line-id"
                          value={newSubdomain.lineId}
                          onChange={(e) => setNewSubdomain({ ...newSubdomain, lineId: e.target.value })}
                          placeholder="line_id"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="region">服務地區</Label>
                      <Input
                        id="region"
                        value={newSubdomain.region}
                        onChange={(e) => setNewSubdomain({ ...newSubdomain, region: e.target.value })}
                        placeholder="例如：台北地區、全台灣"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="welcome-message">歡迎訊息</Label>
                      <Textarea
                        id="welcome-message"
                        value={newSubdomain.welcomeMessage}
                        onChange={(e) => setNewSubdomain({ ...newSubdomain, welcomeMessage: e.target.value })}
                        placeholder="在專屬頁面顯示給客戶的歡迎訊息..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleCreateSubdomain} 
                      disabled={creating || !subdomainAvailable}
                    >
                      {creating ? '創建中...' : '創建子網域'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜尋 */}
        <div className="mb-6">
          <Input
            placeholder="搜尋子網域名稱或業務員姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總子網域</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subdomains.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活躍子網域</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subdomains.filter(s => s.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總註冊數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subdomains.reduce((sum, s) => sum + (s.stats?.registrations || 0), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subdomains.reduce((sum, s) => sum + (s.stats?.orders || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 子網域列表 */}
        <Card>
          <CardHeader>
            <CardTitle>子網域列表</CardTitle>
            <CardDescription>
              {filteredSubdomains.length} 個子網域
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subdomainsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSubdomains.length > 0 ? (
              <div className="space-y-4">
                {filteredSubdomains.map((subdomain) => (
                  <div key={subdomain.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Globe className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">devape.me/{subdomain.subdomain}</h3>
                          {!subdomain.isActive && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              已停用
                            </Badge>
                          )}
                          {subdomain.isReserved && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              保留
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">業務員: {subdomain.salespersonName}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                          <span>訪問: {subdomain.stats?.totalVisits || 0}</span>
                          <span>註冊: {subdomain.stats?.registrations || 0}</span>
                          <span>訂單: {subdomain.stats?.orders || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getSubdomainUrl(subdomain.subdomain), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        訪問
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSubdomainStatus(subdomain.id, subdomain.isActive)}
                      >
                        {subdomain.isActive ? '停用' : '啟用'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteSubdomain(subdomain.id, subdomain.subdomain)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到子網域</h3>
                <p className="text-gray-500">請調整搜尋條件或建立新的子網域</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 保留子網域說明 */}
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              保留子網域
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-3">
              以下子網域名稱為系統保留，無法用於業務員子網域：
            </p>
            <div className="flex flex-wrap gap-2">
              {RESERVED_SUBDOMAINS.map((reserved) => (
                <Badge key={reserved} variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {reserved}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}