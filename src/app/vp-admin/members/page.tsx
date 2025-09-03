'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { adminService } from '@/lib/firebase/admin'
import { AdminMember, AdminRole, getRoleDisplayName, ROLE_PERMISSIONS } from '@/lib/types/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

interface NewMemberForm {
  name: string
  email: string
  role: AdminRole
}

interface EditMemberForm {
  id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
}

export default function MembersManagePage() {
  const [user, loading] = useAuthState(auth)
  const [members, setMembers] = useState<AdminMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<AdminMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newMember, setNewMember] = useState<NewMemberForm>({
    name: '',
    email: '',
    role: 'admin'
  })
  const [editMember, setEditMember] = useState<EditMemberForm | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/vp-admin')
      return
    }

    if (user) {
      checkAdminAccess()
      loadMembers()
    }
  }, [user, loading])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm, roleFilter])

  const checkAdminAccess = async () => {
    if (!user) return

    try {
      const adminData = await adminService.getMember(user.uid)
      if (!adminData || !adminData.isActive || 
          (adminData.role !== 'super_admin' && adminData.role !== 'admin')) {
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

  const loadMembers = async () => {
    try {
      setMembersLoading(true)
      const membersList = await adminService.getAllMembers()
      setMembers(membersList)
    } catch (error) {
      console.error('載入成員列表失敗:', error)
      toast.error('載入成員列表失敗')
    } finally {
      setMembersLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = members

    // 搜尋過濾
    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 角色過濾
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter)
    }

    setFilteredMembers(filtered)
  }

  const handleCreateMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error('請填寫所有必填欄位')
      return
    }

    setCreating(true)
    try {
      const memberData = {
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        permissions: ROLE_PERMISSIONS[newMember.role],
        isActive: true,
        createdBy: user?.uid
      }

      await adminService.createMember(memberData)
      toast.success('成員創建成功')
      setShowCreateDialog(false)
      setNewMember({ name: '', email: '', role: 'admin' })
      loadMembers() // 重新載入列表
    } catch (error) {
      console.error('創建成員失敗:', error)
      toast.error('創建成員失敗')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      await adminService.updateMember(memberId, { isActive: !currentStatus })
      toast.success(`成員已${currentStatus ? '停用' : '啟用'}`)
      loadMembers()
    } catch (error) {
      console.error('切換成員狀態失敗:', error)
      toast.error('切換成員狀態失敗')
    }
  }

  const handleEditMember = (member: AdminMember) => {
    setEditMember({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.isActive
    })
    setShowEditDialog(true)
  }

  const handleUpdateMember = async () => {
    if (!editMember || !editMember.name || !editMember.email || !editMember.role) {
      toast.error('請填寫所有必填欄位')
      return
    }

    setUpdating(true)
    try {
      const updateData = {
        name: editMember.name,
        email: editMember.email,
        role: editMember.role,
        permissions: ROLE_PERMISSIONS[editMember.role],
        isActive: editMember.isActive,
        updatedAt: new Date()
      }

      await adminService.updateMember(editMember.id, updateData)
      toast.success('成員資料已更新')
      setShowEditDialog(false)
      setEditMember(null)
      loadMembers() // 重新載入列表
    } catch (error) {
      console.error('更新成員失敗:', error)
      toast.error('更新成員失敗')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`確定要刪除成員 "${memberName}" 嗎？此操作無法復原。`)) {
      return
    }

    try {
      await adminService.deleteMember(memberId)
      toast.success('成員已刪除')
      loadMembers()
    } catch (error) {
      console.error('刪除成員失敗:', error)
      toast.error('刪除成員失敗')
    }
  }

  const getRoleColor = (role: AdminRole) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      salesperson: 'bg-green-100 text-green-800',
      operations: 'bg-yellow-100 text-yellow-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
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
              <h1 className="text-2xl font-bold text-gray-900">成員管理</h1>
              <p className="text-sm text-gray-500">管理系統成員與權限</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/vp-admin/dashboard')} variant="outline">
                返回儀表板
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新增成員
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新增系統成員</DialogTitle>
                    <DialogDescription>
                      創建新的管理員或業務員帳號
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="member-name">姓名</Label>
                      <Input
                        id="member-name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="請輸入成員姓名"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="member-email">電子郵件</Label>
                      <Input
                        id="member-email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="請輸入登入信箱"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="member-role">角色權限</Label>
                      <Select value={newMember.role} onValueChange={(value: AdminRole) => 
                        setNewMember({ ...newMember, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理員</SelectItem>
                          <SelectItem value="salesperson">業務員</SelectItem>
                          <SelectItem value="operations">後勤人員</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateMember} disabled={creating}>
                      {creating ? '創建中...' : '創建成員'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 編輯成員對話框 */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>編輯成員資料</DialogTitle>
                    <DialogDescription>
                      修改成員的基本資料與權限
                    </DialogDescription>
                  </DialogHeader>
                  
                  {editMember && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-member-name">姓名</Label>
                        <Input
                          id="edit-member-name"
                          value={editMember.name}
                          onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                          placeholder="請輸入成員姓名"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-member-email">電子郵件</Label>
                        <Input
                          id="edit-member-email"
                          type="email"
                          value={editMember.email}
                          onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                          placeholder="請輸入登入信箱"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-member-role">角色權限</Label>
                        <Select 
                          value={editMember.role} 
                          onValueChange={(value: AdminRole) => 
                            setEditMember({ ...editMember, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">超級管理員</SelectItem>
                            <SelectItem value="admin">管理員</SelectItem>
                            <SelectItem value="salesperson">業務員</SelectItem>
                            <SelectItem value="operations">後勤人員</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-member-active"
                          checked={editMember.isActive}
                          onChange={(e) => setEditMember({ ...editMember, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="edit-member-active">啟用帳號</Label>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowEditDialog(false)
                      setEditMember(null)
                    }}>
                      取消
                    </Button>
                    <Button onClick={handleUpdateMember} disabled={updating}>
                      {updating ? '更新中...' : '更新成員'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜尋和篩選 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="搜尋成員姓名或信箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AdminRole | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="篩選角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有角色</SelectItem>
              <SelectItem value="super_admin">超級管理員</SelectItem>
              <SelectItem value="admin">管理員</SelectItem>
              <SelectItem value="salesperson">業務員</SelectItem>
              <SelectItem value="operations">後勤人員</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總成員數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活躍成員</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">管理員</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'admin' || m.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">業務員</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'salesperson').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 成員列表 */}
        <Card>
          <CardHeader>
            <CardTitle>系統成員列表</CardTitle>
            <CardDescription>
              {filteredMembers.length} 位成員
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
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
            ) : filteredMembers.length > 0 ? (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{member.name}</h3>
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                          {!member.isActive && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              已停用
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        {member.lastLoginAt && (
                          <p className="text-xs text-gray-400 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            最後登入: {member.lastLoginAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        編輯
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleMemberStatus(member.id, member.isActive)}
                      >
                        {member.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            停用
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            啟用
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteMember(member.id, member.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到成員</h3>
                <p className="text-gray-500">請調整搜尋條件或新增成員</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}