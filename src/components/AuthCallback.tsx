import React, { useEffect, useState } from 'react';
import { useUser } from '@civic/auth/react';

export const AuthCallback: React.FC = () => {
  const { user, isLoading, error } = useUser();
  const [countdown, setCountdown] = useState(5); // Wait 5 seconds instead of 2
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    // Give Civic Auth time to process the OAuth callback
    const timer = setTimeout(() => {
      setProcessingComplete(true);
    }, 5000); // Increased from 2000 to 5000

    // Countdown timer for user feedback
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, []);

  useEffect(() => {
    console.log('AuthCallback state:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      isLoading, 
      error: error?.message,
      processingComplete 
    });

    // Once processing is complete and we have auth state, redirect
    if (processingComplete && !isLoading) {
      if (error) {
        console.error('Authentication error:', error);
        window.location.href = '/?auth=error';
      } else if (user) {
        console.log('Authentication successful, redirecting to dashboard...');
        // Redirect to dashboard since user is authenticated
        window.location.href = '/?authenticated=true';
      } else {
        // No user but no error - still redirect to home
        console.log('No user detected after timeout, redirecting to home');
        window.location.href = '/';
      }
    }
  }, [processingComplete, isLoading, user, error]);

  // If user is detected early, redirect immediately
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User detected early, redirecting...');
      window.location.href = '/?authenticated=true';
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
        <p className="text-gray-600 mb-4">
          Please wait while we complete your authentication...
          {countdown > 0 && <span className="block text-sm mt-2">({countdown}s remaining)</span>}
        </p>
        
        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-4">
            <p>Debug: {JSON.stringify({
              hasUser: !!user,
              isLoading,
              hasError: !!error,
              processingComplete
            })}</p>
          </div>
        )}
        
        {error && (
          <p className="text-red-600 text-sm mt-4">
            Error: {error.message}
          </p>
        )}
      </div>
    </div>
  );
}; 