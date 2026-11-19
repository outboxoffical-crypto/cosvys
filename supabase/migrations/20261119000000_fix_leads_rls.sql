-- Repair lead ownership and RLS policies.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

CREATE POLICY "Users can view their own leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()::text) = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()::text) = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()::text) = user_id)
  WITH CHECK ((SELECT auth.uid()::text) = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()::text) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
