'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/providers/auth-provider';
import { useCart } from '@/lib/hooks/use-cart';

const testProducts = [
  {
    id: 'test-product-1',
    name: '測試商品 A',
    price: 150,
    image: 'https://via.placeholder.com/200x200/007bff/fff?text=商品A'
  },
  {
    id: 'test-product-2', 
    name: '測試商品 B',
    price: 89,
    image: 'https://via.placeholder.com/200x200/28a745/fff?text=商品B'
  },
  {
    id: 'test-product-3',
    name: '測試商品 C', 
    price: 299,
    image: 'https://via.placeholder.com/200x200/dc3545/fff?text=商品C'
  }
];

export default function TestPage() {
  const { user } = useAuth();
  const { addItem, cart, itemCount, totalAmount, isLoading, error } = useCart();

  const handleAddToCart = async (productId: string) => {
    try {
      await addItem({ productId, quantity: 1 });
    } catch (error) {
      console.error('加入購物車失敗:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">購物車功能測試</h1>

          {/* 登入狀態 */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">帳戶狀態</h2>
            {user ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ 已登入</p>
                <p>用戶 ID: {user.uid}</p>
                <p>Email: {user.email}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ 未登入</p>
            )}
          </Card>

          {/* 購物車狀態 */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">購物車狀態</h2>
            {isLoading ? (
              <p>載入中...</p>
            ) : error ? (
              <p className="text-red-600">錯誤: {error}</p>
            ) : (
              <div className="space-y-2">
                <p>商品數量: <Badge>{itemCount}</Badge></p>
                <p>總金額: <Badge variant="secondary">${totalAmount.toFixed(2)}</Badge></p>
                <p>購物車項目:</p>
                {cart?.items.length ? (
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {cart.items.map(item => (
                      <li key={item.id}>
                        {item.productName} x {item.quantity} = ${((item.calculatedPrice?.price || item.basePrice) * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground ml-4">無商品</p>
                )}
              </div>
            )}
          </Card>

          {/* 測試商品 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">測試商品</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testProducts.map(product => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div 
                    className="w-full h-32 bg-gray-200 rounded mb-4 flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${product.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <p className="text-lg font-bold text-primary mb-4">${product.price}</p>
                  <Button 
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!user || isLoading}
                    className="w-full"
                  >
                    {!user ? '請先登入' : '加入購物車'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* 說明 */}
          <Card className="p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">測試說明</h2>
            <div className="space-y-2 text-sm">
              <p>• 請先登入測試帳戶：</p>
              <p className="ml-4">Email: <code>customer@test.com</code></p>
              <p className="ml-4">Password: <code>test123</code></p>
              <p>• 點擊「加入購物車」按鈕測試購物車功能</p>
              <p>• 檢查標頭的購物車圖示是否顯示正確數量</p>
              <p>• 前往 <code>/cart</code> 頁面查看完整購物車</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}