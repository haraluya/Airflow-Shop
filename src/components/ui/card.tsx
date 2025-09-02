import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-lg",
        outlined: "border-2",
        ghost: "border-transparent shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding }),
        hover && "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      {...props}
    />
  )
)
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
    className={cn("text-sm text-muted-foreground", className)}
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

// 專用商業元件
interface ProductCardProps {
  name: string;
  price?: number;
  image?: string;
  description?: string;
  category?: string;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
  isLoggedIn?: boolean;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ 
    name, 
    price, 
    image, 
    description, 
    category, 
    onAddToCart, 
    onViewDetails,
    isLoggedIn = false,
    ...props 
  }, ref) => (
    <Card ref={ref} hover className="overflow-hidden" {...props}>
      {image && (
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardContent className="p-4">
        {category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            {category}
          </p>
        )}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {isLoggedIn && price !== undefined ? (
            <span className="text-lg font-bold text-primary">
              NT$ {price.toLocaleString()}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {isLoggedIn ? '請洽業務' : '請先登入查看價格'}
            </span>
          )}
          <div className="flex gap-2">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="text-sm text-primary hover:underline"
              >
                查看詳情
              </button>
            )}
            {isLoggedIn && onAddToCart && (
              <button
                onClick={onAddToCart}
                className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
              >
                加入購物車
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
)
ProductCard.displayName = "ProductCard"

interface OrderCardProps {
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  itemCount: number;
  onViewDetails?: () => void;
}

const OrderCard = React.forwardRef<HTMLDivElement, OrderCardProps>(
  ({ orderNumber, date, status, total, itemCount, onViewDetails, ...props }, ref) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      pending: '待確認',
      confirmed: '已確認',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      cancelled: '已取消',
    };

    return (
      <Card ref={ref} hover {...props}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">#{orderNumber}</h3>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[status]
            )}>
              {statusLabels[status]}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {itemCount} 件商品
            </div>
            <div className="font-bold text-lg">
              NT$ {total.toLocaleString()}
            </div>
          </div>
          
          {onViewDetails && (
            <div className="mt-3 pt-3 border-t">
              <button
                onClick={onViewDetails}
                className="text-primary hover:underline text-sm"
              >
                查看詳情 →
              </button>
            </div>
          )}
        </CardContent>
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
  OrderCard,
  cardVariants
}