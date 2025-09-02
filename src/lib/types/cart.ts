import { BaseDocument } from './common';
import { Product } from './product';

// 購物車項目
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string;
  quantity: number;
  basePrice: number;
  calculatedPrice?: {
    price: number;
    originalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    appliedRule?: string;
  };
  addedAt: Date | { toDate(): Date };
  updatedAt: Date | { toDate(): Date };
}

// 購物車
export interface Cart extends BaseDocument {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  discountAmount: number;
  subtotal: number;
  status: 'active' | 'abandoned' | 'converted';
  expiresAt?: Date | { toDate(): Date };
}

// 購物車操作
export interface CartActions {
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCart: () => Promise<Cart | null>;
}

// 購物車統計
export interface CartSummary {
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  hasDiscount: boolean;
}

// 加入購物車請求
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variantId?: string;
}

// 更新購物車項目請求
export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

// 購物車項目顯示資料 (含商品完整資料)
export interface CartItemWithProduct extends CartItem {
  product: Product;
}