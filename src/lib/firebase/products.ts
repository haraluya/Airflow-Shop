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
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Product, Category, Brand, ProductFilters, ProductListOptions, ProductBulkAction } from '@/lib/types/product';
import { BaseFirebaseService } from './base';

export interface ProductsListResult {
  products: Product[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
  total: number;
}

class ProductsService extends BaseFirebaseService<Product> {
  constructor() {
    super(COLLECTIONS.PRODUCTS);
  }

  /**
   * 取得商品列表（含分頁與篩選）
   */
  async getProducts(options: ProductListOptions = {}): Promise<ProductsListResult> {
    const { 
      limit = 20, 
      page = 1, 
      sortBy = 'created-desc', 
      filters = {} 
    } = options;

    let q = collection(db, this.collectionName);
    
    // 應用篩選條件
    const queryConstraints: any[] = [];
    
    if (filters.categoryId) {
      queryConstraints.push(where('categoryId', '==', filters.categoryId));
    }
    
    if (filters.brandId) {
      queryConstraints.push(where('brandId', '==', filters.brandId));
    }
    
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }
    
    if (filters.isVisible !== undefined) {
      queryConstraints.push(where('isVisible', '==', filters.isVisible));
    }
    
    if (filters.isFeatured !== undefined) {
      queryConstraints.push(where('isFeatured', '==', filters.isFeatured));
    }
    
    if (filters.inStock) {
      queryConstraints.push(where('stock', '>', 0));
    }

    // 排序
    let orderByConstraint;
    switch (sortBy) {
      case 'name':
        orderByConstraint = orderBy('name', 'asc');
        break;
      case 'price-asc':
        orderByConstraint = orderBy('basePrice', 'asc');
        break;
      case 'price-desc':
        orderByConstraint = orderBy('basePrice', 'desc');
        break;
      case 'created-asc':
        orderByConstraint = orderBy('createdAt', 'asc');
        break;
      case 'updated-desc':
        orderByConstraint = orderBy('updatedAt', 'desc');
        break;
      case 'popularity':
        orderByConstraint = orderBy('orderCount', 'desc');
        break;
      case 'rating':
        orderByConstraint = orderBy('averageRating', 'desc');
        break;
      default:
        orderByConstraint = orderBy('createdAt', 'desc');
    }
    
    queryConstraints.push(orderByConstraint);
    queryConstraints.push(firestoreLimit(limit));
    
    const querySnapshot = await getDocs(query(q, ...queryConstraints));
    
    let products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Product[];

    // 客戶端搜尋（簡單實作，生產環境建議使用 Algolia 或 Elasticsearch）
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // 價格篩選
    if (filters.priceMin !== undefined) {
      products = products.filter(product => product.basePrice >= filters.priceMin!);
    }
    
    if (filters.priceMax !== undefined) {
      products = products.filter(product => product.basePrice <= filters.priceMax!);
    }

    // 標籤篩選
    if (filters.tags && filters.tags.length > 0) {
      products = products.filter(product => 
        filters.tags!.some(tag => product.tags.includes(tag))
      );
    }

    return {
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === limit,
      total: products.length // 簡化版，實際應該查詢總數
    };
  }

  /**
   * 取得單一商品
   */
  async getProductById(productId: string): Promise<Product | null> {
    const productDoc = await getDoc(doc(db, this.collectionName, productId));
    
    if (!productDoc.exists()) {
      return null;
    }

    // 增加檢視次數
    await updateDoc(productDoc.ref, {
      viewCount: increment(1)
    });

    return {
      id: productDoc.id,
      ...this.convertTimestamps(productDoc.data())
    } as Product;
  }

