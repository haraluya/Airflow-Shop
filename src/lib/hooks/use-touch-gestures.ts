'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onPinchEnd?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

export interface TouchGestureOptions {
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  preventScroll?: boolean;
  enablePinch?: boolean;
}

/**
 * 觸控手勢處理 Hook
 * 支援滑動、捏合縮放、點擊、雙擊、長按等手勢
 */
export function useTouchGestures(
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventScroll = false,
    enablePinch = false
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchDistance = useRef<number>(0);
  const initialPinchDistance = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  // 計算兩點之間的距離
  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // 處理觸控開始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const currentTime = Date.now();

    // 單點觸控
    if (e.touches.length === 1) {
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: currentTime
      };

      // 設置長按計時器
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress!();
        }, longPressDelay);
      }
    }

    // 雙點觸控 (捏合)
    if (e.touches.length === 2 && enablePinch) {
      setIsPinching(true);
      initialPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
      
      // 清除長按計時器
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, [handlers, longPressDelay, preventScroll, enablePinch, getDistance]);

  // 處理觸控移動
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    // 清除長按計時器（移動時取消長按）
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // 捏合手勢處理
    if (e.touches.length === 2 && isPinching && enablePinch && handlers.onPinch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance.current;
      handlers.onPinch(scale);
    }
  }, [handlers, isPinching, enablePinch, getDistance, preventScroll]);

  // 處理觸控結束
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    // 清除長按計時器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const currentTime = Date.now();
    const touch = e.changedTouches[0];

    // 捏合結束
    if (isPinching) {
      setIsPinching(false);
      handlers.onPinchEnd?.();
      return;
    }

    // 單點觸控結束
    if (touchStart.current && e.touches.length === 0) {
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = currentTime - touchStart.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 判斷是否為滑動手勢
      if (distance > swipeThreshold && deltaTime < 500) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
          // 水平滑動
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        } else {
          // 垂直滑動
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
      // 判斷是否為點擊
      else if (distance < 10 && deltaTime < 500) {
        // 檢查雙擊
        if (handlers.onDoubleTap && currentTime - lastTapTime.current < doubleTapDelay) {
          handlers.onDoubleTap();
        } else {
          handlers.onTap?.();
        }
        lastTapTime.current = currentTime;
      }

      touchStart.current = null;
    }
  }, [
    handlers, 
    touchStart, 
    swipeThreshold, 
    doubleTapDelay, 
    isPinching, 
    preventScroll
  ]);

  // 綁定事件監聽器
  const bindGestures = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  return { bindGestures };
}

/**
 * 簡化的滑動手勢 Hook
 * 只處理水平滑動，常用於圖片輪播或標籤切換
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  return useTouchGestures(
    { onSwipeLeft, onSwipeRight },
    { swipeThreshold: threshold }
  );
}

/**
 * 長按手勢 Hook
 * 專門處理長按操作
 */
export function useLongPress(onLongPress: () => void, delay = 500) {
  return useTouchGestures(
    { onLongPress },
    { longPressDelay: delay }
  );
}

/**
 * 雙擊手勢 Hook
 * 處理雙擊操作，常用於縮放
 */
export function useDoubleTap(onDoubleTap: () => void, delay = 300) {
  return useTouchGestures(
    { onDoubleTap },
    { doubleTapDelay: delay }
  );
}

/**
 * 捏合縮放手勢 Hook
 * 處理雙指捏合縮放
 */
export function usePinchZoom(
  onPinch: (scale: number) => void,
  onPinchEnd?: () => void
) {
  return useTouchGestures(
    { onPinch, onPinchEnd },
    { enablePinch: true, preventScroll: true }
  );
}