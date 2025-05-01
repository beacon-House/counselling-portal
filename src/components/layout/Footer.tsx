/**
 * Application footer component
 * Provides copyright and basic links
 */
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-100 py-3 px-4 md:py-4 md:px-6 text-center text-xs text-gray-400">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <p>© {currentYear} Beacon House. All rights reserved.</p>
        <div className="mt-2 md:mt-0 flex flex-wrap justify-center space-x-3 md:space-x-4">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Help</a>
        </div>
      </div>
    </footer>
  );
}