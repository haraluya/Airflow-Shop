'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
}

/**
 * 優化的圖片元件
 * - 支援懶載入
 * - 支援加載狀態
 * - 支援錯誤處理和回退圖片
 * - 支援模糊佔位符
 * - 自動尺寸優化
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 75,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // 處理圖片加載完成
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // 處理圖片加載錯誤
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // 嘗試使用回退圖片
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  }, [currentSrc, fallbackSrc, onError]);

  // 當 src 改變時重置狀態
  useEffect(() => {
    if (src !== currentSrc && !hasError) {
      setCurrentSrc(src);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src, currentSrc, hasError]);

  // 生成模糊佔位符
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    
    // 生成簡單的 1x1 像素模糊圖片
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAAAAAAAAB/9oADAMBAAIRAxEAPwCdABmXC';
  };

  const containerClasses = cn(
    'relative overflow-hidden bg-muted',
    className
  );

  const imageClasses = cn(
    'transition-all duration-300',
    isLoading && 'opacity-0 scale-105',
    !isLoading && !hasError && 'opacity-100 scale-100'
  );

  if (fill) {
    return (
      <div className={containerClasses}>
        {/* 加載指示器 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-pulse bg-muted-foreground/20 w-8 h-8 rounded-full" />
          </div>
        )}
        
        {/* 錯誤狀態 */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-muted-foreground/20 rounded" />
              <div className="text-xs">圖片載入失敗</div>
            </div>
          </div>
        )}
        
        {/* 圖片 */}
        {!hasError && (
          <Image
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            fill
            quality={quality}
            priority={priority}
            sizes={sizes}
            loading={loading}
            placeholder={placeholder}
            blurDataURL={getBlurDataURL()}
            className={imageClasses}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className={containerClasses}
      style={{ width, height }}
    >
      {/* 加載指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-pulse bg-muted-foreground/20 w-8 h-8 rounded-full" />
        </div>
      )}
      
      {/* 錯誤狀態 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-1 bg-muted-foreground/20 rounded" />
            <div className="text-xs">圖片載入失敗</div>
          </div>
        </div>
      )}
      
      {/* 圖片 */}
      {!hasError && (
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          sizes={sizes}
          loading={loading}
          placeholder={placeholder}
          blurDataURL={getBlurDataURL()}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * 商品圖片元件 - 預設的商品圖片配置
 */
interface ProductImageProps extends Omit<OptimizedImageProps, 'sizes' | 'quality'> {
  variant?: 'card' | 'list' | 'detail' | 'thumbnail';
}

export function ProductImage({ 
  variant = 'card', 
  ...props 
}: ProductImageProps) {
  const configs = {
    card: {
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      quality: 80
    },
    list: {
      sizes: '80px',
      quality: 75
    },
    detail: {
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw',
      quality: 90
    },
    thumbnail: {
      sizes: '60px',
      quality: 70
    }
  };

  const config = configs[variant];

  return (
    <OptimizedImage
      {...props}
      sizes={config.sizes}
      quality={config.quality}
      loading={variant === 'detail' ? 'eager' : 'lazy'}
      priority={variant === 'detail'}
    />
  );
}

/**
 * 圖片預載入 Hook
 */
export function useImagePreloader(urls: string[]) {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImages = async () => {
      const promises = urls.map(url => {
        return new Promise<string>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(url);
          img.onerror = () => reject(url);
          img.src = url;
        });
      });

      try {
        const loadedUrls = await Promise.allSettled(promises);
        const successfulUrls = loadedUrls
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<string>).value);
        
        setPreloadedImages(new Set(successfulUrls));
      } catch (error) {
        console.warn('圖片預載入失敗:', error);
      }
    };

    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls]);

  return preloadedImages;
}

/**
 * 圖片尺寸計算工具
 */
export function getOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  maxWidth = 1200,
  maxHeight = 800
) {
  const aspectRatio = containerWidth / containerHeight;
  
  let width = Math.min(containerWidth * 2, maxWidth); // 2x for retina
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}