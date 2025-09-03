'use client';

import { forwardRef, useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TouchFriendlyButtonProps extends ButtonProps {
  /** 是否顯示觸控反饋動畫 */
  touchFeedback?: boolean;
  /** 觸控面積最小尺寸 (預設 44px，符合 WCAG 觸控目標規範) */
  minTouchTarget?: number;
  /** 是否啟用長按功能 */
  enableLongPress?: boolean;
  /** 長按觸發的回調 */
  onLongPress?: () => void;
  /** 長按觸發時間 (毫秒) */
  longPressDelay?: number;
}

/**
 * 觸控友好的按鈕元件
 * - 符合 WCAG 觸控目標大小指南 (最小 44x44px)
 * - 支援觸控反饋動畫
 * - 支援長按功能
 * - 自動增加觸控區域
 */
export const TouchFriendlyButton = forwardRef<
  HTMLButtonElement,
  TouchFriendlyButtonProps
>(({
  className,
  children,
  size = 'default',
  touchFeedback = true,
  minTouchTarget = 44,
  enableLongPress = false,
  onLongPress,
  longPressDelay = 500,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  // 處理觸控開始
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (touchFeedback) {
      setIsPressed(true);
    }
    
    if (enableLongPress && onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, longPressDelay);
      setPressTimer(timer);
    }
    
    onTouchStart?.(e);
  };

  // 處理觸控結束
  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (touchFeedback) {
      // 延遲重置，讓用戶看到反饋效果
      setTimeout(() => setIsPressed(false), 150);
    }
    
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    onTouchEnd?.(e);
  };

  // 處理滑鼠按下 (桌面版)
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (touchFeedback) {
      setIsPressed(true);
    }
    
    if (enableLongPress && onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, longPressDelay);
      setPressTimer(timer);
    }
    
    onMouseDown?.(e);
  };

  // 處理滑鼠釋放 (桌面版)
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (touchFeedback) {
      setTimeout(() => setIsPressed(false), 100);
    }
    
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    onMouseUp?.(e);
  };

  // 計算最小觸控目標樣式
  const touchTargetStyle = {
    minWidth: `${minTouchTarget}px`,
    minHeight: `${minTouchTarget}px`
  };

  return (
    <Button
      ref={ref}
      className={cn(
        // 基本樣式
        className,
        // 觸控反饋效果
        touchFeedback && isPressed && 'scale-95 bg-opacity-80',
        // 觸控區域優化
        'relative',
        // 長按時的視覺反饋
        enableLongPress && 'select-none'
      )}
      style={touchTargetStyle}
      size={size}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </Button>
  );
});

TouchFriendlyButton.displayName = 'TouchFriendlyButton';

/**
 * 觸控優化的浮動操作按鈕 (FAB)
 */
interface TouchFABProps extends TouchFriendlyButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
}

export const TouchFAB = forwardRef<HTMLButtonElement, TouchFABProps>(({
  className,
  position = 'bottom-right',
  offset = 16,
  children,
  size = 'default',
  ...props
}, ref) => {
  const positionClasses = {
    'bottom-right': `fixed bottom-${offset} right-${offset}`,
    'bottom-left': `fixed bottom-${offset} left-${offset}`,
    'top-right': `fixed top-${offset} right-${offset}`,
    'top-left': `fixed top-${offset} left-${offset}`
  };

  return (
    <TouchFriendlyButton
      ref={ref}
      className={cn(
        positionClasses[position],
        'rounded-full shadow-lg hover:shadow-xl transition-shadow z-50',
        'w-14 h-14 p-0', // 固定大小，符合 Material Design FAB 規範
        className
      )}
      minTouchTarget={56} // FAB 的標準觸控目標
      size={size}
      {...props}
    >
      {children}
    </TouchFAB>
  );
});

TouchFAB.displayName = 'TouchFAB';

/**
 * 觸控優化的滑動操作列表項
 */
interface SwipeActionItemProps {
  children: React.ReactNode;
  leftActions?: Array<{
    icon: React.ReactNode;
    label: string;
    color: 'primary' | 'secondary' | 'destructive';
    onAction: () => void;
  }>;
  rightActions?: Array<{
    icon: React.ReactNode;
    label: string;
    color: 'primary' | 'secondary' | 'destructive';
    onAction: () => void;
  }>;
  onSwipeThreshold?: number;
}

export function SwipeActionItem({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeThreshold = 100
}: SwipeActionItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwping, setIsSwiping] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // 限制滑動範圍
    const maxSwipe = 120;
    const limitedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(limitedOffset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // 檢查是否超過閾值
    if (Math.abs(swipeOffset) > onSwipeThreshold) {
      // 觸發對應的動作
      if (swipeOffset > 0 && leftActions.length > 0) {
        leftActions[0].onAction();
      } else if (swipeOffset < 0 && rightActions.length > 0) {
        rightActions[0].onAction();
      }
    }
    
    // 重置位置
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* 左側動作 */}
      {leftActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 h-full bg-blue-500 flex items-center px-4 text-white transition-transform"
          style={{ 
            transform: `translateX(${Math.max(-120, swipeOffset - 120)}px)`,
            width: '120px'
          }}
        >
          <div className="flex items-center space-x-2">
            {leftActions[0].icon}
            <span className="text-sm font-medium">{leftActions[0].label}</span>
          </div>
        </div>
      )}
      
      {/* 右側動作 */}
      {rightActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 h-full bg-red-500 flex items-center px-4 text-white transition-transform"
          style={{ 
            transform: `translateX(${Math.min(120, swipeOffset + 120)}px)`,
            width: '120px'
          }}
        >
          <div className="flex items-center space-x-2">
            {rightActions[0].icon}
            <span className="text-sm font-medium">{rightActions[0].label}</span>
          </div>
        </div>
      )}
      
      {/* 主內容 */}
      <div
        className="relative bg-white transition-transform touch-pan-y"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}