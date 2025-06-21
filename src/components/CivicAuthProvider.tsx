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

  const handleSignIn = () => {
    // Handle successful sign-in
  };

  const handleSignOut = async () => {
    // Handle sign-out
  };

  return (
    <BaseCivicAuthProvider
      clientId={clientId}
      redirectUrl={`${window.location.origin}/auth/callback`}
      iframeMode="embedded"
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    >
      {children}
    </BaseCivicAuthProvider>
  );
}; 