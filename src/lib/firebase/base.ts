import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from '@/lib/types/common';

/**
 * Firebase Firestore 基礎服務類別
 * 提供通用的資料庫操作方法
 */
export abstract class BaseFirebaseService<T extends BaseDocument> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * 轉換 Firestore Timestamp 為 JavaScript Date
   */
  protected convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };
    
    // 轉換常見的時間戳記欄位
    const timestampFields = ['createdAt', 'updatedAt', 'lastLoginAt', 'approvedAt', 'rejectedAt'];
    
    timestampFields.forEach(field => {
      if (converted[field] && converted[field] instanceof Timestamp) {
        converted[field] = converted[field].toDate();
      }
    });

    return converted;
  }

  /**
   * 轉換 JavaScript Date 為 Firestore Timestamp
   */
  protected convertToTimestamp(data: any): any {
    if (!data) return data;

    const converted = { ...data };
    
    // 轉換 Date 物件為 Timestamp
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Date) {
        converted[key] = Timestamp.fromDate(converted[key]);
      }
    });

    return converted;
  }

  /**
   * 準備新文件的資料（新增 createdAt 和 updatedAt）
   */
  protected prepareCreateData(data: Partial<T>): any {
    const now = Timestamp.now();
    return {
      ...data,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 準備更新文件的資料（更新 updatedAt）
   */
  protected prepareUpdateData(data: Partial<T>): any {
    return {
      ...data,
      updatedAt: Timestamp.now()
    };
  }
}