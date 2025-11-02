-- Create material_tracker table for tracking project materials
CREATE TABLE IF NOT EXISTS public.material_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  material_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  rate NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * rate) STORED,
  delivery_status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for material_tracker
CREATE POLICY "Users can view their own material tracker"
  ON public.material_tracker
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material tracker"
  ON public.material_tracker
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material tracker"
  ON public.material_tracker
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material tracker"
  ON public.material_tracker
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_material_tracker_updated_at
  BEFORE UPDATE ON public.material_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();