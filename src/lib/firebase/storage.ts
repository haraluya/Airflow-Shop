import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  uploadBytesResumable,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface ImageUploadResult {
  url: string;
  fileName: string;
  fullPath: string;
  size: number;
}

class StorageService {
  /**
   * 上傳單一圖片檔案
   */
  async uploadImage(
    file: File, 
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImageUploadResult> {
    // 產生唯一檔名
    const fileName = `${Date.now()}_${file.name}`;
    const fullPath = `${path}/${fileName}`;
    const storageRef = ref(storage, fullPath);

    if (onProgress) {
      // 使用可追蹤進度的上傳
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url,
                fileName,
                fullPath,
                size: file.size
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // 直接上傳
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      return {
        url,
        fileName,
        fullPath,
        size: file.size
      };
    }
  }

  /**
   * 批量上傳圖片
   */
  async uploadMultipleImages(
    files: File[],
    path: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<ImageUploadResult[]> {
    const uploadPromises = files.map((file, index) => 
      this.uploadImage(
        file, 
        path, 
        onProgress ? (progress) => onProgress(index, progress) : undefined
      )
    );

    return Promise.all(uploadPromises);
  }

  /**
   * 刪除圖片
   */
  async deleteImage(fullPath: string): Promise<void> {
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  }

  /**
   * 批量刪除圖片
   */
  async deleteMultipleImages(fullPaths: string[]): Promise<void> {
    const deletePromises = fullPaths.map(path => this.deleteImage(path));
    await Promise.all(deletePromises);
  }

  /**
   * 取得目錄下所有圖片
   */
  async listImages(path: string): Promise<{ url: string; fullPath: string }[]> {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const urlPromises = result.items.map(async (item) => {
      const url = await getDownloadURL(item);
      return {
        url,
        fullPath: item.fullPath
      };
    });

    return Promise.all(urlPromises);
  }

  /**
   * 取得商品圖片上傳路徑
   */
  getProductImagePath(productId?: string): string {
    return productId ? `products/${productId}` : 'products/temp';
  }

  /**
   * 取得分類圖片上傳路徑
   */
  getCategoryImagePath(): string {
    return 'categories';
  }

  /**
   * 取得品牌圖片上傳路徑
   */
  getBrandImagePath(): string {
    return 'brands';
  }

  /**
   * 驗證圖片檔案
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // 檢查檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: '只允許 JPEG、PNG 和 WebP 格式的圖片'
      };
    }

    // 檢查檔案大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: '圖片檔案大小不可超過 5MB'
      };
    }

    return { isValid: true };
  }

  /**
   * 批量驗證圖片檔案
   */
  validateImageFiles(files: File[]): { 
    validFiles: File[]; 
    invalidFiles: { file: File; error: string }[] 
  } {
    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string }[] = [];

    files.forEach(file => {
      const validation = this.validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error! });
      }
    });

    return { validFiles, invalidFiles };
  }
}

export const storageService = new StorageService();