import { useEffect, useState } from 'react';
import { Plus, X, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProductsStore } from '@/store/products';

interface HomeCategory {
  id: string;
  category_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    description?: string;
  };
}

const HomeCategoriesManager = () => {
  const { categories, loadCategories } = useProductsStore();
  const { toast } = useToast();
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadCategories();
    loadHomeCategories();
  }, []);

  const loadHomeCategories = async () => {
    try {
     const { data, error } = await supabase
  .from('home_categories')
  .select(`
    *,
    categories:forign (name)
  `);

console.log('Loaded home categories:', data);
      if (error) {
        console.error('Error loading home categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load home categories.',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setHomeCategories(data);
      }
    } catch (error) {
      console.error('Error loading home categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load home categories.',
        variant: 'destructive',
      });
    }
  };

  const addHomeCategory = async () => {
    if (!selectedCategoryId) {
      toast({
        title: 'Error',
        description: 'Please select a category.',
        variant: 'destructive',
      });
      return;
    }

    // Check if category is already added
    const alreadyExists = homeCategories.some(hc => hc.category_id === selectedCategoryId);
    if (alreadyExists) {
      toast({
        title: 'Error',
        description: 'This category is already added to home page.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('home_categories')
        .insert([
          {
           forign: selectedCategoryId,
           
            
          },
        ]);

      if (error) {
        console.error('Error adding home category:', error);
        toast({
          title: 'Error',
          description: 'Failed to add category to home page.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Category added to home page successfully!',
      });

      // Reset form and reload
      setSelectedCategoryId('');
      setDisplayOrder(homeCategories.length + 1);
      setIsAddingNew(false);
      loadHomeCategories();
    } catch (error) {
      console.error('Error adding home category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category to home page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateHomeCategoryStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('home_categories')
        .update({ 
          is_active: isActive,
       
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating home category:', error);
        toast({
          title: 'Error',
          description: 'Failed to update category status.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Category ${isActive ? 'activated' : 'deactivated'} successfully!`,
      });

      loadHomeCategories();
    } catch (error) {
      console.error('Error updating home category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category status.',
        variant: 'destructive',
      });
    }
  };

  const updateDisplayOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('home_categories')
        .update({ 
          display_order: newOrder,
       
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating display order:', error);
        toast({
          title: 'Error',
          description: 'Failed to update display order.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Display order updated successfully!',
      });

      loadHomeCategories();
    } catch (error) {
      console.error('Error updating display order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update display order.',
        variant: 'destructive',
      });
    }
  };

  const removeHomeCategory = async (id: string) => {
    if (!confirm('Are you sure you want to remove this category from home page?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('home_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing home category:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove category from home page.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Category removed from home page successfully!',
      });

      loadHomeCategories();
    } catch (error) {
      console.error('Error removing home category:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove category from home page.',
        variant: 'destructive',
      });
    }
  };

  const availableCategories = categories.filter(
    cat => !homeCategories.some(hc => hc.category_id === cat.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Home Page Categories</h2>
          <p className="text-muted-foreground">Manage which categories appear on the home page</p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Add New Category Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add Category to Home Page
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingNew(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Select Category</Label>
                <select
                  id="category"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose a category...</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  min={1}
                  placeholder="Display order"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addHomeCategory}
                disabled={isLoading || !selectedCategoryId}
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Adding...' : 'Add Category'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Categories List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Home Page Categories</h3>
        {homeCategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No categories added to home page yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {homeCategories.map((homeCategory) => (
              <Card key={homeCategory.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">#{homeCategory.display_order}</Badge>
                      <h4 className="font-medium">{homeCategory.categories?.name}</h4>
                      {homeCategory.categories?.description && (
                        <span className="text-sm text-muted-foreground">
                          - {homeCategory.categories.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {homeCategory.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Label htmlFor={`order-${homeCategory.id}`} className="text-xs">
                        Order:
                      </Label>
                      <Input
                        id={`order-${homeCategory.id}`}
                        type="number"
                        value={homeCategory.display_order}
                        onChange={(e) => {
                          const newOrder = parseInt(e.target.value) || 1;
                          updateDisplayOrder(homeCategory.id, newOrder);
                        }}
                        className="w-16 h-8 text-xs"
                        min={1}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Label htmlFor={`active-${homeCategory.id}`} className="text-xs">
                        Active:
                      </Label>
                      <Switch
                        id={`active-${homeCategory.id}`}
                        checked={homeCategory.is_active}
                        onCheckedChange={(checked) => 
                          updateHomeCategoryStatus(homeCategory.id, checked)
                        }
                      />
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeHomeCategory(homeCategory.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Categories Info */}
      {availableCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomeCategoriesManager;