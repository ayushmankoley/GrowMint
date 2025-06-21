import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

console.log('Supabase configured with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high';
          status: 'draft' | 'active' | 'completed';
          lead_source: string | null;
          context_summary: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'draft' | 'active' | 'completed';
          lead_source?: string | null;
          context_summary?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'draft' | 'active' | 'completed';
          lead_source?: string | null;
          context_summary?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_context: {
        Row: {
          id: string;
          project_id: string;
          content_type: 'text' | 'image' | 'document' | 'url';
          content: string;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content_type: 'text' | 'image' | 'document' | 'url';
          content: string;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          content_type?: 'text' | 'image' | 'document' | 'url';
          content?: string;
          metadata?: any | null;
          created_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          project_id: string;
          tool_type: string;
          content: string;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          tool_type: string;
          content: string;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          tool_type?: string;
          content?: string;
          metadata?: any | null;
          created_at?: string;
        };
      };
    };
  };
};