/**
 * Application footer component
 * Provides copyright information
 */
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-100 py-3 px-4 md:py-4 md:px-6 text-center text-xs text-gray-400">
      <div className="max-w-screen-2xl mx-auto">
        <p>© {currentYear} Beacon House. All rights reserved.</p>
      </div>
    </footer>
  );
}