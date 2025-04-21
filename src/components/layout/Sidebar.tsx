/**
 * Application sidebar component
 * Contains student folders and creation functionality
 */
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../types/types';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { counsellor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!counsellor?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('counsellor_id', counsellor.id)
          .order('name');
        
        if (error) throw error;
        setStudents(data as Student[]);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [counsellor]);

  const handleCreateStudent = () => {
    navigate('/create-student');
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full h-full bg-white border-r border-gray-100 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-light text-gray-700">Students</h2>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCreateStudent}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </motion.button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-300"></div>
          </div>
        ) : filteredStudents.length > 0 ? (
          <ul className="py-3 px-2">
            {filteredStudents.map(student => (
              <motion.li 
                key={student.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <NavLink
                  to={`/student/${student.id}`}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2.5 my-1 rounded-lg text-sm ${isActive 
                      ? 'text-gray-900 bg-gray-100 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'}`
                  }
                >
                  <span className="mr-3 text-gray-400">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium leading-tight">{student.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{student.grade} • {student.curriculum}</p>
                  </div>
                </NavLink>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            {searchTerm ? (
              <p className="text-gray-500 text-sm">No students match your search</p>
            ) : (
              <>
                <p className="text-gray-500 font-medium">No students yet</p>
                <p className="text-gray-400 text-sm mt-1">Create a student to get started</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateStudent}
                  className="mt-5 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-all duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Student
                </motion.button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}