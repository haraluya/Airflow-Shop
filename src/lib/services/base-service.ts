import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentReference,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * 基礎 Firebase 服務類別
 * 提供通用的 CRUD 操作方法
 */
export abstract class BaseFirebaseService {
  protected abstract collectionName: string;

  /**
   * 取得集合參考
   */
  protected getCollection() {
    return collection(db, this.collectionName);
  }

  /**
   * 取得文件參考
   */
  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  /**
   * 轉換 Timestamp 為 Date
   */
  protected convertTimestampsToDate<T>(data: any): T {
    const converted = { ...data };
    
    // 轉換常見的時間戳記欄位
    const timestampFields = ['createdAt', 'updatedAt', 'orderDate', 'confirmedAt', 'shippedAt', 'deliveredAt'];
    
    timestampFields.forEach(field => {
      if (converted[field] && converted[field].toDate) {
        converted[field] = converted[field].toDate();
      }
    });

    // 處理巢狀物件中的時間戳記
    if (converted.delivery) {
      if (converted.delivery.estimatedDeliveryDate?.toDate) {
        converted.delivery.estimatedDeliveryDate = converted.delivery.estimatedDeliveryDate.toDate();
      }
      if (converted.delivery.actualDeliveryDate?.toDate) {
        converted.delivery.actualDeliveryDate = converted.delivery.actualDeliveryDate.toDate();
      }
    }

    if (converted.payment) {
      if (converted.payment.dueDate?.toDate) {
        converted.payment.dueDate = converted.payment.dueDate.toDate();
      }
      if (converted.payment.paidAt?.toDate) {
        converted.payment.paidAt = converted.payment.paidAt.toDate();
      }
    }

    return converted as T;
  }

  /**
   * 轉換 Date 為 Timestamp
   */
  protected convertDateToTimestamp<T>(data: any): T {
    const converted = { ...data };
    
    // 轉換常見的日期欄位
    const dateFields = ['createdAt', 'updatedAt', 'orderDate', 'confirmedAt', 'shippedAt', 'deliveredAt'];
    
    dateFields.forEach(field => {
      if (converted[field] instanceof Date) {
        converted[field] = Timestamp.fromDate(converted[field]);
      }
    });

    // 處理巢狀物件中的日期
    if (converted.delivery) {
      if (converted.delivery.estimatedDeliveryDate instanceof Date) {
        converted.delivery.estimatedDeliveryDate = Timestamp.fromDate(converted.delivery.estimatedDeliveryDate);
      }
      if (converted.delivery.actualDeliveryDate instanceof Date) {
        converted.delivery.actualDeliveryDate = Timestamp.fromDate(converted.delivery.actualDeliveryDate);
      }
    }

    if (converted.payment) {
      if (converted.payment.dueDate instanceof Date) {
        converted.payment.dueDate = Timestamp.fromDate(converted.payment.dueDate);
      }
      if (converted.payment.paidAt instanceof Date) {
        converted.payment.paidAt = Timestamp.fromDate(converted.payment.paidAt);
      }
    }

    return converted as T;
  }

  /**
   * 通用的錯誤處理
   */
  protected handleError(operation: string, error: any): void {
    console.error(`${this.collectionName} ${operation} 錯誤:`, error);
    
    // 可以在這裡添加錯誤報告邏輯
    // 例如發送到錯誤追蹤服務
  }

  /**
   * 驗證必要欄位
   */
  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`必要欄位 ${field} 不能為空`);
      }
    }
  }

  /**
   * 清理空值欄位
   */
  protected cleanEmptyFields<T>(data: any): T {
    const cleaned = { ...data };
    
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined || cleaned[key] === null || cleaned[key] === '') {
        delete cleaned[key];
      }
    });

    return cleaned as T;
  }
}