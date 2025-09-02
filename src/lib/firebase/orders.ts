import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  Timestamp,
  writeBatch,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { BaseFirebaseService } from './base';
import { COLLECTIONS } from '@/lib/utils/constants';
import { 
  Order,
  OrderStatus,
  PaymentStatus,
  OrderSearchParams,
  OrderStats,
  OrderActionResult,
  CartToOrderData
} from '@/lib/types/order';
import { Cart } from '@/lib/types/cart';
import { cartService } from './cart';
import { customersService } from './customers';

class OrdersService extends BaseFirebaseService<Order> {
  private orderListeners = new Map<string, () => void>();

  constructor() {
    super(COLLECTIONS.ORDERS);
  }

  /**
   * 生成訂單編號
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `ORD${year}${month}${day}${timestamp}`;
  }

  /**
   * 從購物車建立訂單
   */
  async createOrderFromCart(
    userId: string,
    cartToOrderData: CartToOrderData,
    customerId?: string,
    salespersonId?: string
  ): Promise<OrderActionResult> {
    try {
      const cart = await cartService.getCart(userId);
      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          message: '購物車為空或不存在'
        };
      }

      // 生成訂單編號
      const orderNumber = this.generateOrderNumber();
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 計算價格
      const subtotal = cart.subtotal;
      const discountAmount = cart.discountAmount || 0;
      const shippingFee = this.calculateShippingFee(cartToOrderData.deliveryMethod, subtotal);
      const taxAmount = 0; // 暫時設為0，可根據需求調整
      const totalAmount = subtotal - discountAmount + shippingFee + taxAmount;

      // 轉換購物車項目為訂單項目
      const orderItems = cart.items.map(cartItem => ({
        id: cartItem.id,
        productId: cartItem.productId,
        productName: cartItem.productName,
        productSku: cartItem.productSku,
        quantity: cartItem.quantity,
        basePrice: cartItem.basePrice,
        unitPrice: cartItem.calculatedPrice?.price || cartItem.basePrice,
        totalPrice: (cartItem.calculatedPrice?.price || cartItem.basePrice) * cartItem.quantity,
        discountAmount: cartItem.calculatedPrice 
          ? (cartItem.calculatedPrice.originalPrice - cartItem.calculatedPrice.price) * cartItem.quantity 
          : 0,
        imageUrl: cartItem.productImage,
      }));

      // 取得客戶資料
      let customerName = '';
      let customerEmail = '';
      
      try {
        const customer = await customersService.getCustomerById(customerId || userId);
        if (customer) {
          customerName = customer.contactPerson || customer.companyName || '';
          customerEmail = customer.email || '';
        }
      } catch (error) {
        console.warn('無法取得客戶資料，使用預設值');
      }

