'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { storageService, UploadProgress, ImageUploadResult } from '@/lib/firebase/storage';
import { cn } from '@/lib/utils/cn';

export interface ProductImageData {
  id: string;
  url: string;
  alt: string;
  order: number;
  isMain: boolean;
  fileName?: string;
  fullPath?: string;
}

interface ImageUploadProps {
  images: ProductImageData[];
  onImagesChange: (images: ProductImageData[]) => void;
  maxImages?: number;
  uploadPath?: string;
  className?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  uploadPath = 'products/temp',
  className
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isUploading) return;
    
    // 檢查圖片數量限制
    if (images.length + acceptedFiles.length > maxImages) {
      alert(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    // 驗證檔案
    const { validFiles, invalidFiles } = storageService.validateImageFiles(acceptedFiles);
    
    if (invalidFiles.length > 0) {
      alert(`以下檔案無效：\n${invalidFiles.map(f => `${f.file.name}: ${f.error}`).join('\n')}`);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadResults: ImageUploadResult[] = [];
      
      // 逐一上傳檔案以顯示進度
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progressKey = `${i}-${file.name}`;
        
        const result = await storageService.uploadImage(
          file,
          uploadPath,
          (progress: UploadProgress) => {
            setUploadProgress(prev => ({
              ...prev,
              [progressKey]: progress.progress
            }));
          }
        );
        
        uploadResults.push(result);
        
        // 清除該檔案的進度
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
      }

      // 將上傳結果轉換為 ProductImageData
      const newImages: ProductImageData[] = uploadResults.map((result, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: result.url,
        alt: '',
        order: images.length + index,
        isMain: images.length === 0 && index === 0, // 第一張設為主圖
        fileName: result.fileName,
        fullPath: result.fullPath
      }));

      onImagesChange([...images, ...newImages]);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('圖片上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [images, maxImages, uploadPath, onImagesChange, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    disabled: isUploading
  });

  // 刪除圖片
  const removeImage = async (imageToRemove: ProductImageData) => {
    try {
      // 如果有 fullPath，從 Storage 中刪除
      if (imageToRemove.fullPath) {
        await storageService.deleteImage(imageToRemove.fullPath);
      }
      
      const updatedImages = images.filter(img => img.id !== imageToRemove.id);
      
      // 重新調整順序
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        order: index,
        isMain: index === 0 && updatedImages.length > 0 // 第一張設為主圖
      }));
      
      onImagesChange(reorderedImages);
    } catch (error) {
      console.error('Failed to remove image:', error);
      alert('刪除圖片失敗');
    }
  };

  // 設定主圖
  const setMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  // 更新圖片描述
  const updateImageAlt = (imageId: string, alt: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, alt } : img
    );
    onImagesChange(updatedImages);
  };

  // 移動圖片順序
  const moveImage = (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(images.length - 1, currentIndex + 1);

    if (newIndex === currentIndex) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(currentIndex, 1);
    newImages.splice(newIndex, 0, movedImage);

    // 重新設定順序
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }));

    onImagesChange(reorderedImages);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上傳區域 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <div className="text-sm text-gray-600">
            {isUploading ? (
              <p>正在上傳圖片...</p>
            ) : isDragActive ? (
              <p>放開以上傳圖片</p>
            ) : (
              <p>拖放圖片到此處，或點擊選擇檔案</p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            支援 JPEG、PNG、WebP 格式，最大 5MB，最多 {maxImages} 張
          </p>
          <p className="text-xs text-gray-500">
            目前已上傳 {images.length} / {maxImages} 張圖片
          </p>
        </div>
      </div>

      {/* 上傳進度 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>上傳中: {key.split('-').pop()}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 圖片預覽網格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              {/* 圖片容器 */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt || `商品圖片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* 主圖標記 */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    主圖
                  </div>
                )}
                
                {/* 操作按鈕 */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {!image.isMain && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setMainImage(image.id)}
                    >
                      設為主圖
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* 順序控制 */}
                <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => moveImage(image.id, 'up')}
                    >
                      ↑
                    </Button>
                  )}
                  {index < images.length - 1 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => moveImage(image.id, 'down')}
                    >
                      ↓
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 圖片描述輸入 */}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="圖片描述（可選）"
                  value={image.alt}
                  onChange={(e) => updateImageAlt(image.id, e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 無圖片時的佔位符 */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>尚未上傳任何圖片</p>
        </div>
      )}
    </div>
  );
}