/**
 * Floating Action Button (FAB) component
 * Provides a clean, centralized interface for adding notes
 */
import React, { useRef, useEffect } from 'react';
import { Edit, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  isOpen: boolean;
  toggleOpen: () => void;
  onAddNote: () => void;
  contextText: string;
}

export default function FloatingActionButton({
  isOpen,
  toggleOpen,
  onAddNote,
  contextText
}: FloatingActionButtonProps) {
  const fabRef = useRef<HTMLDivElement>(null);
  
  // Close the FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node) && isOpen) {
        toggleOpen();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleOpen]);

  // Calculate FAB position based on screen size
  const getFabPosition = () => {
    // Use smaller value on mobile devices
    const bottomOffset = window.innerWidth < 640 ? '1rem' : '1.5rem';
    const rightOffset = window.innerWidth < 640 ? '1rem' : '1.5rem';
    
    return {
      bottom: bottomOffset,
      right: rightOffset
    };
  };

  const fabPosition = getFabPosition();

  return (
    <div 
      className="fixed z-50"
      ref={fabRef}
      style={{
        bottom: fabPosition.bottom,
        right: fabPosition.right
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-lg p-2 w-[220px] sm:w-60"
          >
            {contextText && (
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                {contextText}
              </div>
            )}
            
            <button
              onClick={() => {
                onAddNote();
                toggleOpen();
              }}
              className="flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <FileText className="h-4 w-4 mr-3 text-gray-500" />
              <span className="text-sm">Add Note</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={toggleOpen}
        className="bg-gray-800 hover:bg-gray-700 text-white rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ rotate: 0 }}
            animate={{ rotate: isOpen ? 45 : 0 }}
            exit={{ rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}