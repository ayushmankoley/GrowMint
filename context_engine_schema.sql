-- Context Engine Database Schema
-- This creates the necessary tables for conversations and messages

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Using VARCHAR to match Civic Auth user IDs
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES user_personas(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Disable RLS since we're using Civic Auth (not Supabase Auth)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON conversations TO authenticated, anon;
GRANT ALL ON messages TO authenticated, anon;

-- Create function to update conversations.updated_at when a message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Sample data (commented out - uncomment to test)
/*
INSERT INTO conversations (user_id, project_id, title) VALUES 
('sample-civic-user-id', 'sample-project-uuid', 'Test Conversation');

INSERT INTO messages (conversation_id, role, content) VALUES 
('sample-conversation-uuid', 'user', 'Hello, can you help me with my project?'),
('sample-conversation-uuid', 'assistant', 'Of course! I can help you with your project. What would you like to know?');
*/ 