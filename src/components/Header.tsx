import React from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../hooks/useAuth';
import { UserProfileComponent } from './CivicAuthComponent';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen, onAuthClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isProtectedRoute = ['/dashboard', '/sales', '/marketing'].includes(location.pathname);

  const handleLogoClick = () => {
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={`flex justify-center w-full px-4 z-50 ${
      isProtectedRoute 
        ? 'fixed top-0 left-0 right-0 py-2 bg-white shadow-sm' 
        : 'py-2 fixed top-0 left-0 right-0'
    }`}>
      <div className={`flex items-center justify-between px-6 py-1 rounded-full shadow-lg w-full max-w-5xl relative ${
        isProtectedRoute 
          ? 'bg-white border border-gray-200' 
          : 'bg-white/70 backdrop-blur-lg'
      }`}>
        {/* Logo/Brand Area with Placeholder Image */}
        <div className="flex items-center">
          <motion.button
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <img 
              src="https://raw.githubusercontent.com/ayushmankoley/GrowMint/refs/heads/main/src/images/landscape_logo_ts2.png" 
              alt="GrowMint"
              className="h-14 w-48 object-contain rounded-lg bg-transparent"
            />
          </motion.button>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {user && (
            <>
              {["Dashboard", "Sales", "Marketing", "Analytics"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link 
                    to={item === "Analytics" ? "#analytics" : `/${item.toLowerCase()}`}
                    className={`text-sm hover:text-green-600 transition-colors font-medium ${
                      location.pathname === `/${item.toLowerCase()}` 
                        ? 'text-green-600' 
                        : 'text-gray-900'
                    }`}
                  >
                    {item}
                  </Link>
                </motion.div>
              ))}
            </>
          )}
        </nav>

        {/* Desktop CTA Button or User Profile */}
        <div className="flex items-center space-x-4">
          {user ? (
            <motion.div
              className="hidden md:flex items-center space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <UserProfileComponent />
            </motion.div>
          ) : (
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <button
                onClick={onAuthClick}
                className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-green-700 rounded-full hover:bg-green-800 transition-colors"
              >
                Get Started
              </button>
            </motion.div>
          )}
          
          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden flex items-center" 
            onClick={toggleMenu} 
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-6 w-6 text-gray-900" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            
            <div className="flex flex-col space-y-6">
              {user ? (
                <>
                  {["Dashboard", "Sales", "Marketing", "Analytics"].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.1 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Link 
                        to={item === "Analytics" ? "#analytics" : `/${item.toLowerCase()}`}
                        className="text-base text-gray-900 font-medium" 
                        onClick={toggleMenu}
                      >
                        {item}
                      </Link>
                    </motion.div>
                  ))}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="pt-6 flex items-center justify-center"
                  >
                    <UserProfileComponent />
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="pt-6"
                >
                  <button
                    onClick={() => {
                      onAuthClick();
                      toggleMenu();
                    }}
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-green-700 rounded-full hover:bg-green-800 transition-colors"
                  >
                    Get Started
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
