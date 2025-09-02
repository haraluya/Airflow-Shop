import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentReference,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BaseFirebaseService } from './base-service';
import { 
  Order, 
  OrderStatus, 
  PaymentStatus,
  OrderSearchParams,
  OrderStats,
  OrderActionResult,
  CartToOrderData,
  OrderItem,
  OrderPricing,
  OrderDelivery,
  OrderPayment,
  PaymentMethod,
  DeliveryMethod
} from '@/lib/types/order';
import { CartItem } from '@/lib/types/cart';
import { PricingService } from './pricing-service';

export class OrdersService extends BaseFirebaseService {
  protected collectionName = 'orders';
  private pricingService: PricingService;

  constructor() {
    super();
    this.pricingService = new PricingService();
  }

  /**
   * 從購物車建立訂單
   */
  async createOrderFromCart(
    userId: string,
    userEmail: string,
    userName: string,
    cartToOrderData: CartToOrderData
  ): Promise<OrderActionResult> {
    try {
      // 生成訂單編號
      const orderNumber = this.generateOrderNumber();

      // 轉換購物車項目為訂單項目
      const orderItems = await this.convertCartItemsToOrderItems(cartToOrderData.items, userId);

      // 計算價格
      const pricing = this.calculateOrderPricing(orderItems, cartToOrderData.deliveryMethod);

      // 建立配送資訊
      const delivery: OrderDelivery = {
        method: cartToOrderData.deliveryMethod,
        address: cartToOrderData.deliveryAddress,
        contactPhone: cartToOrderData.contactPhone,
        notes: cartToOrderData.notes
      };

      // 建立付款資訊
      const payment: OrderPayment = {
        method: cartToOrderData.paymentMethod,
        status: PaymentStatus.PENDING,
        amount: pricing.totalAmount
      };

      // 建立訂單物件
      const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber,
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        status: OrderStatus.PENDING,
        items: orderItems,
        pricing,
        delivery,
        payment,
        notes: cartToOrderData.notes,
        orderDate: new Date(),
        source: 'website',
        version: 1
      };

      // 儲存到 Firestore
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...orderData,
        orderDate: Timestamp.fromDate(orderData.orderDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        message: '訂單建立成功',
        orderId: docRef.id,
        data: { orderNumber }
      };

    } catch (error) {
      console.error('建立訂單失敗:', error);
      return {
        success: false,
        message: '訂單建立失敗，請稍後再試'
      };
    }
  }

  /**
   * 取得訂單詳情
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, this.collectionName, orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        orderDate: data.orderDate?.toDate(),
        confirmedAt: data.confirmedAt?.toDate(),
        shippedAt: data.shippedAt?.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        delivery: {
          ...data.delivery,
          estimatedDeliveryDate: data.delivery.estimatedDeliveryDate?.toDate(),
          actualDeliveryDate: data.delivery.actualDeliveryDate?.toDate()
        },
        payment: {
          ...data.payment,
          dueDate: data.payment.dueDate?.toDate(),
          paidAt: data.payment.paidAt?.toDate()
        },
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Order;
    } catch (error) {
      console.error('取得訂單失敗:', error);
      return null;
    }
  }

  /**
   * 取得客戶訂單列表
   */
  async getCustomerOrders(
    customerId: string,
    searchParams: Partial<OrderSearchParams> = {}
  ): Promise<Order[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('customerId', '==', customerId),
        orderBy('orderDate', 'desc')
      ];

      // 狀態篩選
      if (searchParams.status && searchParams.status.length > 0) {
        constraints.push(where('status', 'in', searchParams.status));
      }

      // 分頁
      if (searchParams.pageSize) {
        constraints.push(limit(searchParams.pageSize));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate(),
        confirmedAt: doc.data().confirmedAt?.toDate(),
        shippedAt: doc.data().shippedAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        delivery: {
          ...doc.data().delivery,
          estimatedDeliveryDate: doc.data().delivery.estimatedDeliveryDate?.toDate(),
          actualDeliveryDate: doc.data().delivery.actualDeliveryDate?.toDate()
        },
        payment: {
          ...doc.data().payment,
          dueDate: doc.data().payment.dueDate?.toDate(),
          paidAt: doc.data().payment.paidAt?.toDate()
        },
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Order[];
    } catch (error) {
      console.error('取得客戶訂單失敗:', error);
      return [];
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
      const docRef = doc(db, this.collectionName, orderId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      // 根據狀態設置對應的時間戳記
      switch (status) {
        case OrderStatus.CONFIRMED:
          updateData.confirmedAt = Timestamp.now();
          break;
        case OrderStatus.SHIPPED:
          updateData.shippedAt = Timestamp.now();
          break;
        case OrderStatus.DELIVERED:
          updateData.deliveredAt = Timestamp.now();
          break;
      }

      if (notes) {
        updateData.internalNotes = notes;
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: '訂單狀態更新成功',
        orderId
      };
    } catch (error) {
      console.error('更新訂單狀態失敗:', error);
      return {
        success: false,
        message: '訂單狀態更新失敗'
      };
    }
  }

  /**
   * 取消訂單
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderActionResult> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        return {
          success: false,
          message: '訂單不存在'
        };
      }

      // 檢查是否可以取消
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        return {
          success: false,
          message: '此訂單狀態無法取消'
        };
      }

      await this.updateOrderStatus(orderId, OrderStatus.CANCELLED, reason);

      return {
        success: true,
        message: '訂單取消成功',
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

  /**
   * 產生訂單編號
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `AF${year}${month}${day}${timestamp}`;
  }

  /**
   * 轉換購物車項目為訂單項目
   */
  private async convertCartItemsToOrderItems(
    cartItems: CartItem[],
    userId: string
  ): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const cartItem of cartItems) {
      const orderItem: OrderItem = {
        id: cartItem.id,
        productId: cartItem.productId,
        productName: cartItem.productName,
        productSku: cartItem.productSku,
        quantity: cartItem.quantity,
        basePrice: cartItem.basePrice,
        unitPrice: cartItem.calculatedPrice?.price || cartItem.basePrice,
        totalPrice: (cartItem.calculatedPrice?.price || cartItem.basePrice) * cartItem.quantity,
        discountAmount: cartItem.calculatedPrice?.discountAmount || 0,
        imageUrl: cartItem.productImage,
        specifications: {} // TODO: 從商品資料中取得規格
      };

      orderItems.push(orderItem);
    }

    return orderItems;
  }

  /**
   * 計算訂單價格
   */
  private calculateOrderPricing(
    items: OrderItem[],
    deliveryMethod: DeliveryMethod
  ): OrderPricing {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // 計算運費
    let shippingFee = 0;
    switch (deliveryMethod) {
      case DeliveryMethod.STANDARD:
        shippingFee = subtotal >= 1000 ? 0 : 100; // 滿千免運
        break;
      case DeliveryMethod.EXPRESS:
        shippingFee = 200;
        break;
      case DeliveryMethod.SAME_DAY:
        shippingFee = 300;
        break;
      case DeliveryMethod.PICKUP:
        shippingFee = 0;
        break;
    }

    // 計算稅額（5%）
    const taxAmount = Math.round(subtotal * 0.05);
    
    const totalAmount = subtotal + shippingFee + taxAmount;

    return {
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount
    };
  }

  /**
   * 搜尋與篩選訂單（管理員用）
   */
  async searchOrders(searchParams: OrderSearchParams): Promise<Order[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // 狀態篩選
      if (searchParams.status && searchParams.status.length > 0) {
        constraints.push(where('status', 'in', searchParams.status));
      }

      // 付款狀態篩選
      if (searchParams.paymentStatus && searchParams.paymentStatus.length > 0) {
        constraints.push(where('payment.status', 'in', searchParams.paymentStatus));
      }

      // 客戶篩選
      if (searchParams.customerId) {
        constraints.push(where('customerId', '==', searchParams.customerId));
      }

      // 業務員篩選
      if (searchParams.salespersonId) {
        constraints.push(where('salespersonId', '==', searchParams.salespersonId));
      }

      // 排序
      const sortField = searchParams.sortBy || 'orderDate';
      const sortDirection = searchParams.sortOrder || 'desc';
      constraints.push(orderBy(sortField, sortDirection));

      // 分頁
      if (searchParams.pageSize) {
        constraints.push(limit(searchParams.pageSize));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate(),
        confirmedAt: doc.data().confirmedAt?.toDate(),
        shippedAt: doc.data().shippedAt?.toDate(),
        deliveredAt: doc.data().deliveredAt?.toDate(),
        delivery: {
          ...doc.data().delivery,
          estimatedDeliveryDate: doc.data().delivery.estimatedDeliveryDate?.toDate(),
          actualDeliveryDate: doc.data().delivery.actualDeliveryDate?.toDate()
        },
        payment: {
          ...doc.data().payment,
          dueDate: doc.data().payment.dueDate?.toDate(),
          paidAt: doc.data().payment.paidAt?.toDate()
        },
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Order[];
    } catch (error) {
      console.error('搜尋訂單失敗:', error);
      return [];
    }
  }
}