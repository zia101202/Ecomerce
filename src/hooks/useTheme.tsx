import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Theme {
  id: string;
  name: string;
  light_colors: any;
  dark_colors: any;
  is_active: boolean;
}

export function useTheme() {
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveTheme();
  }, []);

  const loadActiveTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading active theme:', error);
        return;
      }

      if (data) {
        setActiveTheme(data);
        applyTheme(data);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const colors = isDark ? theme.dark_colors : theme.light_colors;

    // Apply CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, String(value));
    });
  };

  // Listen for theme changes from other tabs/windows
  useEffect(() => {
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'themes' },
        (payload) => {
          if (payload.new && payload.new.is_active) {
            setActiveTheme(payload.new as Theme);
            applyTheme(payload.new as Theme);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-apply theme when dark mode changes
  useEffect(() => {
    if (activeTheme) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            applyTheme(activeTheme);
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });

      return () => observer.disconnect();
    }
  }, [activeTheme]);

  return {
    activeTheme,
    loading,
    refreshTheme: loadActiveTheme
  };
}