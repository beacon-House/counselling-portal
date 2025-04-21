/**
 * Main App component
 * Handles routing and authentication state
 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import AppLayout from './components/layout/AppLayout';
import StudentView from './components/student/StudentView';
import CreateStudent from './components/student/CreateStudent';
import { AnimatePresence } from 'framer-motion';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// App routes
function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={
            <div className="flex-1 flex items-center justify-center text-gray-400 p-10 text-center">
              <div className="max-w-md">
                <h2 className="text-2xl font-light mb-4">Welcome to Beacon House</h2>
                <p className="text-gray-500">Select a student from the sidebar or create a new one to get started with your counselling journey.</p>
              </div>
            </div>
          } />
          <Route path="student/:studentId" element={<StudentView />} />
          <Route path="create-student" element={<CreateStudent />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;