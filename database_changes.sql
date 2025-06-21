-- Create user_personas table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  company_or_business VARCHAR(255),
  industry VARCHAR(255),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_default ON user_personas(user_id, is_default);

-- Enable Row Level Security
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can insert their own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can update their own personas" ON user_personas;
DROP POLICY IF EXISTS "Users can delete their own personas" ON user_personas;

-- Create RLS policies with better error handling
CREATE POLICY "Users can view their own personas" ON user_personas
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own personas" ON user_personas
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "Users can update their own personas" ON user_personas
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own personas" ON user_personas
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

-- Create function to update updated_at timestamp (replace if exists)
CREATE OR REPLACE FUNCTION update_user_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for updated_at
DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas;
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON user_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_personas_updated_at();

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_personas TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test query to verify the table exists and permissions work
-- (This is just for debugging - you can remove this line after testing)
-- SELECT COUNT(*) FROM user_personas WHERE user_id = auth.uid(); 