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
} from 'firebase/firestore';
import { db } from './config';
import { BaseFirebaseService } from './base';
import { SalespersonProfile } from '@/lib/types/auth';
import { COLLECTIONS } from '@/lib/utils/constants';

/**
 * 業務員相關的 Firebase 服務
 */
export class SalespersonService extends BaseFirebaseService<SalespersonProfile> {
  constructor() {
    super(COLLECTIONS.SALESPERSONS);
  }

  /**
   * 建立業務員檔案
   */
  async createSalesperson(salespersonData: Omit<SalespersonProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, this.collectionName));
      const newSalesperson = {
        ...salespersonData,
        id: docRef.id,
      };

      await setDoc(docRef, this.prepareCreateData(newSalesperson));
      return docRef.id;
    } catch (error) {
      console.error('建立業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據 ID 取得業務員檔案
   */
  async getSalesperson(id: string): Promise<SalespersonProfile | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.convertTimestamps(docSnap.data()) as SalespersonProfile;
      }
      return null;
    } catch (error) {
      console.error('取得業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據 UID 取得業務員檔案
   */
  async getSalespersonByUid(uid: string): Promise<SalespersonProfile | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('uid', '==', uid),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertTimestamps(doc.data()) as SalespersonProfile;
      }
      return null;
    } catch (error) {
      console.error('根據 UID 取得業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據員工編號取得業務員檔案
   */
  async getSalespersonByEmployeeId(employeeId: string): Promise<SalespersonProfile | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('employeeId', '==', employeeId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertTimestamps(doc.data()) as SalespersonProfile;
      }
      return null;
    } catch (error) {
      console.error('根據員工編號取得業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新業務員檔案
   */
  async updateSalesperson(id: string, updates: Partial<SalespersonProfile>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, this.prepareUpdateData(updates));
    } catch (error) {
      console.error('更新業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除業務員檔案
   */
  async deleteSalesperson(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得業務員列表
   */
  async getSalespersons(options: {
    isActive?: boolean;
    territory?: string;
    managerId?: string;
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
    orderByField?: keyof SalespersonProfile;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{
    salespersons: SalespersonProfile[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      const {
        isActive,
        territory,
        managerId,
        pageSize = 20,
        lastDoc,
        orderByField = 'createdAt',
        orderDirection = 'desc',
      } = options;

      let q = collection(db, this.collectionName);
      const constraints = [];

      // 添加篩選條件
      if (typeof isActive === 'boolean') {
        constraints.push(where('isActive', '==', isActive));
      }
      if (territory) {
        constraints.push(where('territory', 'array-contains', territory));
      }
      if (managerId) {
        constraints.push(where('managerId', '==', managerId));
      }

      // 添加排序
      constraints.push(orderBy(orderByField, orderDirection));

      // 添加分頁
      constraints.push(limit(pageSize + 1));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const queryConstraints = query(q, ...constraints);
      const querySnapshot = await getDocs(queryConstraints);

      const salespersons: SalespersonProfile[] = [];
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;

      // 如果有更多資料，移除最後一個文件
      const docsToProcess = hasMore ? docs.slice(0, -1) : docs;

      docsToProcess.forEach(doc => {
        salespersons.push(this.convertTimestamps(doc.data()) as SalespersonProfile);
      });

      return {
        salespersons,
        lastDoc: hasMore ? docs[docs.length - 2] : null,
        hasMore,
      };
    } catch (error) {
      console.error('取得業務員列表時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 搜尋業務員
   */
  async searchSalespersons(searchTerm: string, limitCount = 10): Promise<SalespersonProfile[]> {
    try {
      // 因為 Firestore 不支援全文搜索，這裡使用簡單的名稱搜索
      // 實際應用中可能需要使用 Algolia 或其他搜索服務
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('name'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const salespersons: SalespersonProfile[] = [];

      querySnapshot.docs.forEach(doc => {
        const data = this.convertTimestamps(doc.data()) as SalespersonProfile;
        // 簡單的客戶端過濾
        if (
          data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (data.email && data.email.toLowerCase().includes(searchTerm.toLowerCase()))
        ) {
          salespersons.push(data);
        }
      });

      return salespersons;
    } catch (error) {
      console.error('搜尋業務員時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得業務員統計資料
   */
  async getSalespersonStats(salespersonId: string): Promise<{
    totalCustomers: number;
    totalOrders: number;
    totalSales: number;
    thisMonthSales: number;
    activeCustomers: number;
  }> {
    try {
      // 這裡需要與其他服務整合來計算統計資料
      // 暫時返回模擬數據
      return {
        totalCustomers: 0,
        totalOrders: 0,
        totalSales: 0,
        thisMonthSales: 0,
        activeCustomers: 0,
      };
    } catch (error) {
      console.error('取得業務員統計資料時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 設定業務員狀態
   */
  async setSalespersonStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateSalesperson(id, { isActive });
    } catch (error) {
      console.error('設定業務員狀態時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新業務員最後登入時間
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新業務員最後登入時間時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 批次更新業務員資料
   */
  async batchUpdateSalespersons(updates: Array<{
    id: string;
    data: Partial<SalespersonProfile>;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, this.collectionName, id);
        batch.update(docRef, this.prepareUpdateData(data));
      });

      await batch.commit();
    } catch (error) {
      console.error('批次更新業務員資料時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據子網域取得業務員檔案
   */
  async getSalespersonBySubdomain(subdomain: string): Promise<SalespersonProfile | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('subdomain', '==', subdomain.toLowerCase()),
        where('subdomainEnabled', '==', true),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.convertTimestamps(doc.data()) as SalespersonProfile;
      }
      return null;
    } catch (error) {
      console.error('根據子網域取得業務員檔案時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 檢查子網域是否可用
   */
  async isSubdomainAvailable(subdomain: string, excludeId?: string): Promise<boolean> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('subdomain', '==', subdomain.toLowerCase())
      );

      const querySnapshot = await getDocs(q);
      
      // 如果是更新現有業務員，排除自己
      if (excludeId && !querySnapshot.empty) {
        const docs = querySnapshot.docs.filter(doc => doc.id !== excludeId);
        return docs.length === 0;
      }
      
      return querySnapshot.empty;
    } catch (error) {
      console.error('檢查子網域可用性時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 設定業務員子網域
   */
  async setSubdomain(id: string, subdomain: string, enabled = true): Promise<void> {
    try {
      // 先檢查子網域是否可用
      const isAvailable = await this.isSubdomainAvailable(subdomain, id);
      if (!isAvailable) {
        throw new Error(`子網域 "${subdomain}" 已被使用`);
      }

      await this.updateSalesperson(id, { 
        subdomain: subdomain.toLowerCase(),
        subdomainEnabled: enabled 
      });
    } catch (error) {
      console.error('設定業務員子網域時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 取得所有已使用的子網域
   */
  async getAllSubdomains(): Promise<string[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('subdomain', '!=', null)
      );
      const querySnapshot = await getDocs(q);
      
      const subdomains: string[] = [];
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.subdomain) {
          subdomains.push(data.subdomain);
        }
      });
      
      return subdomains;
    } catch (error) {
      console.error('取得所有子網域時發生錯誤:', error);
      throw error;
    }
  }
}

// 建立並匯出服務實例
export const salespersonService = new SalespersonService();