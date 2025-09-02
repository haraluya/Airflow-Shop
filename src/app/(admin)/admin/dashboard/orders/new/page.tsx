'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Search,
  User,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Plus,
  Minus,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import { Customer } from '@/lib/types/customer';
import { Product } from '@/lib/types/product';
import { Address } from '@/lib/types/common';
import { PaymentMethod, DeliveryMethod, CartToOrderData } from '@/lib/types/order';
import { customersService } from '@/lib/firebase/customers';
import { productsService } from '@/lib/firebase/products';
import { ordersService } from '@/lib/firebase/orders';
import { pricingEngine } from '@/lib/firebase/pricing';
import Link from 'next/link';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function ProxyOrderPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  // 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'customer' | 'products' | 'details' | 'summary'>('customer');
  
  // 客戶搜尋
  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  
  // 商品搜尋
  const [productQuery, setProductQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  
  // 訂單詳情
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.STANDARD);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 搜尋客戶
  const searchCustomers = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsSearchingCustomers(true);
      const result = await customersService.searchCustomers({
        query,
        status: ['active'],
        pageSize: 10
      });
      setCustomers(result.customers);
    } catch (error) {
      console.error('搜尋客戶失敗:', error);
      setError('搜尋客戶失敗');
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // 搜尋商品
  const searchProducts = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsSearchingProducts(true);
      const result = await productsService.searchProducts({
        query,
        isActive: true,
        pageSize: 20
      });
      setProducts(result.products);
    } catch (error) {
      console.error('搜尋商品失敗:', error);
      setError('搜尋商品失敗');
    } finally {
      setIsSearchingProducts(false);
    }
  };

  // 加入商品到購物車
  const addToCart = async (product: Product) => {
    try {
      let unitPrice = product.basePrice;
      
      // 計算客戶專屬價格
      if (selectedCustomer) {
        try {
          const priceResult = await pricingEngine.calculatePrice({
            productId: product.id,
            customerId: selectedCustomer.id,
            quantity: 1,
            basePrice: product.basePrice
          });
          unitPrice = priceResult.price;
        } catch (error) {
          console.warn('價格計算失敗，使用基礎價格:', error);
        }
      }

      const existingItemIndex = cartItems.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // 更新既有商品數量
        updateCartItemQuantity(cartItems[existingItemIndex].id, cartItems[existingItemIndex].quantity + 1);
      } else {
        // 新增商品
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          product,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice
        };
        setCartItems([...cartItems, newItem]);
      }
    } catch (error) {
      console.error('加入購物車失敗:', error);
      setError('加入購物車失敗');
    }
  };

  // 更新購物車項目數量
  const updateCartItemQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    try {
      const updatedItems = cartItems.map(item => {
        if (item.id === itemId) {
          let unitPrice = item.product.basePrice;
          
          // 重新計算價格（考慮數量折扣）
          if (selectedCustomer) {
            // 這裡可以加入數量折扣邏輯
          }
          
          return {
            ...item,
            quantity: newQuantity,
            unitPrice,
            totalPrice: unitPrice * newQuantity
          };
        }
        return item;
      });
      
      setCartItems(updatedItems);
    } catch (error) {
      console.error('更新數量失敗:', error);
      setError('更新數量失敗');
    }
  };

  // 從購物車移除商品
  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  // 計算購物車總計
  const getCartSummary = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = 0; // 可以加入折扣邏輯
    const shippingFee = getShippingFee();
    const taxAmount = 0; // 可以加入稅額計算
    const totalAmount = subtotal - discountAmount + shippingFee + taxAmount;

    return {
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  // 計算運費
  const getShippingFee = () => {
    const summary = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    switch (deliveryMethod) {
      case DeliveryMethod.STANDARD:
        return summary >= 1000 ? 0 : 60;
      case DeliveryMethod.EXPRESS:
        return 120;
      case DeliveryMethod.PICKUP:
        return 0;
      case DeliveryMethod.SAME_DAY:
        return 200;
      default:
        return 60;
    }
  };

  // 提交訂單
  const handleSubmitOrder = async () => {
    if (!selectedCustomer || cartItems.length === 0) {
      setError('請選擇客戶並添加商品');
      return;
    }

    const addresses = selectedCustomer.addresses || [];
    if (addresses.length === 0) {
      setError('客戶沒有設定地址');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const selectedAddress = addresses[selectedAddressIndex];
      
      // 將購物車項目轉換為訂單格式
      const cartItems_converted = cartItems.map(item => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        productImage: item.product.images[0]?.url,
        quantity: item.quantity,
        basePrice: item.product.basePrice,
        calculatedPrice: {
          price: item.unitPrice,
          originalPrice: item.product.basePrice,
          discount: item.product.basePrice - item.unitPrice
        },
        addedAt: new Date(),
        updatedAt: new Date()
      }));

      const orderData: CartToOrderData = {
        items: cartItems_converted,
        deliveryAddress: selectedAddress,
        contactPhone: selectedCustomer.phoneNumber,
        paymentMethod,
        deliveryMethod,
        notes
      };

      const result = await ordersService.createOrderFromCart(
        user?.uid || '',
        orderData,
        selectedCustomer.id,
        profile?.id // 業務員/管理員 ID
      );

      if (result.success && result.orderId) {
        router.push(`/admin/dashboard/orders/${result.orderId}?success=true&proxy=true`);
      } else {
        setError(result.message || '建立訂單失敗');
      }
    } catch (error) {
      console.error('建立訂單失敗:', error);
      setError('系統錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  if (!user || !profile) {
    return <div>請先登入</div>;
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回訂單列表
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">代客下單</h1>
          <p className="text-muted-foreground">協助客戶建立新訂單</p>
        </div>
      </div>

      {/* 步驟指示器 */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center ${step === 'customer' ? 'text-primary' : step !== 'customer' && selectedCustomer ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'customer' ? 'bg-primary text-primary-foreground' : selectedCustomer ? 'bg-green-100 text-green-800' : 'bg-muted'}`}>
            {selectedCustomer ? <CheckCircle className="h-4 w-4" /> : '1'}
          </div>
          <span className="ml-2">選擇客戶</span>
        </div>
        
        <div className="w-12 h-px bg-border" />
        
        <div className={`flex items-center ${step === 'products' ? 'text-primary' : cartItems.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'products' ? 'bg-primary text-primary-foreground' : cartItems.length > 0 ? 'bg-green-100 text-green-800' : 'bg-muted'}`}>
            {cartItems.length > 0 ? <CheckCircle className="h-4 w-4" /> : '2'}
          </div>
          <span className="ml-2">選擇商品</span>
        </div>
        
        <div className="w-12 h-px bg-border" />
        
        <div className={`flex items-center ${step === 'details' ? 'text-primary' : step === 'summary' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'details' || step === 'summary' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="ml-2">訂單詳情</span>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 主要內容區域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 步驟一：選擇客戶 */}
          {step === 'customer' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5" />
                <h2 className="text-xl font-semibold">選擇客戶</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜尋客戶名稱、公司名稱或電子郵件..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomers(customerQuery)}
                    className="pl-10"
                  />
                  <Button
                    onClick={() => searchCustomers(customerQuery)}
                    disabled={isSearchingCustomers || !customerQuery.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    size="sm"
                  >
                    {isSearchingCustomers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '搜尋'
                    )}
                  </Button>
                </div>

                {customers.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setStep('products');
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{customer.companyName}</h3>
                            <p className="text-sm text-muted-foreground">{customer.contactPerson}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                          <Badge variant={customer.status === 'active' ? 'secondary' : 'destructive'}>
                            {customer.status === 'active' ? '活躍' : customer.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 步驟二：選擇商品 */}
          {step === 'products' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Package className="h-5 w-5" />
                <h2 className="text-xl font-semibold">選擇商品</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜尋商品名稱或 SKU..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProducts(productQuery)}
                    className="pl-10"
                  />
                  <Button
                    onClick={() => searchProducts(productQuery)}
                    disabled={isSearchingProducts || !productQuery.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    size="sm"
                  >
                    {isSearchingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '搜尋'
                    )}
                  </Button>
                </div>

                {products.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {product.images[0] && (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-medium text-primary">
                                {formatPrice(product.basePrice)}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => addToCart(product)}
                                disabled={!product.inStock}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                加入
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('customer')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button 
                    onClick={() => setStep('details')}
                    disabled={cartItems.length === 0}
                  >
                    下一步
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 步驟三：訂單詳情 */}
          {step === 'details' && selectedCustomer && (
            <div className="space-y-6">
              {/* 配送地址 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">配送地址</h3>
                </div>

                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.addresses.map((address: Address, index: number) => (
                      <div 
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressIndex === index 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedAddressIndex(index)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">預設</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          收件人：{address.recipient}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          電話：{address.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">此客戶尚未設定配送地址</p>
                )}
              </Card>

              {/* 配送與付款方式 */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">配送方式</h3>
                  </div>

                  <Select value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇配送方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DeliveryMethod.STANDARD}>標準配送 (3-5天)</SelectItem>
                      <SelectItem value={DeliveryMethod.EXPRESS}>快速配送 (1-2天)</SelectItem>
                      <SelectItem value={DeliveryMethod.PICKUP}>門市自取</SelectItem>
                      <SelectItem value={DeliveryMethod.SAME_DAY}>當日配送</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">付款方式</h3>
                  </div>

                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇付款方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.BANK_TRANSFER}>銀行轉帳</SelectItem>
                      <SelectItem value={PaymentMethod.CASH_ON_DELIVERY}>貨到付款</SelectItem>
                      <SelectItem value={PaymentMethod.CREDIT_CARD}>信用卡</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>
              </div>

              {/* 訂單備註 */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">訂單備註</h3>
                <Textarea
                  placeholder="如有特殊需求或備註事項，請在此說明..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('products')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>
                <Button 
                  onClick={() => setStep('summary')}
                  disabled={!selectedCustomer.addresses || selectedCustomer.addresses.length === 0}
                >
                  下一步：確認訂單
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* 步驟四：訂單摘要 */}
          {step === 'summary' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">訂單確認</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">客戶資訊</h3>
                  <p className="text-muted-foreground">
                    {selectedCustomer?.companyName} - {selectedCustomer?.contactPerson}
                  </p>
                  <p className="text-muted-foreground">{selectedCustomer?.email}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">配送資訊</h3>
                  {selectedCustomer?.addresses && selectedCustomer.addresses[selectedAddressIndex] && (
                    <div>
                      <p className="text-muted-foreground">
                        {selectedCustomer.addresses[selectedAddressIndex].recipient}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedCustomer.addresses[selectedAddressIndex].address}
                      </p>
                      <p className="text-muted-foreground">
                        配送方式：{deliveryMethod} / 付款方式：{paymentMethod}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('details')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button 
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        建立訂單中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        確認建立訂單
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 右側：購物車與摘要 */}
        <div className="space-y-6">
          {/* 選中的客戶 */}
          {selectedCustomer && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                <span className="font-medium">選中客戶</span>
              </div>
              <div>
                <p className="font-medium">{selectedCustomer.companyName}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.contactPerson}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              </div>
            </Card>
          )}

          {/* 購物車 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-medium">購物車 ({getCartSummary().itemCount})</span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">尚未選擇商品</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>商品小計</span>
                    <span>{formatPrice(getCartSummary().subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>運費</span>
                    <span>{getCartSummary().shippingFee === 0 ? '免費' : formatPrice(getCartSummary().shippingFee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>總計</span>
                    <span className="text-primary">{formatPrice(getCartSummary().totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}