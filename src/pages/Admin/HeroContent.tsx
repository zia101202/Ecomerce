import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCloudinary } from '@/hooks/useCloudinary';

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

const HeroContent = () => {
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { uploadImage, isUploading } = useCloudinary();

  useEffect(() => {
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
        throw error;
      }

      if (data) {
        setHeroContent(data);
      } else {
        // Create default hero content if none exists
        const { data: newData, error: insertError } = await supabase
          .from('hero_content')
          .insert({
            title: 'Discover Amazing Products at Unbeatable Prices',
            subtitle: '✨ Welcome to the Future of Shopping',
            description: 'Shop the latest trends, find unique items, and enjoy a seamless shopping experience with fast delivery and excellent customer service.',
            images: [],
            button_text: 'Shop Now',
            button_link: '/products',
            secondary_button_text: 'Create Account',
            secondary_button_link: '/auth?mode=signup',
            is_active: true
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setHeroContent(newData);
      }
    } catch (error) {
      console.error('Error loading hero content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hero content.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!heroContent) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('hero_content')
        .update({
          title: heroContent.title,
          subtitle: heroContent.subtitle,
          description: heroContent.description,
          images: heroContent.images,
          button_text: heroContent.button_text,
          button_link: heroContent.button_link,
          secondary_button_text: heroContent.secondary_button_text,
          secondary_button_link: heroContent.secondary_button_link,
          is_active: heroContent.is_active
        })
        .eq('id', heroContent.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hero content updated successfully.',
      });
    } catch (error) {
      console.error('Error saving hero content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hero content.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !heroContent) return;

    try {
      const result = await uploadImage(file, { folder: 'hero' });
      if (result) {
        setHeroContent({
          ...heroContent,
          images: [...heroContent.images, result.url]
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image.',
        variant: 'destructive',
      });
    }
  };

  const removeImage = (index: number) => {
    if (!heroContent) return;
    const newImages = heroContent.images.filter((_, i) => i !== index);
    setHeroContent({ ...heroContent, images: newImages });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!heroContent) {
    return <div className="p-6">No hero content found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hero Section Management</h1>
          <p className="text-muted-foreground">Customize your homepage hero section</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={heroContent.is_active}
                onCheckedChange={(checked) => 
                  setHeroContent({ ...heroContent, is_active: checked })
                }
              />
              <Label>Active</Label>
            </div>

            <div>
              <Label htmlFor="title">Main Title</Label>
              <Input
                id="title"
                value={heroContent.title}
                onChange={(e) => 
                  setHeroContent({ ...heroContent, title: e.target.value })
                }
                placeholder="Enter main title"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle/Badge Text</Label>
              <Input
                id="subtitle"
                value={heroContent.subtitle || ''}
                onChange={(e) => 
                  setHeroContent({ ...heroContent, subtitle: e.target.value })
                }
                placeholder="Enter subtitle or badge text"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={heroContent.description || ''}
                onChange={(e) => 
                  setHeroContent({ ...heroContent, description: e.target.value })
                }
                placeholder="Enter description text"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Button Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">Primary Button Text</Label>
                <Input
                  id="button_text"
                  value={heroContent.button_text}
                  onChange={(e) => 
                    setHeroContent({ ...heroContent, button_text: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="button_link">Primary Button Link</Label>
                <Input
                  id="button_link"
                  value={heroContent.button_link}
                  onChange={(e) => 
                    setHeroContent({ ...heroContent, button_link: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="secondary_button_text">Secondary Button Text</Label>
                <Input
                  id="secondary_button_text"
                  value={heroContent.secondary_button_text}
                  onChange={(e) => 
                    setHeroContent({ ...heroContent, secondary_button_text: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="secondary_button_link">Secondary Button Link</Label>
                <Input
                  id="secondary_button_link"
                  value={heroContent.secondary_button_link}
                  onChange={(e) => 
                    setHeroContent({ ...heroContent, secondary_button_link: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hero Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Upload Images</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Add Image'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {heroContent.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Hero image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {heroContent.images.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No images added yet. Upload some images to make your hero section more attractive.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeroContent;