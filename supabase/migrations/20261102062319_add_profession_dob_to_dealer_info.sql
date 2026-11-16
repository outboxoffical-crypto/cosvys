ALTER TABLE public.dealer_info
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
