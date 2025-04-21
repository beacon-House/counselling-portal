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
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Students</h2>
          <button 
            onClick={handleCreateStudent}
            className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 w-full text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : filteredStudents.length > 0 ? (
          <ul className="py-2">
            {filteredStudents.map(student => (
              <li key={student.id}>
                <NavLink
                  to={`/student/${student.id}`}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-2 text-sm ${isActive 
                      ? 'text-gray-900 bg-gray-200 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  <span className="mr-3 text-gray-400">
                    <Users className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium leading-tight">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.grade} • {student.curriculum}</p>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Users className="h-10 w-10 text-gray-400 mb-2" />
            {searchTerm ? (
              <p className="text-gray-500 text-sm">No students match your search</p>
            ) : (
              <>
                <p className="text-gray-500 font-medium">No students yet</p>
                <p className="text-gray-400 text-sm mt-1">Create a student to get started</p>
                <button
                  onClick={handleCreateStudent}
                  className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Student
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}