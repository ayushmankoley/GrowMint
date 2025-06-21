import React, { useEffect, useState } from 'react';
import { useUser } from '@civic/auth/react';
import { useNavigate } from 'react-router-dom';

export const AuthCallback: React.FC = () => {
  const { user, isLoading, error } = useUser();
  const [countdown, setCountdown] = useState(5); // Wait 5 seconds instead of 2
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !isProcessingComplete) {
      setIsProcessingComplete(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  }, [user, navigate, isProcessingComplete]);

  useEffect(() => {
    if (!user && countdown === 0 && !isProcessingComplete) {
      navigate('/');
    }
  }, [user, countdown, navigate, isProcessingComplete]);

  useEffect(() => {
    if (user && countdown > 3) {
      navigate('/dashboard');
    }
  }, [user, countdown, navigate]);

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
              processingComplete: isProcessingComplete
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