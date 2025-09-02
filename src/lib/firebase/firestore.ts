// Firestore 資料操作工具函數
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db } from './config';
import { BaseDocument, PaginatedResponse, SearchParams } from '@/lib/types/common';
import { COLLECTIONS } from '@/lib/utils/constants';

// 型別安全的文件操作類別
export class FirestoreService<T extends BaseDocument> {
  constructor(private collectionName: string) {}

  // 建立文件
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const docRef = doc(collection(db, this.collectionName));
      const docData = {
        ...data,
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as T;

      await setDoc(docRef, docData);
      return docData;
    } catch (error) {
      console.error(`❌ 建立文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 建立文件（指定 ID）
  async createWithId(id: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const docData = {
        ...data,
        id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as T;

      await setDoc(doc(db, this.collectionName, id), docData);
      return docData;
    } catch (error) {
      console.error(`❌ 建立文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 讀取單一文件
  async getById(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));
      if (docSnap.exists()) {
        return docSnap.data() as T;
      }
      return null;
    } catch (error) {
      console.error(`❌ 讀取文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 更新文件
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`❌ 更新文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 刪除文件
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error(`❌ 刪除文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 查詢多個文件
  async getMany(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
      console.error(`❌ 查詢文件失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 分頁查詢
  async getPaginated(
    page: number = 1,
    pageSize: number = 20,
    constraints: QueryConstraint[] = [],
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResponse<T>> {
    try {
      let q = query(
        collection(db, this.collectionName),
        ...constraints,
        limit(pageSize)
      );

      // 如果有最後一個文件，從該文件後開始查詢
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => doc.data() as T);

      // 計算總數（這需要一個額外的查詢，在生產環境中可能需要快取）
      const totalQuery = query(collection(db, this.collectionName), ...constraints.filter(c => 
        // 排除 limit 和 startAfter 約束
        !c.toString().includes('limit') && !c.toString().includes('startAfter')
      ));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      const totalPages = Math.ceil(total / pageSize);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        items,
        total,
        page,
        limit: pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
      };
    } catch (error) {
      console.error(`❌ 分頁查詢失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 搜尋（基於欄位）
  async search(searchParams: SearchParams): Promise<T[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // 添加篩選條件
      if (searchParams.filters) {
        Object.entries(searchParams.filters).forEach(([field, value]) => {
          if (value !== undefined && value !== null) {
            constraints.push(where(field, '==', value));
          }
        });
      }

      // 添加排序
      if (searchParams.sort) {
        const [field, direction = 'asc'] = searchParams.sort.split(':');
        constraints.push(orderBy(field, direction as 'asc' | 'desc'));
      }

      return this.getMany(constraints);
    } catch (error) {
      console.error(`❌ 搜尋失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }

  // 即時監聽
  onSnapshot(
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const q = query(collection(db, this.collectionName), ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as T);
      callback(data);
    });
  }

  // 批次操作
  async batchWrite(operations: {
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
  }[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      operations.forEach((op) => {
        const docRef = op.id 
          ? doc(db, this.collectionName, op.id)
          : doc(collection(db, this.collectionName));

        switch (op.type) {
          case 'create':
            if (op.data) {
              batch.set(docRef, {
                ...op.data,
                id: docRef.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            break;
          case 'update':
            if (op.data) {
              batch.update(docRef, {
                ...op.data,
                updatedAt: serverTimestamp(),
              });
            }
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(`❌ 批次操作失敗 (${this.collectionName}):`, error);
      throw error;
    }
  }
}

// 預建立的服務實例
export const usersService = new FirestoreService(COLLECTIONS.USERS);
export const customersService = new FirestoreService(COLLECTIONS.CUSTOMERS);
export const productsService = new FirestoreService(COLLECTIONS.PRODUCTS);
export const ordersService = new FirestoreService(COLLECTIONS.ORDERS);

// 實用工具函數
export async function documentExists(collectionName: string, docId: string): Promise<boolean> {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    return docSnap.exists();
  } catch (error) {
    console.error('❌ 檢查文件存在失敗:', error);
    return false;
  }
}

// 交易操作範例
export async function transferData<T>(
  fromCollection: string,
  toCollection: string,
  docId: string,
  transformData?: (data: T) => T
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const fromRef = doc(db, fromCollection, docId);
      const toRef = doc(db, toCollection, docId);

      const fromDoc = await transaction.get(fromRef);
      if (!fromDoc.exists()) {
        throw new Error('來源文件不存在');
      }

      let data = fromDoc.data() as T;
      if (transformData) {
        data = transformData(data);
      }

      transaction.set(toRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      transaction.delete(fromRef);
    });
  } catch (error) {
    console.error('❌ 資料轉移失敗:', error);
    throw error;
  }
}