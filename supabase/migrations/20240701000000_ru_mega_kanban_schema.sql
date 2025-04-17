-- Create schema for RU Mega Kanban app
-- Enable ULID extension for IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table - stores project name
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Mega Kanban',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kanban data table - stores all board data
CREATE TABLE IF NOT EXISTS kanban_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a single default project and data entry
INSERT INTO projects (name)
VALUES ('Mega Kanban')
ON CONFLICT DO NOTHING;

INSERT INTO kanban_data (data)
VALUES ('[]'::JSONB)
ON CONFLICT DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_data_updated_at
BEFORE UPDATE ON kanban_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 