'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, X, Plus } from 'lucide-react';

export interface AdvancedSearchFilters {
  name?: string;
  sku?: string;
  categoryIds?: string[];
  brandIds?: string[];
  priceRange?: [number, number];
  tags?: string[];
  inStock?: boolean;
  isFeatured?: boolean;
  hasDiscount?: boolean;
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  maxPrice?: number;
  categories?: Array<{ id: string; name: string }>;
  brands?: Array<{ id: string; name: string }>;
  availableTags?: string[];
}

export function AdvancedSearch({
  onSearch,
  maxPrice = 10000,
  categories = [],
  brands = [],
  availableTags = []
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    priceRange: [0, maxPrice],
    categoryIds: [],
    brandIds: [],
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = () => {
    onSearch(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFilters({
      priceRange: [0, maxPrice],
      categoryIds: [],
      brandIds: [],
      tags: []
    });
  };

  const addTag = () => {
    if (newTag && !filters.tags?.includes(newTag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId]
    }));
  };

  const toggleBrand = (brandId: string) => {
    setFilters(prev => ({
      ...prev,
      brandIds: prev.brandIds?.includes(brandId)
        ? prev.brandIds.filter(id => id !== brandId)
        : [...(prev.brandIds || []), brandId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="mr-2 h-4 w-4" />
          進階搜尋
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>進階搜尋</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本搜尋 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">商品名稱</Label>
              <Input
                id="name"
                placeholder="搜尋商品名稱..."
                value={filters.name || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">商品編號(SKU)</Label>
              <Input
                id="sku"
                placeholder="搜尋 SKU..."
                value={filters.sku || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
          </div>

          {/* 價格範圍 */}
          <div className="space-y-2">
            <Label>價格範圍</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange || [0, maxPrice]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: [value[0], value[1]] }))}
                max={maxPrice}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>${filters.priceRange?.[0] || 0}</span>
                <span>${filters.priceRange?.[1] || maxPrice}</span>
              </div>
            </div>
          </div>

          {/* 分類選擇 */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>商品分類</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.categoryIds?.includes(category.id) || false}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 品牌選擇 */}
          {brands.length > 0 && (
            <div className="space-y-2">
              <Label>品牌</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                {brands.map(brand => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={filters.brandIds?.includes(brand.id) || false}
                      onCheckedChange={() => toggleBrand(brand.id)}
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {brand.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 標籤 */}
          <div className="space-y-2">
            <Label>標籤</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="新增標籤..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">常用標籤：</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!filters.tags?.includes(tag)) {
                          setFilters(prev => ({
                            ...prev,
                            tags: [...(prev.tags || []), tag]
                          }));
                        }
                      }}
                      className="h-6 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 其他篩選 */}
          <div className="space-y-2">
            <Label>其他篩選</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStock || false}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
                />
                <label
                  htmlFor="in-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  僅顯示有庫存商品
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={filters.isFeatured || false}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isFeatured: checked as boolean }))}
                />
                <label
                  htmlFor="featured"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  僅顯示精選商品
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-discount"
                  checked={filters.hasDiscount || false}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasDiscount: checked as boolean }))}
                />
                <label
                  htmlFor="has-discount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  僅顯示有折扣商品
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              搜尋
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}