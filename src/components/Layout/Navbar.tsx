import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, LogOut, Settings, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useProductsStore } from '@/store/products';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { setFilters } = useProductsStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { settings: siteSettings } = useSiteSettings();

  console.log(isAdmin, 'isAdmin from navbar');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCategoryClick = (categoryId: string) => {
    setFilters({ categoryId });
    navigate('/products');
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (searchQuery.trim()) {
      setFilters({ searchQuery: searchQuery.trim() });
      navigate('/products');
      setIsSearchExpanded(false);
    }
  };

 const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);
  
  // Real-time search: update filters as user types
  if (value.trim()) {
    setFilters({ searchQuery: value.trim() });
    // Navigate to products page if not already there
    if (location.pathname !== '/products') {
      navigate('/products');
    }
  } else {
    // Clear filters when search is empty
    setFilters({ searchQuery: '' });
  }
};

 const clearSearch = () => {
  setSearchQuery('');
  setIsSearchExpanded(false);
  // Reset the search filter to show all products
  setFilters({ searchQuery: '' });
};
const toggleSearch = () => {
  setIsSearchExpanded(!isSearchExpanded);
  if (!isSearchExpanded) {
    setTimeout(() => {
      const searchInput = document.getElementById('navbar-search');
      searchInput?.focus();
    }, 100);
  } else {
    setSearchQuery('');
    // Also clear filters when closing search
    setFilters({ searchQuery: '' });
  }
};

  return (
    <nav className="sticky    top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {siteSettings?.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.store_name}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">
                  {siteSettings?.store_name?.[0] || 'E'}
                </span>
              </div>
            )}
            <span className="font-bold sm:text-xl text-[12px]">
              {siteSettings?.store_name || 'ECommerce'}
            </span>
          </Link>

          {/* Center Section - Navigation Menu and Search */}
          <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-4">
            
            <div className="flex-1 max-w-md relative">
              {/* Desktop Search */}
              <form onSubmit={handleSearch} className="hidden md:flex">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="navbar-search"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="pl-10 pr-4 h-9"
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </form>

              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className="md:hidden"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                <ThemeToggle />
                <Link to="/wishlist" className="relative hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="sm">
                    <ShoppingCart className="w-5 h-5" />
                    {getTotalItems() > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                        {getTotalItems()}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} className="sm:hidden">
                      <Heart className="w-4 h-4 mr-2" />
                      Wishlist
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup" className="hidden sm:block">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search Expanded */}
        {isSearchExpanded && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="mobile-search"
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="pl-10 pr-4"
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSearch}>
                Cancel
              </Button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};