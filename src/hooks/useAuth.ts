import { useState, useEffect } from 'react';
import { useUser } from '@civic/auth/react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Session {
  user: User;
  access_token?: string;
}

export const useAuth = () => {
  const { user: civicUser, isLoading: civicLoading, accessToken, error } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (civicLoading) {
        setLoading(true);
        return;
      }

      // Only process once per user session to avoid repeated syncs
      if (civicUser && !hasInitialized) {
        console.log('🔐 Civic Auth: User authenticated, setting up session...', {
          id: civicUser.id,
          email: civicUser.email,
          name: civicUser.name
        });

        setHasInitialized(true);
        
        // Create user object compatible with existing interface
        const authUser: User = {
          id: civicUser.id,
          email: civicUser.email,
          user_metadata: {
            full_name: civicUser.name,
            avatar_url: civicUser.picture,
          },
        };

        const authSession: Session = {
          user: authUser,
          access_token: accessToken || undefined,
        };

        setUser(authUser);
        setSession(authSession);

        // Optional: Sync user profile to Supabase (only once per session)
        try {
          // Check if user already exists first
          const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', civicUser.id)
            .single();

          if (checkError && checkError.code === 'PGRST116') {
            // User doesn't exist, create new profile
            console.log('📊 Creating new user profile...');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: civicUser.id,
                email: civicUser.email || '',
                full_name: civicUser.name || null,
                avatar_url: civicUser.picture || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('❌ Error creating user profile:', insertError);
            } else {
              console.log('✅ User profile created successfully');
            }
          } else if (existingUser) {
            // User exists, optionally update with latest info (less frequent)
            console.log('👤 User profile already exists, skipping sync');
          }

        } catch (error) {
          console.error('❌ Error checking/syncing user profile:', error);
        }
      } else if (!civicUser && hasInitialized) {
        // User logged out
        console.log('🔓 User logged out, clearing session...');
        setUser(null);
        setSession(null);
        setHasInitialized(false);
      }
      
      setLoading(civicLoading);
    };

    initializeAuth();
  }, [civicUser, civicLoading, accessToken, error, hasInitialized]);


  const signOut = async () => {
    // Reset local state
    console.log('🔓 Signing out...');
    setUser(null);
    setSession(null);
    setHasInitialized(false);
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};

