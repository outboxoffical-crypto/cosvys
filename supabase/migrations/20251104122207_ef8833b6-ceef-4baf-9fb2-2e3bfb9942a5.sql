-- Create leads table for Lead Book
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  phone_number text NOT NULL,
  town_area text NOT NULL,
  central_local text NOT NULL DEFAULT 'Local',
  lead_id text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  quotation_value numeric NOT NULL DEFAULT 0,
  nps integer,
  drop_reason_remarks text,
  approval_status text NOT NULL DEFAULT 'Pending',
  approved_by text,
  project_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own leads"
  ON public.leads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();