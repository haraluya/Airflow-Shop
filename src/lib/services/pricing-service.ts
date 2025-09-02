import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BaseFirebaseService } from './base-service';
import { Product } from '@/lib/types/product';
import { COLLECTIONS } from '@/lib/utils/constants';

export interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'fixed_price';
  value: number;
  minQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingGroup {
  id: string;
  name: string;
  description?: string;
  rules: PricingRule[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculatedPrice {
  originalPrice: number;
  price: number;
  discount: number;
  discountPercentage: number;
  pricingGroupId?: string;
  pricingGroupName?: string;
  appliedRules: PricingRule[];
}

/**
 * 價格引擎服務
 * 處理客戶專屬定價、群組定價等邏輯
 */
export class PricingService extends BaseFirebaseService {
  protected collectionName = 'pricingGroups';

  /**
   * 計算商品價格（針對特定客戶）
   */
  async calculatePrice(
    product: Product,
    customerId: string,
    quantity: number = 1
  ): Promise<CalculatedPrice> {
    try {
      // 取得客戶的價格群組
      const pricingGroup = await this.getCustomerPricingGroup(customerId);
      
      // 基礎價格
      const originalPrice = product.basePrice;
      let finalPrice = originalPrice;
      let totalDiscount = 0;
      const appliedRules: PricingRule[] = [];

      if (pricingGroup) {
        // 應用價格群組規則
        for (const rule of pricingGroup.rules) {
          if (!this.isRuleApplicable(rule, quantity)) {
            continue;
          }

          let ruleDiscount = 0;
          
          switch (rule.type) {
            case 'percentage':
              ruleDiscount = originalPrice * (rule.value / 100);
              break;
            case 'fixed_amount':
              ruleDiscount = rule.value;
              break;
            case 'fixed_price':
              finalPrice = rule.value;
              ruleDiscount = originalPrice - rule.value;
              break;
          }

          if (ruleDiscount > 0) {
            totalDiscount += ruleDiscount;
            appliedRules.push(rule);
          }
        }
      }

      // 確保價格不會低於零
      finalPrice = Math.max(originalPrice - totalDiscount, 0);

      return {
        originalPrice,
        price: finalPrice,
        discount: totalDiscount,
        discountPercentage: originalPrice > 0 ? (totalDiscount / originalPrice) * 100 : 0,
        pricingGroupId: pricingGroup?.id,
        pricingGroupName: pricingGroup?.name,
        appliedRules
      };

    } catch (error) {
      this.handleError('calculatePrice', error);
      
      // 發生錯誤時回傳原價
      return {
        originalPrice: product.basePrice,
        price: product.basePrice,
        discount: 0,
        discountPercentage: 0,
        appliedRules: []
      };
    }
  }

  /**
   * 批量計算商品價格
   */
  async calculatePrices(
    products: Product[],
    customerId: string,
    quantities?: Record<string, number>
  ): Promise<Record<string, CalculatedPrice>> {
    const results: Record<string, CalculatedPrice> = {};

    await Promise.all(
      products.map(async (product) => {
        const quantity = quantities?.[product.id] || 1;
        results[product.id] = await this.calculatePrice(product, customerId, quantity);
      })
    );

    return results;
  }

  /**
   * 取得客戶的價格群組
   */
  async getCustomerPricingGroup(customerId: string): Promise<PricingGroup | null> {
    try {
      // 先從客戶檔案中取得價格群組ID
      const customerDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
      
      if (!customerDoc.exists()) {
        return await this.getDefaultPricingGroup();
      }

      const customerData = customerDoc.data();
      const pricingGroupId = customerData.pricingGroupId;

      if (!pricingGroupId) {
        return await this.getDefaultPricingGroup();
      }

      // 取得價格群組資料
      const pricingGroupDoc = await getDoc(doc(db, this.collectionName, pricingGroupId));
      
      if (!pricingGroupDoc.exists()) {
        return await this.getDefaultPricingGroup();
      }

      const data = pricingGroupDoc.data();
      return this.convertTimestampsToDate({
        id: pricingGroupDoc.id,
        ...data
      });

    } catch (error) {
      this.handleError('getCustomerPricingGroup', error);
      return await this.getDefaultPricingGroup();
    }
  }

  /**
   * 取得預設價格群組
   */
  async getDefaultPricingGroup(): Promise<PricingGroup | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isDefault', '==', true),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return this.convertTimestampsToDate({
        id: doc.id,
        ...data
      });

    } catch (error) {
      this.handleError('getDefaultPricingGroup', error);
      return null;
    }
  }

  /**
   * 檢查規則是否適用
   */
  private isRuleApplicable(rule: PricingRule, quantity: number): boolean {
    // 檢查規則是否啟用
    if (!rule.isActive) {
      return false;
    }

    // 檢查最小數量
    if (rule.minQuantity && quantity < rule.minQuantity) {
      return false;
    }

    // 檢查有效期間
    const now = new Date();
    
    if (rule.validFrom && now < rule.validFrom) {
      return false;
    }

    if (rule.validTo && now > rule.validTo) {
      return false;
    }

    return true;
  }

  /**
   * 建立價格群組
   */
  async createPricingGroup(groupData: Omit<PricingGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await this.create({
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return docRef.id;
    } catch (error) {
      this.handleError('createPricingGroup', error);
      throw error;
    }
  }

  /**
   * 更新價格群組
   */
  async updatePricingGroup(
    groupId: string, 
    updates: Partial<Omit<PricingGroup, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      await this.update(groupId, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      this.handleError('updatePricingGroup', error);
      throw error;
    }
  }

  /**
   * 取得所有價格群組
   */
  async getAllPricingGroups(): Promise<PricingGroup[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      return querySnapshot.docs.map(doc => this.convertTimestampsToDate({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      this.handleError('getAllPricingGroups', error);
      return [];
    }
  }

  /**
   * 通用的建立方法
   */
  private async create(data: any) {
    const { addDoc, collection } = await import('firebase/firestore');
    return addDoc(collection(db, this.collectionName), this.convertDateToTimestamp(data));
  }

  /**
   * 通用的更新方法
   */
  private async update(id: string, data: any) {
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, this.collectionName, id), this.convertDateToTimestamp(data));
  }
}