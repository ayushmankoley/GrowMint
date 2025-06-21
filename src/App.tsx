import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { MarketingPage } from './pages/MarketingPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { CivicAuthComponent } from './components/CivicAuthComponent';
import { AuthCallback } from './components/AuthCallback';
import { useAuth } from './hooks/useAuth';
import TermsPage from './pages/TermsPage';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/auth/callback') {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('authenticated') === 'true' && user && location.pathname === '/') {
      navigate('/dashboard');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [user, location, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthClick = () => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isProtectedRoute = ['/dashboard', '/sales', '/marketing'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen}
        onAuthClick={handleAuthClick}
      />
      
      {user && isProtectedRoute && <Navigation />}

      <main>
        <Routes>
          <Route path="/" element={<HomePage onGetStarted={handleGetStarted} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/comingsoon" element={<ComingSoonPage />} />
          <Route path="/terms" element={<TermsPage />} /> {/* ✅ TERMS PAGE ROUTE */}

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/marketing" 
            element={
              <ProtectedRoute>
                <MarketingPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<HomePage onGetStarted={handleGetStarted} />} />
        </Routes>
      </main>

      <div className="h-32 bg-gradient-to-b from-white via-white/70 to-white"></div>
      
      <footer className="bg-white text-gray-900 py-12 mt-0 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="src\\images\\landscape_logo_ts2.png" 
                  alt="GrowMint"
                  className="h-25 w-60 object-contain"
                />
              </div>
              <p className="text-gray-600 max-w-md">
                Empower your sales and marketing teams with AI-powered, project-based tools that convert leads and scale revenue.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600 transition-colors">Sales Engine</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Marketing Engine</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">AI Context Engine</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-green-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-green-100 mt-12 pt-8 text-center text-gray-600 text-sm space-y-2">
            <p>&copy; 2025 GrowMint. All rights reserved.</p>
            <p>
              <a 
                href="/terms" 
                className="text-green-600 hover:underline transition-colors"
              >
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
      </footer>

      <CivicAuthComponent
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
