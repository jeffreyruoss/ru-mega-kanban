-- Create a table for trash data
CREATE TABLE IF NOT EXISTS kanban_trash (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE kanban_trash ENABLE ROW LEVEL SECURITY;

-- Similar policies to kanban_data table for consistency
CREATE POLICY "Allow authenticated users to read trash data" 
  ON kanban_trash 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert trash data" 
  ON kanban_trash 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update trash data" 
  ON kanban_trash 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Create an index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_kanban_trash_created_at ON kanban_trash (created_at DESC); 