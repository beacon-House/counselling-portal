/**
 * Main application layout component
 * Implements the three-panel layout structure with improved aesthetics
 */
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function AppLayout() {
  const { counsellor } = useAuth();
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Hide sidebar by default on mobile, show by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        counsellorName={counsellor?.name || ''} 
        toggleRightPanel={toggleRightPanel}
        toggleSidebar={toggleSidebar}
        showSidebar={showSidebar}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Overlay for mobile (to close sidebar when clicking outside) */}
        {showSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-30"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Left Sidebar - Student Folders */}
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:relative fixed z-40 h-full bg-white w-[280px] md:w-[280px]"
            >
              <div className="flex justify-end p-2 md:hidden">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-white flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
        
        {/* Optional Right Panel - AI Chat */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white border-l border-gray-100 shadow-lg overflow-auto relative"
            >
              <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-light">AI Assistant</h2>
                <button 
                  onClick={toggleRightPanel}
                  className="p-1 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500">
                  This panel will contain the AI chat functionality in later versions. You'll be able to ask questions about students, get insights, and receive suggestions.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}