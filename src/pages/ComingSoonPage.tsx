import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon!</h1>
          <p className="text-lg text-gray-600 mb-8">
            We're working hard to bring you the best AI-powered revenue tools. 
            Stay tuned for the launch!
          </p>
        </div>
        
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}; 