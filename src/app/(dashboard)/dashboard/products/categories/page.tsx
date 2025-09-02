'use client';

import { useEffect, useState } from 'react';
import { categoriesService } from '@/lib/firebase/categories';
import { Category } from '@/lib/types/product';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Plus,
  Search,
  Tag,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

interface CategoriesPageState {
  categories: Category[];
  categoryTree: (Category & { children: Category[] })[];
  isLoading: boolean;
  searchQuery: string;
  error: string | null;
}

export default function CategoriesPage() {
  const [state, setState] = useState<CategoriesPageState>({
    categories: [],
    categoryTree: [],
    isLoading: true,
    searchQuery: '',
    error: null
  });

  const loadCategories = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [categories, categoryTree] = await Promise.all([
        categoriesService.getCategories(),
        categoriesService.getCategoryTree()
      ]);
      
      setState(prev => ({
        ...prev,
        categories,
        categoryTree,
        isLoading: false
      }));
    } catch (error) {
      console.error('載入分類失敗:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '載入分類失敗'
      }));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = state.categories.filter(category =>
    !state.searchQuery ||
    category.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

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
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回商品
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">分類管理</h1>
            <p className="text-muted-foreground">
              管理商品分類與階層結構
            </p>
          </div>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/products/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            新增分類
          </Link>
        </Button>
      </div>

      {/* 統計資訊 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">總分類數</p>
              <p className="text-xl font-bold">{state.categories.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderOpen className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">根分類</p>
              <p className="text-xl font-bold">{state.categoryTree.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Folder className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">已啟用</p>
              <p className="text-xl font-bold">
                {state.categories.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 搜尋 */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋分類名稱或描述..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {state.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {state.error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 階層式檢視 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">階層檢視</h3>
          {state.categoryTree.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">尚未建立分類</p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.categoryTree.map(category => (
                <CategoryTreeItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </Card>

        {/* 列表檢視 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">所有分類</h3>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {state.searchQuery ? '找不到符合的分類' : '尚未建立分類'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

interface CategoryTreeItemProps {
  category: Category & { children: Category[] };
  level?: number;
}

function CategoryTreeItem({ category, level = 0 }: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = category.children.length > 0;

  return (
    <div className="space-y-1">
      <div 
        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center space-x-2">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-muted rounded"
            >
              <ChevronRight 
                className={`h-3 w-3 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            </button>
          ) : (
            <div className="w-4" />
          )}
          
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            <span className={`text-sm ${!category.isActive ? 'text-muted-foreground' : ''}`}>
              {category.name}
            </span>
            {!category.isActive && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                停用
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/products/categories/${category.id}`}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/products/categories/${category.id}/edit`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children.map(child => (
            <CategoryTreeItem 
              key={child.id} 
              category={{ ...child, children: [] }}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryListItemProps {
  category: Category;
}

function CategoryListItem({ category }: CategoryListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
      <div className="flex items-center space-x-3">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="flex items-center space-x-2">
            <h4 className={`font-medium ${!category.isActive ? 'text-muted-foreground' : ''}`}>
              {category.name}
            </h4>
            <span className="text-xs text-muted-foreground">
              #{category.order}
            </span>
            {!category.isActive && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                停用
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/products/categories/${category.id}`}>
            <Eye className="mr-1 h-3 w-3" />
            查看
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/products/categories/${category.id}/edit`}>
            <Edit className="mr-1 h-3 w-3" />
            編輯
          </Link>
        </Button>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}