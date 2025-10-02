-- Fix linter: set search_path for function
CREATE OR REPLACE FUNCTION public.update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;