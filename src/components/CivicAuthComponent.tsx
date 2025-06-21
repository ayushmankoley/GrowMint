import React, { useEffect } from 'react';
import { SignInButton, SignOutButton, UserButton, useUser } from '@civic/auth/react';
import { X } from 'lucide-react';

interface CivicAuthComponentProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export const CivicAuthComponent: React.FC<CivicAuthComponentProps> = ({ 
  isOpen, 
  onClose, 
  mode 
}) => {
  const { user, isLoading } = useUser();

  // Auto-close modal when user successfully signs in
  useEffect(() => {
    if (user && isOpen && !isLoading) {
      onClose();
    }
  }, [user, isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden relative z-40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' 
                ? 'Sign in to your GrowMint account'
                : 'Create your GrowMint account'
              }
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === 'signin' 
                ? 'Sign in to your RevCraft AI account' 
                : 'Start converting leads with AI'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Civic Auth Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Sign in securely with Civic Auth to access your account.
            </p>
            
            {/* Civic Auth Sign In Button */}
            <div className="flex justify-center">
              <SignInButton className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2" />
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>
                Secure authentication powered by{' '}
                <a 
                  href="https://civic.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Civic Auth
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple User Profile Component for the navbar
export const UserProfileComponent: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <UserButton className="rounded-full border-2 border-gray-200 hover:border-gray-300 transition-colors" />
    </div>
  );
};

// Simple Sign Out Button Component
export const SignOutComponent: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <SignOutButton className={className} />
  );
}; 