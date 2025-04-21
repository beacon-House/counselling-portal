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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-700"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : student ? (
        <>
          <StudentHeader student={student} />
          
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 overflow-auto border-r border-gray-200">
              <RoadmapView 
                phases={phasesWithTasks} 
                studentId={studentId || ''} 
                activePhaseId={activePhaseId}
                activeTaskId={activeTaskId}
                setActivePhaseId={setActivePhaseId}
                setActiveTaskId={setActiveTaskId}
              />
            </div>
            
            <div className="w-1/2 overflow-auto">
              <NotesPanel 
                studentId={studentId || ''} 
                phaseId={activePhaseId} 
                taskId={activeTaskId}
              />
            </div>
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