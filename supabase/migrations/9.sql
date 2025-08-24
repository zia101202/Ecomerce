-- Fix the themes table RLS policy to use the proper has_role function
DROP POLICY IF EXISTS "Admins can manage themes" ON public.themes;

CREATE POLICY "Admins can manage themes" 
ON public.themes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));