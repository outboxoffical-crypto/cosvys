-- Add user_id column to rooms table for user isolation
ALTER TABLE public.rooms ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_rooms_user_id ON public.rooms(user_id);

-- Drop the insecure "Allow all operations" policy
DROP POLICY IF EXISTS "Allow all operations on rooms" ON public.rooms;

-- Create secure RLS policies that restrict access to room owners only
CREATE POLICY "Users can view their own rooms"
ON public.rooms
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rooms"
ON public.rooms
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rooms"
ON public.rooms
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms"
ON public.rooms
FOR DELETE
USING (auth.uid() = user_id);

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create dealer_info table for secure storage
CREATE TABLE public.dealer_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dealer_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  employee_id TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  margin NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dealer_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dealer info"
ON public.dealer_info
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dealer info"
ON public.dealer_info
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dealer info"
ON public.dealer_info
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create product_pricing table for secure storage
CREATE TABLE public.product_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  sizes JSONB NOT NULL DEFAULT '{}',
  margin NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_name)
);

ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own product pricing"
ON public.product_pricing
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dealer_info_updated_at
BEFORE UPDATE ON public.dealer_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_pricing_updated_at
BEFORE UPDATE ON public.product_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();