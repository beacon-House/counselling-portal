/**
 * Application header component
 * Contains user profile info and global search
 */
import React from 'react';
import { Search, User, MessageSquare, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HeaderProps {
  counsellorName: string;
  toggleRightPanel: () => void;
  toggleSidebar: () => void;
  showSidebar: boolean;
}

export default function Header({ counsellorName, toggleRightPanel, toggleSidebar, showSidebar }: HeaderProps) {
  const { signOut } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  // Enhanced button animation variants
  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)' },
    tap: { scale: 0.95, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }
  };

  return (
    <header className="bg-glossy-white shadow-sm z-50 sticky top-0">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleSidebar}
            className="mr-2 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </motion.button>
          
          <Link to="/" className="flex items-center">
            <motion.img 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              src="/bh-logo.png" 
              alt="Beacon House Logo" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            transition={{ duration: 0.5 }}
            className="relative hidden md:block"
          >
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-full w-64 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent text-sm bg-white shadow-sm transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleRightPanel}
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
            aria-label="Toggle AI Assistant"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </motion.button>

          <div className="flex items-center">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mr-2 text-sm font-medium text-gray-700 hidden md:inline-block"
            >
              {counsellorName}
            </motion.span>
            <div className="relative" ref={dropdownRef}>
              <motion.button 
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center rounded-full bg-gray-100 text-sm focus:outline-none p-1 pr-2"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User menu"
              >
                <User className="h-7 w-7 rounded-full p-1" />
                <ChevronDown className="h-4 w-4 ml-1 text-gray-500 hidden sm:block" />
              </motion.button>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30 
                  }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  <motion.button
                    whileHover={{ backgroundColor: "#f3f4f6" }}
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}