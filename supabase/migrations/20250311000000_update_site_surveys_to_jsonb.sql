-- Drop the old site_surveys table
DROP TABLE IF EXISTS site_surveys CASCADE;

-- Create new site_surveys table with JSONB column
CREATE TABLE site_surveys (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  survey_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user's own surveys
CREATE POLICY "Users can manage their own site surveys"
  ON site_surveys
  USING (project_id::text IN (SELECT id::text FROM projects WHERE user_id = auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_site_surveys_project_id ON site_surveys(project_id);
