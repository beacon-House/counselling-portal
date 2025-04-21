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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    target_year: new Date().getFullYear() + 4, // Default to 4 years from now
    grade: '',
    curriculum: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
      // Create student record
      const { data, error } = await supabase
        .from('students')
        .insert({
          ...formData,
          counsellor_id: counsellor.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Navigate to the new student's page
      navigate(`/student/${data.id}`);
    } catch (err) {
      console.error('Error creating student:', err);
      setError('Failed to create student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-5 py-8 max-w-3xl"
    >
      <div className="mb-6">
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
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
      >
        <h1 className="text-2xl font-light mb-8 text-gray-800">Create New Student</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
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
                <option value="US">US</option>
                <option value="IB">IB</option>
                <option value="AP">AP</option>
                <option value="CBSE">CBSE</option>
                <option value="IGCSE">IGCSE</option>
                <option value="A-Levels">A-Levels</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 border border-gray-200 text-gray-700 rounded-lg mr-4 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center transition-colors"
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