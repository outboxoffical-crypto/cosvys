-- Fix site_surveys table with proper RLS policies
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.site_surveys CASCADE;

-- Create site_surveys table with id column and proper constraints
CREATE TABLE public.site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  survey_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for SELECT - users can see their own surveys
CREATE POLICY "Users can select their own site surveys"
  ON public.site_surveys
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy for INSERT - users can insert surveys for their projects
CREATE POLICY "Users can insert site surveys for their projects"
  ON public.site_surveys
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy for UPDATE - users can update their own surveys
CREATE POLICY "Users can update their own site surveys"
  ON public.site_surveys
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy for DELETE - users can delete their own surveys
CREATE POLICY "Users can delete their own site surveys"
  ON public.site_surveys
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_surveys_project_id ON public.site_surveys(project_id);
CREATE INDEX IF NOT EXISTS idx_site_surveys_created_at ON public.site_surveys(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_site_surveys_updated_at ON public.site_surveys;
CREATE TRIGGER trigger_update_site_surveys_updated_at
  BEFORE UPDATE ON public.site_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_site_surveys_updated_at();

