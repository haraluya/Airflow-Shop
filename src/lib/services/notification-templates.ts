/**
 * 通知模板管理服務
 * 負責管理各種通知模板的創建、更新和渲染
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { 
  NotificationTemplate, 
  NotificationContent,
  NotificationType,
  NOTIFICATION_TYPE,
  NOTIFICATION_CHANNEL 
} from '@/lib/types/notification';

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example?: string;
  required?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  variables: TemplateVariable[];
}

class NotificationTemplateService {
  // 預設模板定義
  private readonly defaultTemplates: Record<string, NotificationTemplate> = {
    [NOTIFICATION_TYPE.ORDER_CREATED]: {
      id: 'order_created',
      name: '訂單建立通知',
      type: NOTIFICATION_TYPE.ORDER_CREATED,
      category: 'order',
      subject: '訂單建立成功 - #{orderNumber}',
      emailTemplate: `
        <h2>感謝您的訂購！</h2>
        <p>親愛的 {{customerName}}，</p>
        <p>您的訂單已成功建立，我們將盡快為您處理。</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>訂單資訊</h3>
          <p><strong>訂單編號：</strong>{{orderNumber}}</p>
          <p><strong>訂單金額：</strong>NT$ {{totalAmount}}</p>
          <p><strong>下單時間：</strong>{{orderDate}}</p>
        </div>
        
        <p>如有任何問題，請隨時聯繫我們的客服團隊。</p>
        <p>感謝您的信任與支持！</p>
      `,
      smsTemplate: '您的訂單 {{orderNumber}} 已建立成功，金額 NT$ {{totalAmount}}，感謝您的購買！',
      lineTemplate: '✅ 訂單建立成功\n訂單編號：{{orderNumber}}\n金額：NT$ {{totalAmount}}\n我們將盡快為您處理！',
      inAppTemplate: '您的訂單 {{orderNumber}} 已成功建立，總計 NT$ {{totalAmount}}',
      variables: ['customerName', 'orderNumber', 'totalAmount', 'orderDate'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    [NOTIFICATION_TYPE.ORDER_CONFIRMED]: {
      id: 'order_confirmed',
      name: '訂單確認通知',
      type: NOTIFICATION_TYPE.ORDER_CONFIRMED,
      category: 'order',
      subject: '訂單已確認 - #{orderNumber}',
      emailTemplate: `
        <h2>訂單已確認</h2>
        <p>親愛的 {{customerName}}，</p>
        <p>您的訂單已經確認，正在準備出貨。</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>訂單資訊</h3>
          <p><strong>訂單編號：</strong>{{orderNumber}}</p>
          <p><strong>確認時間：</strong>{{confirmedAt}}</p>
          <p><strong>預計出貨：</strong>1-2 個工作天</p>
        </div>
        
        <p>我們會在商品出貨時再次通知您。</p>
      `,
      smsTemplate: '訂單 {{orderNumber}} 已確認，正在準備出貨，預計 1-2 個工作天內寄出。',
      lineTemplate: '✅ 訂單已確認\n訂單編號：{{orderNumber}}\n狀態：準備出貨\n預計 1-2 個工作天內寄出',
      inAppTemplate: '您的訂單 {{orderNumber}} 已確認，正在準備出貨',
      variables: ['customerName', 'orderNumber', 'confirmedAt'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    [NOTIFICATION_TYPE.ORDER_SHIPPED]: {
      id: 'order_shipped',
      name: '訂單出貨通知',
      type: NOTIFICATION_TYPE.ORDER_SHIPPED,
      category: 'order',
      subject: '訂單已出貨 - #{orderNumber}',
      emailTemplate: `
        <h2>您的商品已出貨！</h2>
        <p>親愛的 {{customerName}}，</p>
        <p>好消息！您的訂單已經出貨了。</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>物流資訊</h3>
          <p><strong>訂單編號：</strong>{{orderNumber}}</p>
          <p><strong>出貨時間：</strong>{{shippedAt}}</p>
          {{#trackingNumber}}
          <p><strong>追蹤號碼：</strong>{{trackingNumber}}</p>
          {{/trackingNumber}}
          <p><strong>預計送達：</strong>{{estimatedDeliveryDate}}</p>
        </div>
        
        <p>您可以透過追蹤號碼查詢商品配送進度。</p>
      `,
      smsTemplate: '您的訂單 {{orderNumber}} 已出貨！{{#trackingNumber}}追蹤號碼：{{trackingNumber}}，{{/trackingNumber}}預計 {{estimatedDays}} 天內送達。',
      lineTemplate: '📦 訂單已出貨\n訂單編號：{{orderNumber}}\n{{#trackingNumber}}追蹤號碼：{{trackingNumber}}\n{{/trackingNumber}}預計送達：{{estimatedDeliveryDate}}',
      inAppTemplate: '您的訂單 {{orderNumber}} 已出貨，預計 {{estimatedDays}} 天內送達',
      variables: ['customerName', 'orderNumber', 'shippedAt', 'trackingNumber', 'estimatedDeliveryDate', 'estimatedDays'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    [NOTIFICATION_TYPE.ORDER_DELIVERED]: {
      id: 'order_delivered',
      name: '訂單送達通知',
      type: NOTIFICATION_TYPE.ORDER_DELIVERED,
      category: 'order',
      subject: '訂單已送達 - #{orderNumber}',
      emailTemplate: `
        <h2>商品已送達！</h2>
        <p>親愛的 {{customerName}}，</p>
        <p>您的訂單已經送達，感謝您的購買！</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>送達資訊</h3>
          <p><strong>訂單編號：</strong>{{orderNumber}}</p>
          <p><strong>送達時間：</strong>{{deliveredAt}}</p>
        </div>
        
        <p>希望您滿意我們的商品和服務。如有任何問題，請隨時聯繫我們。</p>
        <p>期待您的下次購買！</p>
      `,
      smsTemplate: '您的訂單 {{orderNumber}} 已送達，感謝您的購買！如有問題請聯繫客服。',
      lineTemplate: '✅ 訂單已送達\n訂單編號：{{orderNumber}}\n感謝您的購買！\n期待您的下次光臨 😊',
      inAppTemplate: '您的訂單 {{orderNumber}} 已送達，感謝您的購買！',
      variables: ['customerName', 'orderNumber', 'deliveredAt'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    [NOTIFICATION_TYPE.PAYMENT_RECEIVED]: {
      id: 'payment_received',
      name: '付款確認通知',
      type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
      category: 'payment',
      subject: '付款確認 - #{orderNumber}',
      emailTemplate: `
        <h2>付款確認成功</h2>
        <p>親愛的 {{customerName}}，</p>
        <p>我們已收到您的付款，訂單將進入處理流程。</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>付款資訊</h3>
          <p><strong>訂單編號：</strong>{{orderNumber}}</p>
          <p><strong>付款金額：</strong>NT$ {{amount}}</p>
          <p><strong>付款時間：</strong>{{paidAt}}</p>
          {{#transactionId}}
          <p><strong>交易編號：</strong>{{transactionId}}</p>
          {{/transactionId}}
        </div>
        
        <p>感謝您的付款，我們會盡快處理您的訂單。</p>
      `,
      smsTemplate: '付款確認：訂單 {{orderNumber}} 付款 NT$ {{amount}} 已收到，訂單進入處理流程。',
      lineTemplate: '💳 付款確認\n訂單編號：{{orderNumber}}\n付款金額：NT$ {{amount}}\n感謝您的付款！',
      inAppTemplate: '您的付款已確認，訂單 {{orderNumber}} 進入處理流程',
      variables: ['customerName', 'orderNumber', 'amount', 'paidAt', 'transactionId'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  /**
   * 初始化預設模板
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      for (const template of Object.values(this.defaultTemplates)) {
        const existingTemplate = await this.getTemplateByType(template.type);
        if (!existingTemplate) {
          await this.createTemplate(template);
          console.log(`已建立預設模板: ${template.name}`);
        }
      }
    } catch (error) {
      console.error('初始化預設模板失敗:', error);
    }
  }

  /**
   * 建立新模板
   */
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const template: Omit<NotificationTemplate, 'id'> = {
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES), template);
      return docRef.id;
    } catch (error) {
      console.error('建立模板失敗:', error);
      throw error;
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<void> {
    try {
      const templateRef = doc(db, COLLECTIONS.NOTIFICATION_TEMPLATES, templateId);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('更新模板失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, COLLECTIONS.NOTIFICATION_TEMPLATES, templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('刪除模板失敗:', error);
      throw error;
    }
  }

  /**
   * 依 ID 取得模板
   */
  async getTemplateById(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const templateRef = doc(db, COLLECTIONS.NOTIFICATION_TEMPLATES, templateId);
      const templateSnap = await getDoc(templateRef);
      
      if (!templateSnap.exists()) {
        return null;
      }

      return {
        id: templateSnap.id,
        ...templateSnap.data(),
        createdAt: templateSnap.data().createdAt?.toDate(),
        updatedAt: templateSnap.data().updatedAt?.toDate(),
      } as NotificationTemplate;
    } catch (error) {
      console.error('取得模板失敗:', error);
      return null;
    }
  }

  /**
   * 依類型取得模板
   */
  async getTemplateByType(type: NotificationType): Promise<NotificationTemplate | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES),
        where('type', '==', type),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as NotificationTemplate;
    } catch (error) {
      console.error('取得模板失敗:', error);
      return null;
    }
  }

  /**
   * 取得所有模板
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES),
        orderBy('category'),
        orderBy('name')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as NotificationTemplate[];
    } catch (error) {
      console.error('取得模板列表失敗:', error);
      return [];
    }
  }

  /**
   * 依分類取得模板
   */
  async getTemplatesByCategory(category: string): Promise<NotificationTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('name')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as NotificationTemplate[];
    } catch (error) {
      console.error('取得分類模板失敗:', error);
      return [];
    }
  }

  /**
   * 渲染模板內容
   */
  renderTemplate(
    template: NotificationTemplate, 
    channel: string, 
    variables: Record<string, any>
  ): NotificationContent {
    let templateContent: string;
    
    // 依據通道選擇對應的模板
    switch (channel) {
      case NOTIFICATION_CHANNEL.EMAIL:
        templateContent = template.emailTemplate || template.inAppTemplate || '';
        break;
      case NOTIFICATION_CHANNEL.SMS:
        templateContent = template.smsTemplate || template.inAppTemplate || '';
        break;
      case NOTIFICATION_CHANNEL.LINE:
        templateContent = template.lineTemplate || template.inAppTemplate || '';
        break;
      case NOTIFICATION_CHANNEL.IN_APP:
      default:
        templateContent = template.inAppTemplate || '';
        break;
    }

    // 替換變數
    const renderedContent = this.replaceVariables(templateContent, variables);
    const renderedSubject = template.subject ? this.replaceVariables(template.subject, variables) : '';

    return {
      title: renderedSubject,
      message: renderedContent,
      actionUrl: variables.actionUrl,
      actionText: variables.actionText,
    };
  }

  /**
   * 替換模板變數
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // 替換簡單變數 {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    // 處理條件區塊 {{#variable}}...{{/variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
      if (value) {
        result = result.replace(regex, '$1');
      } else {
        result = result.replace(regex, '');
      }
    });

    return result.trim();
  }

  /**
   * 取得模板變數定義
   */
  getTemplateVariables(): Record<string, TemplateVariable[]> {
    return {
      order: [
        { key: 'customerName', label: '客戶姓名', description: '訂單客戶的姓名', required: true },
        { key: 'orderNumber', label: '訂單編號', description: '系統生成的訂單編號', example: 'ORD-20240301-001', required: true },
        { key: 'totalAmount', label: '訂單金額', description: '訂單總金額', example: '1,250', required: true },
        { key: 'orderDate', label: '下單時間', description: '訂單建立時間', example: '2024-03-01 14:30', required: true },
        { key: 'confirmedAt', label: '確認時間', description: '訂單確認時間', example: '2024-03-01 15:00' },
        { key: 'shippedAt', label: '出貨時間', description: '商品出貨時間', example: '2024-03-02 10:00' },
        { key: 'deliveredAt', label: '送達時間', description: '商品送達時間', example: '2024-03-03 16:30' },
        { key: 'trackingNumber', label: '追蹤號碼', description: '物流追蹤號碼', example: 'TW123456789' },
        { key: 'estimatedDeliveryDate', label: '預計送達日期', description: '預計商品送達日期', example: '2024-03-05' },
        { key: 'estimatedDays', label: '預計天數', description: '預計送達天數', example: '3' },
      ],
      payment: [
        { key: 'amount', label: '付款金額', description: '實際付款金額', example: '1,250', required: true },
        { key: 'paidAt', label: '付款時間', description: '付款完成時間', example: '2024-03-01 16:00' },
        { key: 'transactionId', label: '交易編號', description: '付款系統的交易編號', example: 'TXN-ABC123' },
        { key: 'paymentMethod', label: '付款方式', description: '使用的付款方式', example: '信用卡' },
      ],
      customer: [
        { key: 'customerEmail', label: '客戶郵箱', description: '客戶的電子郵件地址', example: 'customer@example.com' },
        { key: 'customerPhone', label: '客戶電話', description: '客戶的聯絡電話', example: '0912-345-678' },
      ],
      system: [
        { key: 'companyName', label: '公司名稱', description: '店家的公司名稱', example: 'Airflow B2B Shop' },
        { key: 'supportEmail', label: '客服信箱', description: '客服聯絡信箱', example: 'support@airflow.com' },
        { key: 'supportPhone', label: '客服電話', description: '客服聯絡電話', example: '02-1234-5678' },
        { key: 'websiteUrl', label: '網站網址', description: '官方網站網址', example: 'https://airflow.com' },
      ],
    };
  }
}

export const notificationTemplateService = new NotificationTemplateService();