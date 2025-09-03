'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order, ORDER_STATUS, ORDER_STATUS_LABELS, PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '@/lib/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  Calendar,
  User,
  AlertCircle,
  Save
} from 'lucide-react';

// 訂單狀態更新表單 Schema
const orderStatusSchema = z.object({
  status: z.string().min(1, '請選擇訂單狀態'),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryDays: z.coerce.number().min(1).max(30).optional(),
  reason: z.string().optional(),
});

// 付款狀態更新表單 Schema
const paymentStatusSchema = z.object({
  paymentStatus: z.string().min(1, '請選擇付款狀態'),
  transactionId: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type OrderStatusFormData = z.infer<typeof orderStatusSchema>;
type PaymentStatusFormData = z.infer<typeof paymentStatusSchema>;

interface OrderStatusManagerProps {
  order: Order;
  onUpdate?: (orderId: string) => void;
}

export function OrderStatusManager({ order, onUpdate }: OrderStatusManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // 訂單狀態表單
  const orderForm = useForm<OrderStatusFormData>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      status: order.status,
      notes: '',
      trackingNumber: order.trackingNumber || '',
      estimatedDeliveryDays: 3,
      reason: '',
    },
  });

  // 付款狀態表單
  const paymentForm = useForm<PaymentStatusFormData>({
    resolver: zodResolver(paymentStatusSchema),
    defaultValues: {
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId || '',
      paymentMethod: order.paymentMethod || '',
      notes: '',
    },
  });

  const updateOrderStatus = async (data: OrderStatusFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          notes: data.notes,
          trackingNumber: data.trackingNumber,
          estimatedDeliveryDays: data.estimatedDeliveryDays,
          reason: data.reason,
          updatedBy: 'admin', // 這裡應該是當前管理員ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '訂單狀態更新成功' });
        setShowOrderDialog(false);
        onUpdate?.(order.id);
        
        // 3秒後清除訊息
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || '更新失敗' });
      }

    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      setMessage({ type: 'error', text: '更新訂單狀態失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (data: PaymentStatusFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: data.paymentStatus,
          transactionId: data.transactionId,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          updatedBy: 'admin', // 這裡應該是當前管理員ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '付款狀態更新成功' });
        setShowPaymentDialog(false);
        onUpdate?.(order.id);
        
        // 3秒後清除訊息
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || '更新失敗' });
      }

    } catch (error) {
      console.error('更新付款狀態失敗:', error);
      setMessage({ type: 'error', text: '更新付款狀態失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.PROCESSING:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PAYMENT_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PAYMENT_STATUS.PAID:
        return 'bg-green-100 text-green-800';
      case PAYMENT_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800';
      case PAYMENT_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>訂單狀態管理</span>
        </CardTitle>
        <CardDescription>
          管理訂單和付款狀態，自動發送通知
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 狀態訊息 */}
        {message && (
          <div className={`p-3 text-sm rounded-md flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'text-green-800 bg-green-100 border border-green-200' 
              : 'text-red-800 bg-red-100 border border-red-200'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        )}

        {/* 當前狀態顯示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">訂單狀態</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(order.status)}>
                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
              </Badge>
              <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    更新狀態
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>更新訂單狀態</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={orderForm.handleSubmit(updateOrderStatus)} className="space-y-4">
                    <FormField
                      label="訂單狀態"
                      required
                      error={orderForm.formState.errors.status?.message}
                    >
                      <select
                        className="w-full p-2 border rounded-md"
                        {...orderForm.register('status')}
                      >
                        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </FormField>

                    {orderForm.watch('status') === ORDER_STATUS.SHIPPED && (
                      <>
                        <FormField
                          label="物流追蹤號碼"
                          error={orderForm.formState.errors.trackingNumber?.message}
                        >
                          <Input
                            placeholder="請輸入追蹤號碼"
                            {...orderForm.register('trackingNumber')}
                          />
                        </FormField>
                        <FormField
                          label="預計到貨天數"
                          error={orderForm.formState.errors.estimatedDeliveryDays?.message}
                        >
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            placeholder="3"
                            {...orderForm.register('estimatedDeliveryDays')}
                          />
                        </FormField>
                      </>
                    )}

                    {orderForm.watch('status') === ORDER_STATUS.CANCELLED && (
                      <FormField
                        label="取消原因"
                        error={orderForm.formState.errors.reason?.message}
                      >
                        <Textarea
                          placeholder="請說明取消原因"
                          {...orderForm.register('reason')}
                        />
                      </FormField>
                    )}

                    <FormField
                      label="備註"
                      error={orderForm.formState.errors.notes?.message}
                    >
                      <Textarea
                        placeholder="狀態更新說明（選填）"
                        {...orderForm.register('notes')}
                      />
                    </FormField>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowOrderDialog(false)}
                      >
                        取消
                      </Button>
                      <Button type="submit" loading={isLoading} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        更新狀態
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">付款狀態</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS]}
              </Badge>
              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    更新狀態
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>更新付款狀態</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={paymentForm.handleSubmit(updatePaymentStatus)} className="space-y-4">
                    <FormField
                      label="付款狀態"
                      required
                      error={paymentForm.formState.errors.paymentStatus?.message}
                    >
                      <select
                        className="w-full p-2 border rounded-md"
                        {...paymentForm.register('paymentStatus')}
                      >
                        {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </FormField>

                    {paymentForm.watch('paymentStatus') === PAYMENT_STATUS.PAID && (
                      <>
                        <FormField
                          label="交易ID"
                          error={paymentForm.formState.errors.transactionId?.message}
                        >
                          <Input
                            placeholder="請輸入交易ID"
                            {...paymentForm.register('transactionId')}
                          />
                        </FormField>
                        <FormField
                          label="付款方式"
                          error={paymentForm.formState.errors.paymentMethod?.message}
                        >
                          <select
                            className="w-full p-2 border rounded-md"
                            {...paymentForm.register('paymentMethod')}
                          >
                            <option value="">請選擇付款方式</option>
                            <option value="bank_transfer">銀行轉帳</option>
                            <option value="cash_on_delivery">貨到付款</option>
                            <option value="credit_card">信用卡</option>
                            <option value="line_pay">LINE Pay</option>
                          </select>
                        </FormField>
                      </>
                    )}

                    <FormField
                      label="備註"
                      error={paymentForm.formState.errors.notes?.message}
                    >
                      <Textarea
                        placeholder="付款狀態更新說明（選填）"
                        {...paymentForm.register('notes')}
                      />
                    </FormField>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowPaymentDialog(false)}
                      >
                        取消
                      </Button>
                      <Button type="submit" loading={isLoading} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        更新狀態
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* 狀態歷史記錄 */}
        {(order.statusHistory || order.paymentHistory) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">狀態變更記錄</h3>
            <Tabs defaultValue="order" className="w-full">
              <TabsList>
                <TabsTrigger value="order">訂單狀態</TabsTrigger>
                <TabsTrigger value="payment">付款狀態</TabsTrigger>
              </TabsList>
              
              <TabsContent value="order" className="space-y-2">
                {order.statusHistory?.length ? (
                  order.statusHistory.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">
                            {ORDER_STATUS_LABELS[record.status as keyof typeof ORDER_STATUS_LABELS]}
                          </span>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(record.timestamp).toLocaleDateString('zh-TW')}</div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{record.updatedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">暫無狀態變更記錄</p>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-2">
                {order.paymentHistory?.length ? (
                  order.paymentHistory.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">
                            {PAYMENT_STATUS_LABELS[record.status as keyof typeof PAYMENT_STATUS_LABELS]}
                          </span>
                          {record.transactionId && (
                            <p className="text-sm text-muted-foreground">交易ID: {record.transactionId}</p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(record.timestamp).toLocaleDateString('zh-TW')}</div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{record.updatedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">暫無付款記錄</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}