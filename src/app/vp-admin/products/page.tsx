'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, getDocs, where, orderBy, limit, updateDoc, deleteDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  Grid3X3,
  List,
  ArrowUpDown,
  Download,
  Upload,
  Settings,
  Tag,
  DollarSign,
  BarChart3,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
  descriptionHtml: string
  images: string[]
  standardPrice: number
  costPrice?: number
  category: string
  series: string
  brand?: string
  isActive: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  salesCount?: number
  viewCount?: number
}

type ViewMode = 'grid' | 'table'
type SortField = 'name' | 'price' | 'category' | 'sales' | 'createdAt' | 'stockQuantity'
type SortOrder = 'asc' | 'desc'

export default function ProductsPage() {
  const [user, loading, error] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [seriesFilter, setSeriesFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [dataLoading, setDataLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [series, setSeries] = useState<string[]>([])
  const [priceEditingId, setPriceEditingId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const adminDocRef = doc(db, 'admins', user.uid)
        const adminDoc = await getDoc(adminDocRef)
        
        if (!adminDoc.exists()) {
          router.push('/vp-admin')
          return
        }
        
        setIsAdmin(true)
        await loadProducts()
      } catch (error) {
        console.error('檢查管理員狀態失敗:', error)
        router.push('/vp-admin')
      }
    }

    if (!loading && user) {
      checkAdminStatus()
    } else if (!loading && !user) {
      router.push('/vp-admin')
    }
  }, [user, loading, router])

  const loadProducts = async () => {
    try {
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('updatedAt', 'desc')
      )
      
      const snapshot = await getDocs(productsQuery)
      const productData: Product[] = []
      const categorySet = new Set<string>()
      const seriesSet = new Set<string>()
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        const product: Product = {
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          descriptionHtml: data.descriptionHtml || '',
          images: data.images || [],
          standardPrice: data.standardPrice || 0,
          costPrice: data.costPrice,
          category: data.category || '',
          series: data.series || '',
          brand: data.brand,
          isActive: data.isActive ?? true,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold || 10,
          weight: data.weight,
          dimensions: data.dimensions,
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          salesCount: data.salesCount || 0,
          viewCount: data.viewCount || 0
        }
        productData.push(product)
        
        if (product.category) categorySet.add(product.category)
        if (product.series) seriesSet.add(product.series)
      })
      
      setProducts(productData)
      setFilteredProducts(productData)
      setCategories(Array.from(categorySet).sort())
      setSeries(Array.from(seriesSet).sort())
    } catch (error) {
      console.error('載入商品資料失敗:', error)
      toast.error('載入商品資料失敗')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    let filtered = products

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 分類篩選
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // 系列篩選
    if (seriesFilter !== 'all') {
      filtered = filtered.filter(product => product.series === seriesFilter)
    }

    // 狀態篩選
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(product => product.isActive)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(product => !product.isActive)
      } else if (statusFilter === 'low_stock') {
        filtered = filtered.filter(product => 
          product.stockQuantity !== undefined && 
          product.stockQuantity <= (product.lowStockThreshold || 10)
        )
      }
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.standardPrice
          bValue = b.standardPrice
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        case 'sales':
          aValue = a.salesCount || 0
          bValue = b.salesCount || 0
          break
        case 'stockQuantity':
          aValue = a.stockQuantity || 0
          bValue = b.stockQuantity || 0
          break
        case 'createdAt':
        default:
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter, seriesFilter, statusFilter, sortField, sortOrder])

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      })
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isActive: !currentStatus } : p
      ))
      
      toast.success(`商品已${!currentStatus ? '上架' : '下架'}`)
    } catch (error) {
      console.error('更新商品狀態失敗:', error)
      toast.error('更新失敗')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('確定要刪除這個商品嗎？此操作無法復原。')) return
    
    try {
      await deleteDoc(doc(db, 'products', productId))
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast.success('商品已刪除')
    } catch (error) {
      console.error('刪除商品失敗:', error)
      toast.error('刪除失敗')
    }
  }

  const handlePriceEdit = async (productId: string, newPrice: string) => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) {
      toast.error('請輸入有效的價格')
      return
    }

    try {
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        standardPrice: price,
        updatedAt: new Date()
      })
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, standardPrice: price } : p
      ))
      
      setPriceEditingId(null)
      setEditingPrice('')
      toast.success('價格已更新')
    } catch (error) {
      console.error('更新價格失敗:', error)
      toast.error('更新失敗')
    }
  }

  const handleBatchOperation = async (operation: string) => {
    if (selectedProducts.length === 0) {
      toast.error('請選擇要操作的商品')
      return
    }

    // 實作批量操作邏輯
    switch (operation) {
      case 'activate':
        // 批量上架
        break
      case 'deactivate':
        // 批量下架
        break
      case 'delete':
        // 批量刪除
        break
      case 'export':
        // 匯出選中商品
        break
    }
  }

  const getStatusBadge = (product: Product) => {
    if (!product.isActive) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">已下架</Badge>
    }
    
    if (product.stockQuantity !== undefined && product.stockQuantity <= (product.lowStockThreshold || 10)) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">庫存不足</Badge>
    }
    
    return <Badge variant="secondary" className="bg-green-100 text-green-800">正常販售</Badge>
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="p-4">
        <div className="aspect-square relative mb-2 bg-gray-100 rounded-lg overflow-hidden">
          {product.images[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="h-8 w-8" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            {getStatusBadge(product)}
          </div>
          <div className="absolute top-2 right-2">
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedProducts(prev => [...prev, product.id])
                } else {
                  setSelectedProducts(prev => prev.filter(id => id !== product.id))
                }
              }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">NT${product.standardPrice.toLocaleString()}</span>
            {product.salesCount !== undefined && (
              <span className="text-xs text-muted-foreground">售出 {product.salesCount}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">{product.category}</Badge>
            {product.series && (
              <Badge variant="outline" className="text-xs">{product.series}</Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                檢視
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleToggleProductStatus(product.id, product.isActive)}
              >
                {product.isActive ? '下架商品' : '上架商品'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  if (loading || !isAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題與動作按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品管理</h1>
          <p className="text-muted-foreground">管理商品目錄、價格與庫存</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleBatchOperation('export')}>
            <Download className="h-4 w-4 mr-2" />
            匯出商品
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            批量匯入
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增商品
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              商品總數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              上架中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              庫存不足
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => 
                p.stockQuantity !== undefined && 
                p.stockQuantity <= (p.lowStockThreshold || 10)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              分類數量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              平均價格
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NT${products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.standardPrice, 0) / products.length).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋與篩選控制 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜尋 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜尋商品名稱、SKU 或標籤..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 篩選器 */}
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分類</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={seriesFilter} onValueChange={setSeriesFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="系列" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有系列</SelectItem>
                  {series.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="active">上架中</SelectItem>
                  <SelectItem value="inactive">已下架</SelectItem>
                  <SelectItem value="low_stock">庫存不足</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 視圖與排序 */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-1">
                <Button 
                  variant={viewMode === 'table' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortField, SortOrder]
                setSortField(field)
                setSortOrder(order)
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">最新更新</SelectItem>
                  <SelectItem value="name-asc">名稱 A-Z</SelectItem>
                  <SelectItem value="name-desc">名稱 Z-A</SelectItem>
                  <SelectItem value="price-asc">價格由低到高</SelectItem>
                  <SelectItem value="price-desc">價格由高到低</SelectItem>
                  <SelectItem value="sales-desc">銷量由高到低</SelectItem>
                  <SelectItem value="stockQuantity-asc">庫存由少到多</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedProducts.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已選擇 {selectedProducts.length} 件商品
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBatchOperation('activate')}
                  >
                    批量上架
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBatchOperation('deactivate')}
                  >
                    批量下架
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBatchOperation('export')}
                  >
                    匯出選中
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBatchOperation('delete')}
                  >
                    批量刪除
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>商品清單</CardTitle>
              <CardDescription>
                顯示 {filteredProducts.length} / {products.length} 件商品
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              列設定
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">沒有找到商品</h3>
              <p>
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? '請調整搜尋條件或篩選器'
                  : '尚無商品資料，請新增第一個商品'
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="w-12 p-4">
                          <Checkbox
                            checked={selectedProducts.length === filteredProducts.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts(filteredProducts.map(p => p.id))
                              } else {
                                setSelectedProducts([])
                              }
                            }}
                          />
                        </th>
                        <th className="text-left p-4">商品</th>
                        <th className="text-left p-4">SKU</th>
                        <th className="text-left p-4">分類</th>
                        <th className="text-left p-4 cursor-pointer hover:bg-gray-50" 
                            onClick={() => {
                              setSortField('price')
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            }}>
                          <div className="flex items-center gap-1">
                            價格 <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="text-left p-4">庫存</th>
                        <th className="text-left p-4">狀態</th>
                        <th className="text-left p-4">銷量</th>
                        <th className="w-20 p-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50/50">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(prev => [...prev, product.id])
                                } else {
                                  setSelectedProducts(prev => prev.filter(id => id !== product.id))
                                }
                              }}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                {product.images[0] ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium line-clamp-1">{product.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  更新: {product.updatedAt.toLocaleDateString('zh-TW')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono">{product.sku}</td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              {product.series && (
                                <div>
                                  <Badge variant="outline" className="text-xs">{product.series}</Badge>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {priceEditingId === product.id ? (
                              <Input
                                type="number"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                onBlur={() => handlePriceEdit(product.id, editingPrice)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handlePriceEdit(product.id, editingPrice)
                                  } else if (e.key === 'Escape') {
                                    setPriceEditingId(null)
                                    setEditingPrice('')
                                  }
                                }}
                                className="w-24 h-8 text-sm"
                                autoFocus
                              />
                            ) : (
                              <button
                                className="text-left hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                onClick={() => {
                                  setPriceEditingId(product.id)
                                  setEditingPrice(product.standardPrice.toString())
                                }}
                              >
                                <div className="font-medium">NT${product.standardPrice.toLocaleString()}</div>
                                {product.costPrice && (
                                  <div className="text-xs text-muted-foreground">
                                    成本: NT${product.costPrice.toLocaleString()}
                                  </div>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="p-4">
                            {product.stockQuantity !== undefined ? (
                              <div className="space-y-1">
                                <div className="font-medium">{product.stockQuantity}</div>
                                {product.stockQuantity <= (product.lowStockThreshold || 10) && (
                                  <div className="text-xs text-yellow-600">庫存不足</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">無庫存管理</span>
                            )}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(product)}
                          </td>
                          <td className="p-4 text-sm">
                            {product.salesCount !== undefined ? product.salesCount : '-'}
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  檢視
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  編輯
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleProductStatus(product.id, product.isActive)}>
                                  {product.isActive ? '下架商品' : '上架商品'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  刪除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}