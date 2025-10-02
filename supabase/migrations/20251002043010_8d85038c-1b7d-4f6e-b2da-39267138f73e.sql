-- Create rooms table to store room measurements
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  length DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL DEFAULT 0,
  project_type TEXT NOT NULL,
  pictures JSONB DEFAULT '[]'::jsonb,
  opening_areas JSONB DEFAULT '[]'::jsonb,
  extra_surfaces JSONB DEFAULT '[]'::jsonb,
  door_window_grills JSONB DEFAULT '[]'::jsonb,
  floor_area DECIMAL NOT NULL,
  wall_area DECIMAL NOT NULL,
  ceiling_area DECIMAL NOT NULL,
  adjusted_wall_area DECIMAL NOT NULL,
  total_opening_area DECIMAL DEFAULT 0,
  total_extra_surface DECIMAL DEFAULT 0,
  total_door_window_grill_area DECIMAL DEFAULT 0,
  selected_areas JSONB DEFAULT '{"floor": true, "wall": true, "ceiling": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_project_id ON public.rooms(project_id);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since no auth is implemented)
CREATE POLICY "Allow all operations on rooms" 
ON public.rooms 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_timestamp
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_rooms_updated_at();