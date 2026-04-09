-- Create site_surveys table for storing about site survey data
CREATE TABLE IF NOT EXISTS public.site_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  work_type text NOT NULL CHECK (work_type IN ('fresh', 'repaint', 'partial')),
  surface_condition text NOT NULL CHECK (surface_condition IN ('smooth', 'medium', 'rough', 'damaged')),
  existing_paint text NOT NULL CHECK (existing_paint IN ('good', 'slightly_peeling', 'heavy_peeling', 'damp')),
  preparation text NOT NULL CHECK (preparation IN ('basic_cleaning', 'scraping', 'putty', 'crack_filling')),
  dampness text NOT NULL CHECK (dampness IN ('none', 'minor', 'moderate', 'severe')),
  wall_height text NOT NULL CHECK (wall_height IN ('normal', 'medium', 'high')),
  accessibility text NOT NULL CHECK (accessibility IN ('easy', 'moderate', 'difficult')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_survey UNIQUE (project_id)
);

-- Enable RLS
ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies - users can access their own project surveys through the projects table
CREATE POLICY "Users can view their project surveys"
ON public.site_surveys
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = site_surveys.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert surveys for their projects"
ON public.site_surveys
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = site_surveys.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update surveys for their projects"
ON public.site_surveys
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = site_surveys.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete surveys for their projects"
ON public.site_surveys
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = site_surveys.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_surveys_updated_at
BEFORE UPDATE ON public.site_surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_site_surveys_project_id ON public.site_surveys(project_id);

