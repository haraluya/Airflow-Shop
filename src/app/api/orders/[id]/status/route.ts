import { NextRequest, NextResponse } from 'next/server';
import { orderAutomationService } from '@/lib/services/order-automation';
import { z } from 'zod';

// 訂單狀態更新 Schema
const updateOrderStatusSchema = z.object({
  status: z.string().min(1, '訂單狀態不能為空'),
  notes: z.string().optional(),
  estimatedDeliveryDays: z.number().optional(),
  trackingNumber: z.string().optional(),
  reason: z.string().optional(),
  updatedBy: z.string().optional(),
});

// 付款狀態更新 Schema
const updatePaymentStatusSchema = z.object({
  paymentStatus: z.string().min(1, '付款狀態不能為空'),
  transactionId: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  updatedBy: z.string().optional(),
});

/**
 * 更新訂單狀態
 * PUT /api/orders/[id]/status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();

    // 根據請求類型選擇對應的 schema
    let validatedData;
    if ('status' in body) {
      // 訂單狀態更新
      validatedData = updateOrderStatusSchema.parse(body);
      
      await orderAutomationService.updateOrderStatus({
        orderId,
        newStatus: validatedData.status,
        notes: validatedData.notes,
        estimatedDeliveryDays: validatedData.estimatedDeliveryDays,
        trackingNumber: validatedData.trackingNumber,
        reason: validatedData.reason,
        updatedBy: validatedData.updatedBy,
      });

      return NextResponse.json({
        success: true,
        message: '訂單狀態更新成功',
      });

    } else if ('paymentStatus' in body) {
      // 付款狀態更新
      validatedData = updatePaymentStatusSchema.parse(body);

      await orderAutomationService.updatePaymentStatus({
        orderId,
        newPaymentStatus: validatedData.paymentStatus,
        transactionId: validatedData.transactionId,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        updatedBy: validatedData.updatedBy,
      });

      return NextResponse.json({
        success: true,
        message: '付款狀態更新成功',
      });

    } else {
      return NextResponse.json(
        { error: '無效的請求參數' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('更新訂單狀態失敗:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '資料驗證失敗', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '更新訂單狀態失敗' },
      { status: 500 }
    );
  }
}

/**
 * 批量更新訂單狀態
 * POST /api/orders/[id]/status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;

    const orderId = params.id;

    switch (action) {
      case 'auto_confirm':
        await orderAutomationService.autoConfirmOrder(orderId);
        return NextResponse.json({
          success: true,
          message: '訂單自動確認成功',
        });

      default:
        return NextResponse.json(
          { error: '不支援的操作' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('批量操作失敗:', error);
    return NextResponse.json(
      { error: '批量操作失敗' },
      { status: 500 }
    );
  }
}