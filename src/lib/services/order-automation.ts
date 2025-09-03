/**
 * 訂單狀態自動化管理服務
 * 負責訂單生命週期的自動化流程管理
 */

import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Order, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/types/order';
import { notificationService } from '@/lib/firebase/notifications';
import { NOTIFICATION_TYPE, NOTIFICATION_CHANNEL } from '@/lib/types/notification';

export interface OrderStatusUpdate {
  orderId: string;
  newStatus: string;
  notes?: string;
  estimatedDeliveryDays?: number;
  trackingNumber?: string;
  updatedBy?: string;
  reason?: string;
}

export interface PaymentStatusUpdate {
  orderId: string;
  newPaymentStatus: string;
  transactionId?: string;
  paymentMethod?: string;
  notes?: string;
  updatedBy?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggers: {
    statusChange?: string;
    timeDelay?: number; // 小時
    condition?: string;
  };
  actions: {
    updateStatus?: string;
    sendNotification?: boolean;
    executeFunction?: string;
  };
  isActive: boolean;
}

class OrderAutomationService {
  /**
   * 更新訂單狀態
   */
  async updateOrderStatus(update: OrderStatusUpdate): Promise<void> {
    try {
      const { orderId, newStatus, notes, estimatedDeliveryDays, trackingNumber, updatedBy, reason } = update;
      
      // 取得當前訂單資料
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('訂單不存在');
      }

      const orderData = orderSnap.data() as Order;
      const oldStatus = orderData.status;

      // 驗證狀態轉換是否有效
      if (!this.isValidStatusTransition(oldStatus, newStatus)) {
        throw new Error(`無效的狀態轉換: ${oldStatus} -> ${newStatus}`);
      }

      // 準備更新資料
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      // 添加狀態變更記錄
      const statusHistory = orderData.statusHistory || [];
      statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        updatedBy: updatedBy || 'system',
        notes: notes || reason,
      });
      updateData.statusHistory = statusHistory;

      // 根據新狀態添加相關欄位
      switch (newStatus) {
        case ORDER_STATUS.CONFIRMED:
          updateData.confirmedAt = Timestamp.now();
          break;
        case ORDER_STATUS.PROCESSING:
          updateData.processingAt = Timestamp.now();
          break;
        case ORDER_STATUS.SHIPPED:
          updateData.shippedAt = Timestamp.now();
          if (trackingNumber) updateData.trackingNumber = trackingNumber;
          if (estimatedDeliveryDays) {
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDeliveryDays);
            updateData.estimatedDeliveryDate = Timestamp.fromDate(estimatedDelivery);
          }
          break;
        case ORDER_STATUS.DELIVERED:
          updateData.deliveredAt = Timestamp.now();
          // 自動將付款狀態設為已付款（如果是貨到付款）
          if (orderData.paymentMethod === 'cash_on_delivery' && orderData.paymentStatus === PAYMENT_STATUS.PENDING) {
            updateData.paymentStatus = PAYMENT_STATUS.PAID;
            updateData.paidAt = Timestamp.now();
          }
          break;
        case ORDER_STATUS.CANCELLED:
          updateData.cancelledAt = Timestamp.now();
          updateData.cancelReason = reason;
          // 取消訂單時將付款狀態設為已取消
          if (orderData.paymentStatus !== PAYMENT_STATUS.PAID) {
            updateData.paymentStatus = PAYMENT_STATUS.CANCELLED;
          }
          break;
      }

      // 更新訂單
      await updateDoc(orderRef, updateData);

      // 發送狀態變更通知
      await this.sendStatusChangeNotification(orderData, oldStatus, newStatus, estimatedDeliveryDays);

      // 執行自動化規則
      await this.executeAutomationRules(orderId, oldStatus, newStatus);

      console.log(`訂單 ${orderId} 狀態已從 ${oldStatus} 更新為 ${newStatus}`);
      
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 更新付款狀態
   */
  async updatePaymentStatus(update: PaymentStatusUpdate): Promise<void> {
    try {
      const { orderId, newPaymentStatus, transactionId, paymentMethod, notes, updatedBy } = update;
      
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('訂單不存在');
      }

      const orderData = orderSnap.data() as Order;
      const oldPaymentStatus = orderData.paymentStatus;

      // 準備更新資料
      const updateData: any = {
        paymentStatus: newPaymentStatus,
        updatedAt: Timestamp.now(),
      };

      // 添加付款狀態變更記錄
      const paymentHistory = orderData.paymentHistory || [];
      paymentHistory.push({
        status: newPaymentStatus,
        timestamp: new Date(),
        transactionId,
        paymentMethod,
        updatedBy: updatedBy || 'system',
        notes,
      });
      updateData.paymentHistory = paymentHistory;

      // 根據新狀態添加相關欄位
      switch (newPaymentStatus) {
        case PAYMENT_STATUS.PAID:
          updateData.paidAt = Timestamp.now();
          if (transactionId) updateData.transactionId = transactionId;
          if (paymentMethod) updateData.paymentMethod = paymentMethod;
          // 付款完成後，如果訂單還是待確認狀態，自動確認訂單
          if (orderData.status === ORDER_STATUS.PENDING) {
            updateData.status = ORDER_STATUS.CONFIRMED;
            updateData.confirmedAt = Timestamp.now();
          }
          break;
        case PAYMENT_STATUS.OVERDUE:
          // 計算逾期天數
          const dueDate = orderData.dueDate || orderData.createdAt;
          const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          updateData.daysPastDue = daysPastDue;
          break;
        case PAYMENT_STATUS.CANCELLED:
          updateData.paymentCancelledAt = Timestamp.now();
          // 付款取消時，如果訂單未發貨，自動取消訂單
          if ([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(orderData.status)) {
            updateData.status = ORDER_STATUS.CANCELLED;
            updateData.cancelledAt = Timestamp.now();
            updateData.cancelReason = '付款已取消';
          }
          break;
      }

      // 更新訂單
      await updateDoc(orderRef, updateData);

      // 發送付款狀態變更通知
      await this.sendPaymentStatusNotification(orderData, oldPaymentStatus, newPaymentStatus);

      console.log(`訂單 ${orderId} 付款狀態已從 ${oldPaymentStatus} 更新為 ${newPaymentStatus}`);
      
    } catch (error) {
      console.error('更新付款狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 批量處理逾期訂單
   */
  async processOverdueOrders(): Promise<void> {
    try {
      // 這裡應該查詢所有逾期的訂單
      // 實作查詢邏輯...
      
      console.log('處理逾期訂單完成');
    } catch (error) {
      console.error('處理逾期訂單失敗:', error);
    }
  }

  /**
   * 自動確認訂單（付款後）
   */
  async autoConfirmOrder(orderId: string): Promise<void> {
    await this.updateOrderStatus({
      orderId,
      newStatus: ORDER_STATUS.CONFIRMED,
      notes: '付款確認後自動確認訂單',
      updatedBy: 'system',
    });
  }

  /**
   * 檢查狀態轉換是否有效
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.DELIVERED]: [], // 已送達無法再轉換
      [ORDER_STATUS.CANCELLED]: [], // 已取消無法再轉換
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * 發送狀態變更通知
   */
  private async sendStatusChangeNotification(
    order: Order, 
    oldStatus: string, 
    newStatus: string,
    estimatedDays?: number
  ): Promise<void> {
    try {
      let notificationType: string;
      
      switch (newStatus) {
        case ORDER_STATUS.CONFIRMED:
          notificationType = NOTIFICATION_TYPE.ORDER_CONFIRMED;
          break;
        case ORDER_STATUS.SHIPPED:
          notificationType = NOTIFICATION_TYPE.ORDER_SHIPPED;
          break;
        case ORDER_STATUS.DELIVERED:
          notificationType = NOTIFICATION_TYPE.ORDER_DELIVERED;
          break;
        case ORDER_STATUS.CANCELLED:
          notificationType = NOTIFICATION_TYPE.ORDER_CANCELLED;
          break;
        default:
          return; // 不發送通知
      }

      // 發送通知給客戶
      await notificationService.sendOrderNotification(
        notificationType as any,
        order.id,
        order.orderNumber,
        [{
          id: order.customerId,
          type: 'customer',
          email: order.shippingAddress?.email || order.customerEmail || '',
          name: order.customerName,
        }],
        {
          orderId: order.id,
          estimatedDays,
        }
      );

    } catch (error) {
      console.error('發送狀態變更通知失敗:', error);
    }
  }

  /**
   * 發送付款狀態通知
   */
  private async sendPaymentStatusNotification(
    order: Order,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      if (newStatus === PAYMENT_STATUS.PAID) {
        // 發送付款確認通知
        await notificationService.sendOrderNotification(
          NOTIFICATION_TYPE.PAYMENT_RECEIVED as any,
          order.id,
          order.orderNumber,
          [{
            id: order.customerId,
            type: 'customer',
            email: order.shippingAddress?.email || order.customerEmail || '',
            name: order.customerName,
          }],
          {
            orderId: order.id,
            amount: order.totalAmount,
          }
        );
      }
    } catch (error) {
      console.error('發送付款狀態通知失敗:', error);
    }
  }

  /**
   * 執行自動化規則
   */
  private async executeAutomationRules(
    orderId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      // 這裡可以實作自定義的自動化規則
      // 例如：訂單確認後自動生成發票、出貨後自動發送物流追蹤等
      
      console.log(`執行訂單 ${orderId} 的自動化規則: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      console.error('執行自動化規則失敗:', error);
    }
  }
}

export const orderAutomationService = new OrderAutomationService();