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
  DocumentSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Category } from '@/lib/types/product';
import { BaseFirebaseService } from './base';

class CategoriesService extends BaseFirebaseService<Category> {
  constructor() {
    super(COLLECTIONS.CATEGORIES);
  }

  /**
   * 取得所有分類（階層式結構）
   */
  async getCategories(): Promise<Category[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('order', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Category[];
  }

  /**
   * 取得啟用的分類
   */
  async getActiveCategories(): Promise<Category[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Category[];
  }

  /**
   * 取得根分類（無父分類）
   */
  async getRootCategories(): Promise<Category[]> {
    const q = query(
      collection(db, this.collectionName),
      where('parentId', '==', null),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Category[];
  }

  /**
   * 取得子分類
   */
  async getChildCategories(parentId: string): Promise<Category[]> {
    const q = query(
      collection(db, this.collectionName),
      where('parentId', '==', parentId),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Category[];
  }

  /**
   * 取得分類樹狀結構
   */
  async getCategoryTree(): Promise<(Category & { children: Category[] })[]> {
    const allCategories = await this.getCategories();
    
    // 建立分類映射
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    
    allCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });
    
    const rootCategories: (Category & { children: Category[] })[] = [];
    
    // 建構樹狀結構
    categoryMap.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  }

  /**
   * 透過slug取得分類
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const q = query(
      collection(db, this.collectionName),
      where('slug', '==', slug)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as Category;
  }

  /**
   * 建立分類
   */
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // 檢查slug是否重複
    const existingCategory = await this.getCategoryBySlug(categoryData.slug);
    if (existingCategory) {
      throw new Error('URL代號已存在，請使用不同的代號');
    }

    const newCategoryData = this.prepareCreateData(categoryData);
    const docRef = await addDoc(collection(db, this.collectionName), newCategoryData);
    return docRef.id;
  }

  /**
   * 更新分類
   */
  async updateCategory(categoryId: string, updateData: Partial<Category>): Promise<void> {
    const categoryRef = doc(db, this.collectionName, categoryId);
    
    // 如果更新slug，檢查是否重複
    if (updateData.slug) {
      const existingCategory = await this.getCategoryBySlug(updateData.slug);
      if (existingCategory && existingCategory.id !== categoryId) {
        throw new Error('URL代號已存在，請使用不同的代號');
      }
    }

    const updateDataWithTimestamp = this.prepareUpdateData(updateData);
    await updateDoc(categoryRef, updateDataWithTimestamp);
  }

  /**
   * 刪除分類
   */
  async deleteCategory(categoryId: string): Promise<void> {
    // 檢查是否有子分類
    const childCategories = await this.getChildCategories(categoryId);
    if (childCategories.length > 0) {
      throw new Error('無法刪除包含子分類的分類，請先刪除或移動子分類');
    }

    // 檢查是否有商品使用此分類
    // 這裡簡化處理，實際應該檢查商品集合
    const categoryRef = doc(db, this.collectionName, categoryId);
    await deleteDoc(categoryRef);
  }

  /**
   * 重新排序分類
   */
  async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    const batch = writeBatch(db);
    
    categoryOrders.forEach(({ id, order }) => {
      const categoryRef = doc(db, this.collectionName, id);
      batch.update(categoryRef, { 
        order,
        updatedAt: this.prepareUpdateData({}).updatedAt 
      });
    });
    
    await batch.commit();
  }

  /**
   * 取得分類路徑（面包屑）
   */
  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentCategoryId: string | null = categoryId;
    
    while (currentCategoryId) {
      const categoryDoc = await getDoc(doc(db, this.collectionName, currentCategoryId));
      
      if (!categoryDoc.exists()) {
        break;
      }
      
      const category = {
        id: categoryDoc.id,
        ...this.convertTimestamps(categoryDoc.data())
      } as Category;
      
      path.unshift(category);
      currentCategoryId = category.parentId || null;
    }
    
    return path;
  }
}

export const categoriesService = new CategoriesService();