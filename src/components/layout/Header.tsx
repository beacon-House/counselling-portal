/**
 * Application header component
 * Contains user profile info and global search
 */
import React from 'react';
import { Search, User, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  counsellorName: string;
  toggleRightPanel: () => void;
}

export default function Header({ counsellorName, toggleRightPanel }: HeaderProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Beacon House Counsellor Portal</h1>
          
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleRightPanel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle AI Assistant"
          >
            <MessageSquare className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700">{counsellorName}</span>
            <div className="relative group">
              <button className="flex rounded-full bg-gray-100 text-sm focus:outline-none">
                <User className="h-8 w-8 rounded-full p-1.5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
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