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
import StudentHeader from './StudentHeader';
import FloatingActionButton from './FloatingActionButton';
import { motion } from 'framer-motion';

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
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  
  // Detail view state for notes
  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isFileUpload, setIsFileUpload] = useState(false);
  
  // FAB state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<SelectedContext>({
    phaseId: null,
    taskId: null,
    subtaskId: null,
    name: '',
  });

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
  const phasesWithTasks = React.useMemo(() => {
    return phases.map(phase => ({
      ...phase,
      tasks: tasks.filter(task => task.phase_id === phase.id)
    }));
  }, [phases, tasks]);

  // Function to update selected context for FAB
  const setContext = (phaseId: string | null, taskId: string | null, subtaskId: string | null = null) => {
    let contextName = '';
    
    if (subtaskId) {
      const phase = phases.find(p => p.id === phaseId);
      const task = tasks.find(t => t.id === taskId);
      if (phase && task) {
        contextName = `${phase.name} > ${task.name} > Subtask`;
      }
    } else if (taskId) {
      const phase = phases.find(p => p.id === phaseId);
      const task = tasks.find(t => t.id === taskId);
      if (phase && task) {
        contextName = `${phase.name} > ${task.name}`;
      }
    } else if (phaseId) {
      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        contextName = phase.name;
      }
    } else {
      contextName = student?.name || 'Student';
    }
    
    setSelectedContext({
      phaseId,
      taskId,
      subtaskId,
      name: contextName
    });
  };
  
  // Handle opening the FAB
  const handleOpenFab = (phaseId: string | null, taskId: string | null, subtaskId: string | null = null) => {
    setContext(phaseId, taskId, subtaskId);
    setIsFabOpen(true);
  };
  
  // Handle adding a note from the FAB
  const handleAddNote = () => {
    setActivePhaseId(selectedContext.phaseId);
    setActiveTaskId(selectedContext.taskId);
    setActiveSubtaskId(selectedContext.subtaskId);
    setIsDetailView(true);
    setIsFileUpload(false);
    setSelectedNote(null);
    setIsFabOpen(false);
  };
  
  // Handle uploading a file from the FAB
  const handleUploadFile = () => {
    setActivePhaseId(selectedContext.phaseId);
    setActiveTaskId(selectedContext.taskId);
    setActiveSubtaskId(selectedContext.subtaskId);
    setIsDetailView(true);
    setIsFileUpload(true);
    setSelectedNote(null);
    setIsFabOpen(false);
  };

  // Handle note being saved
  const handleNoteSaved = (note: Note) => {
    setIsDetailView(false);
    setSelectedNote(null);
    setIsFileUpload(false);
  };

  // Get contextual text for FAB menu
  const getContextText = () => {
    if (!selectedContext.phaseId) {
      return `Add note for ${student?.name || 'Student'}`;
    }
    
    return `Add note to: ${selectedContext.name}`;
  };

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
                onOpenFab={handleOpenFab}
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
                subtaskId={activeSubtaskId}
                isDetailView={isDetailView}
                selectedNote={selectedNote}
                isFileUpload={isFileUpload}
                setIsDetailView={setIsDetailView}
                setSelectedNote={setSelectedNote}
                onNoteSaved={handleNoteSaved}
              />
            </motion.div>
          </div>
          
          {/* Floating Action Button */}
          <FloatingActionButton 
            isOpen={isFabOpen}
            toggleOpen={() => setIsFabOpen(!isFabOpen)}
            onAddNote={handleAddNote}
            onUploadFile={handleUploadFile}
            contextText={getContextText()}
          />
        </>
      ) : (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">Student not found</div>
        </div>
      )}
    </div>
  );
}