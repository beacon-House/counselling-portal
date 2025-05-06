/**
 * Subtask Owner Select component
 * Allows selecting and managing multiple owners for a subtask
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Plus, User, Users } from 'lucide-react';
import { Student } from '../../types/types';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtaskOwnerSelectProps {
  currentOwners: string[] | null;
  student: Student | null;
  onOwnersChange: (owners: string[]) => void;
}

export default function SubtaskOwnerSelect({ 
  currentOwners = [], 
  student, 
  onOwnersChange 
}: SubtaskOwnerSelectProps) {
  const [owners, setOwners] = useState<string[]>(currentOwners || []);
  const [customOwner, setCustomOwner] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { counsellor } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize owners
  useEffect(() => {
    setOwners(currentOwners || []);
  }, [currentOwners]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsAddingCustom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle adding a custom owner
  const handleAddCustomOwner = () => {
    if (customOwner.trim() && !owners.includes(customOwner.trim())) {
      const newOwners = [...owners, customOwner.trim()];
      setOwners(newOwners);
      setCustomOwner('');
      onOwnersChange(newOwners);
      setIsAddingCustom(false);
    }
  };

  // Handle toggling an owner
  const handleToggleOwner = (owner: string) => {
    let newOwners;
    if (owners.includes(owner)) {
      newOwners = owners.filter(o => o !== owner);
    } else {
      newOwners = [...owners, owner];
    }
    setOwners(newOwners);
    onOwnersChange(newOwners);
  };

  // Handle removing an owner
  const handleRemoveOwner = (owner: string) => {
    const newOwners = owners.filter(o => o !== owner);
    setOwners(newOwners);
    onOwnersChange(newOwners);
  };

  // Handle key down for custom owner input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customOwner.trim()) {
      e.preventDefault();
      handleAddCustomOwner();
    } else if (e.key === 'Escape') {
      setIsAddingCustom(false);
      setCustomOwner('');
    }
  };

  return (
    <div className="relative">
      {/* Current owners display */}
      <div 
        onClick={() => setIsDropdownOpen(true)}
        className="flex items-center min-w-0 cursor-pointer"
      >
        {owners.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-full">
            {owners.length === 1 ? (
              <div className="flex items-center text-xs text-gray-700 truncate">
                <User className="h-3 w-3 mr-1 text-gray-400" />
                <span>{owners[0]}</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-gray-700">
                <Users className="h-3 w-3 mr-1 text-gray-400" />
                <span>{owners.length} owners</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Select owner</span>
        )}
      </div>

      {/* Owners dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden"
            style={{ right: 0 }}
          >
            <div className="py-1 border-b border-gray-100 px-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Current Owners</span>
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Current owners list */}
            <div className="py-1 max-h-32 overflow-y-auto">
              {owners.length > 0 ? (
                <div className="px-2 py-1 space-y-1">
                  {owners.map((owner, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1 text-xs rounded hover:bg-gray-50">
                      <span className="truncate">{owner}</span>
                      <button
                        onClick={() => handleRemoveOwner(owner)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-xs text-gray-500 italic">
                  No owners assigned
                </div>
              )}
            </div>

            {/* Predefined options */}
            <div className="py-1 border-t border-gray-100">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-gray-500 px-2">Select Owner</span>
                <div className="mt-1 space-y-1">
                  {student && (
                    <div 
                      onClick={() => handleToggleOwner(student.name)}
                      className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1.5 text-gray-400" />
                        <span>{student.name} (Student)</span>
                      </div>
                      {owners.includes(student.name) && (
                        <Check className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                  
                  {counsellor && (
                    <div 
                      onClick={() => handleToggleOwner(counsellor.name)}
                      className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1.5 text-gray-400" />
                        <span>{counsellor.name} (Counsellor)</span>
                      </div>
                      {owners.includes(counsellor.name) && (
                        <Check className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Custom owner input */}
            <div className="py-1 border-t border-gray-100">
              {isAddingCustom ? (
                <div className="px-2 py-1">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={customOwner}
                      onChange={(e) => setCustomOwner(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter owner name"
                      autoFocus
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddCustomOwner}
                      disabled={!customOwner.trim()}
                      className="ml-1 p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                      title="Add owner"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full flex items-center px-4 py-2 text-xs text-indigo-600 hover:bg-gray-50"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Add custom owner
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}