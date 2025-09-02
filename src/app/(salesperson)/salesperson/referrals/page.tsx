'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Link as LinkIcon,
  Calendar,
  BarChart3,
  Globe
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { referralCodesService } from '@/lib/firebase/referrals';
import { ReferralCode, CreateReferralCodeData } from '@/lib/types/referral';
import { toast } from '@/lib/utils/toast';

export default function SalespersonReferrals() {
  const { profile, user } = useAuth();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // 建立推薦碼表單狀態
  const [createForm, setCreateForm] = useState<Partial<CreateReferralCodeData>>({
    code: '',
    description: '',
    welcomeMessage: '',
  });

  // 統計數據
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalClicks: 0,
    totalRegistrations: 0,
    totalOrders: 0,
    totalSales: 0
  });

  useEffect(() => {
    loadReferralCodes();
  }, [user?.uid]);

  const loadReferralCodes = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const codes = await referralCodesService.getReferralCodesBySalesperson(user.uid);
      setReferralCodes(codes);

      // 計算統計數據
      const totalCodes = codes.length;
      const activeCodes = codes.filter(c => c.isActive).length;
      const totalClicks = codes.reduce((sum, c) => sum + c.totalClicks, 0);
      const totalRegistrations = codes.reduce((sum, c) => sum + c.totalRegistrations, 0);
      const totalOrders = codes.reduce((sum, c) => sum + c.totalOrders, 0);
      const totalSales = codes.reduce((sum, c) => sum + c.totalSales, 0);

      setStats({
        totalCodes,
        activeCodes,
        totalClicks,
        totalRegistrations,
        totalOrders,
        totalSales
      });

    } catch (error) {
      console.error('載入推薦碼失敗:', error);
      toast.error('載入推薦碼失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!user?.uid || !profile?.displayName) return;

    if (!createForm.code?.trim()) {
      toast.error('請輸入推薦碼');
      return;
    }

    try {
      const createData: CreateReferralCodeData = {
        code: createForm.code!.toUpperCase(),
        salespersonId: user.uid,
        description: createForm.description,
        welcomeMessage: createForm.welcomeMessage,
      };

      await referralCodesService.createReferralCode(createData);
      toast.success('推薦碼建立成功');
      
      setShowCreateDialog(false);
      setCreateForm({ code: '', description: '', welcomeMessage: '' });
      loadReferralCodes();

    } catch (error: any) {
      console.error('建立推薦碼失敗:', error);
      toast.error(error.message || '建立推薦碼失敗');
    }
  };

  const handleToggleStatus = async (code: ReferralCode) => {
    try {
      await referralCodesService.toggleReferralCodeStatus(code.id, !code.isActive);
      toast.success(`推薦碼已${code.isActive ? '停用' : '啟用'}`);
      loadReferralCodes();
    } catch (error) {
      console.error('更新推薦碼狀態失敗:', error);
      toast.error('更新推薦碼狀態失敗');
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('推薦連結已複製到剪貼板');
  };

  const handleViewDetails = (code: ReferralCode) => {
    setSelectedCode(code);
    setShowDetailsDialog(true);
  };

  const getReferralLink = (code: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${code}`;
    }
    return `https://yourdomain.com/${code}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">推薦碼管理</h1>
          <p className="text-muted-foreground">
            管理您的推薦碼並追蹤成效
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              建立推薦碼
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立新推薦碼</DialogTitle>
              <DialogDescription>
                建立一個新的推薦碼來追蹤客戶來源和業績
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">推薦碼 *</Label>
                <Input
                  id="code"
                  placeholder="例如: JOHN2024"
                  value={createForm.code || ''}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    code: e.target.value.toUpperCase() 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  placeholder="推薦碼用途說明"
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="welcomeMessage">歡迎訊息</Label>
                <Textarea
                  id="welcomeMessage"
                  placeholder="客戶點擊推薦連結時顯示的歡迎訊息"
                  value={createForm.welcomeMessage || ''}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    welcomeMessage: e.target.value 
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateCode}>
                建立推薦碼
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總推薦碼</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCodes}</div>
            <p className="text-xs text-muted-foreground">
              活躍: {stats.activeCodes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總點擊數</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">累計點擊</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總註冊數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">新客戶註冊</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">推薦訂單</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總業績</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">推薦業績</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">轉換率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalClicks > 0 
                ? ((stats.totalRegistrations / stats.totalClicks) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">點擊到註冊</p>
          </CardContent>
        </Card>
      </div>

      {/* 推薦碼列表 */}
      <Card>
        <CardHeader>
          <CardTitle>推薦碼列表</CardTitle>
        </CardHeader>
        <CardContent>
          {referralCodes.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">還沒有推薦碼</h3>
              <p className="text-muted-foreground">
                建立您的第一個推薦碼來開始追蹤客戶來源
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                建立推薦碼
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {referralCodes.map((code) => (
                <Card key={code.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {code.code.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{code.code}</h3>
                            <Badge variant={code.isActive ? 'default' : 'secondary'}>
                              {code.isActive ? '啟用中' : '已停用'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {code.description || '無描述'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>建立於 {code.createdAt instanceof Date ? code.createdAt.toLocaleDateString('zh-TW') : new Date(code.createdAt.toDate()).toLocaleDateString('zh-TW')}</span>
                            {code.lastUsedAt && (
                              <span>最後使用 {new Date(code.lastUsedAt).toLocaleDateString('zh-TW')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* 統計數據 */}
                        <div className="grid grid-cols-2 gap-3 text-center text-sm">
                          <div>
                            <div className="font-medium text-blue-600">{code.totalClicks}</div>
                            <div className="text-muted-foreground text-xs">點擊</div>
                          </div>
                          <div>
                            <div className="font-medium text-green-600">{code.totalRegistrations}</div>
                            <div className="text-muted-foreground text-xs">註冊</div>
                          </div>
                          <div>
                            <div className="font-medium text-purple-600">{code.totalOrders}</div>
                            <div className="text-muted-foreground text-xs">訂單</div>
                          </div>
                          <div>
                            <div className="font-medium text-orange-600">
                              ${code.totalSales.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground text-xs">業績</div>
                          </div>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopyLink(code.code)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            複製連結
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(getReferralLink(code.code), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleViewDetails(code)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看詳情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(code)}>
                                {code.isActive ? (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    停用
                                  </>
                                ) : (
                                  <>
                                    <Target className="h-4 w-4 mr-2" />
                                    啟用
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 推薦碼詳情對話框 */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>推薦碼詳情</DialogTitle>
            <DialogDescription>
              {selectedCode?.code} 的詳細統計和設定
            </DialogDescription>
          </DialogHeader>
          {selectedCode && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>推薦碼</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {selectedCode.code}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyLink(selectedCode.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>狀態</Label>
                  <div className="mt-1">
                    <Badge variant={selectedCode.isActive ? 'default' : 'secondary'}>
                      {selectedCode.isActive ? '啟用中' : '已停用'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 推薦連結 */}
              <div>
                <Label>推薦連結</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    readOnly 
                    value={getReferralLink(selectedCode.code)}
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyLink(selectedCode.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(getReferralLink(selectedCode.code), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 統計數據 */}
              <div>
                <Label>成效統計</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {selectedCode.totalClicks}
                      </div>
                      <div className="text-xs text-muted-foreground">點擊數</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {selectedCode.totalRegistrations}
                      </div>
                      <div className="text-xs text-muted-foreground">註冊數</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {selectedCode.totalOrders}
                      </div>
                      <div className="text-xs text-muted-foreground">訂單數</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold text-orange-600">
                        ${selectedCode.totalSales.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">總業績</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 歡迎訊息 */}
              {selectedCode.welcomeMessage && (
                <div>
                  <Label>歡迎訊息</Label>
                  <Textarea 
                    readOnly 
                    value={selectedCode.welcomeMessage}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}