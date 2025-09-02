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
import { db } from './config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Brand } from '@/lib/types/product';
import { BaseFirebaseService } from './base';

class BrandsService extends BaseFirebaseService<Brand> {
  constructor() {
    super(COLLECTIONS.BRANDS);
  }

  /**
   * 取得所有品牌
   */
  async getBrands(): Promise<Brand[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Brand[];
  }

  /**
   * 取得啟用的品牌
   */
  async getActiveBrands(): Promise<Brand[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as Brand[];
  }

  /**
   * 透過slug取得品牌
   */
  async getBrandBySlug(slug: string): Promise<Brand | null> {
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
    } as Brand;
  }

  /**
   * 建立品牌
   */
  async createBrand(brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // 檢查slug是否重複
    const existingBrand = await this.getBrandBySlug(brandData.slug);
    if (existingBrand) {
      throw new Error('URL代號已存在，請使用不同的代號');
    }

    const newBrandData = this.prepareCreateData(brandData);
    const docRef = await addDoc(collection(db, this.collectionName), newBrandData);
    return docRef.id;
  }

  /**
   * 更新品牌
   */
  async updateBrand(brandId: string, updateData: Partial<Brand>): Promise<void> {
    const brandRef = doc(db, this.collectionName, brandId);
    
    // 如果更新slug，檢查是否重複
    if (updateData.slug) {
      const existingBrand = await this.getBrandBySlug(updateData.slug);
      if (existingBrand && existingBrand.id !== brandId) {
        throw new Error('URL代號已存在，請使用不同的代號');
      }
    }

    const updateDataWithTimestamp = this.prepareUpdateData(updateData);
    await updateDoc(brandRef, updateDataWithTimestamp);
  }

  /**
   * 刪除品牌
   */
  async deleteBrand(brandId: string): Promise<void> {
    // 檢查是否有商品使用此品牌
    // 這裡簡化處理，實際應該檢查商品集合
    const brandRef = doc(db, this.collectionName, brandId);
    await deleteDoc(brandRef);
  }

  /**
   * 取得品牌統計
   */
  async getBrandStats() {
    const [allQuery, activeQuery] = await Promise.all([
      getDocs(collection(db, this.collectionName)),
      getDocs(query(collection(db, this.collectionName), where('isActive', '==', true)))
    ]);

    return {
      total: allQuery.size,
      active: activeQuery.size,
      inactive: allQuery.size - activeQuery.size
    };
  }
}

export const brandsService = new BrandsService();