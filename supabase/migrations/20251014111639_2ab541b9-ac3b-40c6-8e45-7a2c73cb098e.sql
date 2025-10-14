-- Add paint_calculations column to rooms table for caching
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS paint_calculations JSONB DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_paint_calculations 
ON public.rooms USING gin(paint_calculations);
