'use client';

import { useState, useEffect } from 'react';
import { storageService } from '@/lib/firebase/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  Filter,
  Download,
  Copy,
  Grid3X3,
  List,
  RefreshCw
} from 'lucide-react';

interface MediaFile {
  url: string;
  fullPath: string;
  name: string;
  folder: string;
  size?: number;
  uploadDate?: Date;
}

interface MediaPageState {
  files: MediaFile[];
  filteredFiles: MediaFile[];
  isLoading: boolean;
  searchTerm: string;
  selectedFolder: string;
  viewMode: 'grid' | 'list';
  selectedFiles: Set<string>;
}

export default function MediaPage() {
  const [state, setState] = useState<MediaPageState>({
    files: [],
    filteredFiles: [],
    isLoading: true,
    searchTerm: '',
    selectedFolder: 'all',
    viewMode: 'grid',
    selectedFiles: new Set()
  });

  useEffect(() => {
    loadMediaFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [state.files, state.searchTerm, state.selectedFolder]);

  const loadMediaFiles = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // 載入不同資料夾的圖片
      const [productImages, categoryImages, brandImages] = await Promise.all([
        storageService.listImages('products'),
        storageService.listImages('categories'),
        storageService.listImages('brands')
      ]);

      const allFiles: MediaFile[] = [
        ...productImages.map(img => ({
          ...img,
          name: img.fullPath.split('/').pop() || '',
          folder: 'products'
        })),
        ...categoryImages.map(img => ({
          ...img,
          name: img.fullPath.split('/').pop() || '',
          folder: 'categories'
        })),
        ...brandImages.map(img => ({
          ...img,
          name: img.fullPath.split('/').pop() || '',
          folder: 'brands'
        }))
      ];

      setState(prev => ({
        ...prev,
        files: allFiles,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入媒體檔案失敗:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filterFiles = () => {
    let filtered = state.files;

    // 按資料夾篩選
    if (state.selectedFolder !== 'all') {
      filtered = filtered.filter(file => file.folder === state.selectedFolder);
    }

    // 按檔名搜尋
    if (state.searchTerm) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    setState(prev => ({ ...prev, filteredFiles: filtered }));
  };

  const deleteFiles = async (filePaths: string[]) => {
    if (!confirm(`確定要刪除 ${filePaths.length} 個檔案嗎？此操作不可復原。`)) {
      return;
    }

    try {
      await storageService.deleteMultipleImages(filePaths);
      await loadMediaFiles();
      setState(prev => ({ ...prev, selectedFiles: new Set() }));
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      alert('刪除檔案失敗');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('圖片URL已複製到剪貼板');
  };

  const toggleFileSelection = (fullPath: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedFiles);
      if (newSelected.has(fullPath)) {
        newSelected.delete(fullPath);
      } else {
        newSelected.add(fullPath);
      }
      return { ...prev, selectedFiles: newSelected };
    });
  };

  const selectAllFiles = () => {
    setState(prev => ({
      ...prev,
      selectedFiles: new Set(prev.filteredFiles.map(file => file.fullPath))
    }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedFiles: new Set() }));
  };

  const getFolderStats = () => {
    const stats = state.files.reduce((acc, file) => {
      acc[file.folder] = (acc[file.folder] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      all: state.files.length,
      products: stats.products || 0,
      categories: stats.categories || 0,
      brands: stats.brands || 0
    };
  };

  const folderStats = getFolderStats();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標頭 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">媒體管理</h1>
          <p className="text-muted-foreground">
            管理系統中的所有圖片檔案
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMediaFiles}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重新整理
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ 
              ...prev, 
              viewMode: prev.viewMode === 'grid' ? 'list' : 'grid' 
            }))}
          >
            {state.viewMode === 'grid' ? (
              <List className="mr-2 h-4 w-4" />
            ) : (
              <Grid3X3 className="mr-2 h-4 w-4" />
            )}
            {state.viewMode === 'grid' ? '列表檢視' : '網格檢視'}
          </Button>
        </div>
      </div>

      {/* 工具欄 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜尋 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋檔案名稱..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>

        {/* 資料夾篩選 */}
        <select
          value={state.selectedFolder}
          onChange={(e) => setState(prev => ({ ...prev, selectedFolder: e.target.value }))}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          <option value="all">所有資料夾 ({folderStats.all})</option>
          <option value="products">商品圖片 ({folderStats.products})</option>
          <option value="categories">分類圖片 ({folderStats.categories})</option>
          <option value="brands">品牌圖片 ({folderStats.brands})</option>
        </select>
      </div>

      {/* 批量操作 */}
      {state.selectedFiles.size > 0 && (
        <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
          <span className="text-sm">
            已選擇 {state.selectedFiles.size} 個檔案
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              取消選擇
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteFiles(Array.from(state.selectedFiles))}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除選擇的檔案
            </Button>
          </div>
        </div>
      )}

      {/* 檔案列表 */}
      {state.filteredFiles.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">沒有找到檔案</h3>
          <p className="text-muted-foreground">
            {state.searchTerm || state.selectedFolder !== 'all' 
              ? '請嘗試其他搜尋條件' 
              : '系統中尚未有任何圖片檔案'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 全選控制 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={state.selectedFiles.size === state.filteredFiles.length && state.filteredFiles.length > 0}
              onChange={(e) => e.target.checked ? selectAllFiles() : clearSelection()}
              className="rounded"
            />
            <label className="text-sm font-medium">
              全選 ({state.filteredFiles.length} 個檔案)
            </label>
          </div>

          {/* 檔案網格 */}
          {state.viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {state.filteredFiles.map((file) => (
                <Card key={file.fullPath} className="group relative">
                  <div className="aspect-square relative">
                    <input
                      type="checkbox"
                      checked={state.selectedFiles.has(file.fullPath)}
                      onChange={() => toggleFileSelection(file.fullPath)}
                      className="absolute top-2 left-2 z-10 rounded"
                    />
                    
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(file.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFiles([file.fullPath])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {file.folder}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {state.filteredFiles.map((file) => (
                <Card key={file.fullPath} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={state.selectedFiles.has(file.fullPath)}
                      onChange={() => toggleFileSelection(file.fullPath)}
                      className="rounded"
                    />
                    
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {file.folder} 資料夾
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(file.url)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        複製連結
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFiles([file.fullPath])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}