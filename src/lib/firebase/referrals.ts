import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  writeBatch,
  increment,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { BaseFirebaseService } from './base';
import { 
  ReferralCode, 
  ReferralTracking, 
  ReferralStats, 
  ReferralReport,
  CreateReferralCodeData,
  UpdateReferralCodeData
} from '@/lib/types/referral';
import { COLLECTIONS } from '@/lib/utils/constants';

/**
 * 推薦碼管理服務
 */
export class ReferralCodesService extends BaseFirebaseService<ReferralCode> {
  constructor() {
    super(COLLECTIONS.REFERRAL_CODES);
  }

  /**
   * 建立推薦碼
   */
  async createReferralCode(data: CreateReferralCodeData): Promise<string> {
    try {
      // 檢查推薦碼是否已存在
      const existingCode = await this.getReferralCodeByCode(data.code);
      if (existingCode) {
        throw new Error('推薦碼已存在');
      }

      const docRef = doc(collection(db, this.collectionName));
      const newReferralCode: ReferralCode = {
        ...data,
        id: docRef.id,
        isActive: true,
        totalClicks: 0,
        totalRegistrations: 0,
        totalOrders: 0,
        totalSales: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, this.prepareCreateData(newReferralCode));
      return docRef.id;
    } catch (error) {
      console.error('建立推薦碼時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據推薦碼取得資料
   */
  async getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('code', '==', code),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertTimestamps(doc.data()) as ReferralCode;
      }
      return null;
    } catch (error) {
      console.error('取得推薦碼時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據業務員ID取得推薦碼列表
   */
  async getReferralCodesBySalesperson(salespersonId: string): Promise<ReferralCode[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('salespersonId', '==', salespersonId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const referralCodes: ReferralCode[] = [];
      querySnapshot.docs.forEach(doc => {
        referralCodes.push(this.convertTimestamps(doc.data()) as ReferralCode);
      });

      return referralCodes;
    } catch (error) {
      console.error('取得業務員推薦碼列表時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新推薦碼
   */
  async updateReferralCode(id: string, data: UpdateReferralCodeData): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, this.prepareUpdateData(data));
    } catch (error) {
      console.error('更新推薦碼時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除推薦碼
   */
  async deleteReferralCode(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除推薦碼時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 啟用/停用推薦碼
   */
  async toggleReferralCodeStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateReferralCode(id, { isActive });
    } catch (error) {
      console.error('切換推薦碼狀態時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 記錄推薦碼點擊
   */
  async recordClick(referralCode: string, sessionId: string, clickData: any): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 更新推薦碼統計
      const referralCodeDoc = await this.getReferralCodeByCode(referralCode);
      if (referralCodeDoc) {
        const codeRef = doc(db, this.collectionName, referralCodeDoc.id);
        batch.update(codeRef, {
          totalClicks: increment(1),
          lastUsedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 記錄追蹤事件
      const trackingRef = doc(collection(db, COLLECTIONS.REFERRAL_TRACKING));
      const trackingData: Omit<ReferralTracking, 'id' | 'createdAt' | 'updatedAt'> = {
        referralCode,
        salespersonId: referralCodeDoc?.salespersonId || '',
        sessionId,
        eventType: 'click',
        eventData: { clickData }
      };

      batch.set(trackingRef, this.prepareCreateData(trackingData));
      
      await batch.commit();
    } catch (error) {
      console.error('記錄推薦碼點擊時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 記錄客戶註冊
   */
  async recordRegistration(
    referralCode: string, 
    customerId: string, 
    customerEmail: string, 
    customerName: string,
    sessionId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 更新推薦碼統計
      const referralCodeDoc = await this.getReferralCodeByCode(referralCode);
      if (referralCodeDoc) {
        const codeRef = doc(db, this.collectionName, referralCodeDoc.id);
        batch.update(codeRef, {
          totalRegistrations: increment(1),
          lastUsedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 記錄追蹤事件
      const trackingRef = doc(collection(db, COLLECTIONS.REFERRAL_TRACKING));
      const trackingData: Omit<ReferralTracking, 'id' | 'createdAt' | 'updatedAt'> = {
        referralCode,
        salespersonId: referralCodeDoc?.salespersonId || '',
        customerId,
        sessionId,
        eventType: 'registration',
        eventData: {
          registrationData: {
            customerId,
            customerEmail,
            customerName
          }
        }
      };

      batch.set(trackingRef, this.prepareCreateData(trackingData));
      
      await batch.commit();
    } catch (error) {
      console.error('記錄推薦碼註冊時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 記錄訂單
   */
  async recordOrder(
    referralCode: string,
    orderId: string,
    orderAmount: number,
    orderItems: number,
    customerId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 更新推薦碼統計
      const referralCodeDoc = await this.getReferralCodeByCode(referralCode);
      if (referralCodeDoc) {
        const codeRef = doc(db, this.collectionName, referralCodeDoc.id);
        batch.update(codeRef, {
          totalOrders: increment(1),
          totalSales: increment(orderAmount),
          lastUsedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 記錄追蹤事件
      const trackingRef = doc(collection(db, COLLECTIONS.REFERRAL_TRACKING));
      const trackingData: Omit<ReferralTracking, 'id' | 'createdAt' | 'updatedAt'> = {
        referralCode,
        salespersonId: referralCodeDoc?.salespersonId || '',
        customerId,
        sessionId: sessionId || `order_${orderId}`,
        eventType: 'order',
        eventData: {
          orderData: {
            orderId,
            orderAmount,
            orderItems
          }
        }
      };

      batch.set(trackingRef, this.prepareCreateData(trackingData));
      
      await batch.commit();
    } catch (error) {
      console.error('記錄推薦碼訂單時發生錯誤:', error);
      throw error;
    }
  }
}

/**
 * 推薦碼追蹤服務
 */
export class ReferralTrackingService extends BaseFirebaseService<ReferralTracking> {
  constructor() {
    super(COLLECTIONS.REFERRAL_TRACKING);
  }

  /**
   * 取得推薦碼的追蹤記錄
   */
  async getTrackingByReferralCode(
    referralCode: string,
    options: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<ReferralTracking[]> {
    try {
      let q = collection(db, this.collectionName);
      const constraints = [where('referralCode', '==', referralCode)];

      if (options.eventType) {
        constraints.push(where('eventType', '==', options.eventType));
      }

      if (options.startDate) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.startDate)));
      }

      if (options.endDate) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(options.endDate)));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      const queryConstraints = query(q, ...constraints);
      const querySnapshot = await getDocs(queryConstraints);

      const trackingRecords: ReferralTracking[] = [];
      querySnapshot.docs.forEach(doc => {
        trackingRecords.push(this.convertTimestamps(doc.data()) as ReferralTracking);
      });

      return trackingRecords;
    } catch (error) {
      console.error('取得推薦碼追蹤記錄時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得業務員的追蹤統計
   */
  async getSalespersonTrackingStats(
    salespersonId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<ReferralStats[]> {
    try {
      // 計算日期範圍
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      // 這裡應該實現複雜的統計查詢
      // 暫時返回空陣列，實際應用中需要進行聚合查詢
      return [];
    } catch (error) {
      console.error('取得業務員追蹤統計時發生錯誤:', error);
      throw error;
    }
  }
}

// 建立並匯出服務實例
export const referralCodesService = new ReferralCodesService();
export const referralTrackingService = new ReferralTrackingService();