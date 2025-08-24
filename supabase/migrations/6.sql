-- Create hero_content table for dynamic hero section management
CREATE TABLE public.hero_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  button_text TEXT DEFAULT 'Shop Now',
  button_link TEXT DEFAULT '/products',
  secondary_button_text TEXT DEFAULT 'Create Account',
  secondary_button_link TEXT DEFAULT '/auth?mode=signup',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active hero content" 
ON public.hero_content 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage hero content" 
ON public.hero_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_hero_content_updated_at
BEFORE UPDATE ON public.hero_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero content
INSERT INTO public.hero_content (
  title,
  subtitle,
  description,
  images
) VALUES (
  'Discover Amazing Products at Unbeatable Prices',
  '✨ Welcome to the Future of Shopping',
  'Shop the latest trends, find unique items, and enjoy a seamless shopping experience with fast delivery and excellent customer service.',
  '{}'
);