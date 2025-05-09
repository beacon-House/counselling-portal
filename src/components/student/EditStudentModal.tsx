/**
 * Edit Student Modal component
 * Provides an interface for editing existing student information
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Student } from '../../types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onUpdateSuccess: (updatedStudent: Student) => void;
}

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  onUpdateSuccess
}: EditStudentModalProps) {
  const { counsellor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtherCurriculum, setShowOtherCurriculum] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school_name: '',
    target_year: 0,
    grade: '',
    curriculum: '',
    other_curriculum: ''
  });

  // Initialize form data when student prop changes
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        school_name: student.school_name || '',
        target_year: student.target_year || new Date().getFullYear() + 4,
        grade: student.grade || '',
        curriculum: student.curriculum || '',
        other_curriculum: student.curriculum === 'Others' ? student.other_curriculum || '' : ''
      });
      
      setShowOtherCurriculum(student.curriculum === 'Others');
    }
  }, [student]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'curriculum' && value === 'Others') {
      setShowOtherCurriculum(true);
    } else if (name === 'curriculum') {
      setShowOtherCurriculum(false);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!counsellor?.id) {
      setError('You must be logged in to update a student');
      setLoading(false);
      return;
    }

    try {
      // Determine the actual curriculum value to save
      const finalCurriculum = formData.curriculum === 'Others' 
        ? formData.other_curriculum 
        : formData.curriculum;
      
      if (formData.curriculum === 'Others' && !formData.other_curriculum.trim()) {
        throw new Error('Please specify the curriculum when selecting "Others"');
      }
      
      // Update student record
      const { data, error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          school_name: formData.school_name,
          target_year: formData.target_year,
          grade: formData.grade,
          curriculum: finalCurriculum,
          other_curriculum: formData.other_curriculum
        })
        .eq('id', student.id)
        .select()
        .single();

      if (error) throw error;
      
      // Call the success handler with updated data
      onUpdateSuccess(data as Student);
      onClose();
    } catch (err) {
      console.error('Error updating student:', err);
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? String(err.message) 
        : 'Failed to update student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-5 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-medium text-gray-800">Edit Student</h3>
          <motion.button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name *
              </label>
              <input
                type="text"
                name="school_name"
                required
                value={formData.school_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Graduation Year *
              </label>
              <input
                type="number"
                name="target_year"
                required
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                value={formData.target_year}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Grade *
              </label>
              <select
                name="grade"
                required
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              >
                <option value="" disabled>Select grade</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className={showOtherCurriculum ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curriculum *
              </label>
              <select
                name="curriculum"
                required
                value={formData.curriculum}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              >
                <option value="" disabled>Select curriculum</option>
                <option value="CBSE">CBSE</option>
                <option value="IBSE">IBSE</option>
                <option value="IGCSE">IGCSE</option>
                <option value="IB">IB</option>
                <option value="State Board">State Board</option>
                <option value="US Common Core">US Common Core</option>
                <option value="AP">AP</option>
                <option value="ICSE">ICSE</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {showOtherCurriculum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Curriculum *
                </label>
                <input
                  type="text"
                  name="other_curriculum"
                  required
                  value={formData.other_curriculum}
                  onChange={handleChange}
                  placeholder="Enter curriculum name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end mt-6 md:mt-8 gap-3 sm:gap-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 border border-gray-200 text-gray-700 rounded-lg sm:mr-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}