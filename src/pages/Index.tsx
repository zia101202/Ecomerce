import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Star, Truck, Shield, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductsStore } from '@/store/products';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import React, { useRef, useState, useEffect } from 'react';

interface HeroContent {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  images: string[];
  button_text: string;
  button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  is_active: boolean;
}

const Index = () => {
  const { products, loadProducts } = useProductsStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [homeCategories, setHomeCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showHomeProducts, setShowHomeProducts] = useState<any>({});
  
  // Scroll refs and states for each category
  const scrollRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [scrollStates, setScrollStates] = useState<{[key: string]: {showLeft: boolean, showRight: boolean}}>({});

  useEffect(() => {
    loadProducts();
    loadHeroContent();
  }, []);

  const loadHeroContent = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_content')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading hero content:', error);
        return;
      }

      if (data) {
        setHeroContent(data);
      }
    } catch (error) {
      console.error('Error loading hero content:', error);
    }
  };

  useEffect(() => {
    const fetchHomeCategories = async () => {
      const { data, error } = await supabase
        .from("home_categories")
        .select(`
          *,
          categories:forign (name)
        `);
      
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        console.log("Fetched data:", data);
        setHomeCategories(data || []);
      }
    };

    fetchHomeCategories();

    const fetchAllProducts = async () => {
       const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category_id ( id, name )
    `);

  console.log(data);

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        console.log("Fetched data:", data);
        setAllProducts(data || []);
      }
    };

    fetchAllProducts();
  }, []);

  const featuredProducts = products.slice(0, 4);

  const nextImage = () => {
    if (heroContent && heroContent.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === heroContent.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (heroContent && heroContent.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? heroContent.images.length - 1 : prev - 1
      );
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    if (heroContent && heroContent.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => 
          prev === heroContent.images.length - 1 ? 0 : prev + 1
        );
      }, 4000); // Auto-slide every 4 seconds
      return () => clearInterval(interval);
    }
  }, [heroContent?.images.length]);

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

  function filterProductsByHomeCategories(allProducts, homeCategories) {
    // Step 1: Filter active home categories and sort by display_order
    const activeCategories = homeCategories
      .filter(cat => cat.is_active)
      .sort((a, b) => a.display_order - b.display_order);

    // Group products by category
    const categorizedProducts = {};
    
    activeCategories.forEach(homeCat => {
      const categoryProducts = allProducts.filter(product => 
        product.category_id.id === homeCat.forign && product.is_active
      );
      
      if (categoryProducts.length > 0) {
        categorizedProducts[homeCat.categories.name] = {
          ...homeCat,
          products: categoryProducts
        };
      }
    });

    return categorizedProducts;
  }

  useEffect(() => {
    const result = filterProductsByHomeCategories(allProducts, homeCategories);
    console.log('Filtered Products:', result);
    setShowHomeProducts(result);
  },[allProducts, homeCategories]);

  // Scroll arrow functionality
  const checkScrollButtons = (categoryKey: string) => {
    const container = scrollRefs.current[categoryKey];
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      setScrollStates(prev => ({
        ...prev,
        [categoryKey]: {
          showLeft: scrollLeft > 0,
          showRight: scrollLeft < scrollWidth - clientWidth - 1
        }
      }));
    }
  };

  const scroll = (categoryKey: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[categoryKey];
    if (container) {
      const scrollAmount = 260; // Slightly more than card width (250px + gap)
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Check scroll buttons for all categories when showHomeProducts changes
    Object.keys(showHomeProducts).forEach(categoryKey => {
      checkScrollButtons(categoryKey);
    });

    const handleResize = () => {
      Object.keys(showHomeProducts).forEach(categoryKey => {
        checkScrollButtons(categoryKey);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showHomeProducts]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Simplified without background slider */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {heroContent?.subtitle && (
              <Badge className="mb-4" variant="secondary">
                {heroContent.subtitle}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text">
              {heroContent?.title || 'Discover Amazing Products at Unbeatable Prices'}
            </h1>
            {heroContent?.description && (
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {heroContent.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={heroContent?.button_link || '/products'}>
                <Button size="lg" className="group">
                  {heroContent?.button_text || 'Shop Now'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={heroContent?.secondary_button_link || '/auth?mode=signup'}>
                <Button size="lg" variant="outline">
                  {heroContent?.secondary_button_text || 'Create Account'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Check out our handpicked selection of the best products just for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-muted overflow-hidden cursor-pointer">
                    <Link to={`/products/${product.id}`}>
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
                    </Link>
                  </div>
                </div>

                <CardContent className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold line-clamp-2 mb-2 hover:text-primary transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">${product.price}</span>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mb-12">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {Object.entries(showHomeProducts).map(([categoryKey, category]) => (
            <div key={category.id} className="mb-12">
              {/* Category Title */}
              <h2 className="text-2xl font-bold mb-4">{category.categories.name}</h2>

              {/* Horizontal Scrollable Section with Arrows */}
              <div className="relative group">
                {/* Left Arrow */}
                {scrollStates[categoryKey]?.showLeft && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => scroll(categoryKey, 'left')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}

                {/* Right Arrow */}
                {scrollStates[categoryKey]?.showRight && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => scroll(categoryKey, 'right')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                {/* Scrollable Container */}
                <div 
                  ref={(el) => {
                    scrollRefs.current[categoryKey] = el;
                  }}
                  className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4" 
                  style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* Internet Explorer and Edge */
                  }}
                  onScroll={() => checkScrollButtons(categoryKey)}
                >
                  {category.products.map((product) => (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-shadow overflow-hidden min-w-[250px] flex-shrink-0"
                    >
                      <div className="relative">
                        <div className="h-48 bg-muted overflow-hidden cursor-pointer">
                          <Link to={`/products/${product.id}`}>
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
                          </Link>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <Link to={`/products/${product.id}`}>
                          <h3 className="font-semibold line-clamp-2 mb-2 hover:text-primary transition-colors cursor-pointer">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold">${product.price}</span>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(product.id)}
                          className="w-full"
                          size="sm"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Slider Section */}
      {heroContent && heroContent.images && heroContent.images.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Gallery</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our collection through these beautiful showcase images.
              </p>
            </div>

            <div className="relative max-w-6xl mx-auto">
              {/* Main Slider Container */}
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={heroContent.images[currentImageIndex]}
                  alt={`Slide ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                
                {/* Navigation Arrows */}
                {heroContent.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {heroContent.images.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2 overflow-x-auto pb-2">
                  {heroContent.images.map((image, index) => (
                    <button
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary scale-110' 
                          : 'border-transparent hover:border-primary/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Image Indicators */}
              {heroContent.images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {heroContent.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-primary' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-muted-foreground">Free shipping on orders over $50</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-muted-foreground">100% secure payment processing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">Round-the-clock customer support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;