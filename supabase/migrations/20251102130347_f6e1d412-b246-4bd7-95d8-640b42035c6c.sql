-- Create projects table for storing project details
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  project_type text NOT NULL,
  project_status text NOT NULL DEFAULT 'In Progress',
  quotation_value numeric NOT NULL,
  area_sqft numeric NOT NULL,
  project_date timestamp with time zone NOT NULL DEFAULT now(),
  approval_status text NOT NULL DEFAULT 'Pending',
  reminder_sent boolean NOT NULL DEFAULT false,
  feedback_message text,
  notification_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create activity log table
CREATE TABLE IF NOT EXISTS public.project_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for activity log
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policy for activity log
CREATE POLICY "Users can view activity log for their projects"
ON public.project_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_activity_log.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert activity log for their projects"
ON public.project_activity_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_activity_log.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for projects
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;