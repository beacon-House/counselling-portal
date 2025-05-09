/**
 * Form component for creating new student profiles
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function CreateStudent() {
  const { counsellor } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtherCurriculum, setShowOtherCurriculum] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school_name: '',
    target_year: new Date().getFullYear() + 4, // Default to 4 years from now
    grade: '',
    curriculum: '',
    other_curriculum: ''
  });

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
      setError('You must be logged in to create a student');
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
      
      // Create student record - only include needed fields and handle other_curriculum explicitly
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          school_name: formData.school_name,
          target_year: formData.target_year,
          grade: formData.grade,
          curriculum: finalCurriculum,
          other_curriculum: formData.other_curriculum,  // Explicitly include this field
          counsellor_id: counsellor.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Navigate to the new student's page
      navigate(`/student/${data.id}`);
    } catch (err) {
      console.error('Error creating student:', err);
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? String(err.message) 
        : 'Failed to create student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-5 py-6 md:py-8 max-w-3xl"
    >
      <div className="mb-5 md:mb-6">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </motion.button>
      </div>

      <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-8"
      >
        <h1 className="text-xl md:text-2xl font-light mb-6 md:mb-8 text-gray-800">Create New Student</h1>

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
              onClick={() => navigate(-1)}
              className="px-5 py-3 border border-gray-200 text-gray-700 rounded-lg sm:mr-4 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create Student
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}