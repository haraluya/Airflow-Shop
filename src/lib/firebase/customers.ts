import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  addDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS, USER_STATUS } from '@/lib/utils/constants';
import { CustomerProfile, Address } from '@/lib/types/auth';
import { BaseFirebaseService } from './base';

export interface CustomerFilters {
  status?: keyof typeof USER_STATUS;
  salespersonId?: string;
  search?: string;
  pricingGroupId?: string;
}

export interface CustomerListOptions {
  limit?: number;
  lastDoc?: DocumentSnapshot;
  filters?: CustomerFilters;
}

export interface CustomerUpdateData {
  status?: keyof typeof USER_STATUS;
  notes?: string;
  pricingGroupId?: string;
  salespersonId?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface CreateCustomerData {
  email: string;
  displayName?: string;
  contactPerson: string;
  phoneNumber: string;
  companyName?: string;
  taxId?: string;
  address: string; // 第一個地址
  source: string;
  salespersonId?: string;
  notes?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

class CustomersService extends BaseFirebaseService<CustomerProfile> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  /**
   * 創建新的客戶（管理員功能）
   */
  async createCustomer(customerData: CreateCustomerData): Promise<string> {
    try {
      const now = Timestamp.now();
      
      // 構建客戶資料
      const customerProfile: Omit<CustomerProfile, 'id'> = {
        uid: '', // 暫時為空，因為沒有 Firebase Auth 整合
        email: customerData.email,
        displayName: customerData.displayName || customerData.contactPerson,
        role: 'customer',
        status: USER_STATUS.ACTIVE, // 管理員創建的客戶直接啟用
        contactPerson: customerData.contactPerson,
        phoneNumber: customerData.phoneNumber,
        companyName: customerData.companyName,
        taxId: customerData.taxId,
        addresses: [{
          id: Math.random().toString(36).substr(2, 9),
          type: 'delivery',
          address: customerData.address,
          isDefault: true,
          createdAt: now.toDate()
        }],
        source: customerData.source,
        salespersonId: customerData.salespersonId,
        notes: customerData.notes,
        creditLimit: customerData.creditLimit || 0,
        paymentTerms: customerData.paymentTerms || '月結30天',
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        lastLoginAt: undefined
      };

      // 添加到 Firestore
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...customerProfile,
        createdAt: now,
        updatedAt: now
      });

      return docRef.id;
    } catch (error) {
      console.error('創建客戶失敗:', error);
      throw new Error('創建客戶失敗');
    }
  }

  /**
   * 取得待審核的客戶
   */
  async getPendingCustomers(options: CustomerListOptions = {}) {
    const { limit = 20, lastDoc, filters = {} } = options;
    
    let q = query(
      collection(db, this.collectionName),
      where('role', '==', 'customer'),
      where('status', '==', USER_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, firestoreLimit(limit));

    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as CustomerProfile[];

    return {
      customers,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limit
    };
  }

  /**
   * 取得客戶列表（含篩選）
   */
  async getCustomers(options: CustomerListOptions = {}) {
    const { limit = 20, lastDoc, filters = {} } = options;
    
    let q = query(
      collection(db, this.collectionName),
      where('role', '==', 'customer'),
      orderBy('createdAt', 'desc')
    );

    // 應用篩選條件
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.salespersonId) {
      q = query(q, where('salespersonId', '==', filters.salespersonId));
    }

    if (filters.pricingGroupId) {
      q = query(q, where('pricingGroupId', '==', filters.pricingGroupId));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, firestoreLimit(limit));

    const snapshot = await getDocs(q);
    let customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as CustomerProfile[];

    // 客戶端搜尋（簡單實作，大資料量時需要使用 Algolia 或 Elasticsearch）
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      customers = customers.filter(customer => 
        customer.displayName?.toLowerCase().includes(searchTerm) ||
        customer.companyName?.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.contactPerson.toLowerCase().includes(searchTerm)
      );
    }

    return {
      customers,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limit
    };
  }

  /**
   * 審核客戶（批准或拒絕）
   */
  async approveCustomer(customerId: string, approverNotes?: string): Promise<void> {
    const customerRef = doc(db, this.collectionName, customerId);
    
    await updateDoc(customerRef, {
      status: USER_STATUS.ACTIVE,
      notes: approverNotes || '',
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 拒絕客戶申請
   */
  async rejectCustomer(customerId: string, rejectionReason: string): Promise<void> {
    const customerRef = doc(db, this.collectionName, customerId);
    
    await updateDoc(customerRef, {
      status: USER_STATUS.SUSPENDED,
      notes: rejectionReason,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 更新客戶資料
   */
  async updateCustomer(customerId: string, updateData: CustomerUpdateData): Promise<void> {
    const customerRef = doc(db, this.collectionName, customerId);
    
    await updateDoc(customerRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 取得單一客戶詳情
   */
  async getCustomerById(customerId: string): Promise<CustomerProfile | null> {
    const customerRef = doc(db, this.collectionName, customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (!customerSnap.exists()) {
      return null;
    }

    return {
      id: customerSnap.id,
      ...this.convertTimestamps(customerSnap.data())
    } as CustomerProfile;
  }

  /**
   * 取得業務員的客戶
   */
  async getCustomersBySalesperson(salespersonId: string, options: Omit<CustomerListOptions, 'filters'> = {}) {
    return this.getCustomers({
      ...options,
      filters: { salespersonId }
    });
  }

  /**
   * 統計資料
   */
  async getCustomerStats() {
    const [totalQuery, pendingQuery, activeQuery] = await Promise.all([
      getDocs(query(collection(db, this.collectionName), where('role', '==', 'customer'))),
      getDocs(query(collection(db, this.collectionName), where('role', '==', 'customer'), where('status', '==', USER_STATUS.PENDING))),
      getDocs(query(collection(db, this.collectionName), where('role', '==', 'customer'), where('status', '==', USER_STATUS.ACTIVE)))
    ]);

    return {
      total: totalQuery.size,
      pending: pendingQuery.size,
      active: activeQuery.size,
      suspended: totalQuery.size - pendingQuery.size - activeQuery.size
    };
  }
}

export const customersService = new CustomersService();