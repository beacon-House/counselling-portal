/**
 * Main application layout component
 * Implements the three-panel layout structure
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { counsellor } = useAuth();
  const [showRightPanel, setShowRightPanel] = useState(false);

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header counsellorName={counsellor?.name || ''} toggleRightPanel={toggleRightPanel} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Student Folders */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
        
        {/* Optional Right Panel - AI Chat */}
        {showRightPanel && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-auto">
            <h2 className="text-lg font-medium mb-4">AI Assistant</h2>
            <p className="text-sm text-gray-600">
              This panel will contain the AI chat functionality in later versions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}