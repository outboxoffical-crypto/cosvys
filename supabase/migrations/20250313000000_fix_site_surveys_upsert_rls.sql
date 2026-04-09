-- Fix site_surveys RLS policies for UPSERT operations
-- Drop existing policies that don't work with UPSERT
DROP POLICY IF EXISTS "Users can insert site surveys for their projects" ON public.site_surveys;
DROP POLICY IF EXISTS "Users can update their own site surveys" ON public.site_surveys;

-- Create a combined INSERT policy that works with UPSERT
CREATE POLICY "Users can insert site surveys for their projects"
  ON public.site_surveys
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()::uuid
    )
  );

-- Create UPDATE policy with both USING and WITH CHECK for UPSERT compatibility
CREATE POLICY "Users can update their own site surveys"
  ON public.site_surveys
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()::uuid
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()::uuid
    )
  );

