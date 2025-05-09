/**
 * Login form component for counsellor authentication
 */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid login credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-glossy-light py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full space-y-8 bg-white p-6 sm:p-10 rounded-xl shadow-md"
      >
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-light text-gray-900"
          >
            Beacon House
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-2 text-center text-sm text-gray-500"
          >
            Counsellor Portal Login
          </motion.p>
        </div>
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-6 sm:mt-8 space-y-6" 
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="text-sm text-gray-600 mb-1 block">
                Email address
              </label>
              <motion.input
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(70, 100, 255, 0.1)" }}
                transition={{ duration: 0.2 }}
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:z-10 sm:text-sm bg-white shadow-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-gray-600 mb-1 block">
                Password
              </label>
              <motion.input
                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(70, 100, 255, 0.1)" }}
                transition={{ duration: 0.2 }}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:z-10 sm:text-sm bg-white shadow-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <div>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5 text-white" />
              ) : (
                <>
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: -2 }}
                    className="-ml-1 mr-2 h-5 w-5"
                  >
                    <LogIn className="h-5 w-5" aria-hidden="true" />
                  </motion.span>
                  Sign in
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}