-- Add delivery_date column to material_tracker table
ALTER TABLE material_tracker ADD COLUMN IF NOT EXISTS delivery_date date;