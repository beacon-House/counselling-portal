/**
 * Application sidebar component
 * Contains student folders and creation functionality
 * Allows counsellors to view all students in the system, not just their own
 */
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../types/types';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Extended student interface to include counsellor information
interface ExtendedStudent extends Student {
  counsellor_name?: string;
  is_own_student: boolean;
}

export default function Sidebar() {
  const [students, setStudents] = useState<ExtendedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredStudent, setHoveredStudent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const { counsellor } = useAuth();
  const navigate = useNavigate();
  const studentRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!counsellor?.id) return;
      
      try {
        // Fetch all students along with their counsellor names
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            counsellors:counsellor_id (
              name
            )
          `)
          .order('name');
        
        if (error) throw error;
        
        // Transform the data to include counsellor name and the is_own_student flag
        const extendedStudents = (data || []).map(student => {
          // Extract first name only from the counsellor name
          const fullName = student.counsellors?.name || '';
          const firstName = fullName.split(' ')[0];
          
          return {
            ...student,
            counsellor_name: firstName,
            is_own_student: student.counsellor_id === counsellor.id
          };
        });
        
        setStudents(extendedStudents as ExtendedStudent[]);
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
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.counsellor_name && student.counsellor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMouseEnter = (studentId: string, event: React.MouseEvent) => {
    setHoveredStudent(studentId);
    
    // Calculate tooltip position
    const studentElement = studentRefs.current[studentId];
    if (studentElement && sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const rect = studentElement.getBoundingClientRect();
      
      // Position below on mobile, to the right on desktop
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        setTooltipPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        setTooltipPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 10, // 10px offset from right edge
        });
      }
    }
  };
  
  const handleMouseLeave = () => {
    setHoveredStudent(null);
  };

  // Find the hovered student data
  const hoveredStudentData = hoveredStudent 
    ? students.find(student => student.id === hoveredStudent) 
    : null;

  return (
    <aside className="w-full h-full bg-white border-r border-gray-100 flex flex-col" ref={sidebarRef}>
      <div className="p-4 md:p-5 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4 md:mb-5">
          <h2 className="text-base font-light text-gray-700">Students</h2>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCreateStudent}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            aria-label="Add student"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </motion.button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search students or counsellors..."
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
          <ul className="py-2 md:py-3 px-2">
            {filteredStudents.map(student => (
              <motion.li 
                key={student.id}
                ref={el => studentRefs.current[student.id] = el}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={(e) => handleMouseEnter(student.id, e)}
                onMouseLeave={handleMouseLeave}
                className="relative"
              >
                <NavLink
                  to={`/student/${student.id}`}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2.5 my-0.5 rounded-lg text-sm ${isActive 
                      ? 'text-gray-900 bg-gray-100 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'}`
                  }
                >
                  <span className="mr-3 text-gray-400 flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center">
                      <p className="font-medium leading-tight truncate">{student.name}</p>
                      {student.counsellor_name && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[80px] ${
                          student.is_own_student 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {student.counsellor_name}
                        </span>
                      )}
                      
                      {student.student_context && (
                        <span className="ml-1 text-gray-400">
                          <Info className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{student.grade} • {student.curriculum}</p>
                  </div>
                </NavLink>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 md:py-12 px-4 text-center">
            <Users className="h-8 w-8 md:h-10 md:w-10 text-gray-300 mb-3" />
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
                  className="mt-4 md:mt-5 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-all duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Student
                </motion.button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Student context tooltip */}
      <AnimatePresence>
        {hoveredStudent && hoveredStudentData?.student_context && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 max-w-xs bg-white p-3 rounded-lg shadow-lg border border-gray-100"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              maxWidth: window.innerWidth < 768 ? '90vw' : '300px'
            }}
          >
            <div className="text-xs">
              <h4 className="font-medium text-gray-800 mb-1">Student Context</h4>
              <p className="text-gray-600 line-clamp-6">
                {hoveredStudentData.student_context}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}