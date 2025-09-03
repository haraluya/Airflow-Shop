'use client';

import React, { useState, useEffect } from 'react';
import { notificationTemplateService } from '@/lib/services/notification-templates';
import { NotificationTemplate } from '@/lib/types/notification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  Save,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export function NotificationTemplateManager() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChannel, setPreviewChannel] = useState('email');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templateList = await notificationTemplateService.getAllTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('載入模板失敗:', error);
      setMessage({ type: 'error', text: '載入模板失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultTemplates = async () => {
    try {
      await notificationTemplateService.initializeDefaultTemplates();
      await loadTemplates();
      setMessage({ type: 'success', text: '預設模板已建立完成' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('初始化模板失敗:', error);
      setMessage({ type: 'error', text: '初始化模板失敗' });
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowEditDialog(true);
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'line': return <MessageSquare className="w-4 h-4" />;
      case 'in_app': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    const sampleVariables = {
      customerName: '王小明',
      orderNumber: 'ORD-20240301-001',
      totalAmount: '1,250',
      orderDate: '2024-03-01 14:30',
      confirmedAt: '2024-03-01 15:00',
      shippedAt: '2024-03-02 10:00',
      deliveredAt: '2024-03-03 16:30',
      trackingNumber: 'TW123456789',
      estimatedDeliveryDate: '2024-03-05',
      estimatedDays: '3',
      amount: '1,250',
      paidAt: '2024-03-01 16:00',
      transactionId: 'TXN-ABC123',
      actionUrl: '/orders/123',
      actionText: '查看訂單',
    };

    const content = notificationTemplateService.renderTemplate(
      selectedTemplate, 
      previewChannel, 
      sampleVariables
    );

    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">標題</label>
          <div className="mt-1 p-3 bg-muted rounded-md">
            {content.title || '(無標題)'}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">內容</label>
          <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
            {previewChannel === 'email' ? (
              <div dangerouslySetInnerHTML={{ __html: content.message }} />
            ) : (
              content.message
            )}
          </div>
        </div>

        {content.actionUrl && (
          <div>
            <label className="text-sm font-medium">操作連結</label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              <span className="text-blue-600 underline">{content.actionText || '查看詳情'}</span>
              <span className="text-sm text-muted-foreground ml-2">({content.actionUrl})</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>通知模板管理</span>
            </CardTitle>
            <CardDescription>
              管理各種通知的郵件、簡訊、LINE 和應用內模板
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadTemplates}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重新載入
            </Button>
            {templates.length === 0 && (
              <Button variant="outline" size="sm" onClick={initializeDefaultTemplates}>
                <Plus className="w-4 h-4 mr-2" />
                建立預設模板
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 狀態訊息 */}
          {message && (
            <div className={`p-3 text-sm rounded-md flex items-center space-x-2 mb-6 ${
              message.type === 'success' 
                ? 'text-green-800 bg-green-100 border border-green-200' 
                : 'text-red-800 bg-red-100 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span>{message.text}</span>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">尚未建立任何通知模板</p>
              <Button onClick={initializeDefaultTemplates}>
                <Plus className="w-4 h-4 mr-2" />
                建立預設模板
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.type}
                          </p>
                        </div>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        {template.emailTemplate && getChannelIcon('email')}
                        {template.smsTemplate && getChannelIcon('sms')}
                        {template.lineTemplate && getChannelIcon('line')}
                        {template.inAppTemplate && getChannelIcon('in_app')}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? '啟用' : '停用'}
                        </Badge>

                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
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

      {/* 預覽模板對話框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>模板預覽：{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 頻道選擇 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">預覽頻道：</span>
              <Tabs value={previewChannel} onValueChange={setPreviewChannel}>
                <TabsList className="grid grid-cols-4 w-fit">
                  <TabsTrigger value="email" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    郵件
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="text-xs">
                    <Smartphone className="w-3 h-3 mr-1" />
                    簡訊
                  </TabsTrigger>
                  <TabsTrigger value="line" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    LINE
                  </TabsTrigger>
                  <TabsTrigger value="in_app" className="text-xs">
                    <Bell className="w-3 h-3 mr-1" />
                    應用內
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 預覽內容 */}
            <div className="border rounded-lg p-4 bg-muted/50">
              {renderPreview()}
            </div>

            <div className="text-xs text-muted-foreground">
              * 使用範例變數資料進行預覽
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編輯模板對話框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>編輯模板：{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              模板編輯功能開發中...
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-medium mb-2">可用變數：</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>{'{{customerName}}'} - 客戶姓名</div>
                  <div>{'{{orderNumber}}'} - 訂單編號</div>
                  <div>{'{{totalAmount}}'} - 訂單金額</div>
                  <div>{'{{orderDate}}'} - 下單時間</div>
                  <div>{'{{trackingNumber}}'} - 追蹤號碼</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">條件語法：</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>{'{{#variable}}...{{/variable}}'} - 條件顯示</div>
                  <div>變數存在時才顯示區塊內容</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                儲存變更
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}