      // 準備訂單資料
      const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber,
        customerId: customerId || userId,
        customerName,
        customerEmail,
        status: OrderStatus.PENDING,
        items: orderItems,
        pricing: {
          subtotal,
          discountAmount,
          shippingFee,
          taxAmount,
          totalAmount
        },
        delivery: {
          method: cartToOrderData.deliveryMethod,
          address: cartToOrderData.deliveryAddress,
          contactPhone: cartToOrderData.contactPhone,
          notes: cartToOrderData.notes
        },
        payment: {
          method: cartToOrderData.paymentMethod,
          status: PaymentStatus.PENDING,
          amount: totalAmount
        },
        salespersonId,
        notes: cartToOrderData.notes,
        orderDate: new Date(),
        source: salespersonId ? 'proxy_order' : 'website',
        version: 1
      };

      // 準備批次寫入
      const batch = writeBatch(db);
      
      // 建立訂單
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      batch.set(orderRef, this.prepareCreateData(orderData));

      // 清空購物車
      const cartRef = doc(db, COLLECTIONS.CARTS, userId);
      batch.update(cartRef, {
        items: [],
        totalItems: 0,
        subtotal: 0,
        discountAmount: 0,
        totalAmount: 0,
        updatedAt: Timestamp.now()
      });

      // 執行批次寫入
      await batch.commit();

      return {
        success: true,
        message: '訂單建立成功',
        orderId,
        data: { orderNumber, totalAmount }
      };

    } catch (error) {
      console.error('建立訂單失敗:', error);
      return {
        success: false,
        message: '建立訂單失敗，請稍後再試'
      };
    }
  }

  /**
   * 計算運費
   */
  private calculateShippingFee(deliveryMethod: string, subtotal: number): number {
    // 基礎運費計算邏輯，可根據需求調整
    switch (deliveryMethod) {
      case 'standard':
        return subtotal >= 1000 ? 0 : 60; // 滿1000免運
      case 'express':
        return 120;
      case 'pickup':
        return 0;
      case 'same_day':
        return 200;
      default:
        return 60;
    }
  }

  /**
   * 取得單一訂單
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...this.convertTimestamps(data),
        // 轉換訂單特有的時間戳記
        orderDate: data.orderDate?.toDate() || new Date(),
        confirmedAt: data.confirmedAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        delivery: {
          ...data.delivery,
          estimatedDeliveryDate: data.delivery?.estimatedDeliveryDate?.toDate(),
          actualDeliveryDate: data.delivery?.actualDeliveryDate?.toDate()
        },
        payment: {
          ...data.payment,
          dueDate: data.payment?.dueDate?.toDate(),
          paidAt: data.payment?.paidAt?.toDate()
        }
      } as Order;
    } catch (error) {
      console.error('取得訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 根據訂單編號取得訂單
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('orderNumber', '==', orderNumber),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...this.convertTimestamps(data),
        orderDate: data.orderDate?.toDate() || new Date(),
        confirmedAt: data.confirmedAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        delivery: {
          ...data.delivery,
          estimatedDeliveryDate: data.delivery?.estimatedDeliveryDate?.toDate(),
          actualDeliveryDate: data.delivery?.actualDeliveryDate?.toDate()
        },
        payment: {
          ...data.payment,
          dueDate: data.payment?.dueDate?.toDate(),
          paidAt: data.payment?.paidAt?.toDate()
        }
      } as Order;
    } catch (error) {
      console.error('根據訂單編號取得訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 取得客戶訂單列表
   */
  async getCustomerOrders(
    customerId: string,
    params: Partial<OrderSearchParams> = {}
  ): Promise<{ orders: Order[], hasMore: boolean }> {
    try {
      const pageSize = params.pageSize || 20;
      
      let q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('customerId', '==', customerId),
        orderBy('orderDate', 'desc'),
        limit(pageSize + 1) // 多取一筆判斷是否還有更多
      );

      // 狀態篩選
      if (params.status && params.status.length > 0) {
        q = query(q, where('status', 'in', params.status));
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;
      
      if (hasMore) {
        docs.pop(); // 移除多取的最後一筆
      }

      const orders = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...this.convertTimestamps(data),
          orderDate: data.orderDate?.toDate() || new Date(),
          confirmedAt: data.confirmedAt?.toDate(),
          shippedAt: data.shippedAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          delivery: {
            ...data.delivery,
            estimatedDeliveryDate: data.delivery?.estimatedDeliveryDate?.toDate(),
            actualDeliveryDate: data.delivery?.actualDeliveryDate?.toDate()
          },
          payment: {
            ...data.payment,
            dueDate: data.payment?.dueDate?.toDate(),
            paidAt: data.payment?.paidAt?.toDate()
          }
        } as Order;
      });

      return { orders, hasMore };
    } catch (error) {
      console.error('取得客戶訂單列表失敗:', error);
      throw error;
    }
  }

  /**
   * 搜尋訂單（管理員用）
   */
  async searchOrders(params: OrderSearchParams = {}): Promise<{ orders: Order[], hasMore: boolean }> {
    try {
      const pageSize = params.pageSize || 20;
      let q = query(collection(db, COLLECTIONS.ORDERS));

      // 基本排序
      const sortField = params.sortBy || 'orderDate';
      const sortDirection = params.sortOrder || 'desc';
      q = query(q, orderBy(sortField, sortDirection));

      // 狀態篩選
      if (params.status && params.status.length > 0) {
        q = query(q, where('status', 'in', params.status));
      }

      // 付款狀態篩選
      if (params.paymentStatus && params.paymentStatus.length > 0) {
        q = query(q, where('payment.status', 'in', params.paymentStatus));
      }

      // 特定客戶篩選
      if (params.customerId) {
        q = query(q, where('customerId', '==', params.customerId));
      }

      // 特定業務員篩選
      if (params.salespersonId) {
        q = query(q, where('salespersonId', '==', params.salespersonId));
      }

      // 日期範圍篩選
      if (params.dateRange) {
        q = query(
          q, 
          where('orderDate', '>=', Timestamp.fromDate(params.dateRange.startDate)),
          where('orderDate', '<=', Timestamp.fromDate(params.dateRange.endDate))
        );
      }

      // 金額範圍篩選
      if (params.minAmount !== undefined) {
        q = query(q, where('pricing.totalAmount', '>=', params.minAmount));
      }
      if (params.maxAmount !== undefined) {
        q = query(q, where('pricing.totalAmount', '<=', params.maxAmount));
      }

      q = query(q, limit(pageSize + 1));

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;
      
      if (hasMore) {
        docs.pop();
      }

      const orders = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...this.convertTimestamps(data),
          orderDate: data.orderDate?.toDate() || new Date(),
          confirmedAt: data.confirmedAt?.toDate(),
          shippedAt: data.shippedAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          delivery: {
            ...data.delivery,
            estimatedDeliveryDate: data.delivery?.estimatedDeliveryDate?.toDate(),
            actualDeliveryDate: data.delivery?.actualDeliveryDate?.toDate()
          },
          payment: {
            ...data.payment,
            dueDate: data.payment?.dueDate?.toDate(),
            paidAt: data.payment?.paidAt?.toDate()
          }
        } as Order;
      });

      // 如果有關鍵字搜尋，進行客戶端篩選
      if (params.query) {
        const filtered = orders.filter(order => 
          order.orderNumber.toLowerCase().includes(params.query!.toLowerCase()) ||
          order.customerName.toLowerCase().includes(params.query!.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(params.query!.toLowerCase())
        );
        return { orders: filtered, hasMore: false };
      }

      return { orders, hasMore };
    } catch (error) {
      console.error('搜尋訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 更新訂單狀態
   */
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus,
    notes?: string
  ): Promise<OrderActionResult> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      // 根據狀態設定相應的時間戳記
      const now = new Date();
      switch (status) {
        case OrderStatus.CONFIRMED:
          updateData.confirmedAt = Timestamp.fromDate(now);
          break;
        case OrderStatus.SHIPPED:
          updateData.shippedAt = Timestamp.fromDate(now);
          break;
        case OrderStatus.DELIVERED:
          updateData.deliveredAt = Timestamp.fromDate(now);
          break;
      }

      if (notes) {
        updateData.internalNotes = notes;
      }

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updateData);

      return {
        success: true,
        message: '訂單狀態更新成功',
        orderId
      };
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      return {
        success: false,
        message: '更新訂單狀態失敗'
      };
    }
  }

  /**
   * 更新付款狀態
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
    reference?: string
  ): Promise<OrderActionResult> {
    try {
      const updateData: any = {
        'payment.status': paymentStatus,
        updatedAt: Timestamp.now()
      };

      if (paymentStatus === PaymentStatus.PAID) {
        updateData['payment.paidAt'] = Timestamp.now();
      }

      if (transactionId) {
        updateData['payment.transactionId'] = transactionId;
      }

      if (reference) {
        updateData['payment.reference'] = reference;
      }

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updateData);

      return {
        success: true,
        message: '付款狀態更新成功',
        orderId
      };
    } catch (error) {
      console.error('更新付款狀態失敗:', error);
      return {
        success: false,
        message: '更新付款狀態失敗'
      };
    }
  }

  /**
   * 取得訂單統計
   */
  async getOrderStats(customerId?: string): Promise<OrderStats> {
    try {
      let q = query(collection(db, COLLECTIONS.ORDERS));
      
      if (customerId) {
        q = query(q, where('customerId', '==', customerId));
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => doc.data());

      const stats: OrderStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(order => order.status === OrderStatus.PENDING).length,
        confirmedOrders: orders.filter(order => order.status === OrderStatus.CONFIRMED).length,
        shippedOrders: orders.filter(order => order.status === OrderStatus.SHIPPED).length,
        deliveredOrders: orders.filter(order => order.status === OrderStatus.DELIVERED).length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0),
        averageOrderValue: 0
      };

      stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

      return stats;
    } catch (error) {
      console.error('取得訂單統計失敗:', error);
      throw error;
    }
  }

  /**
   * 監聽訂單變化
   */
  subscribeToOrder(orderId: string, callback: (order: Order | null) => void): () => void {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const order: Order = {
            id: snapshot.id,
            ...this.convertTimestamps(data),
            orderDate: data.orderDate?.toDate() || new Date(),
            confirmedAt: data.confirmedAt?.toDate(),
            shippedAt: data.shippedAt?.toDate(),
            deliveredAt: data.deliveredAt?.toDate(),
            delivery: {
              ...data.delivery,
              estimatedDeliveryDate: data.delivery?.estimatedDeliveryDate?.toDate(),
              actualDeliveryDate: data.delivery?.actualDeliveryDate?.toDate()
            },
            payment: {
              ...data.payment,
              dueDate: data.payment?.dueDate?.toDate(),
              paidAt: data.payment?.paidAt?.toDate()
            }
          } as Order;
          callback(order);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('訂單監聽失敗:', error);
        callback(null);
      }
    );

    this.orderListeners.set(orderId, unsubscribe);
    return unsubscribe;
  }

  /**
   * 停止監聽訂單
   */
  unsubscribeFromOrder(orderId: string): void {
    const unsubscribe = this.orderListeners.get(orderId);
    if (unsubscribe) {
      unsubscribe();
      this.orderListeners.delete(orderId);
    }
  }

  /**
   * 取消訂單
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderActionResult> {
    try {
      const updateData: any = {
        status: OrderStatus.CANCELLED,
        'payment.status': PaymentStatus.CANCELLED,
        internalNotes: reason ? `取消原因：${reason}` : '訂單已取消',
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updateData);

      return {
        success: true,
        message: '訂單已成功取消',
        orderId
      };
    } catch (error) {
      console.error('取消訂單失敗:', error);
      return {
        success: false,
        message: '取消訂單失敗'
      };
    }
  }
}

export const ordersService = new OrdersService();