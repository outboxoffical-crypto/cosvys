-- Complete rebuild of site_surveys table with working RLS
-- This migration starts fresh to avoid conflicts

-- Drop existing table and policies
DROP TABLE IF EXISTS public.site_surveys CASCADE;

-- Create site_surveys table
CREATE TABLE public.site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  survey_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes first
CREATE INDEX idx_site_surveys_project_id ON public.site_surveys(project_id);
CREATE INDEX idx_site_surveys_created_at ON public.site_surveys(created_at);

-- Enable RLS
ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - allow all authenticated users
-- This is a temporary permissive policy to test if the table works
CREATE POLICY "Enable read access for all authenticated users"
  ON public.site_surveys
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
  ON public.site_surveys
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
  ON public.site_surveys
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
  ON public.site_surveys
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
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

