-- Create labour_tracker table
CREATE TABLE public.labour_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  labour_count INTEGER NOT NULL DEFAULT 0,
  work_completed TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.labour_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own labour tracker" 
ON public.labour_tracker 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own labour tracker" 
ON public.labour_tracker 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own labour tracker" 
ON public.labour_tracker 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own labour tracker" 
ON public.labour_tracker 
FOR DELETE 
USING (auth.uid() = user_id);