import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  id: string;
  store_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  is_active: boolean;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    
    // Listen for real-time updates
    const channel = supabase
      .channel('site-settings-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'site_settings' },
        (payload) => {
          if (payload.new && payload.new.is_active) {
            setSettings(payload.new as SiteSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error loading site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    refreshSettings: loadSettings
  };
}