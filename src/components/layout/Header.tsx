/**
 * Application header component
 * Contains user profile info and global search
 */
import React from 'react';
import { Search, User, MessageSquare, LogOut, Menu } from 'lucide-react';
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white shadow-sm z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="mr-2 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          <Link to="/" className="flex items-center">
            <img 
              src="/bh-logo.png" 
              alt="Beacon House Logo" 
              className="h-10 w-auto"
            />
          </Link>
          
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-full w-64 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent text-sm bg-gray-50"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRightPanel}
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
            aria-label="Toggle AI Assistant"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </motion.button>

          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700 hidden md:inline-block">{counsellorName}</span>
            <div className="relative group">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex rounded-full bg-gray-100 text-sm focus:outline-none p-1"
              >
                <User className="h-7 w-7 rounded-full p-1" />
              </motion.button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 hidden group-hover:block">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}