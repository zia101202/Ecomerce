import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Loader2, Upload, Trash2 } from 'lucide-react';

interface SiteSettings {
  id: string;
  store_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  is_active: boolean;
}

export default function SiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const { toast } = useToast();
  const { user, hasRole } = useAuthStore();

  // Redirect non-admin users
  if (!user || !hasRole('admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading site settings:', error);
        toast({
          title: "Error",
          description: "Failed to load site settings",
          variant: "destructive",
        });
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error loading site settings:', error);
      toast({
        title: "Error",
        description: "Failed to load site settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'logo_url' : 'favicon_url';
      setSettings(prev => prev ? { ...prev, [field]: data.publicUrl } : null);

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = (type: 'logo' | 'favicon') => {
    const field = type === 'logo' ? 'logo_url' : 'favicon_url';
    setSettings(prev => prev ? { ...prev, [field]: null } : null);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          store_name: settings.store_name,
          logo_url: settings.logo_url,
          favicon_url: settings.favicon_url,
        })
        .eq('id', settings.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Site settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          No site settings found.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Site Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Brand Configuration</CardTitle>
            <CardDescription>
              Manage your store's branding and appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                placeholder="Enter store name"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo preview" 
                      className="h-12 w-12 object-contain rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage('logo')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-12 w-12 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    disabled={uploading === 'logo'}
                    className="w-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: PNG or SVG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                {settings.favicon_url ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={settings.favicon_url} 
                      alt="Favicon preview" 
                      className="h-8 w-8 object-contain rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage('favicon')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-8 w-8 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                    <Upload className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'favicon');
                    }}
                    disabled={uploading === 'favicon'}
                    className="w-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: PNG, 32x32px or 16x16px
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || uploading !== null}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}