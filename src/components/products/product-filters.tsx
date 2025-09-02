'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { categoriesService } from '@/lib/firebase/categories';
import { brandsService } from '@/lib/firebase/brands';
import { Category, Brand } from '@/lib/types/product';

export interface FilterState {
  categoryIds: string[];
  brandIds: string[];
  priceRange: [number, number];
  tags: string[];
  inStock: boolean;
  isFeatured: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  productCount?: number;
  maxPrice?: number;
}

export function ProductFilters({ 
  filters, 
  onFiltersChange, 
  productCount = 0,
  maxPrice = 10000 
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
    availability: true
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        categoriesService.getActiveCategories(),
        brandsService.getActiveBrands()
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('載入篩選資料失敗:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    
    onFiltersChange({
      ...filters,
      categoryIds: newCategoryIds
    });
  };

  const handleBrandToggle = (brandId: string) => {
    const newBrandIds = filters.brandIds.includes(brandId)
      ? filters.brandIds.filter(id => id !== brandId)
      : [...filters.brandIds, brandId];
    
    onFiltersChange({
      ...filters,
      brandIds: newBrandIds
    });
  };

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]]
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      categoryIds: [],
      brandIds: [],
      priceRange: [0, maxPrice],
      tags: [],
      inStock: false,
      isFeatured: false
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categoryIds.length > 0) count += filters.categoryIds.length;
    if (filters.brandIds.length > 0) count += filters.brandIds.length;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++;
    if (filters.inStock) count++;
    if (filters.isFeatured) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* 已選擇的篩選條件 */}
      {getActiveFiltersCount() > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">已選擇篩選</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-auto p-0 text-xs"
            >
              清除全部
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.categoryIds.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <Badge key={categoryId} variant="secondary">
                  {category.name}
                  <button
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
            {filters.brandIds.map(brandId => {
              const brand = brands.find(b => b.id === brandId);
              return brand ? (
                <Badge key={brandId} variant="secondary">
                  {brand.name}
                  <button
                    onClick={() => handleBrandToggle(brandId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
              <Badge variant="secondary">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                <button
                  onClick={() => handlePriceChange([0, maxPrice])}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* 商品分類 */}
      <div>
        <button
          onClick={() => toggleSection('categories')}
          className="flex w-full items-center justify-between text-left"
        >
          <Label className="text-sm font-medium">商品分類</Label>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.categories && (
          <ScrollArea className="mt-3 h-48">
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categoryIds.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
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
          </ScrollArea>
        )}
      </div>

      <Separator />

      {/* 品牌 */}
      <div>
        <button
          onClick={() => toggleSection('brands')}
          className="flex w-full items-center justify-between text-left"
        >
          <Label className="text-sm font-medium">品牌</Label>
          {expandedSections.brands ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.brands && (
          <ScrollArea className="mt-3 h-48">
            <div className="space-y-2">
              {brands.map(brand => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={filters.brandIds.includes(brand.id)}
                    onCheckedChange={() => handleBrandToggle(brand.id)}
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
          </ScrollArea>
        )}
      </div>

      <Separator />

      {/* 價格範圍 */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="flex w-full items-center justify-between text-left"
        >
          <Label className="text-sm font-medium">價格範圍</Label>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-4 space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              max={maxPrice}
              step={100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 庫存與精選 */}
      <div>
        <button
          onClick={() => toggleSection('availability')}
          className="flex w-full items-center justify-between text-left"
        >
          <Label className="text-sm font-medium">其他篩選</Label>
          {expandedSections.availability ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.availability && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, inStock: checked as boolean })
                }
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
                checked={filters.isFeatured}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, isFeatured: checked as boolean })
                }
              />
              <label
                htmlFor="featured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                僅顯示精選商品
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 手機版 - Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              篩選
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>篩選商品</SheetTitle>
            </SheetHeader>
            <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
              <FilterContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* 桌面版 - 側邊欄 */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">篩選</h3>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} 個篩選
              </Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>
    </>
  );
}