  /**
   * 透過SKU取得商品
   */
  async getProductBySku(sku: string): Promise<Product | null> {
    const q = query(
      collection(db, this.collectionName),
      where('sku', '==', sku),
      firestoreLimit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as Product;
  }

  /**
   * 建立商品
   */
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'orderCount' | 'reviewCount' | 'averageRating'>): Promise<string> {
    // 檢查SKU是否重複
    const existingProduct = await this.getProductBySku(productData.sku);
    if (existingProduct) {
      throw new Error('SKU已存在，請使用不同的SKU');
    }

    const newProductData = {
      ...this.prepareCreateData(productData),
      viewCount: 0,
      orderCount: 0,
      reviewCount: 0,
      averageRating: 0,
    };

    const docRef = await addDoc(collection(db, this.collectionName), newProductData);
    return docRef.id;
  }

  /**
   * 更新商品
   */
  async updateProduct(productId: string, updateData: Partial<Product>): Promise<void> {
    const productRef = doc(db, this.collectionName, productId);
    
    // 如果更新SKU，檢查是否重複
    if (updateData.sku) {
      const existingProduct = await this.getProductBySku(updateData.sku);
      if (existingProduct && existingProduct.id !== productId) {
        throw new Error('SKU已存在，請使用不同的SKU');
      }
    }

    const updateDataWithTimestamp = this.prepareUpdateData(updateData);
    await updateDoc(productRef, updateDataWithTimestamp);
  }

  /**
   * 刪除商品
   */
  async deleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, this.collectionName, productId);
    await deleteDoc(productRef);
  }

  /**
   * 批量操作商品
   */
  async bulkAction(action: ProductBulkAction): Promise<void> {
    const batch = writeBatch(db);
    
    for (const productId of action.productIds) {
      const productRef = doc(db, this.collectionName, productId);
      
      switch (action.action) {
        case 'delete':
          batch.delete(productRef);
          break;
        case 'activate':
          batch.update(productRef, { 
            status: 'active', 
            updatedAt: Timestamp.now() 
          });
          break;
        case 'deactivate':
          batch.update(productRef, { 
            status: 'inactive', 
            updatedAt: Timestamp.now() 
          });
          break;
        case 'update-category':
          if (action.data?.categoryId) {
            batch.update(productRef, { 
              categoryId: action.data.categoryId,
              categoryName: action.data.categoryName,
              updatedAt: Timestamp.now() 
            });
          }
          break;
        case 'update-brand':
          if (action.data?.brandId) {
            batch.update(productRef, { 
              brandId: action.data.brandId,
              brandName: action.data.brandName,
              updatedAt: Timestamp.now() 
            });
          }
          break;
      }
    }
    
    await batch.commit();
  }

  /**
   * 更新商品庫存
   */
  async updateStock(productId: string, quantity: number): Promise<void> {
    const productRef = doc(db, this.collectionName, productId);
    await updateDoc(productRef, {
      stock: increment(quantity),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 取得低庫存商品
   */
  async getLowStockProducts(): Promise<Product[]> {
    // 這是簡化版實作，理想情況應該使用複合查詢
    const q = query(
      collection(db, this.collectionName),
      where('trackStock', '==', true),
      orderBy('stock', 'asc'),
      firestoreLimit(50)
    );
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Product[];

    // 過濾出真正低庫存的商品
    return products.filter(product => product.stock <= product.lowStockThreshold);
  }

  /**
   * 取得熱門商品
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isFeatured', '==', true),
      where('isVisible', '==', true),
      where('status', '==', 'active'),
      orderBy('orderCount', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Product[];
  }

  /**
   * 取得商品統計
   */
  async getProductStats() {
    // 簡化版實作，實際應該使用聚合查詢或定期更新的統計數據
    const [allQuery, activeQuery, lowStockQuery] = await Promise.all([
      getDocs(collection(db, this.collectionName)),
      getDocs(query(collection(db, this.collectionName), where('status', '==', 'active'))),
      this.getLowStockProducts()
    ]);

    return {
      total: allQuery.size,
      active: activeQuery.size,
      lowStock: lowStockQuery.length,
      draft: allQuery.size - activeQuery.size
    };
  }
}

export const productsService = new ProductsService();