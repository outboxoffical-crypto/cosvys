-- Fix 1: Create approval_tokens table for secure project approvals
CREATE TABLE public.approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on approval_tokens
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own project tokens
CREATE POLICY "Users can view tokens for their projects"
ON public.approval_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = approval_tokens.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Users can create tokens for their projects
CREATE POLICY "Users can create tokens for their projects"
ON public.approval_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = approval_tokens.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Add index for faster token lookups
CREATE INDEX idx_approval_tokens_token ON public.approval_tokens(token);
CREATE INDEX idx_approval_tokens_project_id ON public.approval_tokens(project_id);

-- Fix 2: Make rooms.user_id NOT NULL
-- First, update any remaining rooms with NULL user_id
UPDATE public.rooms
SET user_id = (
  SELECT user_id 
  FROM public.projects 
  WHERE projects.id::text = rooms.project_id
)
WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.rooms ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint for data integrity
ALTER TABLE public.rooms 
ADD CONSTRAINT fk_rooms_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;