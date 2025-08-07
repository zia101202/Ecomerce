import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (heroContent && heroContent.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => 
          prev === heroContent.images.length - 1 ? 0 : prev + 1
        );
      }, 5000); // Auto-slide every 5 seconds
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 overflow-hidden">
        {/* Background Image Slider */}
        {heroContent && heroContent.images.length > 0 && (
          <div className="absolute inset-0 z-0">
            <div className="relative w-full h-full">
              <img
                src={heroContent.images[currentImageIndex]}
                alt="Hero background"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-secondary/10" />
            </div>
            
            {/* Image Navigation */}
            {heroContent.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/20 hover:bg-background/40"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/20 hover:bg-background/40"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                  {heroContent.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-primary' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {heroContent?.subtitle && (
              <Badge className="mb-4" variant="secondary">
                {heroContent.subtitle}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {heroContent?.title || 'Discover Amazing Products at Unbeatable Prices'}
            </h1>
            {heroContent?.description && (
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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

        {/* Featured Products Preview in Hero */}
        {featuredProducts.length > 0 && (
          <div className="container mx-auto px-4 mt-16 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => window.location.href = `/products/${product.id}`}
                >
                  <div className="relative overflow-hidden rounded-lg bg-background/80 backdrop-blur-sm border border-white/20 hover:scale-105 transition-all duration-300">
                    <div className="h-32 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      <span className="text-primary font-bold">${product.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  <div className="h-48 bg-muted overflow-hidden">
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
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  
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

          <div className="text-center">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
