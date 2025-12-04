-- Add sub_areas column to rooms table for independent paintable sections
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS sub_areas jsonb DEFAULT '[]'::jsonb;