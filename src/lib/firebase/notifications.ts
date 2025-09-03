import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { BaseFirebaseService } from './base';
import { COLLECTIONS } from '@/lib/utils/constants';
import {
  Notification,
  NotificationTemplate,
  NotificationSettings,
  NotificationType,
  SendNotificationRequest,
  BatchNotificationRequest,
  NotificationQueryParams,
  NotificationStats,
  NotificationResult,
  NotificationContent,
  NotificationRecipient,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  NOTIFICATION_CHANNEL
} from '@/lib/types/notification';

class NotificationService extends BaseFirebaseService<Notification> {
  private notificationListeners = new Map<string, () => void>();

  constructor() {
    super(COLLECTIONS.NOTIFICATIONS);
  }

  /**
   * 發送單一通知
   */
  async sendNotification(request: SendNotificationRequest): Promise<NotificationResult> {
    try {
      const batch = writeBatch(db);
      const notificationIds: string[] = [];

      for (const channel of request.channels) {
        for (const recipient of request.recipients) {
          // 檢查用戶通知設定
          const isEnabled = await this.isNotificationEnabled(recipient, request.type, channel);
          if (!isEnabled) {
            console.log(`用戶 ${recipient.id} 已關閉 ${channel} 通知`);
            continue;
          }

          const notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
            type: request.type,
            channel,
            status: NOTIFICATION_STATUS.PENDING,
            recipient,
            content: request.content,
            resourceType: request.resourceType as 'order' | 'product' | 'customer' | undefined,
            resourceId: request.resourceId,
            retryCount: 0,
            maxRetries: 3,
            priority: request.priority || 'normal',
            scheduledAt: request.scheduledAt
          };

          const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
          batch.set(notificationRef, this.prepareCreateData(notificationData));
          notificationIds.push(notificationRef.id);
        }
      }

      await batch.commit();

      // 執行實際發送
      for (const notificationId of notificationIds) {
        this.processNotification(notificationId);
      }

      return {
        success: true,
        message: '通知已加入發送佇列',
        notificationId: notificationIds[0]
      };

    } catch (error) {
      console.error('發送通知失敗:', error);
      return {
        success: false,
        message: '發送通知失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  /**
   * 批量發送通知
   */
  async sendBatchNotifications(request: BatchNotificationRequest): Promise<NotificationResult> {
    try {
      const results = await Promise.all(
        request.notifications.map(notification => 
          this.sendNotification(notification)
        )
      );

      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        return {
          success: false,
          message: `${failed.length} 個通知發送失敗`
        };
      }

      return {
        success: true,
        message: `成功發送 ${results.length} 個通知`
      };

    } catch (error) {
      console.error('批量發送通知失敗:', error);
      return {
        success: false,
        message: '批量發送通知失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  /**
   * 處理通知發送
   */
  private async processNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) return;
      
      const notification = {
        id: notificationDoc.id,
        ...this.convertTimestamps(notificationDoc.data()),
        sentAt: notificationDoc.data().sentAt?.toDate(),
        readAt: notificationDoc.data().readAt?.toDate(),
        scheduledAt: notificationDoc.data().scheduledAt?.toDate()
      } as Notification;

      // 檢查是否需要延遲發送
      if (notification.scheduledAt && notification.scheduledAt > new Date()) {
        // TODO: 實作延遲發送邏輯
        return;
      }

      let success = false;
      let failureReason = '';

      // 根據頻道發送通知
      switch (notification.channel) {
        case NOTIFICATION_CHANNEL.EMAIL:
          success = await this.sendEmailNotification(notification);
          break;
        case NOTIFICATION_CHANNEL.SMS:
          success = await this.sendSMSNotification(notification);
          break;
        case NOTIFICATION_CHANNEL.LINE:
          success = await this.sendLINENotification(notification);
          break;
        case NOTIFICATION_CHANNEL.IN_APP:
          success = await this.sendInAppNotification(notification);
          break;
        default:
          failureReason = '不支援的通知頻道';
      }

      // 更新通知狀態
      await this.updateNotificationStatus(notificationId, 
        success ? NOTIFICATION_STATUS.SENT : NOTIFICATION_STATUS.FAILED,
        failureReason
      );

    } catch (error) {
      console.error('處理通知失敗:', error);
      await this.updateNotificationStatus(notificationId, 
        NOTIFICATION_STATUS.FAILED, 
        error instanceof Error ? error.message : '處理失敗'
      );
    }
  }

  /**
   * 發送電子郵件通知
   */
  private async sendEmailNotification(notification: Notification): Promise<boolean> {
    try {
      // TODO: 整合電子郵件服務 (SendGrid, AWS SES, 等)
      console.log('發送電子郵件通知:', {
        to: notification.recipient.email,
        subject: notification.content.title,
        body: notification.content.message
      });
      
      // 模擬發送成功
      return true;
    } catch (error) {
      console.error('發送電子郵件失敗:', error);
      return false;
    }
  }

  /**
   * 發送簡訊通知
   */
  private async sendSMSNotification(notification: Notification): Promise<boolean> {
    try {
      // TODO: 整合簡訊服務 (Twilio, AWS SNS, 等)
      console.log('發送簡訊通知:', {
        to: notification.recipient.phone,
        message: notification.content.message
      });
      
      // 模擬發送成功
      return true;
    } catch (error) {
      console.error('發送簡訊失敗:', error);
      return false;
    }
  }

  /**
   * 發送 LINE 通知
   */
  private async sendLINENotification(notification: Notification): Promise<boolean> {
    try {
      // TODO: 整合 LINE Notify API
      console.log('發送 LINE 通知:', {
        to: notification.recipient.lineId,
        message: notification.content.message
      });
      
      // 模擬發送成功
      return true;
    } catch (error) {
      console.error('發送 LINE 通知失敗:', error);
      return false;
    }
  }

  /**
   * 發送應用內通知
   */
  private async sendInAppNotification(notification: Notification): Promise<boolean> {
    try {
      // 應用內通知直接寫入資料庫即可
      console.log('發送應用內通知:', notification.content.title);
      return true;
    } catch (error) {
      console.error('發送應用內通知失敗:', error);
      return false;
    }
  }

  /**
   * 更新通知狀態
   */
  private async updateNotificationStatus(
    notificationId: string, 
    status: string, 
    failureReason?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (status === NOTIFICATION_STATUS.SENT) {
      updateData.sentAt = Timestamp.now();
    } else if (status === NOTIFICATION_STATUS.FAILED) {
      updateData.failureReason = failureReason;
    }

    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), updateData);
  }

  /**
   * 檢查用戶是否啟用該類型和頻道的通知
   */
  private async isNotificationEnabled(
    recipient: NotificationRecipient,
    type: NotificationType,
    channel: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATION_SETTINGS),
        where('userId', '==', recipient.id),
        where('userType', '==', recipient.type)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return true; // 預設啟用
      }

      const settings = querySnapshot.docs[0].data() as NotificationSettings;

      // 檢查頻道是否啟用
      switch (channel) {
        case NOTIFICATION_CHANNEL.EMAIL:
          if (!settings.emailEnabled) return false;
          break;
        case NOTIFICATION_CHANNEL.SMS:
          if (!settings.smsEnabled) return false;
          break;
        case NOTIFICATION_CHANNEL.LINE:
          if (!settings.lineEnabled) return false;
          break;
        case NOTIFICATION_CHANNEL.IN_APP:
          if (!settings.inAppEnabled) return false;
          break;
      }

      // 檢查類型是否啟用
      if (type.startsWith('order_') && !settings.orderNotifications) return false;
      if (type.startsWith('payment_') && !settings.paymentNotifications) return false;
      if (type === 'low_stock' && !settings.stockNotifications) return false;
      if (type === 'system_alert' && !settings.systemNotifications) return false;

      return true;
    } catch (error) {
      console.error('檢查通知設定失敗:', error);
      return true; // 錯誤時預設啟用
    }
  }

  /**
   * 快速發送訂單通知
   */
  async sendOrderNotification(
    type: NotificationType,
    orderId: string,
    orderNumber: string,
    recipients: NotificationRecipient[],
    additionalData?: Record<string, any>
  ): Promise<NotificationResult> {
    
    return await this.sendNotification({
      type,
      channels: [NOTIFICATION_CHANNEL.EMAIL, NOTIFICATION_CHANNEL.IN_APP],
      recipients,
      content: await this.generateOrderNotificationContent(type, orderNumber, NOTIFICATION_CHANNEL.EMAIL, additionalData),
      resourceType: 'order',
      resourceId: orderId,
      priority: 'normal'
    });
  }

  /**
   * 生成訂單通知內容（使用模板系統）
   */
  private async generateOrderNotificationContent(
    type: NotificationType, 
    orderNumber: string, 
    channel: string,
    additionalData?: Record<string, any>
  ): Promise<NotificationContent> {
    try {
      // 嘗試從模板服務取得模板
      const { notificationTemplateService } = await import('@/lib/services/notification-templates');
      const template = await notificationTemplateService.getTemplateByType(type);
      
      if (template) {
        // 準備模板變數
        const variables = {
          orderNumber,
          ...additionalData,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看訂單',
        };
        
        return notificationTemplateService.renderTemplate(template, channel, variables);
      }
    } catch (error) {
      console.error('使用模板生成通知內容失敗，使用預設內容:', error);
    }

    // 預設內容（向後兼容）
    switch (type) {
      case NOTIFICATION_TYPE.ORDER_CREATED:
        return {
          title: '新訂單建立',
          message: `您的訂單 ${orderNumber} 已成功建立，我們會盡快為您處理。`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看訂單'
        };
      
      case NOTIFICATION_TYPE.ORDER_CONFIRMED:
        return {
          title: '訂單已確認',
          message: `您的訂單 ${orderNumber} 已確認，正在準備出貨。`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看訂單'
        };
      
      case NOTIFICATION_TYPE.ORDER_SHIPPED:
        return {
          title: '訂單已出貨',
          message: `您的訂單 ${orderNumber} 已出貨，預計 ${additionalData?.estimatedDays || 3} 天內送達。`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '追蹤物流'
        };
      
      case NOTIFICATION_TYPE.ORDER_DELIVERED:
        return {
          title: '訂單已送達',
          message: `您的訂單 ${orderNumber} 已送達，感謝您的購買！`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看訂單'
        };
      
      case NOTIFICATION_TYPE.ORDER_CANCELLED:
        return {
          title: '訂單已取消',
          message: `您的訂單 ${orderNumber} 已取消。如有疑問請聯繫客服。`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看詳情'
        };
      
      default:
        return {
          title: '訂單更新',
          message: `您的訂單 ${orderNumber} 狀態已更新。`,
          actionUrl: `/orders/${additionalData?.orderId}`,
          actionText: '查看訂單'
        };
    }
  }

  /**
   * 取得用戶通知列表
   */
  async getUserNotifications(
    userId: string,
    userType: 'customer' | 'admin' | 'salesperson',
    params: Partial<NotificationQueryParams> = {}
  ): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipient.id', '==', userId),
        where('recipient.type', '==', userType),
        orderBy('createdAt', 'desc'),
        limit(params.limit || 50)
      );

      if (params.status) {
        q = query(q, where('status', '==', params.status));
      }

      if (params.type) {
        q = query(q, where('type', '==', params.type));
      }

      if (params.channel) {
        q = query(q, where('channel', '==', params.channel));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
        sentAt: doc.data().sentAt?.toDate(),
        readAt: doc.data().readAt?.toDate(),
        scheduledAt: doc.data().scheduledAt?.toDate()
      })) as Notification[];

    } catch (error) {
      console.error('取得用戶通知失敗:', error);
      return [];
    }
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(notificationId: string): Promise<NotificationResult> {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        status: NOTIFICATION_STATUS.READ,
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        message: '通知已標記為已讀'
      };
    } catch (error) {
      console.error('標記通知已讀失敗:', error);
      return {
        success: false,
        message: '標記通知已讀失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  /**
   * 批量標記通知為已讀
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<NotificationResult> {
    try {
      const batch = writeBatch(db);

      notificationIds.forEach(id => {
        batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, id), {
          status: NOTIFICATION_STATUS.READ,
          readAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();

      return {
        success: true,
        message: `${notificationIds.length} 個通知已標記為已讀`
      };
    } catch (error) {
      console.error('批量標記通知已讀失敗:', error);
      return {
        success: false,
        message: '批量標記通知已讀失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }
}

export const notificationService = new NotificationService();