-- Add category and is_visible columns to product_pricing table
ALTER TABLE public.product_pricing 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_pricing_category_visible 
ON public.product_pricing(category, is_visible) 
WHERE is_visible = true;