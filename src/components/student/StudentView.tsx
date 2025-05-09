/**
 * Main student view component
 * Displays the student roadmap and notes interface
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Student, Phase, Task, Note } from '../../types/types';
import RoadmapView from './roadmap/RoadmapView';
import NotesPanel from './notes/NotesPanel';
import TranscriptsPanel from './transcripts/TranscriptsPanel';
import FilesPanel from './files/FilesPanel';
import TasksWithDeadlines from './TasksWithDeadlines';
import StudentHeader from './StudentHeader';
import StudentCalendar from './calendar/StudentCalendar';
import { Layers, FileText, FolderOpen, Calendar, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGenerateContext } from '../../hooks/useGenerateContext';

interface SelectedContext {
  phaseId: string | null;
  taskId: string | null;
  subtaskId: string | null;
  name: string;
}

export default function StudentView() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'transcript' | 'files' | 'notes' | 'deadlines' | 'calendar'>('roadmap');
  
  // Detail view state for notes and transcripts
  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Context generation hook
  const { generateContext } = useGenerateContext();

  useEffect(() => {
    if (!studentId) return;
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
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
      if (phasesData.length > 0 && !activePhaseId) {
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

  // Organize tasks by phase
  const phasesWithTasks = React.useMemo(() => {
    return phases.map(phase => ({
      ...phase,
      tasks: tasks.filter(task => task.phase_id === phase.id)
    }));
  }, [phases, tasks]);
  
  // Update student state when context is refreshed
  const refreshStudentData = async () => {
    if (!studentId) return;
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      
      setStudent(data as Student);
    } catch (error) {
      console.error('Error refreshing student data:', error);
    }
  };
  
  // Listen for student context updates
  useEffect(() => {
    if (!studentId) return;
    
    const subscription = supabase
      .channel('students-channel')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'students',
        filter: `id=eq.${studentId}`
      }, () => {
        refreshStudentData();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [studentId]);

  return (
    <div className="h-full flex flex-col">
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center p-4">
          <div className="text-red-500 bg-red-50 p-4 rounded-lg max-w-md text-center">{error}</div>
        </div>
      ) : student ? (
        <>
          <StudentHeader student={student} />
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-100 bg-white">
            <div className="max-w-screen-2xl mx-auto px-4">
              <div className="flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('roadmap')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'roadmap'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Roadmap
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'transcript'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Transcripts
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'files'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Files
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'notes'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('deadlines')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'deadlines'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Deadlines
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center py-3 px-3 md:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'calendar'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {activeTab === 'roadmap' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <RoadmapView 
                  phases={phasesWithTasks} 
                  studentId={studentId || ''} 
                  activePhaseId={activePhaseId}
                  activeTaskId={activeTaskId}
                  setActivePhaseId={setActivePhaseId}
                  setActiveTaskId={setActiveTaskId}
                  onOpenFab={() => {}}
                />
              </motion.div>
            ) : activeTab === 'transcript' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <TranscriptsPanel 
                  studentId={studentId || ''} 
                  phaseId={activePhaseId} 
                  taskId={activeTaskId}
                  isDetailView={isDetailView}
                  selectedNote={selectedNote}
                  setIsDetailView={setIsDetailView}
                  setSelectedNote={setSelectedNote}
                />
              </motion.div>
            ) : activeTab === 'notes' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <NotesPanel 
                  studentId={studentId || ''} 
                  phaseId={activePhaseId} 
                  taskId={activeTaskId}
                  isDetailView={isDetailView}
                  selectedNote={selectedNote}
                  setIsDetailView={setIsDetailView}
                  setSelectedNote={setSelectedNote}
                />
              </motion.div>
            ) : activeTab === 'files' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <FilesPanel 
                  studentId={studentId || ''} 
                  phaseId={activePhaseId} 
                  taskId={activeTaskId}
                  student={student}
                />
              </motion.div>
            ) : activeTab === 'calendar' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <StudentCalendar 
                  studentId={studentId || ''}
                  student={student}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-auto"
              >
                <TasksWithDeadlines 
                  studentId={studentId || ''}
                />
              </motion.div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex justify-center items-center p-4">
          <div className="text-gray-500">Student not found</div>
        </div>
      )}
    </div>
  );
}