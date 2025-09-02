import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/lib/utils/constants';
import { Cart, CartItem, CartSummary, AddToCartRequest, UpdateCartItemRequest } from '@/lib/types/cart';
import { productsService } from './products';
import { pricingEngine } from './pricing';

class CartService {
  private cartListeners = new Map<string, () => void>();

  /**
   * 取得用戶購物車
   */
  async getCart(userId: string): Promise<Cart | null> {
    try {
      const cartRef = doc(db, COLLECTIONS.CARTS, userId);
      const cartSnap = await getDoc(cartRef);
      
      if (!cartSnap.exists()) {
        return null;
      }

      const data = cartSnap.data();
      return {
        id: cartSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate()
      } as Cart;
    } catch (error) {
      console.error('取得購物車失敗:', error);
      throw error;
    }
  }

  /**
   * 建立新的購物車
   */
  private async createEmptyCart(userId: string): Promise<Cart> {
    const now = new Date();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const newCart = {
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      discountAmount: 0,
      subtotal: 0,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiryDate
    };

    const cartRef = doc(db, COLLECTIONS.CARTS, userId);
    await setDoc(cartRef, {
      ...newCart,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(newCart.expiresAt!)
    });

    return {
      id: userId,
      ...newCart,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiryDate)
    };
  }

  /**
   * 計算購物車總計
   */
  private calculateCartSummary(items: CartItem[]): CartSummary {
    let totalItems = 0;
    let subtotal = 0;
    let discountAmount = 0;

    for (const item of items) {
      totalItems += item.quantity;
      
      const itemPrice = item.calculatedPrice?.price || item.basePrice;
      const itemOriginalPrice = item.calculatedPrice?.originalPrice || item.basePrice;
      
      subtotal += itemOriginalPrice * item.quantity;
      discountAmount += (itemOriginalPrice - itemPrice) * item.quantity;
    }

    const totalAmount = subtotal - discountAmount;

    return {
      totalItems,
      subtotal,
      discountAmount,
      totalAmount,
      hasDiscount: discountAmount > 0
    };
  }

  /**
   * 更新購物車統計
   */
  private async updateCartSummary(userId: string, items: CartItem[]): Promise<void> {
    const summary = this.calculateCartSummary(items);
    
    const cartRef = doc(db, COLLECTIONS.CARTS, userId);
    await updateDoc(cartRef, {
      items,
      totalItems: summary.totalItems,
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      totalAmount: summary.totalAmount,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 加入商品到購物車
   */
  async addItem(userId: string, request: AddToCartRequest, customerId?: string): Promise<void> {
    try {
      // 取得商品資料
      const product = await productsService.getProductById(request.productId);
      if (!product) {
        throw new Error('商品不存在');
      }

      // 檢查庫存
      if (product.trackStock && product.stock < request.quantity) {
        throw new Error('庫存不足');
      }

      // 取得或建立購物車
      let cart = await this.getCart(userId);
      if (!cart) {
        cart = await this.createEmptyCart(userId);
      }

      // 計算商品價格
      let calculatedPrice;
      try {
        calculatedPrice = await pricingEngine.calculatePrice({
          productId: request.productId,
          customerId,
          quantity: request.quantity,
          basePrice: product.basePrice
        });
      } catch (error) {
        console.warn('價格計算失敗，使用基礎價格:', error);
      }

      // 檢查是否已存在相同商品
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === request.productId
      );

      const newItem: CartItem = {
        id: existingItemIndex >= 0 
          ? cart.items[existingItemIndex].id 
          : `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: request.productId,
        productName: product.name,
        productSku: product.sku,
        productImage: product.images[0]?.url,
        quantity: existingItemIndex >= 0 
          ? cart.items[existingItemIndex].quantity + request.quantity 
          : request.quantity,
        basePrice: product.basePrice,
        calculatedPrice,
        addedAt: existingItemIndex >= 0 ? cart.items[existingItemIndex].addedAt : new Date(),
        updatedAt: new Date()
      };

      // 再次檢查庫存（考慮既有數量）
      if (product.trackStock && product.stock < newItem.quantity) {
        throw new Error('庫存不足');
      }

      // 更新購物車項目
      const updatedItems = [...cart.items];
      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex] = newItem;
      } else {
        updatedItems.push(newItem);
      }

      // 更新購物車
      await this.updateCartSummary(userId, updatedItems);
      
    } catch (error) {
      console.error('加入購物車失敗:', error);
      throw error;
    }
  }

  /**
   * 移除購物車項目
   */
  async removeItem(userId: string, itemId: string): Promise<void> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('購物車不存在');
      }

      const updatedItems = cart.items.filter(item => item.id !== itemId);
      await this.updateCartSummary(userId, updatedItems);
      
    } catch (error) {
      console.error('移除購物車項目失敗:', error);
      throw error;
    }
  }

  /**
   * 更新購物車項目數量
   */
  async updateItemQuantity(
    userId: string, 
    request: UpdateCartItemRequest, 
    customerId?: string
  ): Promise<void> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('購物車不存在');
      }

      const itemIndex = cart.items.findIndex(item => item.id === request.itemId);
      if (itemIndex === -1) {
        throw new Error('購物車項目不存在');
      }

      if (request.quantity <= 0) {
        // 數量為0或負數時移除項目
        await this.removeItem(userId, request.itemId);
        return;
      }

      const item = cart.items[itemIndex];
      
      // 檢查庫存
      const product = await productsService.getProductById(item.productId);
      if (product?.trackStock && product.stock < request.quantity) {
        throw new Error('庫存不足');
      }

      // 重新計算價格
      let calculatedPrice;
      try {
        calculatedPrice = await pricingEngine.calculatePrice({
          productId: item.productId,
          customerId,
          quantity: request.quantity,
          basePrice: item.basePrice
        });
      } catch (error) {
        console.warn('價格計算失敗，使用既有價格:', error);
        calculatedPrice = item.calculatedPrice;
      }

      // 更新項目
      const updatedItems = [...cart.items];
      updatedItems[itemIndex] = {
        ...item,
        quantity: request.quantity,
        calculatedPrice,
        updatedAt: new Date()
      };

      await this.updateCartSummary(userId, updatedItems);
      
    } catch (error) {
      console.error('更新購物車項目數量失敗:', error);
      throw error;
    }
  }

  /**
   * 清空購物車
   */
  async clearCart(userId: string): Promise<void> {
    try {
      await this.updateCartSummary(userId, []);
    } catch (error) {
      console.error('清空購物車失敗:', error);
      throw error;
    }
  }

  /**
   * 取得購物車統計
   */
  async getCartSummary(userId: string): Promise<CartSummary | null> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        return null;
      }

      return this.calculateCartSummary(cart.items);
    } catch (error) {
      console.error('取得購物車統計失敗:', error);
      throw error;
    }
  }

  /**
   * 監聽購物車變化
   */
  subscribeToCart(userId: string, callback: (cart: Cart | null) => void): () => void {
    const cartRef = doc(db, COLLECTIONS.CARTS, userId);
    
    const unsubscribe = onSnapshot(
      cartRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cart: Cart = {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate()
          } as Cart;
          callback(cart);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('購物車監聽失敗:', error);
        callback(null);
      }
    );

    // 儲存監聽器以便清理
    this.cartListeners.set(userId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * 停止監聽購物車
   */
  unsubscribeFromCart(userId: string): void {
    const unsubscribe = this.cartListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.cartListeners.delete(userId);
    }
  }

  /**
   * 合併購物車 (用戶登入時)
   */
  async mergeCarts(fromUserId: string, toUserId: string): Promise<void> {
    try {
      const [fromCart, toCart] = await Promise.all([
        this.getCart(fromUserId),
        this.getCart(toUserId)
      ]);

      if (!fromCart || fromCart.items.length === 0) {
        return; // 沒有要合併的購物車
      }

      if (!toCart) {
        // 目標購物車不存在，直接轉移
        const batch = writeBatch(db);
        
        // 刪除舊購物車
        batch.delete(doc(db, COLLECTIONS.CARTS, fromUserId));
        
        // 建立新購物車
        batch.set(doc(db, COLLECTIONS.CARTS, toUserId), {
          ...fromCart,
          userId: toUserId,
          updatedAt: Timestamp.now()
        });
        
        await batch.commit();
        return;
      }

      // 合併購物車項目
      const mergedItems = [...toCart.items];
      
      for (const fromItem of fromCart.items) {
        const existingIndex = mergedItems.findIndex(
          item => item.productId === fromItem.productId
        );
        
        if (existingIndex >= 0) {
          // 商品已存在，增加數量
          mergedItems[existingIndex] = {
            ...mergedItems[existingIndex],
            quantity: mergedItems[existingIndex].quantity + fromItem.quantity,
            updatedAt: new Date()
          };
        } else {
          // 新商品，直接加入
          mergedItems.push({
            ...fromItem,
            updatedAt: new Date()
          });
        }
      }

      // 更新目標購物車並刪除來源購物車
      const batch = writeBatch(db);
      
      batch.delete(doc(db, COLLECTIONS.CARTS, fromUserId));
      
      const summary = this.calculateCartSummary(mergedItems);
      batch.update(doc(db, COLLECTIONS.CARTS, toUserId), {
        items: mergedItems,
        totalItems: summary.totalItems,
        subtotal: summary.subtotal,
        discountAmount: summary.discountAmount,
        totalAmount: summary.totalAmount,
        updatedAt: Timestamp.now()
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('合併購物車失敗:', error);
      throw error;
    }
  }
}

export const cartService = new CartService();