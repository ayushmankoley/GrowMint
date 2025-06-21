import React, { ReactNode } from 'react';
import { CivicAuthProvider as BaseCivicAuthProvider } from '@civic/auth/react';

interface CivicAuthProviderProps {
  children: ReactNode;
}

export const CivicAuthProvider: React.FC<CivicAuthProviderProps> = ({ children }) => {
  const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;

  if (!clientId) {
    console.error('VITE_CIVIC_CLIENT_ID is not set in environment variables');
    return <div>Error: Civic Auth Client ID is not configured</div>;
  }

  const handleSignIn = (error?: Error) => {
    if (error) {
      console.error('Sign-in error:', error);
    } else {
      console.log('Sign-in successful');
      // Close any modals if we're in OAuth callback mode
      if (window.location.pathname === '/auth/callback') {
        // Let the AuthCallback component handle the redirect
        return;
      }
    }
  };

  const handleSignOut = async () => {
    console.log('User signed out');
  };

  return (
    <BaseCivicAuthProvider
      clientId={clientId}
      redirectUrl={`${window.location.origin}/auth/callback`}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    >
      {children}
    </BaseCivicAuthProvider>
  );
}; 