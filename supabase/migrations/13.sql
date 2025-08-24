-- Create site settings table for dynamic logo and store name
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'E-Commerce Store',
  logo_url text,
  favicon_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active site settings" 
ON public.site_settings 
FOR SELECT 
USING (is_active = true);

-- Create trigger for timestamps
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (store_name, is_active) 
VALUES ('E-Commerce Store', true);

-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true);

-- Create storage policies for site assets
CREATE POLICY "Site assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));