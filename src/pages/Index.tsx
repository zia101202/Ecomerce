import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Truck,
  Shield,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductsStore } from "@/store/products";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import React, { useRef, useState, useEffect } from "react";
import "./HeroAnimations.css"; // Import the CSS file

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
  const { products, categories, loadProducts, loadCategories } = useProductsStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [homeCategories, setHomeCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showHomeProducts, setShowHomeProducts] = useState<any>({});

  // Scroll refs and states for each category
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [scrollStates, setScrollStates] = useState<{
    [key: string]: { showLeft: boolean; showRight: boolean };
  }>({});

  // Categories scroll ref
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null);
  const [categoriesScrollState, setCategoriesScrollState] = useState({
    showLeft: false,
    showRight: false,
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadHeroContent();
  }, []);

  const loadHeroContent = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading hero content:", error);
        return;
      }

      if (data) {
        setHeroContent(data);
      }
    } catch (error) {
      console.error("Error loading hero content:", error);
    }
  };

  useEffect(() => {
    const fetchHomeCategories = async () => {
      const { data, error } = await supabase.from("home_categories").select(`
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
      const { data, error } = await supabase.from("products").select(`
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
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    await addItem(productId);
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart.",
    });
  };

  function filterProductsByHomeCategories(allProducts, homeCategories) {
    // Step 1: Filter active home categories and sort by display_order
    const activeCategories = homeCategories
      .filter((cat) => cat.is_active)
      .sort((a, b) => a.display_order - b.display_order);

    // Group products by category
    const categorizedProducts = {};

    activeCategories.forEach((homeCat) => {
      const categoryProducts = allProducts.filter(
        (product) =>
          product.category_id.id === homeCat.forign && product.is_active
      );

      if (categoryProducts.length > 0) {
        categorizedProducts[homeCat.categories.name] = {
          ...homeCat,
          products: categoryProducts,
        };
      }
    });

    return categorizedProducts;
  }

  useEffect(() => {
    const result = filterProductsByHomeCategories(allProducts, homeCategories);
    console.log("Filtered Products:", result);
    setShowHomeProducts(result);
  }, [allProducts, homeCategories]);

  // Scroll arrow functionality
  const checkScrollButtons = (categoryKey: string) => {
    const container = scrollRefs.current[categoryKey];
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      setScrollStates((prev) => ({
        ...prev,
        [categoryKey]: {
          showLeft: scrollLeft > 0,
          showRight: scrollLeft < scrollWidth - clientWidth - 1,
        },
      }));
    }
  };

  const scroll = (categoryKey: string, direction: "left" | "right") => {
    const container = scrollRefs.current[categoryKey];
    if (container) {
      const scrollAmount = 260; // Slightly more than card width (250px + gap)
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Categories scroll functionality
  const checkCategoriesScrollButtons = () => {
    const container = categoriesScrollRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCategoriesScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft < scrollWidth - clientWidth - 1,
      });
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    const container = categoriesScrollRef.current;
    if (container) {
      const scrollAmount = 260; // Slightly more than card width (250px + gap)
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // Check scroll buttons for all categories when showHomeProducts changes
    Object.keys(showHomeProducts).forEach((categoryKey) => {
      checkScrollButtons(categoryKey);
    });

    // Check categories scroll buttons
    checkCategoriesScrollButtons();

    const handleResize = () => {
      Object.keys(showHomeProducts).forEach((categoryKey) => {
        checkScrollButtons(categoryKey);
      });
      checkCategoriesScrollButtons();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showHomeProducts, categories]);

  return (
    <div className="min-h-screen mx-[20px]">
      {/* Professional Hero Section */}
      {heroContent && heroContent.images && heroContent.images.length > 0 && (
        <section className="relative rounded-[15px] mt-[20px] h-[30vh] sm:h-[50vh] md:h-[60vh] w-full max-w-[1200px] mx-auto overflow-hidden px-4 sm:px-0">
          {/* Background Image Slider */}
          <div className="absolute inset-0">
            {heroContent.images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {heroContent.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-7 h-7  md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all duration-300 group"
                onClick={prevImage}
              >
                <ChevronLeft className="w-2 h-2 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-7 h-7  md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all duration-300 group"
                onClick={nextImage}
              >
                <ChevronRight className="w-2 h-2 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="container mx-auto px-4 sm:px-6 text-center">
              <div className="max-w-4xl mx-auto">
                {/* Subtitle Badge */}
                {heroContent?.subtitle && (
                  <div className="inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 sm:mb-6 md:mb-8 animate-fade-in">
                    <span className="text-[10px] sm:text-sm font-medium text-white">
                      {heroContent.subtitle}
                    </span>
                  </div>
                )}

                {/* Main Title */}
                <h1 className="text-[15px] sm:text-3xl md:text-4xl lg:text-5xl xl:text-[35px] font-bold mb-4 sm:mb-6 md:mb-8 leading-tight animate-slide-up">
                  <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent drop-shadow-lg">
                    {heroContent?.title ||
                      "Discover Amazing Products at Unbeatable Prices"}
                  </span>
                </h1>

                {/* Description */}
                {heroContent?.description && (
                  <p className="text-sm sm:text-base hidden md:block md:text-lg lg:text-xl xl:text-[15px] text-gray-200 mb-6 sm:mb-8 md:mb-12 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
                    {heroContent.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center animate-slide-up animation-delay-400">
                  <Link to={heroContent?.button_link || "/products"}>
                    <Button
                      size="sm"
                      className="hidden sm:inline-flex w-full sm:w-auto group relative px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm sm:text-base md:text-lg rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 border-0"
                    >
                      <span className="flex items-center justify-center">
                        {heroContent?.button_text || "Shop Now"}
                        <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link
                    to={
                      heroContent?.secondary_button_link || "/auth?mode=signup"
                    }
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 hover:scale-105"
                    >
                      {heroContent?.secondary_button_text || "Create Account"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Slide Indicators */}
          {heroContent.images.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
              {heroContent.images.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 sm:h-1 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-white w-8 sm:w-10 md:w-12"
                      : "bg-white/50 w-1.5 sm:w-2 hover:bg-white/75"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our wide range of categories to find exactly what you're looking for.
            </p>
          </div>

          <div className="relative group">
            {/* Left Arrow */}
            {categoriesScrollState.showLeft && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => scrollCategories("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Right Arrow */}
            {categoriesScrollState.showRight && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => scrollCategories("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Scrollable Container */}
            <div
              ref={categoriesScrollRef}
              className="flex space-x-6  overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              onScroll={checkCategoriesScrollButtons}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="min-w-[250px] flex-shrink-0"
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer hover:scale-105">
                    <div className="relative">
                      <div className="h-48 bg-muted overflow-hidden">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover  group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-gray-100 to-gray-200">
                            <ShoppingBag className="w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-white/80 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-primary font-medium">
                        Explore Category
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Categories
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Check out our handpicked selection of the best products just for
              you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-shadow overflow-hidden"
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
                    <span className="text-lg font-bold">
                      {product.price} Rs
                    </span>
                  </div>

                  <Link to={`/products/${product.id}`}>
                    <Button className="w-full" size="sm">
                      Buy Now
                    </Button>
                  </Link>
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
              <h2 className="text-2xl font-bold mb-4">
                {category.categories.name}
              </h2>

              {/* Horizontal Scrollable Section with Arrows */}
              <div className="relative group">
                {/* Left Arrow */}
                {scrollStates[categoryKey]?.showLeft && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => scroll(categoryKey, "left")}
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
                    onClick={() => scroll(categoryKey, "right")}
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
                    scrollbarWidth: "none" /* Firefox */,
                    msOverflowStyle: "none" /* Internet Explorer and Edge */,
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
                          <span className="text-lg font-bold">
                            {product.price} Rs
                          </span>
                        </div>

                        <Link to={`/products/${product.id}`}>
                          <Button className="w-full" size="sm">
                            Buy Now
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;