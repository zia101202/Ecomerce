-- Create themes table for admin theme customization
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  light_colors JSONB NOT NULL,
  dark_colors JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Themes are viewable by everyone" 
ON public.themes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage themes" 
ON public.themes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create trigger for timestamps
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default themes
INSERT INTO public.themes (name, description, light_colors, dark_colors, is_active) VALUES
('Ocean Breeze', 'Cool blues and whites inspired by the ocean', 
 '{
   "background": "210 40% 98%",
   "foreground": "222.2 84% 4.9%",
   "card": "210 40% 98%",
   "card-foreground": "222.2 84% 4.9%",
   "popover": "210 40% 98%",
   "popover-foreground": "222.2 84% 4.9%",
   "primary": "210 100% 50%",
   "primary-foreground": "210 40% 98%",
   "secondary": "210 40% 96.1%",
   "secondary-foreground": "210 100% 20%",
   "muted": "210 40% 96.1%",
   "muted-foreground": "215.4 16.3% 46.9%",
   "accent": "210 100% 85%",
   "accent-foreground": "210 100% 20%",
   "destructive": "0 84.2% 60.2%",
   "destructive-foreground": "210 40% 98%",
   "border": "210 40% 85%",
   "input": "210 40% 85%",
   "ring": "210 100% 50%"
 }',
 '{
   "background": "210 50% 8%",
   "foreground": "210 40% 98%",
   "card": "210 50% 8%",
   "card-foreground": "210 40% 98%",
   "popover": "210 50% 8%",
   "popover-foreground": "210 40% 98%",
   "primary": "210 100% 70%",
   "primary-foreground": "210 50% 8%",
   "secondary": "210 30% 15%",
   "secondary-foreground": "210 40% 98%",
   "muted": "210 30% 15%",
   "muted-foreground": "215 20.2% 65.1%",
   "accent": "210 50% 25%",
   "accent-foreground": "210 40% 98%",
   "destructive": "0 62.8% 30.6%",
   "destructive-foreground": "210 40% 98%",
   "border": "210 30% 18%",
   "input": "210 30% 18%",
   "ring": "210 100% 70%"
 }', true),

('Sunset Glow', 'Warm oranges and reds like a beautiful sunset',
 '{
   "background": "30 40% 98%",
   "foreground": "20 14.3% 4.1%",
   "card": "30 40% 98%",
   "card-foreground": "20 14.3% 4.1%",
   "popover": "30 40% 98%",
   "popover-foreground": "20 14.3% 4.1%",
   "primary": "24 95% 53%",
   "primary-foreground": "30 40% 98%",
   "secondary": "30 40% 96.1%",
   "secondary-foreground": "24 70% 20%",
   "muted": "30 40% 96.1%",
   "muted-foreground": "25 5.3% 44.7%",
   "accent": "24 90% 85%",
   "accent-foreground": "24 70% 20%",
   "destructive": "0 84.2% 60.2%",
   "destructive-foreground": "30 40% 98%",
   "border": "30 40% 85%",
   "input": "30 40% 85%",
   "ring": "24 95% 53%"
 }',
 '{
   "background": "20 50% 8%",
   "foreground": "30 40% 98%",
   "card": "20 50% 8%",
   "card-foreground": "30 40% 98%",
   "popover": "20 50% 8%",
   "popover-foreground": "30 40% 98%",
   "primary": "24 95% 65%",
   "primary-foreground": "20 50% 8%",
   "secondary": "20 30% 15%",
   "secondary-foreground": "30 40% 98%",
   "muted": "20 30% 15%",
   "muted-foreground": "25 15% 65.1%",
   "accent": "24 60% 25%",
   "accent-foreground": "30 40% 98%",
   "destructive": "0 62.8% 30.6%",
   "destructive-foreground": "30 40% 98%",
   "border": "20 30% 18%",
   "input": "20 30% 18%",
   "ring": "24 95% 65%"
 }', false),

('Forest Green', 'Natural greens inspired by lush forests',
 '{
   "background": "120 40% 98%",
   "foreground": "120 14.3% 4.1%",
   "card": "120 40% 98%",
   "card-foreground": "120 14.3% 4.1%",
   "popover": "120 40% 98%",
   "popover-foreground": "120 14.3% 4.1%",
   "primary": "142 76% 36%",
   "primary-foreground": "120 40% 98%",
   "secondary": "120 40% 96.1%",
   "secondary-foreground": "142 60% 20%",
   "muted": "120 40% 96.1%",
   "muted-foreground": "125 5.3% 44.7%",
   "accent": "142 50% 85%",
   "accent-foreground": "142 60% 20%",
   "destructive": "0 84.2% 60.2%",
   "destructive-foreground": "120 40% 98%",
   "border": "120 40% 85%",
   "input": "120 40% 85%",
   "ring": "142 76% 36%"
 }',
 '{
   "background": "120 50% 8%",
   "foreground": "120 40% 98%",
   "card": "120 50% 8%",
   "card-foreground": "120 40% 98%",
   "popover": "120 50% 8%",
   "popover-foreground": "120 40% 98%",
   "primary": "142 76% 55%",
   "primary-foreground": "120 50% 8%",
   "secondary": "120 30% 15%",
   "secondary-foreground": "120 40% 98%",
   "muted": "120 30% 15%",
   "muted-foreground": "125 15% 65.1%",
   "accent": "142 40% 25%",
   "accent-foreground": "120 40% 98%",
   "destructive": "0 62.8% 30.6%",
   "destructive-foreground": "120 40% 98%",
   "border": "120 30% 18%",
   "input": "120 30% 18%",
   "ring": "142 76% 55%"
 }', false),

('Royal Purple', 'Rich purples for an elegant and luxurious feel',
 '{
   "background": "270 40% 98%",
   "foreground": "270 14.3% 4.1%",
   "card": "270 40% 98%",
   "card-foreground": "270 14.3% 4.1%",
   "popover": "270 40% 98%",
   "popover-foreground": "270 14.3% 4.1%",
   "primary": "262 83% 58%",
   "primary-foreground": "270 40% 98%",
   "secondary": "270 40% 96.1%",
   "secondary-foreground": "262 60% 20%",
   "muted": "270 40% 96.1%",
   "muted-foreground": "275 5.3% 44.7%",
   "accent": "262 60% 85%",
   "accent-foreground": "262 60% 20%",
   "destructive": "0 84.2% 60.2%",
   "destructive-foreground": "270 40% 98%",
   "border": "270 40% 85%",
   "input": "270 40% 85%",
   "ring": "262 83% 58%"
 }',
 '{
   "background": "270 50% 8%",
   "foreground": "270 40% 98%",
   "card": "270 50% 8%",
   "card-foreground": "270 40% 98%",
   "popover": "270 50% 8%",
   "popover-foreground": "270 40% 98%",
   "primary": "262 83% 70%",
   "primary-foreground": "270 50% 8%",
   "secondary": "270 30% 15%",
   "secondary-foreground": "270 40% 98%",
   "muted": "270 30% 15%",
   "muted-foreground": "275 15% 65.1%",
   "accent": "262 50% 25%",
   "accent-foreground": "270 40% 98%",
   "destructive": "0 62.8% 30.6%",
   "destructive-foreground": "270 40% 98%",
   "border": "270 30% 18%",
   "input": "270 30% 18%",
   "ring": "262 83% 70%"
 }', false);