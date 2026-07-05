-- Create a table for multi-tenant workspaces
CREATE TABLE public.erp_workspaces (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.erp_workspaces ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own workspace
CREATE POLICY "Users can view their own workspace" 
ON public.erp_workspaces 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow users to insert/update their own workspace
CREATE POLICY "Users can insert/update their own workspace" 
ON public.erp_workspaces 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
