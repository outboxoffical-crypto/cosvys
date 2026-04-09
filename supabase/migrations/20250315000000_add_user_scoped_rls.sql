-- Apply user-scoped RLS policies after table is working
-- This migration updates the RLS policies to be user-specific

-- Drop the temporary permissive policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.site_surveys;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.site_surveys;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.site_surveys;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.site_surveys;

-- Create strict user-scoped policies
CREATE POLICY "Users can view their own site surveys"
  ON public.site_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.site_surveys.project_id
      AND public.projects.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can create site surveys for their projects"
  ON public.site_surveys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = project_id
      AND public.projects.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can update their own site surveys"
  ON public.site_surveys
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.site_surveys.project_id
      AND public.projects.user_id = auth.uid()::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.site_surveys.project_id
      AND public.projects.user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can delete their own site surveys"
  ON public.site_surveys
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.site_surveys.project_id
      AND public.projects.user_id = auth.uid()::uuid
    )
  );

