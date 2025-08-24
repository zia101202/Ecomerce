import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, ShoppingCart, Filter, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useProductsStore } from '@/store/products';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Products() {
  const { 
    products, 
    categories, 
    isLoading, 
    filters,
    sortBy,
    sortOrder,
    loadProducts, 
    loadCategories, 
    setFilters, 
    setSorting,
    getFilteredProducts 
  } = useProductsStore();
  
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery || '');
  const [productReviews, setProductReviews] = useState<{[key: string]: {average: number, count: number}}>({});
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Handle URL category parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCurrentCategory(categoryParam);
      setFilters({ category: categoryParam });
    } else {
      setCurrentCategory(null);
      setFilters({ category: undefined });
    }
  }, [searchParams, setFilters]);

  // Load reviews for all products
  useEffect(() => {
    const loadProductReviews = async () => {
      if (products.length === 0) return;
      
      const productIds = products.map(p => p.id);
      
      const { data: reviews } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);

      if (reviews) {
        const reviewsMap: {[key: string]: {average: number, count: number}} = {};
        
        reviews.forEach(review => {
          if (!reviewsMap[review.product_id]) {
            reviewsMap[review.product_id] = { average: 0, count: 0 };
          }
          reviewsMap[review.product_id].count++;
        });

        // Calculate averages
        Object.keys(reviewsMap).forEach(productId => {
          const productReviewsData = reviews.filter(r => r.product_id === productId);
          const average = productReviewsData.reduce((sum, review) => sum + review.rating, 0) / productReviewsData.length;
          reviewsMap[productId].average = Math.round(average * 10) / 10;
        });

        setProductReviews(reviewsMap);
      }
    };

    loadProductReviews();
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      const maxPrice = Math.max(...products.map(p => p.price));
      setPriceRange([filters.minPrice || 0, filters.maxPrice || maxPrice]);
    }
  }, [products, filters]);

  const filteredProducts = getFilteredProducts();

  // Get current category name for display
  const getCurrentCategoryName = () => {
    if (!currentCategory) return null;
    const category = categories.find(cat => cat.id === currentCategory);
    return category ? category.name : null;
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to add items to cart.',
        variant: 'destructive',
      });
      return;
    }

    await addItem(productId);
    toast({
      title: 'Added to cart',
      description: 'Item has been added to your cart.',
    });
  };

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange);
    setFilters({
      minPrice: newRange[0],
      maxPrice: newRange[1],
    });
  };

  const handleSearch = () => {
    setFilters({ searchQuery: localSearchQuery });
  };

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      // Remove category from URL and filters
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('category');
        return newParams;
      });
      setCurrentCategory(null);
      setFilters({ category: undefined });
    } else {
      // Add category to URL and filters
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('category', categoryId);
        return newParams;
      });
      setCurrentCategory(categoryId);
      setFilters({ category: categoryId });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        

        {/* Products Grid */}
        <div className="flex-1">
          {/* Filters Row - Category and Price Range */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Categories */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select
                value={currentCategory || 'all'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Price Range</Label>
              <div className="space-y-3">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{priceRange[0]} Rs</span>
                  <span>{priceRange[1]} Rs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header with title and sort */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {getCurrentCategoryName() ? `${getCurrentCategoryName()} Products` : 'All Products'} 
                <span className="text-muted-foreground ml-2">({filteredProducts.length})</span>
              </h1>
              {getCurrentCategoryName() && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">{getCurrentCategoryName()}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCategoryChange('all')}
                    className="text-xs h-6"
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Label htmlFor="sort" className="text-sm">Sort by:</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSorting(field, order as 'asc' | 'desc');
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low to High</SelectItem>
                  <SelectItem value="price-desc">Price High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded mb-4" />
                    <div className="h-6 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {getCurrentCategoryName() 
                  ? `No products found in the ${getCurrentCategoryName()} category.`
                  : 'No products found matching your criteria.'
                }
              </p>
              {getCurrentCategoryName() && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleCategoryChange('all')}
                >
                  View All Products
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="h-48 bg-muted rounded-t-lg overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    {product.compare_price && product.compare_price > product.price && (
                      <Badge className="absolute top-2 left-2" variant="destructive">
                        {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                      </Badge>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {product.categories && (
                      <Badge variant="secondary" className="mt-1">
                        {product.categories.name}
                      </Badge>
                    )}

                    {productReviews[product.id] && (
                      <div className="flex items-center mt-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(productReviews[product.id].average) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({productReviews[product.id].average}) · {productReviews[product.id].count} review{productReviews[product.id].count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{product.price} Rs</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.compare_price} Rs
                          </span>
                        )}
                      </div>
                      
                      {product.inventory_count <= 5 && product.inventory_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {product.inventory_count} left
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddToCart(product.id)}
                      className="w-full"
                      disabled={product.inventory_count === 0}
                    >
                      {product.inventory_count === 0 ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FiltersContent = ({
  categories,
  filters,
  priceRange,
  localSearchQuery,
  currentCategory,
  setLocalSearchQuery,
  setFilters,
  handlePriceRangeChange,
  handleSearch,
  handleCategoryChange,
}: any) => (
  <div className="space-y-6">



  </div>
);