import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  images: string[];
  inventory_count: number;
}

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: Product;
}

const Wishlist = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWishlistItems();
    }
  }, [user]);

  const loadWishlistItems = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id,
          name,
          price,
          compare_price,
          images,
          inventory_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load wishlist items.',
        variant: 'destructive',
      });
    } else {
      setWishlistItems(data || []);
    }
    setIsLoading(false);
  };

  const removeFromWishlist = async (itemId: string) => {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist.',
        variant: 'destructive',
      });
    } else {
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: 'Removed',
        description: 'Item removed from wishlist.',
      });
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addItem(product.id, 1);
    toast({
      title: 'Added to cart',
      description: `${product.name} added to your cart.`,
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your wishlist.</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Heart className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Your Wishlist</h1>
        <Badge variant="secondary" className="ml-2">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding items you love to keep track of them!
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative aspect-square overflow-hidden">
                <Link to={`/products/${item.products.id}`}>
                  <img
                    src={item.products.images[0] || '/placeholder.svg'}
                    alt={item.products.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={() => removeFromWishlist(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <Link to={`/products/${item.products.id}`}>
                  <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {item.products.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold">${item.products.price}</span>
                  {item.products.compare_price && item.products.compare_price !== item.products.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${item.products.compare_price}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleAddToCart(item.products)}
                    disabled={item.products.inventory_count === 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {item.products.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>

                {item.products.inventory_count === 0 && (
                  <Badge variant="destructive" className="mt-2">
                    Out of Stock
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;