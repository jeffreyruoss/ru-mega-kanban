-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read trash data" ON kanban_trash;
DROP POLICY IF EXISTS "Allow authenticated users to insert trash data" ON kanban_trash;
DROP POLICY IF EXISTS "Allow authenticated users to update trash data" ON kanban_trash;

-- Make sure RLS is enabled
ALTER TABLE kanban_trash ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies
-- Allow all users to read trash data
CREATE POLICY "Allow anyone to read trash data" 
  ON kanban_trash 
  FOR SELECT 
  USING (true);

-- Allow all users to insert trash data
CREATE POLICY "Allow anyone to insert trash data" 
  ON kanban_trash 
  FOR INSERT 
  WITH CHECK (true);

-- Allow all users to update trash data
CREATE POLICY "Allow anyone to update trash data" 
  ON kanban_trash 
  FOR UPDATE 
  USING (true);

-- Add delete policy (which was missing before)
CREATE POLICY "Allow anyone to delete trash data"
  ON kanban_trash
  FOR DELETE
  USING (true); 