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
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { PricingGroup, ProductPrice, TieredPricing } from '@/lib/types/product';
import { BaseFirebaseService } from './base';

// 價格群組服務
class PricingGroupsService extends BaseFirebaseService<PricingGroup> {
  constructor() {
    super(COLLECTIONS.PRICING_GROUPS);
  }

  /**
   * 取得所有價格群組
   */
  async getPricingGroups(): Promise<PricingGroup[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as PricingGroup[];
  }

  /**
   * 取得啟用的價格群組
   */
  async getActivePricingGroups(): Promise<PricingGroup[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as PricingGroup[];
  }

  /**
   * 建立價格群組
   */
  async createPricingGroup(groupData: Omit<PricingGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newGroupData = this.prepareCreateData(groupData);
    const docRef = await addDoc(collection(db, this.collectionName), newGroupData);
    return docRef.id;
  }

  /**
   * 更新價格群組
   */
  async updatePricingGroup(groupId: string, updateData: Partial<PricingGroup>): Promise<void> {
    const groupRef = doc(db, this.collectionName, groupId);
    const updateDataWithTimestamp = this.prepareUpdateData(updateData);
    await updateDoc(groupRef, updateDataWithTimestamp);
  }

  /**
   * 刪除價格群組
   */
  async deletePricingGroup(groupId: string): Promise<void> {
    // 檢查是否有客戶或商品使用此價格群組
    // 這裡簡化處理，實際應該檢查相關集合
    const groupRef = doc(db, this.collectionName, groupId);
    await deleteDoc(groupRef);
  }

