// Card 組件範例 - 用於 B2B 電商介面
'use client';

import * as React from "react"
import { cn } from "../utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// 專用的產品卡片組件
interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
    unit: string;
    image?: string;
    category?: string;
    inStock: boolean;
    minOrderQuantity?: number;
  };
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ className, product, onAddToCart, onViewDetails, ...props }, ref) => (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <div className="aspect-square relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">無圖片</span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {product.category}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">缺貨中</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-500">{product.code}</div>
          <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <div className="text-lg font-semibold text-blue-600">
            NT$ {product.price.toLocaleString()} / {product.unit}
          </div>
          {product.minOrderQuantity && (
            <div className="text-xs text-gray-500">
              最小訂購量：{product.minOrderQuantity} {product.unit}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2">
        <button
          onClick={() => onViewDetails?.(product.id)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          查看詳情
        </button>
        <button
          onClick={() => onAddToCart?.(product.id)}
          disabled={!product.inStock}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {product.inStock ? '加入購物車' : '缺貨中'}
        </button>
      </CardFooter>
    </Card>
  )
)
ProductCard.displayName = "ProductCard"

// 專用的訂單卡片組件
interface OrderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    orderDate: string;
    itemCount: number;
  };
  onViewOrder?: (orderId: string) => void;
}

const OrderCard = React.forwardRef<HTMLDivElement, OrderCardProps>(
  ({ className, order, onViewOrder, ...props }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'processing': return 'bg-purple-100 text-purple-800';
        case 'shipped': return 'bg-green-100 text-green-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
              <CardDescription>{order.customerName}</CardDescription>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getStatusColor(order.status)
            )}>
              {order.status}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">訂單日期</div>
              <div className="font-medium">{order.orderDate}</div>
            </div>
            <div>
              <div className="text-gray-500">商品數量</div>
              <div className="font-medium">{order.itemCount} 項</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">訂單金額</div>
              <div className="text-lg font-semibold text-blue-600">
                NT$ {order.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <button
            onClick={() => onViewOrder?.(order.id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            查看訂單
          </button>
        </CardFooter>
      </Card>
    )
  }
)
OrderCard.displayName = "OrderCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  ProductCard,
  OrderCard
}