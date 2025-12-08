-- Add section_name column to rooms table for section header display
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS section_name text DEFAULT NULL;