  /**
   * 添加客戶到價格群組
   */
  async addCustomerToGroup(groupId: string, customerId: string): Promise<void> {
    const groupRef = doc(db, this.collectionName, groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('價格群組不存在');
    }

    const groupData = groupDoc.data() as PricingGroup;
const updatedCustomerIds = Array.from(new Set([...groupData.customerIds, customerId]));

    await updateDoc(groupRef, {
      customerIds: updatedCustomerIds,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 從價格群組移除客戶
   */
  async removeCustomerFromGroup(groupId: string, customerId: string): Promise<void> {
    const groupRef = doc(db, this.collectionName, groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('價格群組不存在');
    }

    const groupData = groupDoc.data() as PricingGroup;
    const updatedCustomerIds = groupData.customerIds.filter(id => id !== customerId);

    await updateDoc(groupRef, {
      customerIds: updatedCustomerIds,
      updatedAt: Timestamp.now()
    });
  }
}

// 商品價格服務
class ProductPricesService extends BaseFirebaseService<ProductPrice> {
  constructor() {
    super(COLLECTIONS.PRODUCT_PRICES);
  }

  /**
   * 取得商品的所有價格設定
   */
  async getProductPrices(productId: string): Promise<ProductPrice[]> {
    const q = query(
      collection(db, this.collectionName),
      where('productId', '==', productId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    })) as ProductPrice[];
  }

  /**
   * 取得客戶的商品價格
   */
  async getCustomerProductPrice(productId: string, customerId: string): Promise<ProductPrice | null> {
    const q = query(
      collection(db, this.collectionName),
      where('productId', '==', productId),
      where('customerId', '==', customerId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as ProductPrice;
  }

  /**
   * 取得價格群組的商品價格
   */
  async getGroupProductPrice(productId: string, pricingGroupId: string): Promise<ProductPrice | null> {
    const q = query(
      collection(db, this.collectionName),
      where('productId', '==', productId),
      where('pricingGroupId', '==', pricingGroupId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as ProductPrice;
  }

  /**
   * 建立商品價格
   */
  async createProductPrice(priceData: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newPriceData = this.prepareCreateData(priceData);
    const docRef = await addDoc(collection(db, this.collectionName), newPriceData);
    return docRef.id;
  }

  /**
   * 更新商品價格
   */
  async updateProductPrice(priceId: string, updateData: Partial<ProductPrice>): Promise<void> {
    const priceRef = doc(db, this.collectionName, priceId);
    const updateDataWithTimestamp = this.prepareUpdateData(updateData);
    await updateDoc(priceRef, updateDataWithTimestamp);
  }

  /**
   * 刪除商品價格
   */
  async deleteProductPrice(priceId: string): Promise<void> {
    const priceRef = doc(db, this.collectionName, priceId);
    await deleteDoc(priceRef);
  }

  /**
   * 批量建立商品價格
   */
  async createBulkProductPrices(pricesData: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    
    pricesData.forEach(priceData => {
      const docRef = doc(collection(db, this.collectionName));
      const newPriceData = this.prepareCreateData(priceData);
      batch.set(docRef, newPriceData);
    });
    
    await batch.commit();
  }
}

// 價格計算引擎
export class PricingEngine {
  private pricingGroupsService = new PricingGroupsService();
  private productPricesService = new ProductPricesService();

  /**
   * 計算商品價格
   */
  async calculatePrice(params: {
    productId: string;
    customerId?: string;
    quantity: number;
    basePrice: number;
  }): Promise<{
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
    tieredPricing?: TieredPricing;
  }> {
    const { productId, customerId, quantity, basePrice } = params;

    // 1. 檢查客戶專屬價格
    if (customerId) {
      const customerPrice = await this.productPricesService.getCustomerProductPrice(productId, customerId);
      if (customerPrice) {
        const result = this.calculateTieredPrice(customerPrice, quantity, basePrice);
        return {
          ...result,
          appliedRule: '客戶專屬價格'
        };
      }

      // 2. 檢查客戶所屬價格群組
      const pricingGroups = await this.pricingGroupsService.getActivePricingGroups();
      const customerGroup = pricingGroups.find(group => group.customerIds.includes(customerId));
      
      if (customerGroup) {
        const groupPrice = await this.productPricesService.getGroupProductPrice(productId, customerGroup.id);
        if (groupPrice) {
          const result = this.calculateTieredPrice(groupPrice, quantity, basePrice);
          return {
            ...result,
            appliedRule: `價格群組: ${customerGroup.name}`
          };
        }

        // 使用群組折扣
        const result = this.calculateGroupDiscount(customerGroup, basePrice);
        return {
          ...result,
          appliedRule: `群組折扣: ${customerGroup.name}`
        };
      }
    }

    // 3. 使用基礎價格
    return {
      price: basePrice,
      originalPrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0,
      appliedRule: '基礎價格'
    };
  }

  /**
   * 計算階層式定價
   */
  private calculateTieredPrice(
    productPrice: ProductPrice, 
    quantity: number, 
    basePrice: number
  ): {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    tieredPricing?: TieredPricing;
  } {
    // 如果沒有階層式定價，直接使用固定價格
    if (!productPrice.tieredPricing || productPrice.tieredPricing.length === 0) {
      const discountAmount = basePrice - productPrice.price;
      const discountPercentage = (discountAmount / basePrice) * 100;
      
      return {
        price: productPrice.price,
        originalPrice: basePrice,
        discountAmount: Math.max(0, discountAmount),
        discountPercentage: Math.max(0, discountPercentage)
      };
    }

    // 找到適用的階層
    const applicableTier = productPrice.tieredPricing
      .sort((a, b) => a.minQuantity - b.minQuantity)
      .find(tier => {
        const meetsMin = quantity >= tier.minQuantity;
        const meetsMax = !tier.maxQuantity || quantity <= tier.maxQuantity;
        return meetsMin && meetsMax;
      });

    if (!applicableTier) {
      // 沒有匹配的階層，使用基礎價格
      return {
        price: basePrice,
        originalPrice: basePrice,
        discountAmount: 0,
        discountPercentage: 0
      };
    }

    const finalPrice = applicableTier.price;
    const discountAmount = basePrice - finalPrice;
    const discountPercentage = applicableTier.discountPercentage || ((discountAmount / basePrice) * 100);

    return {
      price: finalPrice,
      originalPrice: basePrice,
      discountAmount: Math.max(0, discountAmount),
      discountPercentage: Math.max(0, discountPercentage),
      tieredPricing: applicableTier
    };
  }

  /**
   * 計算群組折扣
   */
  private calculateGroupDiscount(
    group: PricingGroup, 
    basePrice: number
  ): {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
  } {
    let finalPrice = basePrice;
    let discountAmount = 0;
    let discountPercentage = 0;

    switch (group.discountType) {
      case 'percentage':
        discountPercentage = group.discountValue;
        discountAmount = (basePrice * discountPercentage) / 100;
        finalPrice = basePrice - discountAmount;
        break;
      case 'fixed':
        discountAmount = group.discountValue;
        finalPrice = Math.max(0, basePrice - discountAmount);
        discountPercentage = (discountAmount / basePrice) * 100;
        break;
      case 'tiered':
        // 階層式折扣需要額外的邏輯，這裡簡化處理
        finalPrice = basePrice;
        break;
    }

    return {
      price: Math.round(finalPrice * 100) / 100, // 保留兩位小數
      originalPrice: basePrice,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercentage: Math.round(discountPercentage * 100) / 100
    };
  }

  /**
   * 批量計算商品價格
   */
  async calculateBulkPrices(items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
  }>, customerId?: string): Promise<Array<{
    productId: string;
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
  }>> {
    const results = await Promise.all(
      items.map(item => 
        this.calculatePrice({
          ...item,
          customerId
        })
      )
    );

    return results.map((result, index) => ({
      productId: items[index].productId,
      ...result
    }));
  }
}

export const pricingGroupsService = new PricingGroupsService();
export const productPricesService = new ProductPricesService();
export const pricingEngine = new PricingEngine();