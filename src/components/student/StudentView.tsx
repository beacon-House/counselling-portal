/**
 * Main student view component
 * Displays the student roadmap and notes interface
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Student, Phase, Task } from '../../types/types';
import RoadmapView from './roadmap/RoadmapView';
import NotesPanel from './notes/NotesPanel';
import StudentHeader from './StudentHeader';
import { motion } from 'framer-motion';

export default function StudentView() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentData = async () => {
      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (studentError) throw studentError;
        setStudent(studentData as Student);

        // Fetch phases
        const { data: phasesData, error: phasesError } = await supabase
          .from('phases')
          .select('*')
          .order('sequence');

        if (phasesError) throw phasesError;
        setPhases(phasesData as Phase[]);
        
        // Set active phase to first phase
        if (phasesData.length > 0) {
          setActivePhaseId(phasesData[0].id);
        }

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('sequence');

        if (tasksError) throw tasksError;
        setTasks(tasksData as Task[]);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  // Organize tasks by phase
  const phasesWithTasks = phases.map(phase => ({
    ...phase,
    tasks: tasks.filter(task => task.phase_id === phase.id)
  }));

  return (
    <div className="h-full flex flex-col">
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
        </div>
      ) : student ? (
        <>
          <StudentHeader student={student} />
          
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full md:w-1/2 overflow-auto border-b md:border-b-0 md:border-r border-gray-100"
            >
              <RoadmapView 
                phases={phasesWithTasks} 
                studentId={studentId || ''} 
                activePhaseId={activePhaseId}
                activeTaskId={activeTaskId}
                setActivePhaseId={setActivePhaseId}
                setActiveTaskId={setActiveTaskId}
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full md:w-1/2 overflow-auto"
            >
              <NotesPanel 
                studentId={studentId || ''} 
                phaseId={activePhaseId} 
                taskId={activeTaskId}
              />
            </motion.div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">Student not found</div>
        </div>
      )}
    </div>
  );
}