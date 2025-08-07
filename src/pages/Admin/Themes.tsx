import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface Theme {
  id: string;
  name: string;
  description: string | null;
  light_colors: any;
  dark_colors: any;
  is_active: boolean;
}

export default function Themes() {
  const { isAdmin, user } = useAuthStore();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadThemes();
  }, []);

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  const loadThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error loading themes:', error);
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activateTheme = async (themeId: string) => {
    setActivating(themeId);
    try {
    // First, deactivate all themes
    await supabase
      .from('themes')
      .update({ is_active: false })
      .not('id', 'is', null); // Deactivate all themes

      // Then activate the selected theme
      const { error } = await supabase
        .from('themes')
        .update({ is_active: true })
        .eq('id', themeId);

      if (error) throw error;

      // Update local state
      setThemes(themes.map(theme => ({
        ...theme,
        is_active: theme.id === themeId
      })));

      toast({
        title: "Success",
        description: "Theme activated successfully",
      });

      // Reload the page to apply the new theme
      window.location.reload();
    } catch (error) {
      console.error('Error activating theme:', error);
      toast({
        title: "Error",
        description: "Failed to activate theme",
        variant: "destructive",
      });
    } finally {
      setActivating(null);
    }
  };

  const renderColorPreview = (colors: any) => {
    const previewColors = ['primary', 'secondary', 'accent', 'background'];
    return (
      <div className="flex gap-1">
        {previewColors.map(colorKey => {
          const colorValue = colors[colorKey];
          if (!colorValue) return null;
          
          return (
            <div
              key={colorKey}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: `hsl(${colorValue})` }}
              title={colorKey}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Theme Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Theme Management</h1>
        </div>
        <Badge variant="secondary">
          {themes.filter(t => t.is_active).length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card key={theme.id} className={`relative ${theme.is_active ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {theme.name}
                  {theme.is_active && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
                {theme.is_active && <Badge variant="default">Active</Badge>}
              </div>
              {theme.description && (
                <CardDescription>{theme.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Light Mode</span>
                  {renderColorPreview(theme.light_colors)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dark Mode</span>
                  {renderColorPreview(theme.dark_colors)}
                </div>
              </div>
              
              <Button
                onClick={() => activateTheme(theme.id)}
                disabled={theme.is_active || activating === theme.id}
                className="w-full"
                variant={theme.is_active ? "secondary" : "default"}
              >
                {activating === theme.id ? "Activating..." : 
                 theme.is_active ? "Currently Active" : "Activate Theme"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Theme Management</CardTitle>
          <CardDescription>
            Customize your website's appearance by selecting from predefined themes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Themes control colors for both light and dark modes</li>
            <li>• Only one theme can be active at a time</li>
            <li>• Changes apply immediately across your entire website</li>
            <li>• All UI components automatically use the active theme colors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}