-- Backfill any legacy dealer_info rows that are missing a shop name.
-- This prevents null constraint failures during account setup and keeps the column valid.
UPDATE public.dealer_info
SET shop_name = COALESCE(shop_name, dealer_name, 'Shop')
WHERE shop_name IS NULL;

-- Ensure the column remains required for future records.
ALTER TABLE public.dealer_info
ALTER COLUMN shop_name SET NOT NULL;

